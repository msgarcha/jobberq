import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  console.log(`[CHECK-SUBSCRIPTION] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) throw new Error(`Auth error: ${claimsError?.message || "Invalid token"}`);

    const userId = claimsData.claims.sub as string;
    const email = claimsData.claims.email as string;
    if (!email) throw new Error("User not authenticated");
    logStep("User authenticated", { email });

    // Load profile flags up front
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("trial_ends_at, access_revoked, is_super_admin")
      .eq("user_id", userId)
      .maybeSingle();

    const trialEndsAt = profile?.trial_ends_at || null;
    const accessRevoked = !!profile?.access_revoked;
    const isSuperAdmin = !!profile?.is_super_admin;

    // Map Stripe product IDs (current + legacy) to tier keys so the backend
    // can return a definitive tier the client doesn't have to re-derive.
    const STRIPE_PRODUCT_TIER: Record<string, "starter" | "pro" | "business"> = {
      // current pricing
      prod_UZB5bIhMsXcmZa: "starter",
      prod_UZB5c821ACqF2q: "pro",
      prod_UZB5tos0Dglji1: "business",
      // legacy pricing
      prod_U6yyGorJZoTTuw: "starter",
      prod_U6z3Y8rbHA1uhQ: "pro",
      prod_U6z4mV3LY4CeeP: "business",
    };
    // Map Apple product IDs back to a representative Stripe product id so the
    // client's getTierByProductId() resolves the same tier across platforms.
    const APPLE_TIER_TO_STRIPE: Record<string, string> = {
      starter: "prod_UZB5bIhMsXcmZa",
      pro: "prod_UZB5c821ACqF2q",
      business: "prod_UZB5tos0Dglji1",
    };

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email, limit: 1 });

    let subscribed = false;
    let productId: string | null = null;
    let tier: "starter" | "pro" | "business" | null = null;
    let subscriptionEnd: string | null = null;
    let isTrialing = false;
    let source: "stripe" | "apple" | null = null;

    if (customers.data.length > 0) {
      const customerId = customers.data[0].id;
      logStep("Found customer", { customerId });
      const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 });
      const trialingSubs = await stripe.subscriptions.list({ customer: customerId, status: "trialing", limit: 1 });
      const allSubs = [...subscriptions.data, ...trialingSubs.data];

      if (allSubs.length > 0) {
        const sub = allSubs[0];
        subscribed = true;
        source = "stripe";
        subscriptionEnd = new Date(sub.current_period_end * 1000).toISOString();
        productId = sub.items.data[0].price.product as string;
        tier = (productId && STRIPE_PRODUCT_TIER[productId]) || null;
        isTrialing = sub.status === "trialing";
        logStep("Active Stripe subscription", { productId, tier, isTrialing, end: subscriptionEnd });
      }
    }

    // Merge Apple (RevenueCat) entitlement — recognised on web too.
    if (!subscribed) {
      const { data: ent } = await supabaseClient
        .from("iap_entitlements")
        .select("is_active, tier, product_id, expires_at, provider")
        .eq("user_id", userId)
        .eq("provider", "apple")
        .maybeSingle();

      const appleActive =
        !!ent?.is_active &&
        (!ent.expires_at || new Date(ent.expires_at) > new Date());

      if (appleActive) {
        subscribed = true;
        source = "apple";
        subscriptionEnd = ent?.expires_at ?? null;
        tier = (ent?.tier as "starter" | "pro" | "business" | null) ?? null;
        productId = ent?.tier ? APPLE_TIER_TO_STRIPE[ent.tier] ?? null : null;
        logStep("Active Apple entitlement", { tier, end: subscriptionEnd });
      }
    }

    // App-trial logic (no paid sub): isTrialing if trial in future
    if (!subscribed) {
      isTrialing = trialEndsAt ? new Date(trialEndsAt) > new Date() : false;
    }

    // Trial considered expired only when not subscribed, not trialing, and not super admin
    const trialExpired = !subscribed && !isTrialing && !isSuperAdmin;

    return new Response(JSON.stringify({
      subscribed,
      is_trialing: isTrialing,
      trial_ends_at: trialEndsAt,
      trial_expired: trialExpired,
      access_revoked: accessRevoked,
      is_super_admin: isSuperAdmin,
      product_id: productId,
      tier,
      subscription_end: subscriptionEnd,
      source,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
