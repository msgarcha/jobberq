// Generates a 1-2 sentence service description based on name + price,
// learning from the user's existing services_catalog.
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
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const tier = await resolveTier(admin, user.id);
    const quota = await enforceAiQuota(admin, user.id, "service-describe", tier);
    if (!quota.ok) return quotaResponse(quota, corsHeaders);

    const { name, price } = await req.json();
    if (!name || typeof name !== "string") {
      return new Response(JSON.stringify({ error: "name required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Pull a few existing services for tone/style context
    const { data: existing } = await supabase
      .from("services_catalog")
      .select("name, description")
      .not("description", "is", null)
      .limit(8);

    const examples = (existing || [])
      .filter((s: any) => s.description)
      .map((s: any) => `- ${s.name}: ${s.description}`)
      .join("\n");

    const prompt = `Write a single 1-2 sentence customer-facing description for a service.
Service name: ${name}
${price ? `Price: $${price}` : ""}

${examples ? `Examples of how this contractor writes service descriptions:\n${examples}\n` : ""}
Match their tone if examples exist. Otherwise: clear, concrete, no marketing fluff. Mention what's included.
Return ONLY the description text, no quotes, no labels.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You write concise, practical service descriptions for trade contractors." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (aiResp.status === 429 || aiResp.status === 402) {
      return new Response(JSON.stringify({ error: "AI temporarily unavailable" }), { status: aiResp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!aiResp.ok) {
      return new Response(JSON.stringify({ error: "AI error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await aiResp.json();
    const description = (data.choices?.[0]?.message?.content || "").trim().replace(/^["']|["']$/g, "");
    return new Response(JSON.stringify({ description }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("service-describe error:", e);
    return new Response(JSON.stringify({ error: "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
