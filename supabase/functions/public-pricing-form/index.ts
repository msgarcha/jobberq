// Public, unauthenticated read of a published pricing form by slug.
// Returns ONLY what the public form needs to render. Never team_id, user_id, internal IDs of submissions, etc.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function isSlug(s: unknown): s is string {
  return typeof s === "string" && /^[a-z0-9-]{2,64}$/.test(s);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    let slug = url.searchParams.get("slug");
    if (!slug && req.method === "POST") {
      try {
        const body = await req.json();
        slug = body?.slug;
      } catch { /* ignore */ }
    }
    if (!isSlug(slug)) {
      return new Response(JSON.stringify({ error: "invalid slug" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: form, error } = await admin
      .from("pricing_forms")
      .select("id, team_id, slug, title, description, primary_color, logo_url, success_message, require_address, require_phone, is_published")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (error || !form) {
      return new Response(JSON.stringify({ error: "not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [{ data: services }, { data: questions }, { data: company }] = await Promise.all([
      admin
        .from("pricing_form_services")
        .select("id, display_name, base_price, unit_label, min_qty, max_qty, sort_order")
        .eq("form_id", form.id)
        .order("sort_order", { ascending: true }),
      admin
        .from("pricing_form_questions")
        .select("id, label, help_text, kind, required, options, applies_to_service_ids, sort_order")
        .eq("form_id", form.id)
        .order("sort_order", { ascending: true }),
      admin
        .from("company_settings")
        .select("company_name, default_tax_rate")
        .eq("team_id", form.team_id)
        .maybeSingle(),
    ]);

    return new Response(
      JSON.stringify({
        slug: form.slug,
        title: form.title,
        description: form.description,
        primary_color: form.primary_color,
        logo_url: form.logo_url,
        success_message: form.success_message,
        require_address: form.require_address,
        require_phone: form.require_phone,
        company_name: company?.company_name || null,
        tax_rate: Number(company?.default_tax_rate ?? 0),
        services: (services || []).map((s) => ({
          id: s.id,
          display_name: s.display_name,
          base_price: Number(s.base_price),
          unit_label: s.unit_label,
          min_qty: Number(s.min_qty),
          max_qty: Number(s.max_qty),
        })),
        questions: (questions || []).map((q) => ({
          id: q.id,
          label: q.label,
          help_text: q.help_text,
          kind: q.kind,
          required: q.required,
          options: Array.isArray(q.options) ? q.options : [],
          applies_to_service_ids: q.applies_to_service_ids || [],
        })),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("public-pricing-form error", e);
    return new Response(JSON.stringify({ error: "server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
