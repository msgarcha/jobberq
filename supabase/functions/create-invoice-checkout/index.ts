import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const { invoice_id } = await req.json();
    if (!invoice_id) {
      return new Response(JSON.stringify({ error: "invoice_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*, clients(email, first_name, last_name, company_name)")
      .eq("id", invoice_id)
      .single();

    if (invoiceError || !invoice) {
      return new Response(JSON.stringify({ error: "Invoice not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (invoice.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const balanceDue = Number(invoice.balance_due);
    if (balanceDue <= 0) {
      return new Response(JSON.stringify({ error: "No balance due on this invoice" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: companySettings } = await supabase
      .from("company_settings")
      .select("stripe_account_id, stripe_onboarding_complete, stripe_charges_enabled")
      .maybeSingle();

    const connectedAccountId =
      companySettings?.stripe_charges_enabled
        ? companySettings.stripe_account_id
        : null;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2025-08-27.basil",
    });

    const client = invoice.clients;
    const clientEmail = client?.email || undefined;
    const balanceCents = Math.round(balanceDue * 100);

    // Calculate platform fee
    const feePercent = Number(Deno.env.get("PLATFORM_FEE_PERCENT") || "0");
    const applicationFee = feePercent > 0 ? Math.round(balanceCents * feePercent / 100) : undefined;

    const sessionParams: any = {
      mode: "payment",
      customer_email: clientEmail,
      line_items: [
        {
          price_data: {
            currency: "cad",
            product_data: {
              name: `Invoice ${invoice.invoice_number}`,
              description: invoice.title || `Payment for invoice ${invoice.invoice_number}`,
            },
            unit_amount: balanceCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        invoice_id: invoice.id,
        user_id: userId,
      },
      success_url: `${req.headers.get("origin")}/invoices/${invoice_id}?payment=success`,
      cancel_url: `${req.headers.get("origin")}/invoices/${invoice_id}?payment=cancelled`,
    };

    if (connectedAccountId) {
      sessionParams.payment_intent_data = {
        transfer_data: { destination: connectedAccountId },
      };
      if (applicationFee) {
        sessionParams.payment_intent_data.application_fee_amount = applicationFee;
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
