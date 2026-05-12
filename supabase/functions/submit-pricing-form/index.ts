// Public submission endpoint for a pricing form.
// - Server-side recomputes prices (never trusts client totals).
// - Rate-limits per-IP to deter bot floods.
// - Creates a client (lead) + draft quote + line items, then records the submission.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// In-memory IP bucket: 5 submissions per IP per minute. Per-edge instance — good enough for abuse triage.
const ipHits = new Map<string, { count: number; resetAt: number }>();
function rateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipHits.get(ip);
  if (!entry || entry.resetAt < now) {
    ipHits.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

async function sha256Hex(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const isStr = (v: unknown, max = 500) => typeof v === "string" && v.length > 0 && v.length <= max;
const isEmail = (v: unknown) =>
  typeof v === "string" && v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

interface SelectedSvcInput { service_id: string; quantity: number; }
interface AnswerInput { question_id: string; value: unknown; }

function clampNum(n: unknown, min: number, max: number, fallback: number): number {
  const x = Number(n);
  if (!Number.isFinite(x)) return fallback;
  return Math.max(min, Math.min(max, x));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "0.0.0.0";
    if (!rateLimit(ip)) {
      return new Response(JSON.stringify({ error: "too many submissions, try again in a minute" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const slug = body?.slug;
    const contact = body?.contact || {};
    const selected: SelectedSvcInput[] = Array.isArray(body?.selected_services) ? body.selected_services : [];
    const answers: AnswerInput[] = Array.isArray(body?.answers) ? body.answers : [];

    if (!isStr(slug, 64) || !/^[a-z0-9-]+$/.test(slug)) {
      return new Response(JSON.stringify({ error: "invalid slug" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!isStr(contact.first_name, 100) || !isStr(contact.last_name, 100)) {
      return new Response(JSON.stringify({ error: "first and last name required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!isEmail(contact.email)) {
      return new Response(JSON.stringify({ error: "valid email required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (contact.phone && !isStr(contact.phone, 40)) {
      return new Response(JSON.stringify({ error: "invalid phone" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (selected.length === 0) {
      return new Response(JSON.stringify({ error: "select at least one service" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Load form
    const { data: form, error: fErr } = await admin
      .from("pricing_forms")
      .select("id, team_id, user_id, slug, is_published")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    if (fErr || !form) {
      return new Response(JSON.stringify({ error: "form not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load services + questions and rebuild the price server-side.
    const [{ data: svcs }, { data: qs }, { data: company }] = await Promise.all([
      admin.from("pricing_form_services")
        .select("id, display_name, base_price, unit_label, min_qty, max_qty, tax_rate, service_id")
        .eq("form_id", form.id),
      admin.from("pricing_form_questions")
        .select("id, label, kind, options, applies_to_service_ids")
        .eq("form_id", form.id),
      admin.from("company_settings")
        .select("default_tax_rate, next_quote_number, quote_prefix, default_payment_terms")
        .eq("team_id", form.team_id)
        .maybeSingle(),
    ]);

    const svcMap = new Map((svcs || []).map((s) => [s.id, s]));
    const qMap = new Map((qs || []).map((q) => [q.id, q]));

    const defaultTax = Number(company?.default_tax_rate ?? 0);

    // Build line items from selected services with server-side priced math.
    const lineItems: Array<{
      service_id: string | null;
      description: string;
      quantity: number;
      unit_price: number;
      tax_rate: number;
      sort_order: number;
    }> = [];

    let order = 0;
    for (const sel of selected) {
      const svc = svcMap.get(sel.service_id);
      if (!svc) continue;
      const qty = clampNum(sel.quantity, Number(svc.min_qty), Number(svc.max_qty), Number(svc.min_qty));
      let unit = Number(svc.base_price);
      let pctSurcharge = 0;
      let flatAdd = 0;

      // Apply pricing modifiers from question answers scoped to this service (or global).
      for (const ans of answers) {
        const q: any = qMap.get(ans.question_id);
        if (!q) continue;
        const scope: string[] = q.applies_to_service_ids || [];
        if (scope.length > 0 && !scope.includes(svc.id)) continue;
        const opts: any[] = Array.isArray(q.options) ? q.options : [];
        const selectedVals: string[] = Array.isArray(ans.value)
          ? ans.value.map(String)
          : ans.value != null ? [String(ans.value)] : [];
        for (const opt of opts) {
          if (!selectedVals.includes(String(opt.value))) continue;
          const delta = Number(opt.price_delta) || 0;
          if (opt.price_kind === "percent") pctSurcharge += delta;
          else if (opt.price_kind === "per_unit") unit += delta;
          else flatAdd += delta;
        }
      }

      let lineUnit = unit * (1 + pctSurcharge / 100);
      // Round to 2 decimals
      lineUnit = Math.round(lineUnit * 100) / 100;
      const taxRate = Number(svc.tax_rate ?? defaultTax);

      lineItems.push({
        service_id: svc.service_id || null,
        description: svc.display_name,
        quantity: qty,
        unit_price: lineUnit,
        tax_rate: taxRate,
        sort_order: order++,
      });

      if (flatAdd > 0) {
        lineItems.push({
          service_id: null,
          description: `${svc.display_name} — add-ons`,
          quantity: 1,
          unit_price: Math.round(flatAdd * 100) / 100,
          tax_rate: taxRate,
          sort_order: order++,
        });
      }
    }

    if (lineItems.length === 0) {
      return new Response(JSON.stringify({ error: "no valid services selected" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let subtotal = 0;
    let taxTotal = 0;
    for (const li of lineItems) {
      const lineSub = li.quantity * li.unit_price;
      subtotal += lineSub;
      taxTotal += lineSub * (li.tax_rate / 100);
    }
    subtotal = Math.round(subtotal * 100) / 100;
    taxTotal = Math.round(taxTotal * 100) / 100;
    const total = Math.round((subtotal + taxTotal) * 100) / 100;

    // Find or create client (match by lowercased email within team).
    let clientId: string | null = null;
    const normalizedEmail = String(contact.email).trim().toLowerCase();
    const { data: existingClient } = await admin
      .from("clients")
      .select("id")
      .eq("team_id", form.team_id)
      .ilike("email", normalizedEmail)
      .maybeSingle();

    if (existingClient) {
      clientId = existingClient.id;
    } else {
      const { data: newClient, error: cErr } = await admin
        .from("clients")
        .insert({
          team_id: form.team_id,
          user_id: form.user_id,
          first_name: String(contact.first_name).slice(0, 100),
          last_name: String(contact.last_name).slice(0, 100),
          email: normalizedEmail,
          phone: contact.phone ? String(contact.phone).slice(0, 40) : null,
          address_line1: contact.address_line1 ? String(contact.address_line1).slice(0, 200) : null,
          city: contact.city ? String(contact.city).slice(0, 80) : null,
          state: contact.state ? String(contact.state).slice(0, 80) : null,
          zip: contact.zip ? String(contact.zip).slice(0, 20) : null,
          status: "lead",
          lead_source: "pricing_form",
        })
        .select("id")
        .single();
      if (cErr || !newClient) {
        console.error("client insert failed", cErr);
        return new Response(JSON.stringify({ error: "could not save submission" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      clientId = newClient.id;
    }

    // Allocate quote number.
    const nextNum = (company?.next_quote_number ?? 1001) as number;
    const prefix = (company?.quote_prefix ?? "Q-") as string;
    const quoteNumber = `${prefix}${nextNum}`;

    const { data: quote, error: qErr } = await admin
      .from("quotes")
      .insert({
        team_id: form.team_id,
        user_id: form.user_id,
        client_id: clientId,
        quote_number: quoteNumber,
        status: "draft",
        title: `Online booking — ${contact.first_name} ${contact.last_name}`,
        subtotal,
        tax_amount: taxTotal,
        total,
        client_notes: null,
      })
      .select("id, quote_number")
      .single();
    if (qErr || !quote) {
      console.error("quote insert failed", qErr);
      return new Response(JSON.stringify({ error: "could not create quote" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Bump next_quote_number (best-effort; race-safe enough for a low-frequency endpoint).
    if (company) {
      await admin
        .from("company_settings")
        .update({ next_quote_number: nextNum + 1 })
        .eq("team_id", form.team_id);
    }

    // Insert line items
    const { error: liErr } = await admin
      .from("quote_line_items")
      .insert(lineItems.map((li) => ({
        team_id: form.team_id,
        user_id: form.user_id,
        quote_id: quote.id,
        service_id: li.service_id,
        description: li.description,
        quantity: li.quantity,
        unit_price: li.unit_price,
        tax_rate: li.tax_rate,
        line_total: Math.round(li.quantity * li.unit_price * 100) / 100,
        sort_order: li.sort_order,
      })));
    if (liErr) console.error("line items insert failed (non-fatal)", liErr);

    // Record submission for the audit trail.
    const ipHash = await sha256Hex(`${ip}|${form.team_id}`);
    const ua = (req.headers.get("user-agent") || "").slice(0, 300);

    await admin.from("pricing_form_submissions").insert({
      team_id: form.team_id,
      form_id: form.id,
      slug: form.slug,
      contact: {
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email,
        phone: contact.phone || null,
        address_line1: contact.address_line1 || null,
        city: contact.city || null,
        state: contact.state || null,
        zip: contact.zip || null,
      },
      selected_services: selected,
      answers,
      computed_subtotal: subtotal,
      computed_tax: taxTotal,
      computed_total: total,
      client_id: clientId,
      quote_id: quote.id,
      status: "converted",
      ip_hash: ipHash,
      user_agent: ua,
    });

    return new Response(JSON.stringify({ ok: true, quote_number: quote.quote_number }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("submit-pricing-form error", e);
    return new Response(JSON.stringify({ error: "server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
