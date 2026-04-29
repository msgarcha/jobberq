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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Helper to fetch branding for the error page (best-effort, by team_id if known)
  const brandFor = async (teamId: string | null) => {
    if (!teamId) return { companyName: "", logoUrl: "" };
    const { data } = await supabase
      .from("company_settings")
      .select("company_name, logo_url")
      .eq("team_id", teamId)
      .maybeSingle();
    return {
      companyName: data?.company_name || "",
      logoUrl: data?.logo_url || "",
    };
  };

  try {
    const { token } = await req.json();

    if (!token || typeof token !== "string") {
      return new Response(
        JSON.stringify({ error: "Token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Look up by either long token (legacy) or short_token (new branded /r/ links)
    const { data: review, error: revErr } = await supabase
      .from("review_requests")
      .select("id, token, short_token, status, expires_at, team_id, client_id, rating, feedback")
      .or(`token.eq.${token},short_token.eq.${token}`)
      .maybeSingle();

    if (revErr || !review) {
      return new Response(
        JSON.stringify({
          error: "This review link is invalid or has already been used.",
          companyName: "",
          logoUrl: "",
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const branding = await brandFor(review.team_id);

    // Already submitted
    if (review.status !== "pending") {
      return new Response(
        JSON.stringify({
          error: "This review has already been submitted. Thank you!",
          status: review.status,
          ...branding,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Expired
    if (new Date(review.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({
          error: "This review link has expired.",
          status: "expired",
          ...branding,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch client first name for friendly greeting
    const { data: client } = await supabase
      .from("clients")
      .select("first_name, last_name")
      .eq("id", review.client_id)
      .maybeSingle();

    return new Response(
      JSON.stringify({
        review: {
          id: review.id,
          token: review.token,
          short_token: review.short_token,
          status: review.status,
          team_id: review.team_id,
        },
        clientName: client ? `${client.first_name} ${client.last_name}` : "",
        clientFirstName: client?.first_name || "",
        ...branding,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
