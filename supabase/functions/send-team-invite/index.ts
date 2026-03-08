import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await supabaseAuth.auth.getUser();
    if (authErr || !user) throw new Error("Not authenticated");

    const { teamId, email, role } = await req.json();
    if (!teamId || !email || !role) throw new Error("Missing teamId, email, or role");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify caller is admin of this team
    const { data: membership } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .single();

    if (!membership || membership.role !== "admin") {
      throw new Error("Only team admins can send invitations");
    }

    // Check team member count vs subscription limits
    const { count: memberCount } = await supabase
      .from("team_members")
      .select("*", { count: "exact", head: true })
      .eq("team_id", teamId);

    const { count: pendingCount } = await supabase
      .from("team_invitations")
      .select("*", { count: "exact", head: true })
      .eq("team_id", teamId)
      .is("accepted_at", null);

    // Get team owner's subscription to check limits
    const { data: team } = await supabase
      .from("teams")
      .select("owner_id")
      .eq("id", teamId)
      .single();

    // For now, allow up to 50 total (actual limit enforcement can be stricter with tier checks)
    const totalMembers = (memberCount || 0) + (pendingCount || 0);
    if (totalMembers >= 50) {
      throw new Error("Team member limit reached");
    }

    // Check if user already a member
    const { data: existingMember } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", (await supabase.from("profiles").select("user_id").eq("user_id", 
        (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === email)?.id || ''
      ).maybeSingle()).data?.user_id || '')
      .maybeSingle();

    if (existingMember) {
      throw new Error("This user is already a team member");
    }

    // Upsert invitation (update if exists for same team+email)
    const { data: invitation, error: invErr } = await supabase
      .from("team_invitations")
      .upsert(
        {
          team_id: teamId,
          email: email.toLowerCase().trim(),
          role,
          invited_by: user.id,
          token: crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, ''),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          accepted_at: null,
        },
        { onConflict: "team_id,email" }
      )
      .select()
      .single();

    if (invErr) throw invErr;

    // Note: In production, you'd send an email here with the invite link
    // For now, return the token so it can be shared
    const inviteUrl = `${req.headers.get("origin") || supabaseUrl.replace('.supabase.co', '')}/accept-invite?token=${invitation.token}`;

    return new Response(
      JSON.stringify({ success: true, inviteUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
