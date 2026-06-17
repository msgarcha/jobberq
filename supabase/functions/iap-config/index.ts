import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Returns the RevenueCat public (publishable) iOS SDK key for the native app.
// This key is safe to expose to clients — it is a publishable key.
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  const iosKey = Deno.env.get("REVENUECAT_IOS_PUBLIC_SDK_KEY") ?? "";
  return new Response(JSON.stringify({ iosKey }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
