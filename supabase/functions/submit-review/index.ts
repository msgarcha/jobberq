import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, rating, feedback } = await req.json();

    if (!token || !rating || rating < 1 || rating > 5) {
      return new Response(
        JSON.stringify({ error: "Invalid token or rating" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find the review request by token
    const { data: review, error: findErr } = await supabase
      .from("review_requests")
      .select("*")
      .eq("token", token)
      .eq("status", "pending")
      .single();

    if (findErr || !review) {
      return new Response(
        JSON.stringify({ error: "Review request not found or already submitted" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check expiry
    if (new Date(review.expires_at) < new Date()) {
      await supabase
        .from("review_requests")
        .update({ status: "expired" })
        .eq("id", review.id);
      return new Response(
        JSON.stringify({ error: "This review request has expired" }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get company settings for this team
    const { data: settings } = await supabase
      .from("company_settings")
      .select("google_review_url, review_min_stars, review_gating_enabled")
      .eq("team_id", review.team_id)
      .single();

    const minStars = settings?.review_min_stars ?? 4;
    const gatingEnabled = settings?.review_gating_enabled ?? true;
    const googleUrl = settings?.google_review_url;

    const shouldRedirect = gatingEnabled
      ? rating >= minStars && !!googleUrl
      : !!googleUrl;

    // Update the review request
    const { error: updateErr } = await supabase
      .from("review_requests")
      .update({
        rating,
        feedback: feedback?.trim() || null,
        status: "completed",
        submitted_at: new Date().toISOString(),
        redirected_to_google: shouldRedirect,
      })
      .eq("id", review.id);

    if (updateErr) throw updateErr;

    return new Response(
      JSON.stringify({
        success: true,
        redirect_to_google: shouldRedirect,
        google_review_url: shouldRedirect ? googleUrl : null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
