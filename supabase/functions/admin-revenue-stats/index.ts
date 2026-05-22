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

    // Get all active subscriptions for MRR
    const activeSubs: Stripe.Subscription[] = [];
    let hasMore = true;
    let startingAfter: string | undefined;
    while (hasMore) {
      const params: any = { status: "active", limit: 100 };
      if (startingAfter) params.starting_after = startingAfter;
      const res = await stripe.subscriptions.list(params);
      activeSubs.push(...res.data);
      hasMore = res.has_more;
      if (res.data.length) startingAfter = res.data[res.data.length - 1].id;
    }

    // Calculate MRR
    let mrr = 0;
    for (const sub of activeSubs) {
      const item = sub.items.data[0];
      if (item?.price?.unit_amount && item?.price?.recurring?.interval) {
        const amount = item.price.unit_amount / 100;
        const interval = item.price.recurring.interval;
        if (interval === "month") mrr += amount;
        else if (interval === "year") mrr += amount / 12;
        else if (interval === "week") mrr += amount * 4.33;
      }
    }

    // Get trialing subs count (paginate)
    let trialingCount = 0;
    {
      let more = true; let after: string | undefined;
      while (more) {
        const params: any = { status: "trialing", limit: 100 };
        if (after) params.starting_after = after;
        const r = await stripe.subscriptions.list(params);
        trialingCount += r.data.length;
        more = r.has_more;
        if (r.data.length) after = r.data[r.data.length - 1].id;
      }
    }

    // App-trial buckets from profiles (users without Stripe subs we already know about)
    const subscribedEmails = new Set<string>();
    for (const s of activeSubs) {
      const c: any = s.customer as any;
      if (typeof c === "string") continue;
      if (c?.email) subscribedEmails.add(c.email);
    }
    const { data: { users: allUsers } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const userIds = (allUsers || []).map(u => u.id);
    const { data: profs } = await supabaseAdmin
      .from("profiles")
      .select("user_id, trial_ends_at, access_revoked")
      .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
    const profByUser = new Map(profs?.map(p => [p.user_id, p]) || []);
    const nowMs = Date.now();
    let appTrialActive = 0;
    let appTrialExpired = 0;
    let revokedCount = 0;
    for (const u of (allUsers || [])) {
      const p = profByUser.get(u.id) as any;
      if (p?.access_revoked) { revokedCount++; continue; }
      if (subscribedEmails.has(u.email || "")) continue;
      const t = p?.trial_ends_at ? new Date(p.trial_ends_at).getTime() : 0;
      if (t > nowMs) appTrialActive++;
      else appTrialExpired++;
    }

    // Get past_due subs
    const pastDueSubs = await stripe.subscriptions.list({ status: "past_due", limit: 100 });

    // Get charges for last 12 months for revenue over time
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    const revenueByMonth: Record<string, number> = {};

    // Initialize 12 months
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      revenueByMonth[key] = 0;
    }

    let chargesHasMore = true;
    let chargesStarting: string | undefined;
    let totalRevenue = 0;

    while (chargesHasMore) {
      const params: any = {
        limit: 100,
        created: { gte: Math.floor(twelveMonthsAgo.getTime() / 1000) },
      };
      if (chargesStarting) params.starting_after = chargesStarting;
      const charges = await stripe.charges.list(params);

      for (const charge of charges.data) {
        if (charge.status === "succeeded" && !charge.refunded) {
          const amount = charge.amount / 100;
          totalRevenue += amount;
          const date = new Date(charge.created * 1000);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          if (revenueByMonth[key] !== undefined) {
            revenueByMonth[key] += amount;
          }
        }
      }

      chargesHasMore = charges.has_more;
      if (charges.data.length) chargesStarting = charges.data[charges.data.length - 1].id;
    }

    // Count new subscribers this month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newThisMonth = activeSubs.filter(
      s => new Date(s.created * 1000) >= startOfMonth
    ).length;

    // Count canceled this month
    const canceledSubs = await stripe.subscriptions.list({
      status: "canceled",
      created: { gte: Math.floor(startOfMonth.getTime() / 1000) },
      limit: 100,
    });

    const revenueOverTime = Object.entries(revenueByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({ month, amount: Math.round(amount * 100) / 100 }));

    return new Response(JSON.stringify({
      mrr: Math.round(mrr * 100) / 100,
      total_revenue: Math.round(totalRevenue * 100) / 100,
      active_subscribers: activeSubs.length,
      trialing_count: trialingCount,
      past_due_count: pastDueSubs.data.length,
      new_this_month: newThisMonth,
      canceled_this_month: canceledSubs.data.length,
      revenue_over_time: revenueOverTime,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
