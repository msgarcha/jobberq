import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    if (!token || typeof token !== "string") {
      return new Response(
        JSON.stringify({ error: "Token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch review request
    const { data: review, error: revErr } = await supabase
      .from("review_requests")
      .select("id, token, status, expires_at, team_id, client_id, rating, feedback")
      .eq("token", token)
      .maybeSingle();

    if (revErr || !review) {
      return new Response(
        JSON.stringify({ error: "This review link is invalid or has already been used." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check status
    if (review.status !== "pending") {
      return new Response(
        JSON.stringify({ error: "This review has already been submitted. Thank you!", status: review.status }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check expiry
    if (new Date(review.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "This review link has expired.", status: "expired" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch client name
    const { data: client } = await supabase
      .from("clients")
      .select("first_name, last_name")
      .eq("id", review.client_id)
      .maybeSingle();

    // Fetch company settings for branding
    let companyName = "";
    let logoUrl = "";

    if (review.team_id) {
      const { data: settings } = await supabase
        .from("company_settings")
        .select("company_name, logo_url")
        .eq("team_id", review.team_id)
        .maybeSingle();

      if (settings) {
        companyName = settings.company_name || "";
        logoUrl = settings.logo_url || "";
      }
    }

    return new Response(
      JSON.stringify({
        review: {
          id: review.id,
          token: review.token,
          status: review.status,
          team_id: review.team_id,
        },
        clientName: client ? `${client.first_name} ${client.last_name}` : "",
        companyName,
        logoUrl,
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
