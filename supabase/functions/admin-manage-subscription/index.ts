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

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Unauthorized");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("is_super_admin")
      .eq("user_id", userData.user.id)
      .single();

    if (!profile?.is_super_admin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const body = await req.json();
    const { action, subscription_id, customer_email, ...params } = body;

    let result: any = {};

    switch (action) {
      case "extend_trial": {
        if (!subscription_id || !params.trial_end_date) throw new Error("subscription_id and trial_end_date required");
        const trialEnd = Math.floor(new Date(params.trial_end_date).getTime() / 1000);
        const sub = await stripe.subscriptions.update(subscription_id, { trial_end: trialEnd });
        result = { success: true, message: `Trial extended to ${params.trial_end_date}`, subscription: sub.id };
        break;
      }

      case "cancel": {
        if (!subscription_id) throw new Error("subscription_id required");
        const cancelImmediate = params.immediate === true;
        if (cancelImmediate) {
          await stripe.subscriptions.cancel(subscription_id);
          result = { success: true, message: "Subscription canceled immediately" };
        } else {
          await stripe.subscriptions.update(subscription_id, { cancel_at_period_end: true });
          result = { success: true, message: "Subscription set to cancel at period end" };
        }
        break;
      }

      case "resume": {
        if (!subscription_id) throw new Error("subscription_id required");
        await stripe.subscriptions.update(subscription_id, { cancel_at_period_end: false });
        result = { success: true, message: "Subscription resumed" };
        break;
      }

      case "change_tier": {
        if (!subscription_id || !params.new_price_id) throw new Error("subscription_id and new_price_id required");
        const sub = await stripe.subscriptions.retrieve(subscription_id);
        const itemId = sub.items.data[0].id;
        await stripe.subscriptions.update(subscription_id, {
          items: [{ id: itemId, price: params.new_price_id }],
          proration_behavior: "create_prorations",
        });
        result = { success: true, message: `Tier changed to ${params.new_price_id}` };
        break;
      }

      case "grant_free": {
        if (!subscription_id) throw new Error("subscription_id required");
        // Set trial_end to 10 years from now (effectively free forever)
        const farFuture = Math.floor(Date.now() / 1000) + 10 * 365 * 24 * 60 * 60;
        await stripe.subscriptions.update(subscription_id, { trial_end: farFuture });
        result = { success: true, message: "Granted free access (10-year trial)" };
        break;
      }

      case "extend_app_trial": {
        // For trial-only users (no Stripe sub), extend their app trial
        if (!customer_email || !params.trial_end_date) throw new Error("customer_email and trial_end_date required");
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
        const targetUser = users?.find(u => u.email === customer_email);
        if (!targetUser) throw new Error("User not found");
        await supabaseAdmin.from("profiles").update({ trial_ends_at: params.trial_end_date }).eq("user_id", targetUser.id);
        result = { success: true, message: `App trial extended to ${params.trial_end_date}` };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
