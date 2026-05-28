import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { notifyOwner, formatCurrency, clientDisplayName, appUrl } from "../_shared/notify-owner.ts";

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
      .select("id, invoice_number, title, subtotal, discount_amount, tax_amount, total, balance_due, amount_paid, status, due_date, created_at, client_id, team_id, viewed_at, clients(first_name, last_name, company_name)")
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
      .select("company_name, logo_url, email, phone, address_line1, city, state, zip, stripe_charges_enabled, website")
      .eq("team_id", invoice.team_id)
      .maybeSingle();

    // Record viewed_at (first view only) and notify owner
    if (!(invoice as any).viewed_at) {
      await supabaseAdmin
        .from("invoices")
        .update({ viewed_at: new Date().toISOString() })
        .eq("id", invoice_id);

      const cName = clientDisplayName((invoice as any).clients);
      const amt = formatCurrency(invoice.total);
      await notifyOwner({
        teamId: invoice.team_id,
        event: "invoice_viewed",
        title: `${cName} opened invoice ${invoice.invoice_number}`,
        body: amt ? `${amt} • Just viewed for the first time` : "Just viewed for the first time",
        link: `/invoices/${invoice.id}`,
        entityType: "invoice",
        entityId: invoice.id,
        idempotencySuffix: invoice.id,
        templateData: {
          clientName: cName,
          invoiceNumber: invoice.invoice_number,
          amount: amt,
          invoiceUrl: appUrl(`/invoices/${invoice.id}`),
        },
      });
    }

    // Only ever expose a *publishable* key (pk_...) to the browser. Never leak a
    // secret key, even if the secret was misconfigured with the wrong value.
    const rawKey = Deno.env.get("STRIPE_PUBLISHABLE_KEY") ?? "";
    const publishableKey = rawKey.startsWith("pk_") ? rawKey : null;

    return new Response(
      JSON.stringify({
        invoice,
        line_items: lineItems || [],
        company,
        stripe_publishable_key: publishableKey,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error loading public invoice:", error);
    return new Response(JSON.stringify({ error: "An internal error occurred. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
