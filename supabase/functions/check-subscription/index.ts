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

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      // Check trial from profiles
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("trial_ends_at")
         .eq("user_id", userId)
        .single();

      const trialEndsAt = profile?.trial_ends_at || null;
      const isTrialing = trialEndsAt ? new Date(trialEndsAt) > new Date() : false;

      return new Response(JSON.stringify({
        subscribed: false,
        is_trialing: isTrialing,
        trial_ends_at: trialEndsAt,
        product_id: null,
        subscription_end: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    // Also check trialing subscriptions
    const trialingSubs = await stripe.subscriptions.list({
      customer: customerId,
      status: "trialing",
      limit: 1,
    });

    const allSubs = [...subscriptions.data, ...trialingSubs.data];
    const hasActiveSub = allSubs.length > 0;

    let productId: string | null = null;
    let subscriptionEnd: string | null = null;
    let isTrialing = false;

    if (hasActiveSub) {
      const sub = allSubs[0];
      subscriptionEnd = new Date(sub.current_period_end * 1000).toISOString();
      productId = sub.items.data[0].price.product as string;
      isTrialing = sub.status === "trialing";
      logStep("Active subscription", { productId, isTrialing, end: subscriptionEnd });
    } else {
      // Fall back to DB trial
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("trial_ends_at")
        .eq("user_id", userId)
        .single();
      const trialEndsAt = profile?.trial_ends_at || null;
      isTrialing = trialEndsAt ? new Date(trialEndsAt) > new Date() : false;

      return new Response(JSON.stringify({
        subscribed: false,
        is_trialing: isTrialing,
        trial_ends_at: trialEndsAt,
        product_id: null,
        subscription_end: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      subscribed: true,
      is_trialing: isTrialing,
      product_id: productId,
      subscription_end: subscriptionEnd,
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
