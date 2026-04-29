import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function buildGoogleUrl(placeId: string | null, fallback: string | null): string | null {
  if (placeId && placeId.trim()) {
    return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId.trim())}`;
  }
  return fallback || null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { token, rating, feedback, action } = body;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find review by either long token (legacy) or short_token (new)
    const { data: review, error: findErr } = await supabase
      .from("review_requests")
      .select("*")
      .or(`token.eq.${token},short_token.eq.${token}`)
      .maybeSingle();

    if (findErr || !review) {
      return new Response(JSON.stringify({ error: "Review request not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Sub-action: customer confirms they posted on Google
    if (action === "confirm_google_post") {
      await supabase
        .from("review_requests")
        .update({ posted_to_google_confirmed_at: new Date().toISOString() })
        .eq("id", review.id);
      return new Response(JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Submission validation
    if (!token || !rating || rating < 1 || rating > 5) {
      return new Response(JSON.stringify({ error: "Invalid token or rating" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (review.status !== "pending") {
      return new Response(JSON.stringify({ error: "Review already submitted" }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (new Date(review.expires_at) < new Date()) {
      await supabase.from("review_requests").update({ status: "expired" }).eq("id", review.id);
      return new Response(JSON.stringify({ error: "This review request has expired" }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get team settings
    const { data: settings } = await supabase
      .from("company_settings")
      .select("google_review_url, google_place_id, review_min_stars, review_gating_enabled, notify_low_ratings, company_name")
      .eq("team_id", review.team_id)
      .single();

    const minStars = settings?.review_min_stars ?? 4;
    const gatingEnabled = settings?.review_gating_enabled ?? true;
    const googleUrl = buildGoogleUrl(settings?.google_place_id ?? null, settings?.google_review_url ?? null);

    const shouldRedirect = gatingEnabled
      ? rating >= minStars && !!googleUrl
      : !!googleUrl;

    const cleanFeedback = feedback?.trim() || null;

    await supabase
      .from("review_requests")
      .update({
        rating,
        feedback: cleanFeedback,
        status: "completed",
        submitted_at: new Date().toISOString(),
        redirected_to_google: shouldRedirect,
      })
      .eq("id", review.id);

    // Owner alert for low ratings (the "Shield" part)
    const isLowRating = gatingEnabled && rating < minStars;
    if (isLowRating && (settings?.notify_low_ratings ?? true)) {
      try {
        // Find team admin email
        const { data: members } = await supabase
          .from("team_members")
          .select("user_id")
          .eq("team_id", review.team_id)
          .eq("role", "admin")
          .limit(1);

        let ownerEmail: string | null = null;
        if (members && members.length > 0) {
          const { data: userData } = await supabase.auth.admin.getUserById(members[0].user_id);
          ownerEmail = userData?.user?.email ?? null;
        }

        // Client name
        const { data: client } = await supabase
          .from("clients")
          .select("first_name, last_name")
          .eq("id", review.client_id)
          .maybeSingle();

        if (ownerEmail) {
          await supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "low-rating-alert",
              recipientEmail: ownerEmail,
              idempotencyKey: `low-rating-${review.id}`,
              templateData: {
                clientName: client ? `${client.first_name} ${client.last_name}` : "A client",
                rating,
                feedback: cleanFeedback,
                dashboardUrl: "https://quicklinq.ca/reviews",
              },
            },
          });

          await supabase
            .from("review_requests")
            .update({ owner_notified_at: new Date().toISOString() })
            .eq("id", review.id);
        }
      } catch (e) {
        console.error("Failed to notify owner of low rating:", e);
      }
    }

    // Generate AI-drafted review text (only when redirecting to Google)
    let suggestedReviewText: string | null = null;
    if (shouldRedirect) {
      const companyName = settings?.company_name || "the team";
      const fallback = `Had a great experience with ${companyName}. Highly recommend!`;
      try {
        const apiKey = Deno.env.get("LOVABLE_API_KEY");
        if (apiKey) {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 3500);
          const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            signal: controller.signal,
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [
                {
                  role: "system",
                  content: "You write short, natural-sounding Google reviews from a customer's perspective. Output ONLY the review text — no quotes, no preamble, no emojis, no marketing language. Sound like a real person. Keep it under 280 characters and 1-2 sentences.",
                },
                {
                  role: "user",
                  content: `Write a Google review for "${companyName}" from a customer who rated ${rating} out of 5 stars. Their own words: ${cleanFeedback ? `"${cleanFeedback}"` : "(no comment provided)"}.`,
                },
              ],
            }),
          });
          clearTimeout(timeout);
          if (aiRes.ok) {
            const aiData = await aiRes.json();
            const text = aiData?.choices?.[0]?.message?.content?.trim();
            if (text && text.length > 0 && text.length < 600) {
              // Strip surrounding quotes if model added them
              suggestedReviewText = text.replace(/^["'""]|["'""]$/g, "").trim();
            }
          }
        }
      } catch (e) {
        console.error("AI draft generation failed:", e);
      }
      if (!suggestedReviewText) suggestedReviewText = fallback;
    }

    return new Response(JSON.stringify({
      success: true,
      redirect_to_google: shouldRedirect,
      google_review_url: shouldRedirect ? googleUrl : null,
      suggested_review_text: suggestedReviewText,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
