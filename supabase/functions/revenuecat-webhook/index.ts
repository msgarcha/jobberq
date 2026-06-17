import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  console.log(`[REVENUECAT-WEBHOOK] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

// Map an Apple/RevenueCat product identifier to a QuickLinq tier.
function tierFromProductId(productId: string | null): string | null {
  if (!productId) return null;
  const lower = productId.toLowerCase();
  if (lower.includes("business")) return "business";
  if (lower.includes("pro")) return "pro";
  if (lower.includes("starter")) return "starter";
  return null;
}

// Events that mean the subscription is currently active/renewing.
const ACTIVE_EVENTS = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "PRODUCT_CHANGE",
  "UNCANCELLATION",
  "NON_RENEWING_PURCHASE",
  "SUBSCRIPTION_EXTENDED",
]);

// Events that mean access has ended.
const INACTIVE_EVENTS = new Set([
  "EXPIRATION",
  "SUBSCRIPTION_PAUSED",
]);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate the shared secret RevenueCat sends in the Authorization header.
    const expected = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");
    if (!expected) throw new Error("REVENUECAT_WEBHOOK_SECRET not set");
    const auth = req.headers.get("Authorization") || "";
    if (auth !== expected && auth !== `Bearer ${expected}`) {
      logStep("Unauthorized webhook call");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const event = body?.event;
    if (!event) {
      return new Response(JSON.stringify({ error: "No event" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const eventType: string = event.type;
    // app_user_id is set by the client to the Supabase user id.
    const appUserId: string | null = event.app_user_id ?? null;
    const productId: string | null = event.product_id ?? null;
    const expirationMs: number | null = event.expiration_at_ms ?? null;
    logStep("Event received", { eventType, appUserId, productId });

    if (eventType === "TRANSFER" || !appUserId) {
      // Nothing actionable without a user id.
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine active state. For ambiguous events (CANCELLATION, BILLING_ISSUE)
    // rely on the expiration timestamp: access remains until it passes.
    const expiresAt = expirationMs ? new Date(expirationMs) : null;
    let isActive: boolean;
    if (ACTIVE_EVENTS.has(eventType)) {
      isActive = true;
    } else if (INACTIVE_EVENTS.has(eventType)) {
      isActive = false;
    } else {
      // CANCELLATION, BILLING_ISSUE, etc. — active while not yet expired.
      isActive = expiresAt ? expiresAt.getTime() > Date.now() : false;
    }

    const tier = tierFromProductId(productId);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const { error } = await supabase
      .from("iap_entitlements")
      .upsert(
        {
          user_id: appUserId,
          provider: "apple",
          product_id: productId,
          tier,
          is_active: isActive,
          expires_at: expiresAt ? expiresAt.toISOString() : null,
          rc_app_user_id: appUserId,
          raw: body,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

    if (error) {
      logStep("Upsert error", { message: error.message });
      throw error;
    }

    logStep("Entitlement updated", { appUserId, tier, isActive });
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
