import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { reviewId } = await req.json();
    if (!reviewId) {
      return new Response(JSON.stringify({ error: "reviewId required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Validate caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Load review
    const { data: review } = await supabase
      .from("review_requests")
      .select("*")
      .eq("id", reviewId)
      .single();

    if (!review) {
      return new Response(JSON.stringify({ error: "Review not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Verify caller is in same team
    const { data: membership } = await supabase
      .from("team_members")
      .select("id")
      .eq("user_id", user.id)
      .eq("team_id", review.team_id)
      .maybeSingle();
    if (!membership) {
      return new Response(JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Refresh expiry if expired/near-expired
    const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await supabase
      .from("review_requests")
      .update({
        expires_at: newExpiry,
        status: "pending",
        reminder_sent_at: new Date().toISOString(),
      })
      .eq("id", reviewId);

    // Load client + company info
    const { data: client } = await supabase
      .from("clients")
      .select("first_name, last_name, email")
      .eq("id", review.client_id)
      .maybeSingle();

    const { data: settings } = await supabase
      .from("company_settings")
      .select("company_name")
      .eq("team_id", review.team_id)
      .maybeSingle();

    if (!client?.email) {
      return new Response(JSON.stringify({
        success: true,
        emailed: false,
        message: "Link refreshed but client has no email on file. Use Copy Link.",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const reviewUrl = `https://quicklinq.ca/r/${(review as any).short_token || review.token}`;
    const isReminder = !!review.reminder_sent_at || !!review.submitted_at;

    await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "review-request",
        recipientEmail: client.email,
        idempotencyKey: `review-req-${review.id}-${Date.now()}`,
        templateData: {
          clientName: client.first_name,
          companyName: settings?.company_name || "us",
          reviewUrl,
          isReminder,
        },
      },
    });

    return new Response(JSON.stringify({ success: true, emailed: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
