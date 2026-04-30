import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function verifyApprovalToken(quoteId: string, token: string): Promise<boolean> {
  try {
    const [expiresAtStr, sigHex] = token.split(".");
    if (!expiresAtStr || !sigHex) return false;
    const expiresAt = Number(expiresAtStr);
    if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;

    const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const payload = `${quoteId}.${expiresAt}`;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
    const expectedHex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
    // constant-time compare
    if (expectedHex.length !== sigHex.length) return false;
    let mismatch = 0;
    for (let i = 0; i < expectedHex.length; i++) {
      mismatch |= expectedHex.charCodeAt(i) ^ sigHex.charCodeAt(i);
    }
    return mismatch === 0;
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { quote_id, approval_token } = await req.json();
    if (!quote_id || !approval_token) {
      return new Response(JSON.stringify({ error: "quote_id and approval_token required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const valid = await verifyApprovalToken(quote_id, approval_token);
    if (!valid) {
      return new Response(JSON.stringify({ error: "Invalid or expired approval token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: quote } = await supabaseAdmin
      .from("quotes")
      .select("id, status")
      .eq("id", quote_id)
      .single();

    if (!quote) {
      return new Response(JSON.stringify({ error: "Quote not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (quote.status === "approved") {
      return new Response(JSON.stringify({ success: true, already_approved: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (quote.status !== "sent") {
      return new Response(JSON.stringify({ error: "Quote cannot be approved in its current status" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: updateErr } = await supabaseAdmin
      .from("quotes")
      .update({ status: "approved", approved_at: new Date().toISOString() })
      .eq("id", quote_id);

    if (updateErr) throw updateErr;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error approving quote:", error);
    return new Response(JSON.stringify({ error: "An internal error occurred. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
