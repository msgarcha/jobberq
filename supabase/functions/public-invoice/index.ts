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
    const { invoice_id } = await req.json();
    if (!invoice_id) {
      return new Response(JSON.stringify({ error: "invoice_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Load invoice with line items and client info
    const { data: invoice, error: invErr } = await supabaseAdmin
      .from("invoices")
      .select("id, invoice_number, title, subtotal, discount_amount, tax_amount, total, balance_due, amount_paid, status, due_date, created_at, client_id, team_id, clients(first_name, last_name, company_name, email)")
      .eq("id", invoice_id)
      .single();

    if (invErr || !invoice) {
      return new Response(JSON.stringify({ error: "Invoice not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load line items
    const { data: lineItems } = await supabaseAdmin
      .from("invoice_line_items")
      .select("description, quantity, unit_price, line_total, tax_rate, discount_percent")
      .eq("invoice_id", invoice_id)
      .order("sort_order", { ascending: true });

    // Load company settings for branding
    const { data: company } = await supabaseAdmin
      .from("company_settings")
      .select("company_name, logo_url, email, phone, address_line1, city, state, zip, stripe_charges_enabled")
      .eq("team_id", invoice.team_id)
      .maybeSingle();

    return new Response(
      JSON.stringify({
        invoice,
        line_items: lineItems || [],
        company,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error loading public invoice:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
