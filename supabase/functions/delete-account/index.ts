import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const logStep = (step: string, details?: unknown) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[DELETE-ACCOUNT] ${step}${d}`);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    // --- Validate caller's JWT ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;
    logStep("Authenticated", { userId });

    // --- Determine the user's team and whether they are the sole member ---
    const { data: membership } = await admin
      .from("team_members")
      .select("team_id")
      .eq("user_id", userId)
      .maybeSingle();
    const teamId = membership?.team_id ?? null;

    let isSoloTeam = false;
    if (teamId) {
      const { count } = await admin
        .from("team_members")
        .select("user_id", { count: "exact", head: true })
        .eq("team_id", teamId);
      isSoloTeam = (count ?? 0) <= 1;
    }
    logStep("Team resolved", { teamId, isSoloTeam });

    // --- Remove membership first (team_members -> profiles is NO ACTION,
    //     so it must go before the auth user / profile is deleted) ---
    await admin.from("team_members").delete().eq("user_id", userId);

    // --- Delete the auth user. This cascades all rows that reference
    //     auth.users (profiles, clients, quotes, invoices, payments, jobs,
    //     properties, services_catalog, company_settings, user_roles, etc.) ---
    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) {
      logStep("Auth delete failed", { message: delErr.message });
      return new Response(JSON.stringify({ error: delErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    logStep("Auth user deleted");

    // --- If this was a solo team, clean up the remaining team-scoped data
    //     and the team itself (best effort). ---
    if (teamId && isSoloTeam) {
      // Tables scoped only by team_id with no auth.users cascade.
      const teamScoped = [
        "payouts",
        "device_tokens",
        "ai_actions",
        "ai_dismissed_suggestions",
        "pricing_form_submissions",
        "pricing_form_services",
        "pricing_form_questions",
        "pricing_forms",
        "notifications",
        "connect_products",
        "connected_accounts",
        "team_invitations",
      ];
      for (const tbl of teamScoped) {
        const { error } = await admin.from(tbl).delete().eq("team_id", teamId);
        if (error) logStep(`Cleanup warning: ${tbl}`, { message: error.message });
      }
      const { error: teamErr } = await admin.from("teams").delete().eq("id", teamId);
      if (teamErr) logStep("Team delete warning", { message: teamErr.message });
      else logStep("Team deleted", { teamId });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
