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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const invoiceId = session.metadata?.invoice_id;
    const userId = session.metadata?.user_id;

    if (!invoiceId || !userId) {
      console.error("Missing metadata in checkout session");
      return new Response(JSON.stringify({ error: "Missing metadata" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Use service role to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const amountPaid = (session.amount_total || 0) / 100;

    // Record the payment
    const { error: paymentError } = await supabaseAdmin.from("payments").insert({
      invoice_id: invoiceId,
      user_id: userId,
      amount: amountPaid,
      payment_method: "stripe",
      reference_number: session.id,
      stripe_payment_id: session.payment_intent as string,
      notes: "Paid via Stripe Checkout",
    });

    if (paymentError) {
      console.error("Error recording payment:", paymentError);
      return new Response(JSON.stringify({ error: "Failed to record payment" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update invoice totals
    const { data: invoice } = await supabaseAdmin
      .from("invoices")
      .select("amount_paid, total")
      .eq("id", invoiceId)
      .single();

    if (invoice) {
      const newAmountPaid = Number(invoice.amount_paid) + amountPaid;
      const newBalanceDue = Math.max(0, Number(invoice.total) - newAmountPaid);
      const isPaid = newBalanceDue <= 0;

      await supabaseAdmin
        .from("invoices")
        .update({
          amount_paid: newAmountPaid,
          balance_due: newBalanceDue,
          status: isPaid ? "paid" : undefined,
          paid_at: isPaid ? new Date().toISOString() : undefined,
        })
        .eq("id", invoiceId);
    }

    console.log(`Payment recorded for invoice ${invoiceId}: $${amountPaid}`);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
