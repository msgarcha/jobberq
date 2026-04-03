/**
 * Stripe Connect V2 Webhook — Thin Events
 * =========================================
 * Handles "thin" webhook events for V2 connected accounts:
 *   - v2.core.account[requirements].updated
 *   - v2.core.account[.recipient].capability_status_updated
 *
 * Thin events contain only the event ID and type — the full event data
 * must be fetched separately using the Events API.
 *
 * Setup instructions:
 * -------------------
 * 1. In your Stripe Dashboard → Developers → Webhooks → + Add destination
 * 2. In "Events from" select "Connected accounts"
 * 3. Click "Show advanced options" → Payload style: "Thin"
 * 4. Select event types:
 *    - v2.core.account[requirements].updated
 *    - v2.core.account[.recipient].capability_status_updated
 * 5. Set the endpoint URL to this function's URL
 * 6. Copy the webhook signing secret and save it as STRIPE_CONNECT_WEBHOOK_SECRET
 *
 * Local testing with Stripe CLI:
 * stripe listen --thin-events \
 *   'v2.core.account[requirements].updated,v2.core.account[.recipient].capability_status_updated' \
 *   --forward-thin-to http://localhost:54321/functions/v1/stripe-connect-webhook-v2
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ------------------------------------------------------------------
    // 1. Verify the webhook signature
    //    STRIPE_CONNECT_WEBHOOK_SECRET should be set as a secret.
    //    If missing, we log a warning and return 400.
    // ------------------------------------------------------------------
    const webhookSecret = Deno.env.get("STRIPE_CONNECT_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error(
        "STRIPE_CONNECT_WEBHOOK_SECRET is not configured. " +
        "Add it in Lovable Cloud → Secrets using the signing secret from your Stripe webhook endpoint."
      );
      return new Response(
        JSON.stringify({ error: "Webhook secret not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Initialise the Stripe Client
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: "STRIPE_SECRET_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const stripeClient = new Stripe(stripeSecretKey, {
      apiVersion: "2025-08-27.basil",
    });

    // ------------------------------------------------------------------
    // 2. Parse the thin event
    //    Thin events are verified using `parseThinEvent` which checks
    //    the Stripe-Signature header against the webhook secret.
    // ------------------------------------------------------------------
    const rawBody = await req.text();
    const sig = req.headers.get("stripe-signature");
    if (!sig) {
      return new Response(
        JSON.stringify({ error: "Missing stripe-signature header" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // parseThinEvent verifies the signature and returns { id, type, ... }
    const thinEvent = stripeClient.parseThinEvent(rawBody, sig, webhookSecret);
    console.log(`Received thin event: ${thinEvent.type} (${thinEvent.id})`);

    // ------------------------------------------------------------------
    // 3. Fetch the full event data
    //    Since thin events only contain the event ID and type, we must
    //    retrieve the full event to get the actual data payload.
    // ------------------------------------------------------------------
    const event = await (stripeClient as any).v2.core.events.retrieve(thinEvent.id);

    // ------------------------------------------------------------------
    // 4. Handle each event type
    // ------------------------------------------------------------------
    switch (thinEvent.type) {
      case "v2.core.account.requirements.updated": {
        // Requirements have changed on a connected account.
        // You should check if new requirements are now due.
        const accountId = event?.data?.account_id || event?.related_object?.id;
        console.log(`Requirements updated for account: ${accountId}`);

        if (accountId) {
          // Retrieve the updated account to check current requirements
          const account = await (stripeClient as any).v2.core.accounts.retrieve(accountId, {
            include: ["requirements"],
          });

          const status = account?.requirements?.summary?.minimum_deadline?.status;
          console.log(`  Requirements status: ${status}`);

          // If requirements are currently_due or past_due, the account
          // owner needs to complete onboarding or provide updated info.
          if (status === "currently_due" || status === "past_due") {
            console.log(`  ⚠️ Account ${accountId} has pending requirements: ${status}`);
            // TODO: Send a notification to the account owner prompting
            //       them to complete onboarding or update their information.
          }
        }
        break;
      }

      case "v2.core.account.capability_status_updated": {
        // A capability status changed on a connected account.
        const accountId = event?.data?.account_id || event?.related_object?.id;
        console.log(`Capability status updated for account: ${accountId}`);

        if (accountId) {
          const account = await (stripeClient as any).v2.core.accounts.retrieve(accountId, {
            include: ["configuration.recipient"],
          });

          const transfersStatus =
            account?.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers?.status;
          console.log(`  Transfers capability status: ${transfersStatus}`);

          if (transfersStatus === "active") {
            console.log(`  ✅ Account ${accountId} is now ready to receive payments!`);
          } else {
            console.log(`  ⏳ Account ${accountId} transfers status: ${transfersStatus}`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${thinEvent.type}`);
    }

    // ------------------------------------------------------------------
    // 5. Return 200 to acknowledge receipt
    //    Stripe will retry if you don't return 2xx within ~30 seconds.
    // ------------------------------------------------------------------
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
