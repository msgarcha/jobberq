import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  console.log(`[RC-WEBHOOK] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

// Apple App Store product id -> internal tier key
const APPLE_PRODUCT_TIER: Record<string, string> = {
  quicklinq_starter_monthly: "starter",
  quicklinq_pro_monthly: "pro",
  quicklinq_business_monthly: "business",
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1) Authenticate the webhook itself
    const expected = Deno.env.get("REVENUECAT_WEBHOOK_SECRET") ?? "";
    const provided = req.headers.get("Authorization") ?? "";
    if (!expected || provided !== expected) {
      logStep("Unauthorized webhook call");
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const event = body?.event ?? {};
    const type: string = event.type ?? "UNKNOWN";
    logStep("Event received", { type, store: event.store });

    if (type === "TEST") {
      return new Response(JSON.stringify({ ok: true, test: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) Resolve the Supabase user id from RC app_user_id / aliases
    const candidates: string[] = [
      event.app_user_id,
      event.original_app_user_id,
      ...(Array.isArray(event.aliases) ? event.aliases : []),
      event.transferred_to?.[0],
    ].filter(Boolean);
    const userId = candidates.find((c: string) => UUID_RE.test(c)) ?? null;

    if (!userId) {
      logStep("No valid user id in event — acknowledging without write", { candidates });
      return new Response(JSON.stringify({ ok: true, skipped: "no_user" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const productId: string | null = event.product_id ?? null;
    const tier = productId ? APPLE_PRODUCT_TIER[productId] ?? null : null;

    const now = Date.now();
    const expirationMs: number | null = event.expiration_at_ms ?? null;
    const graceMs: number | null = event.grace_period_expiration_at_ms ?? null;
    const effectiveExpiryMs = graceMs ?? expirationMs;

    // 3) Decide active state from event type
    let isActive: boolean;
    switch (type) {
      case "INITIAL_PURCHASE":
      case "RENEWAL":
      case "PRODUCT_CHANGE":
      case "UNCANCELLATION":
      case "NON_RENEWING_PURCHASE":
      case "SUBSCRIPTION_EXTENDED":
      case "TRANSFER":
        isActive = effectiveExpiryMs ? effectiveExpiryMs > now : true;
        break;
      case "CANCELLATION": // auto-renew turned off — keep access until expiry
      case "BILLING_ISSUE": // grace period — keep access until grace expiry
        isActive = effectiveExpiryMs ? effectiveExpiryMs > now : false;
        break;
      case "EXPIRATION":
      case "REFUND":
      case "SUBSCRIPTION_PAUSED":
        isActive = false;
        break;
      default:
        isActive = effectiveExpiryMs ? effectiveExpiryMs > now : false;
    }

    const expiresAt = expirationMs ? new Date(expirationMs).toISOString() : null;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { error } = await supabase
      .from("iap_entitlements")
      .upsert(
        {
          user_id: userId,
          provider: "apple",
          product_id: productId,
          tier,
          is_active: isActive,
          expires_at: expiresAt,
          rc_app_user_id: event.app_user_id ?? null,
          raw: body,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,provider" }
      );

    if (error) {
      logStep("Upsert error", { message: error.message });
      throw error;
    }

    logStep("Entitlement updated", { userId, tier, isActive, expiresAt });
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
