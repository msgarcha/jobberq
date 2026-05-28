import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { notifyOwner, formatCurrency, clientDisplayName, appUrl } from "../_shared/notify-owner.ts";

// Send a "Payment received" receipt email to the CLIENT when an invoice is fully paid.
// Best-effort: never throws — logs errors so the webhook keeps returning 200.
async function sendClientReceipt(admin: any, invoice: any) {
  try {
    const client = invoice?.clients;
    const email = client?.email;
    if (!email) {
      console.log(`[receipt] no client email for invoice ${invoice?.id}, skipping`);
      return;
    }

    // 1. Generate the paid-invoice PDF receipt (best-effort)
    let receiptUrl = "";
    try {
      const { data: pdfRes, error: pdfErr } = await admin.functions.invoke("generate-invoice-pdf", {
        body: { invoice_id: invoice.id },
      });
      if (pdfErr) console.error("[receipt] PDF generation error:", pdfErr);
      else receiptUrl = pdfRes?.url || "";
    } catch (e) {
      console.error("[receipt] PDF invoke failed:", e);
    }

    // 2. Company name for branding
    const { data: company } = await admin
      .from("company_settings")
      .select("company_name")
      .eq("team_id", invoice.team_id)
      .maybeSingle();

    const cName = clientDisplayName(client);
    const paymentDate = new Date().toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    // 3. Send the receipt email to the client (idempotent per invoice)
    const { error: invokeErr } = await admin.functions.invoke("send-transactional-email", {
      body: {
        templateName: "payment-receipt",
        recipientEmail: email,
        idempotencyKey: `receipt-${invoice.id}`,
        templateData: {
          companyName: company?.company_name || "",
          clientName: client?.first_name || cName,
          invoiceNumber: invoice.invoice_number,
          amount: formatCurrency(invoice.total),
          paymentDate,
          receiptUrl,
          invoiceUrl: `https://quicklinq.app/pay/${invoice.id}`,
        },
      },
    });
    if (invokeErr) console.error("[receipt] email invoke error:", invokeErr);
    else console.log(`[receipt] sent to client for invoice ${invoice.id}`);
  } catch (e) {
    console.error("[receipt] sendClientReceipt failed:", e);
  }
}

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

      if (!invoiceId || !userId) {
        console.error("Missing metadata in checkout session");
        return new Response(JSON.stringify({ error: "Missing metadata" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const amountPaid = (session.amount_total || 0) / 100;

      // Get team_id from invoice
      const { data: invoiceData } = await supabaseAdmin
        .from("invoices")
        .select("team_id")
        .eq("id", invoiceId)
        .single();

      const { error: paymentError } = await supabaseAdmin.from("payments").insert({
        invoice_id: invoiceId,
        user_id: userId,
        team_id: invoiceData?.team_id,
        amount: amountPaid,
        payment_method: "stripe",
        reference_number: session.id,
        stripe_payment_id: session.payment_intent as string,
        notes: "Paid via Stripe Checkout",
      });

      if (paymentError) {
        console.error("Error recording payment:", paymentError);
      }

      // Update invoice totals
      const { data: invoice } = await supabaseAdmin
        .from("invoices")
        .select("id, team_id, invoice_number, amount_paid, total, clients(first_name, last_name, company_name, email)")
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

        // When fully paid, email the CLIENT a branded receipt with the paid-invoice PDF.
        if (isPaid) {
          await sendClientReceipt(supabaseAdmin, invoice);
        }
      }

      console.log(`Checkout payment recorded for invoice ${invoiceId}: $${amountPaid}`);
    }

    // Handle payment_intent.succeeded (manual card entry, public pay, saved cards)
    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object as Stripe.PaymentIntent;
      const invoiceId = pi.metadata?.invoice_id;
      const userId = pi.metadata?.user_id;

      if (invoiceId && userId) {
        // Check if payment already recorded (avoid duplicates from checkout flow)
        const { data: existingPayment } = await supabaseAdmin
          .from("payments")
          .select("id")
          .eq("stripe_payment_id", pi.id)
          .maybeSingle();

        if (!existingPayment) {
          const amountPaid = pi.amount / 100;

          const { data: invoiceData } = await supabaseAdmin
            .from("invoices")
            .select("team_id, amount_paid, total, invoice_number, id, clients(first_name, last_name, company_name, email)")
            .eq("id", invoiceId)
            .single();

          await supabaseAdmin.from("payments").insert({
            invoice_id: invoiceId,
            user_id: userId,
            team_id: invoiceData?.team_id,
            amount: amountPaid,
            payment_method: "stripe",
            stripe_payment_id: pi.id,
            notes: "Payment via Stripe",
          });

          if (invoiceData) {
            const newAmountPaid = Number(invoiceData.amount_paid) + amountPaid;
            const newBalance = Math.max(0, Number(invoiceData.total) - newAmountPaid);
            const isFull = newBalance <= 0;
            await supabaseAdmin.from("invoices").update({
              amount_paid: newAmountPaid,
              balance_due: newBalance,
              status: isFull ? "paid" : undefined,
              paid_at: isFull ? new Date().toISOString() : undefined,
            }).eq("id", invoiceId);

            const cName = clientDisplayName((invoiceData as any).clients);
            const amt = formatCurrency(amountPaid);
            const event = isFull ? "invoice_paid" : "deposit_paid";
            await notifyOwner({
              teamId: invoiceData.team_id,
              event,
              title: isFull
                ? `${cName} paid invoice ${invoiceData.invoice_number} in full`
                : `${cName} sent a deposit on ${invoiceData.invoice_number}`,
              body: `${amt} received via Stripe`,
              link: `/invoices/${invoiceData.id}`,
              entityType: "invoice",
              entityId: invoiceData.id,
              idempotencySuffix: pi.id,
              templateData: {
                kind: isFull ? "full" : "deposit",
                clientName: cName,
                invoiceNumber: invoiceData.invoice_number,
                amount: amt,
                invoiceUrl: appUrl(`/invoices/${invoiceData.id}`),
              },
            });

            // When fully paid, email the CLIENT a branded receipt with the paid-invoice PDF.
            if (isFull) {
              await sendClientReceipt(supabaseAdmin, invoiceData);
            }
          }

          console.log(`PaymentIntent succeeded for invoice ${invoiceId}: $${amountPaid}`);
        }
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
