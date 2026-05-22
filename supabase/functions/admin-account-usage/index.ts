import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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

    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("is_super_admin")
      .eq("user_id", userData.user.id)
      .single();

    if (!callerProfile?.is_super_admin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let targetUserId: string | undefined;
    if (req.method === "POST") {
      try {
        const body = await req.json();
        targetUserId = body?.user_id;
      } catch { /* ignore */ }
    }

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // List all auth users (cap 1000) to build the table
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const userIds = (users || []).map(u => u.id);

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("user_id, display_name, trial_ends_at, created_at, access_revoked, access_revoked_at")
      .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    const { data: teamMembers } = await supabaseAdmin
      .from("team_members")
      .select("user_id, team_id, role")
      .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
    const teamByUser = new Map<string, { team_id: string; role: string }>();
    for (const tm of teamMembers || []) {
      if (!teamByUser.has(tm.user_id)) teamByUser.set(tm.user_id, { team_id: tm.team_id, role: tm.role });
    }

    const teamIds = Array.from(new Set(Array.from(teamByUser.values()).map(t => t.team_id)));

    // Bulk counts per team_id
    async function countsByTeam(table: string, dateField: string) {
      const lifetime = new Map<string, number>();
      const last30 = new Map<string, number>();
      if (!teamIds.length) return { lifetime, last30 };
      const { data } = await supabaseAdmin
        .from(table)
        .select(`team_id, ${dateField}`)
        .in("team_id", teamIds);
      for (const row of (data || []) as any[]) {
        if (!row.team_id) continue;
        lifetime.set(row.team_id, (lifetime.get(row.team_id) || 0) + 1);
        if (row[dateField] && row[dateField] >= since) {
          last30.set(row.team_id, (last30.get(row.team_id) || 0) + 1);
        }
      }
      return { lifetime, last30 };
    }

    const [quotes, invoices, clientsC, jobs] = await Promise.all([
      countsByTeam("quotes", "created_at"),
      countsByTeam("invoices", "created_at"),
      countsByTeam("clients", "created_at"),
      countsByTeam("jobs", "created_at"),
    ]);

    // AI usage last 30 days, per user
    const aiUsage30 = new Map<string, number>();
    const aiUsageByFn = new Map<string, Record<string, number>>(); // userId -> {fn: count}
    if (userIds.length) {
      const { data: aiRows } = await supabaseAdmin
        .from("ai_usage_counters")
        .select("user_id, function_name, count, window_kind, window_start")
        .eq("window_kind", "day")
        .gte("window_start", since)
        .in("user_id", userIds);
      for (const r of (aiRows || []) as any[]) {
        aiUsage30.set(r.user_id, (aiUsage30.get(r.user_id) || 0) + (r.count || 0));
        const m = aiUsageByFn.get(r.user_id) || {};
        m[r.function_name] = (m[r.function_name] || 0) + (r.count || 0);
        aiUsageByFn.set(r.user_id, m);
      }
    }

    // Payments collected per team (lifetime + 30d), sum amount
    async function paymentsByTeam() {
      const lifetime = new Map<string, number>();
      const last30 = new Map<string, number>();
      if (!teamIds.length) return { lifetime, last30 };
      const { data } = await supabaseAdmin
        .from("payments")
        .select("team_id, amount, created_at")
        .in("team_id", teamIds);
      for (const row of (data || []) as any[]) {
        const amt = Number(row.amount || 0);
        lifetime.set(row.team_id, (lifetime.get(row.team_id) || 0) + amt);
        if (row.created_at && row.created_at >= since) {
          last30.set(row.team_id, (last30.get(row.team_id) || 0) + amt);
        }
      }
      return { lifetime, last30 };
    }
    const payments = await paymentsByTeam();

    const now = Date.now();
    const rows = (users || []).map(u => {
      const prof = profileMap.get(u.id);
      const team = teamByUser.get(u.id);
      const tid = team?.team_id;
      const trialEndsAt = prof?.trial_ends_at || null;
      const trialActive = trialEndsAt ? new Date(trialEndsAt).getTime() > now : false;
      return {
        user_id: u.id,
        email: u.email || "—",
        name: prof?.display_name || u.email || "—",
        team_id: tid || null,
        role: team?.role || null,
        created_at: u.created_at,
        last_sign_in_at: (u as any).last_sign_in_at || null,
        trial_ends_at: trialEndsAt,
        trial_active: trialActive,
        access_revoked: !!prof?.access_revoked,
        access_revoked_at: prof?.access_revoked_at || null,
        quotes_lifetime: tid ? (quotes.lifetime.get(tid) || 0) : 0,
        quotes_30d: tid ? (quotes.last30.get(tid) || 0) : 0,
        invoices_lifetime: tid ? (invoices.lifetime.get(tid) || 0) : 0,
        invoices_30d: tid ? (invoices.last30.get(tid) || 0) : 0,
        clients_lifetime: tid ? (clientsC.lifetime.get(tid) || 0) : 0,
        jobs_lifetime: tid ? (jobs.lifetime.get(tid) || 0) : 0,
        ai_calls_30d: aiUsage30.get(u.id) || 0,
        payments_lifetime: tid ? (payments.lifetime.get(tid) || 0) : 0,
        payments_30d: tid ? (payments.last30.get(tid) || 0) : 0,
      };
    });

    // If a specific user requested, include the per-function breakdown
    let detail: any = null;
    if (targetUserId) {
      const r = rows.find(x => x.user_id === targetUserId);
      if (r) detail = { ...r, ai_by_function: aiUsageByFn.get(targetUserId) || {} };
    }

    return new Response(JSON.stringify({ rows, detail }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
