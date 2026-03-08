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
    // Authenticate
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Unauthorized");

    // Verify super admin
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

    // Fetch all subscriptions from Stripe
    const allSubscribers: any[] = [];
    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore) {
      const params: any = { limit: 100, expand: ["data.customer", "data.default_payment_method"] };
      if (startingAfter) params.starting_after = startingAfter;
      const subs = await stripe.subscriptions.list(params);

      for (const sub of subs.data) {
        const customer = sub.customer as Stripe.Customer;
        const priceItem = sub.items.data[0];
        const productId = priceItem?.price?.product as string;

        allSubscribers.push({
          subscription_id: sub.id,
          customer_id: customer.id,
          email: customer.email || "N/A",
          name: customer.name || customer.email || "N/A",
          status: sub.status,
          product_id: productId,
          price_id: priceItem?.price?.id,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
          cancel_at_period_end: sub.cancel_at_period_end,
          created: new Date(sub.created * 1000).toISOString(),
        });
      }

      hasMore = subs.has_more;
      if (subs.data.length > 0) {
        startingAfter = subs.data[subs.data.length - 1].id;
      }
    }

    // Also fetch profiles with trial info who may not have stripe subs
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("user_id, display_name, trial_ends_at, created_at");

    // Get emails from auth
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const userMap = new Map(users?.map(u => [u.email, { id: u.id, email: u.email, created_at: u.created_at }]) || []);
    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    // Build list of users without subscriptions (trial-only users)
    const subscribedEmails = new Set(allSubscribers.map(s => s.email));
    const trialOnlyUsers: any[] = [];
    for (const user of (users || [])) {
      if (!subscribedEmails.has(user.email)) {
        const prof = profileMap.get(user.id);
        trialOnlyUsers.push({
          subscription_id: null,
          customer_id: null,
          email: user.email || "N/A",
          name: prof?.display_name || user.email || "N/A",
          status: "trial_only",
          product_id: null,
          price_id: null,
          current_period_end: null,
          trial_end: prof?.trial_ends_at || null,
          cancel_at_period_end: false,
          created: user.created_at,
        });
      }
    }

    return new Response(JSON.stringify({ subscribers: [...allSubscribers, ...trialOnlyUsers] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
