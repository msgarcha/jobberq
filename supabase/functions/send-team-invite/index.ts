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

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) throw new Error("Not authenticated");

    const { teamId, email, role } = await req.json();
    if (!teamId || !email || !role) throw new Error("Missing teamId, email, or role");

    // Verify caller is admin of this team
    const { data: membership } = await supabaseAdmin
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .single();

    if (!membership || membership.role !== "admin") {
      throw new Error("Only team admins can send invitations");
    }

    // Check team member + pending invite count
    const { count: memberCount } = await supabaseAdmin
      .from("team_members")
      .select("*", { count: "exact", head: true })
      .eq("team_id", teamId);

    const { count: pendingCount } = await supabaseAdmin
      .from("team_invitations")
      .select("*", { count: "exact", head: true })
      .eq("team_id", teamId)
      .is("accepted_at", null);

    const totalMembers = (memberCount || 0) + (pendingCount || 0);
    if (totalMembers >= 50) {
      throw new Error("Team member limit reached");
    }

    // Check if email is already a team member
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = users?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase().trim());

    if (existingUser) {
      const { data: existingMember } = await supabaseAdmin
        .from("team_members")
        .select("id")
        .eq("team_id", teamId)
        .eq("user_id", existingUser.id)
        .maybeSingle();

      if (existingMember) {
        throw new Error("This user is already a team member");
      }
    }

    // Upsert invitation
    const newToken = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    const { data: invitation, error: invErr } = await supabaseAdmin
      .from("team_invitations")
      .upsert(
        {
          team_id: teamId,
          email: email.toLowerCase().trim(),
          role,
          invited_by: user.id,
          token: newToken,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          accepted_at: null,
        },
        { onConflict: "team_id,email" }
      )
      .select()
      .single();

    if (invErr) throw invErr;

    const origin = req.headers.get("origin") || "http://localhost:5173";
    const inviteUrl = `${origin}/accept-invite?token=${invitation.token}`;

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
