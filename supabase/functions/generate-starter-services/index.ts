// Generates 5 starter services based on the user's trade and inserts them into services_catalog.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { enforceAiQuota, quotaResponse, resolveTier } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
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

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const tier = await resolveTier(admin, user.id);
    const quota = await enforceAiQuota(admin, user.id, "generate-starter-services", tier);
    if (!quota.ok) return quotaResponse(quota, corsHeaders);

    const body = await req.json().catch(() => ({}));
    const trade = typeof body.trade === "string" ? body.trade.trim() : "";
    if (!trade) {
      return new Response(JSON.stringify({ error: "trade required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find team_id
    const { data: membership } = await admin
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .maybeSingle();
    const teamId = membership?.team_id;
    if (!teamId) {
      return new Response(JSON.stringify({ error: "No team" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Skip if the team already has services
    const { count } = await admin
      .from("services_catalog")
      .select("id", { count: "exact", head: true })
      .eq("team_id", teamId);
    if ((count ?? 0) > 0) {
      return new Response(JSON.stringify({ created: 0, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ask AI for 5 services via tool calling
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You generate practical starter service catalog entries for trade contractors. Prices should be reasonable North American averages in USD. Descriptions are 1-2 sentences, concrete, no marketing fluff.",
          },
          {
            role: "user",
            content: `Generate exactly 5 of the most common services offered by a "${trade}" business. Include realistic default prices.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_services",
              description: "Return 5 starter services for this trade.",
              parameters: {
                type: "object",
                properties: {
                  services: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        description: { type: "string" },
                        default_price: { type: "number" },
                        category: { type: "string" },
                      },
                      required: ["name", "description", "default_price"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["services"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_services" } },
      }),
    });

    if (aiResp.status === 429 || aiResp.status === 402) {
      return new Response(JSON.stringify({ error: "AI temporarily unavailable" }), {
        status: aiResp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiResp.ok) {
      const errTxt = await aiResp.text();
      console.error("AI error:", aiResp.status, errTxt);
      return new Response(JSON.stringify({ error: "AI error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let services: Array<{ name: string; description: string; default_price: number; category?: string }> = [];
    try {
      const parsed = JSON.parse(toolCall?.function?.arguments || "{}");
      services = Array.isArray(parsed.services) ? parsed.services.slice(0, 5) : [];
    } catch (e) {
      console.error("Failed to parse AI response:", e);
    }

    if (services.length === 0) {
      return new Response(JSON.stringify({ error: "No services generated" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rows = services.map((s) => ({
      user_id: user.id,
      team_id: teamId,
      name: String(s.name).slice(0, 200),
      description: s.description ? String(s.description).slice(0, 1000) : null,
      default_price: Number.isFinite(s.default_price) ? Math.max(0, Number(s.default_price)) : 0,
      category: s.category ? String(s.category).slice(0, 100) : null,
      is_active: true,
    }));

    const { error: insErr } = await admin.from("services_catalog").insert(rows);
    if (insErr) {
      console.error("Insert error:", insErr);
      return new Response(JSON.stringify({ error: insErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ created: rows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-starter-services error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
