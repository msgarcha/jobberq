// Inline AI suggestions for quote/invoice line items.
// Returns 0-3 highly relevant suggestions based on the user's own historical line items.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const TOOL = {
  type: "function" as const,
  function: {
    name: "return_suggestions",
    description: "Return 0-3 highly relevant missing line item suggestions.",
    parameters: {
      type: "object",
      properties: {
        suggestions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              key: { type: "string", description: "Short stable key like 'disposal_fee' or 'permit'" },
              description: { type: "string" },
              suggested_price: { type: "number" },
              reason: { type: "string", description: "Why suggesting (under 60 chars)" },
              confidence: { type: "number", minimum: 0, maximum: 1 },
            },
            required: ["key", "description", "suggested_price", "reason", "confidence"],
          },
          maxItems: 3,
        },
      },
      required: ["suggestions"],
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { title, line_items, doc_type } = await req.json();

    if (!line_items || line_items.length === 0) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get team
    const { data: tm } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!tm?.team_id) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get team's industry + dismissed suggestions
    const [{ data: cs }, { data: dismissed }] = await Promise.all([
      supabase.from("company_settings").select("industry").maybeSingle(),
      supabase
        .from("ai_dismissed_suggestions")
        .select("suggestion_key")
        .eq("team_id", tm.team_id)
        .gt("dismissed_until", new Date().toISOString()),
    ]);

    const dismissedKeys = (dismissed || []).map((d: any) => d.suggestion_key);

    // Get historical line items from this team's quotes (last 50)
    const { data: pastQuotes } = await supabase
      .from("quotes")
      .select("id, title, quote_line_items(description, unit_price)")
      .order("created_at", { ascending: false })
      .limit(50);

    const historyDescriptions = (pastQuotes || [])
      .flatMap((q: any) => (q.quote_line_items || []).map((li: any) => `${li.description} ($${li.unit_price})`))
      .slice(0, 100);

    const currentItemsText = line_items
      .map((li: any) => `- ${li.description} ($${li.unit_price})`)
      .join("\n");

    const historyText = historyDescriptions.length > 0
      ? `User's past line items (most recent first):\n${historyDescriptions.join("\n")}`
      : `User has no historical quotes yet. Industry: ${cs?.industry || "unknown"}.`;

    const prompt = `Document type: ${doc_type || "quote"}
Title: ${title || "(no title)"}

Current line items:
${currentItemsText}

${historyText}

Suggest 0-3 missing items that would commonly accompany the current items, based ONLY on what this user has previously included in similar quotes (or, if no history, generic items for their industry). Only include suggestions with confidence ≥ 0.7.

Avoid these previously-dismissed keys: ${dismissedKeys.join(", ") || "(none)"}

If nothing strongly applies, return an empty suggestions array.`;

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
            content: "You suggest commonly-forgotten line items for trade contractor quotes. Be conservative — only suggest items with strong historical precedent.",
          },
          { role: "user", content: prompt },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "return_suggestions" } },
      }),
    });

    if (!aiResp.ok) {
      // Silent failure — suggestions are non-critical
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const tc = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!tc) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let parsed: any = {};
    try {
      parsed = JSON.parse(tc.function.arguments || "{}");
    } catch {
      parsed = { suggestions: [] };
    }

    const suggestions = (parsed.suggestions || [])
      .filter((s: any) => s.confidence >= 0.7 && !dismissedKeys.includes(s.key))
      .slice(0, 3);

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("quote-suggestions error:", e);
    return new Response(JSON.stringify({ suggestions: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
