import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { quote_id } = await req.json();
    if (!quote_id) {
      return new Response(JSON.stringify({ error: "quote_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: quote, error: qErr } = await supabaseAdmin
      .from("quotes")
      .select("id, quote_number, title, subtotal, discount_amount, tax_amount, total, status, valid_until, created_at, client_id, team_id, client_notes, viewed_at, deposit_type, deposit_value, deposit_amount, clients(first_name, last_name, company_name, email)")
      .eq("id", quote_id)
      .single();

    if (qErr || !quote) {
      return new Response(JSON.stringify({ error: "Quote not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: lineItems } = await supabaseAdmin
      .from("quote_line_items")
      .select("description, quantity, unit_price, line_total, tax_rate, discount_percent")
      .eq("quote_id", quote_id)
      .order("sort_order", { ascending: true });

    // Record viewed_at timestamp (first view only)
    if (!quote.viewed_at) {
      await supabaseAdmin
        .from("quotes")
        .update({ viewed_at: new Date().toISOString() })
        .eq("id", quote_id);
    }

    const { data: company } = await supabaseAdmin
      .from("company_settings")
      .select("company_name, logo_url, email, phone, address_line1, city, state, zip, website")
      .eq("team_id", quote.team_id)
      .maybeSingle();

    // Generate a short-lived HMAC approval token bound to this quote_id.
    // Client must echo it back to approve-quote, which proves the caller actually
    // loaded the quote (not just guessed/enumerated UUIDs).
    const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const expiresAt = Date.now() + 1000 * 60 * 60 * 24; // 24h
    const payload = `${quote.id}.${expiresAt}`;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
    const sigHex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
    const approval_token = `${expiresAt}.${sigHex}`;

    return new Response(
      JSON.stringify({ quote, line_items: lineItems || [], company, approval_token }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error loading public quote:", error);
    return new Response(JSON.stringify({ error: "An internal error occurred. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
