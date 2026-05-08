// Generates a warm, personalized body for quote/invoice emails using context
// about the client, document, and tone preference.

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
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const tier = await resolveTier(admin, user.id);
    const quota = await enforceAiQuota(admin, user.id, "personalize-document-email", tier);
    if (!quota.ok) return quotaResponse(quota, corsHeaders);

    const {
      type,            // 'quote' | 'invoice'
      clientName,
      companyName,
      documentNumber,
      documentTitle,
      total,
      balanceDue,
      dueDate,
      tone,            // 'friendly' | 'professional' | 'brief'
    } = await req.json();

    const label = type === "invoice" ? "invoice" : "estimate";
    const amt = type === "invoice" ? (balanceDue ?? total ?? 0) : (total ?? 0);
    const toneInstr =
      tone === "brief" ? "Keep it under 2 short sentences. No fluff."
      : tone === "professional" ? "Professional and warm. 3-4 sentences max."
      : "Friendly and conversational, like a small business owner writing to a regular customer. 3-4 sentences.";

    const prompt = `Write the BODY of an email sending a ${label} to a customer.
Customer: ${clientName || "the customer"}.
From: ${companyName || "us"}.
${label} #: ${documentNumber}.
${documentTitle ? `Job: ${documentTitle}.` : ""}
Amount: $${Number(amt).toFixed(2)}.
${type === "invoice" && dueDate ? `Due: ${dueDate}.` : ""}
${type === "invoice" ? "Politely ask for payment via the link." : "Invite them to review and approve via the link."}

${toneInstr}

Rules:
- Start with a greeting like "Hi <first name>,"
- End with a sign-off like "Thanks," then the company name on its own line.
- Mention they can use the link below to ${type === "invoice" ? "view and pay" : "view and approve"}.
- Do NOT include the link itself or a subject line. Plain text only.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You write friendly, concise customer emails for trade contractors. Sound human." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (aiResp.status === 429 || aiResp.status === 402) {
      return new Response(JSON.stringify({ error: "AI temporarily unavailable" }), {
        status: aiResp.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiResp.ok) {
      return new Response(JSON.stringify({ error: "AI error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const body = data.choices?.[0]?.message?.content?.trim() || "";
    return new Response(JSON.stringify({ body }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("personalize-document-email error:", e);
    return new Response(JSON.stringify({ error: "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
