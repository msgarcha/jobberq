// Document reminder sweep — runs daily via pg_cron.
// Sends automatic payment reminders for invoices and follow-up reminders for
// quotes to the CLIENT, on a per-document cadence (weekly/biweekly/monthly),
// capped by a per-document reminder limit. Stops automatically once a document
// is paid/approved/converted/expired or the limit is reached.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = "https://app.quicklinq.ca";

function freqToMs(freq: string): number {
  switch (freq) {
    case "biweekly": return 14 * 24 * 3600_000;
    case "monthly": return 30 * 24 * 3600_000;
    case "weekly":
    default: return 7 * 24 * 3600_000;
  }
}

function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "";
  try {
    return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(Number(amount));
  } catch {
    return `$${Number(amount).toFixed(2)}`;
  }
}

function formatDate(d: string | null | undefined): string {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

function clientName(c: any): string {
  if (!c) return "there";
  if (c.company_name) return c.company_name;
  const name = `${c.first_name || ""} ${c.last_name || ""}`.trim();
  return name || "there";
}

async function sendEmail(payload: Record<string, unknown>): Promise<boolean> {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY,
    },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    console.error("send-transactional-email failed:", await resp.text());
    return false;
  }
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Cron-only endpoint — constant-time comparison of the raw service-role key.
  {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const expected = SUPABASE_SERVICE_ROLE_KEY;
    let ok = token.length > 0 && token.length === expected.length;
    if (ok) {
      let diff = 0;
      for (let i = 0; i < expected.length; i++) diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
      ok = diff === 0;
    }
    if (!ok) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  try {
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();

    const stats = {
      invoices: { sent: 0, skipped: 0, errors: 0 },
      quotes: { sent: 0, skipped: 0, errors: 0 },
    };

    // Resolve company names per team (no direct FK, so look up separately + cache)
    const companyNameCache = new Map<string, string>();
    async function companyNameForTeam(teamId: string | null): Promise<string> {
      if (!teamId) return "Our Company";
      if (companyNameCache.has(teamId)) return companyNameCache.get(teamId)!;
      const { data } = await admin
        .from("company_settings")
        .select("company_name")
        .eq("team_id", teamId)
        .maybeSingle();
      const name = data?.company_name || "Our Company";
      companyNameCache.set(teamId, name);
      return name;
    }

    // ---- INVOICES ----
    const { data: invoices } = await admin
      .from("invoices")
      .select("id, invoice_number, status, total, balance_due, due_date, team_id, reminder_frequency, reminder_limit, reminders_sent, clients(first_name, last_name, company_name, email)")
      .eq("reminders_enabled", true)
      .in("status", ["sent", "viewed", "overdue"])
      .lte("next_reminder_at", nowIso)
      .limit(200);

    for (const inv of invoices || []) {
      const sentSoFar = inv.reminders_sent || 0;
      if (sentSoFar >= (inv.reminder_limit || 0)) {
        await admin.from("invoices").update({ next_reminder_at: null }).eq("id", inv.id);
        stats.invoices.skipped++;
        continue;
      }
      const client = (inv as any).clients;
      const email = client?.email;
      if (!email) {
        await admin.from("invoices").update({ next_reminder_at: null }).eq("id", inv.id);
        stats.invoices.skipped++;
        continue;
      }

      const company = await companyNameForTeam((inv as any).team_id);
      const ok = await sendEmail({
        templateName: "invoice-reminder",
        recipientEmail: email,
        idempotencyKey: `invoice-reminder-${inv.id}-${sentSoFar + 1}`,
        templateData: {
          companyName: company,
          clientName: clientName(client),
          documentNumber: inv.invoice_number,
          amount: formatCurrency(inv.balance_due ?? inv.total),
          dueDate: formatDate(inv.due_date),
          ctaUrl: `${APP_URL}/pay/${inv.id}`,
        },
      });

      if (ok) {
        const newCount = sentSoFar + 1;
        const reachedLimit = newCount >= (inv.reminder_limit || 0);
        await admin.from("invoices").update({
          reminders_sent: newCount,
          last_reminder_at: nowIso,
          next_reminder_at: reachedLimit ? null : new Date(nowMs + freqToMs(inv.reminder_frequency)).toISOString(),
        }).eq("id", inv.id);
        stats.invoices.sent++;
      } else {
        // Back off a day so a transient failure doesn't burn the schedule
        await admin.from("invoices").update({
          next_reminder_at: new Date(nowMs + 24 * 3600_000).toISOString(),
        }).eq("id", inv.id);
        stats.invoices.errors++;
      }
    }

    // ---- QUOTES ----
    const today = nowIso.split("T")[0];
    const { data: quotes } = await admin
      .from("quotes")
      .select("id, quote_number, status, total, valid_until, team_id, reminder_frequency, reminder_limit, reminders_sent, clients(first_name, last_name, company_name, email)")
      .eq("reminders_enabled", true)
      .in("status", ["sent", "viewed"])
      .lte("next_reminder_at", nowIso)
      .limit(200);

    for (const q of quotes || []) {
      const sentSoFar = q.reminders_sent || 0;
      // Stop if past validity or limit reached
      if ((q.valid_until && q.valid_until < today) || sentSoFar >= (q.reminder_limit || 0)) {
        await admin.from("quotes").update({ next_reminder_at: null }).eq("id", q.id);
        stats.quotes.skipped++;
        continue;
      }
      const client = (q as any).clients;
      const email = client?.email;
      if (!email) {
        await admin.from("quotes").update({ next_reminder_at: null }).eq("id", q.id);
        stats.quotes.skipped++;
        continue;
      }

      const company = await companyNameForTeam((q as any).team_id);
      const ok = await sendEmail({
        templateName: "quote-reminder",
        recipientEmail: email,
        idempotencyKey: `quote-reminder-${q.id}-${sentSoFar + 1}`,
        templateData: {
          companyName: company,
          clientName: clientName(client),
          documentNumber: q.quote_number,
          amount: formatCurrency(q.total),
          validUntil: formatDate(q.valid_until),
          ctaUrl: `${APP_URL}/quote/view/${q.id}`,
        },
      });

      if (ok) {
        const newCount = sentSoFar + 1;
        const reachedLimit = newCount >= (q.reminder_limit || 0);
        await admin.from("quotes").update({
          reminders_sent: newCount,
          last_reminder_at: nowIso,
          next_reminder_at: reachedLimit ? null : new Date(nowMs + freqToMs(q.reminder_frequency)).toISOString(),
        }).eq("id", q.id);
        stats.quotes.sent++;
      } else {
        await admin.from("quotes").update({
          next_reminder_at: new Date(nowMs + 24 * 3600_000).toISOString(),
        }).eq("id", q.id);
        stats.quotes.errors++;
      }
    }

    return new Response(JSON.stringify({ ok: true, stats }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-document-reminders error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
