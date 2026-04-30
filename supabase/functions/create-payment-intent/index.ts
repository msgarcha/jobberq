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
    const body = await req.json();
    const { invoice_id, amount, save_card, client_id, public_pay } = body;

    if (!invoice_id || !amount) {
      return new Response(JSON.stringify({ error: "invoice_id and amount required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2025-08-27.basil",
    });

    const serviceSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let userId: string | null = null;

    // For authenticated requests
    if (authHeader?.startsWith("Bearer ")) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
      if (authErr || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = user.id;
    } else if (!public_pay) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load invoice with service role for public pay
    const { data: invoice, error: invErr } = await serviceSupabase
      .from("invoices")
      .select("*, clients(email, first_name, last_name)")
      .eq("id", invoice_id)
      .single();

    if (invErr || !invoice) {
      return new Response(JSON.stringify({ error: "Invoice not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SECURITY: For public (unauthenticated) payments, ignore client-supplied amount
    // and always charge the actual balance_due from the database to prevent tampering.
    // For authenticated team members, allow the supplied amount but cap it at balance_due.
    const balanceDue = Number(invoice.balance_due) || 0;
    let chargeAmount: number;
    if (public_pay && !userId) {
      chargeAmount = balanceDue;
    } else {
      const requested = Number(amount);
      if (!Number.isFinite(requested) || requested <= 0) {
        return new Response(JSON.stringify({ error: "Invalid amount" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      chargeAmount = Math.min(requested, balanceDue);
    }

    if (chargeAmount <= 0) {
      return new Response(JSON.stringify({ error: "Invoice has no balance due" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up the business's connected Stripe account
    const { data: companySettings } = await serviceSupabase
      .from("company_settings")
      .select("stripe_account_id, stripe_onboarding_complete, stripe_charges_enabled")
      .eq("team_id", invoice.team_id)
      .maybeSingle();

    const connectedAccountId =
      companySettings?.stripe_charges_enabled
        ? companySettings.stripe_account_id
        : null;

    const clientEmail = invoice.clients?.email;
    let customerId: string | undefined;

    // Find or create Stripe customer
    if (clientEmail) {
      const customers = await stripe.customers.list({ email: clientEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: clientEmail,
          name: `${invoice.clients?.first_name || ""} ${invoice.clients?.last_name || ""}`.trim(),
        });
        customerId = customer.id;
      }
    }

    const amountCents = Math.round(chargeAmount * 100);

    // Calculate platform fee
    const feePercent = Number(Deno.env.get("PLATFORM_FEE_PERCENT") || "0");
    const applicationFee = feePercent > 0 ? Math.round(amountCents * feePercent / 100) : undefined;

    const piParams: any = {
      amount: amountCents,
      currency: "cad",
      metadata: {
        invoice_id,
        user_id: userId || invoice.user_id,
      },
    };

    if (customerId) {
      piParams.customer = customerId;
    }

    if (save_card && customerId) {
      piParams.setup_future_usage = "off_session";
    }

    // Route payment to the business's connected Stripe account
    if (connectedAccountId) {
      piParams.transfer_data = { destination: connectedAccountId };
      if (applicationFee) {
        piParams.application_fee_amount = applicationFee;
      }
    }

    const paymentIntent = await stripe.paymentIntents.create(piParams);

    return new Response(
      JSON.stringify({
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        customer_id: customerId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return new Response(JSON.stringify({ error: "An internal error occurred. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
