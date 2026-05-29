import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { finalizeOnlineInvoicePayment } from "../_shared/finalize-online-payment.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2025-08-27.basil",
  });

  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature || !webhookSecret) {
    return new Response(JSON.stringify({ error: "Missing signature or webhook secret" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Handle checkout.session.completed (Stripe Checkout flow)
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const invoiceId = session.metadata?.invoice_id;
      const userId = session.metadata?.user_id;
      const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

      if (!invoiceId || !userId || !paymentIntentId) {
        console.error("Missing metadata in checkout session");
        return new Response(JSON.stringify({ error: "Missing metadata" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const amountPaid = (session.amount_total || 0) / 100;

      await finalizeOnlineInvoicePayment(supabaseAdmin, {
        invoiceId,
        paymentIntentId,
        amount: amountPaid,
        userId,
        referenceNumber: session.id,
        notes: "Paid online via Stripe Checkout",
      });

      console.log(`Checkout payment recorded for invoice ${invoiceId}: $${amountPaid}`);
    }

    // Handle payment_intent.succeeded (manual card entry, public pay, saved cards)
    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object as Stripe.PaymentIntent;
      const invoiceId = pi.metadata?.invoice_id;
      const userId = pi.metadata?.user_id;

      if (invoiceId && userId) {
        const amountPaid = pi.amount / 100;

        await finalizeOnlineInvoicePayment(supabaseAdmin, {
          invoiceId,
          paymentIntentId: pi.id,
          amount: amountPaid,
          userId,
          notes: "Paid online via Stripe",
        });

        console.log(`PaymentIntent succeeded for invoice ${invoiceId}: $${amountPaid}`);
      }
    }

    // Handle payment_intent.payment_failed
    if (event.type === "payment_intent.payment_failed") {
      const pi = event.data.object as Stripe.PaymentIntent;
      console.error(`PaymentIntent failed: ${pi.id}, reason: ${pi.last_payment_error?.message}`);

      await supabaseAdmin.from("webhook_errors").insert({
        event_type: "payment_intent.payment_failed",
        error_message: pi.last_payment_error?.message || "Payment failed",
        raw_payload: { payment_intent_id: pi.id, invoice_id: pi.metadata?.invoice_id },
      });
    }

    // Handle Stripe Connect account updates
    if (event.type === "account.updated") {
      const account = event.data.object as Stripe.Account;
      const isComplete = account.charges_enabled && account.details_submitted;

      await supabaseAdmin
        .from("company_settings")
        .update({
          stripe_onboarding_complete: isComplete,
          stripe_charges_enabled: account.charges_enabled || false,
          stripe_payouts_enabled: account.payouts_enabled || false,
        })
        .eq("stripe_account_id", account.id);

      console.log(`Account ${account.id} updated: charges=${account.charges_enabled}, payouts=${account.payouts_enabled}`);
    }

    // Handle payout.paid
    if (event.type === "payout.paid") {
      const payout = event.data.object as Stripe.Payout;

      // Find the company by connected account (from the event's account field)
      const connectedAccountId = (event as any).account;
      if (connectedAccountId) {
        const { data: settings } = await supabaseAdmin
          .from("company_settings")
          .select("team_id, user_id")
          .eq("stripe_account_id", connectedAccountId)
          .maybeSingle();

        if (settings) {
          await supabaseAdmin.from("payouts").insert({
            team_id: settings.team_id,
            user_id: settings.user_id,
            stripe_payout_id: payout.id,
            amount_cents: payout.amount,
            status: "paid",
            arrival_date: payout.arrival_date
              ? new Date(payout.arrival_date * 1000).toISOString().split("T")[0]
              : null,
          });

          console.log(`Payout recorded: ${payout.id} for team ${settings.team_id}`);
        }
      }
    }
  } catch (err) {
    console.error("Webhook processing error:", err);
    await supabaseAdmin.from("webhook_errors").insert({
      event_type: event.type,
      error_message: err.message || "Unknown error",
      raw_payload: { event_id: event.id },
    });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
