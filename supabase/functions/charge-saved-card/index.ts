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
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { invoice_id, saved_card_id, amount } = await req.json();
    if (!invoice_id || !saved_card_id || !amount) {
      return new Response(JSON.stringify({ error: "invoice_id, saved_card_id, and amount required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load saved card
    const { data: savedCard, error: cardErr } = await supabase
      .from("client_saved_cards")
      .select("*")
      .eq("id", saved_card_id)
      .single();

    if (cardErr || !savedCard) {
      return new Response(JSON.stringify({ error: "Saved card not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up the business's connected Stripe account
    const { data: companySettings } = await supabase
      .from("company_settings")
      .select("stripe_account_id, stripe_onboarding_complete")
      .maybeSingle();

    const connectedAccountId =
      companySettings?.stripe_onboarding_complete
        ? companySettings.stripe_account_id
        : null;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2025-08-27.basil",
    });

    const piParams: any = {
      amount: Math.round(Number(amount) * 100),
      currency: "usd",
      customer: savedCard.stripe_customer_id,
      payment_method: savedCard.stripe_payment_method_id,
      off_session: true,
      confirm: true,
      metadata: {
        invoice_id,
        user_id: user.id,
        saved_card_id,
      },
    };

    // Route payment to the business's connected Stripe account
    if (connectedAccountId) {
      piParams.transfer_data = { destination: connectedAccountId };
    }

    const paymentIntent = await stripe.paymentIntents.create(piParams);

    if (paymentIntent.status === "succeeded") {
      // Record payment in DB using service role
      const serviceSupabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      // Get team_id from user's team membership
      const { data: membership } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id)
        .maybeSingle();

      await serviceSupabase.from("payments").insert({
        invoice_id,
        user_id: user.id,
        team_id: membership?.team_id,
        amount: Number(amount),
        payment_method: "credit_card",
        stripe_payment_id: paymentIntent.id,
        notes: `Charged saved card ending in ${savedCard.card_last4}`,
      });

      // Update invoice
      const { data: invoice } = await serviceSupabase
        .from("invoices")
        .select("amount_paid, total")
        .eq("id", invoice_id)
        .single();

      if (invoice) {
        const newAmountPaid = Number(invoice.amount_paid) + Number(amount);
        const newBalance = Number(invoice.total) - newAmountPaid;
        const updates: any = {
          amount_paid: newAmountPaid,
          balance_due: Math.max(0, newBalance),
        };
        if (newBalance <= 0) {
          updates.status = "paid";
          updates.paid_at = new Date().toISOString();
        }
        await serviceSupabase.from("invoices").update(updates).eq("id", invoice_id);
      }
    }

    return new Response(
      JSON.stringify({
        status: paymentIntent.status,
        payment_intent_id: paymentIntent.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error charging saved card:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
