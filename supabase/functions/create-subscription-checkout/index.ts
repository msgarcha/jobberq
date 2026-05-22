import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    const { priceId } = await req.json();
    if (!priceId) throw new Error("priceId is required");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    let hasPriorSubscription = false;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      const active = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 });
      if (active.data.length > 0) {
        throw new Error("You already have an active subscription. Manage it from the billing page.");
      }
      // Any prior subscription (canceled, past_due, etc.) means this customer
      // already consumed a trial — Stripe rejects trial_period_days again.
      const allSubs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 1 });
      hasPriorSubscription = allSubs.data.length > 0;
    }

    // Check the app-side trial state too.
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("trial_ends_at")
      .eq("user_id", user.id)
      .maybeSingle();
    const appTrialActive = profile?.trial_ends_at
      ? new Date(profile.trial_ends_at) > new Date()
      : true; // no record → treat as eligible

    const eligibleForTrial = appTrialActive && !hasPriorSubscription;

    const origin = req.headers.get("origin") || "http://localhost:5173";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${origin}/settings?tab=billing&checkout=success`,
      cancel_url: `${origin}/settings?tab=billing&checkout=canceled`,
      subscription_data: eligibleForTrial
        ? { trial_period_days: 14 }
        : undefined,
    });

    return new Response(JSON.stringify({ url: session.url, trial: eligibleForTrial }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[create-subscription-checkout]", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
