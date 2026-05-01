// Generates a 2-3 sentence personalized opening for a review request email,
// based on the actual work done in the linked invoice. Cached on review_requests.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { invoice_id, review_request_id, client_first_name, work_summary, company_name } = await req.json();

    // Check cache
    if (review_request_id) {
      const { data: rr } = await supabase
        .from("review_requests")
        .select("personalized_body")
        .eq("id", review_request_id)
        .maybeSingle();
      if (rr?.personalized_body) {
        return new Response(JSON.stringify({ body: rr.personalized_body, cached: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    let workDescription = work_summary;
    if (!workDescription && invoice_id) {
      const { data: items } = await supabase
        .from("invoice_line_items")
        .select("description")
        .eq("invoice_id", invoice_id)
        .order("sort_order")
        .limit(5);
      workDescription = (items || []).map((i: any) => i.description).join("; ");
    }

    const prompt = `Write a warm, brief 2-3 sentence email opening asking ${client_first_name || "the client"} for a review.
The work done was: ${workDescription || "(general service)"}.
Sent from: ${company_name || "us"}.
Mention the specific work naturally. Don't ask for the review yet (the next paragraph does that). Just open with appreciation and reference the job.
Return ONLY the body text — no greeting, no signature, no subject.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You write warm, concise email openings for trade contractors. Sound human, not salesy." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (aiResp.status === 429 || aiResp.status === 402) {
      return new Response(JSON.stringify({ error: "AI temporarily unavailable", body: null }), {
        status: aiResp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!aiResp.ok) {
      return new Response(JSON.stringify({ error: "AI error", body: null }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const body = data.choices?.[0]?.message?.content?.trim() || "";

    // Cache on review_requests
    if (review_request_id && body) {
      await supabase.from("review_requests").update({ personalized_body: body }).eq("id", review_request_id);
    }

    return new Response(JSON.stringify({ body, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("personalize-review-email error:", e);
    return new Response(JSON.stringify({ error: "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
