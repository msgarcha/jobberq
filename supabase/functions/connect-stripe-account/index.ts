import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const { action } = await req.json();

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2025-08-27.basil",
    });

    const serviceSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get user's team_id
    const { data: membership } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!membership?.team_id) {
      return new Response(JSON.stringify({ error: "No team found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get current company settings
    const { data: settings } = await supabase
      .from("company_settings")
      .select("id, stripe_account_id, stripe_onboarding_complete, company_name, email")
      .maybeSingle();

    if (action === "create") {
      let accountId = settings?.stripe_account_id;

      if (!accountId) {
        // Create a new Express connected account
        const account = await stripe.accounts.create({
          type: "express",
          country: "CA",
          email: settings?.email || undefined,
          business_profile: {
            name: settings?.company_name || undefined,
          },
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
        });
        accountId = account.id;

        // Save to company_settings
        if (settings?.id) {
          await serviceSupabase
            .from("company_settings")
            .update({
              stripe_account_id: accountId,
              stripe_onboarding_complete: false,
              stripe_charges_enabled: false,
              stripe_payouts_enabled: false,
            })
            .eq("id", settings.id);
        } else {
          await serviceSupabase
            .from("company_settings")
            .insert({
              user_id: userId,
              team_id: membership.team_id,
              stripe_account_id: accountId,
              stripe_onboarding_complete: false,
              stripe_charges_enabled: false,
              stripe_payouts_enabled: false,
            });
        }
      }

      // Create an account link for onboarding
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${req.headers.get("origin")}/settings?tab=company&stripe=refresh`,
        return_url: `${req.headers.get("origin")}/settings?tab=company&stripe=complete`,
        type: "account_onboarding",
      });

      return new Response(JSON.stringify({ url: accountLink.url, account_id: accountId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === "status") {
      if (!settings?.stripe_account_id) {
        return new Response(JSON.stringify({ connected: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const account = await stripe.accounts.retrieve(settings.stripe_account_id);
      const isComplete = account.charges_enabled && account.details_submitted;

      // Update all status fields
      await serviceSupabase
        .from("company_settings")
        .update({
          stripe_onboarding_complete: isComplete,
          stripe_charges_enabled: account.charges_enabled || false,
          stripe_payouts_enabled: account.payouts_enabled || false,
        })
        .eq("id", settings.id);

      return new Response(
        JSON.stringify({
          connected: true,
          account_id: settings.stripe_account_id,
          onboarding_complete: isComplete,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    if (action === "login-link") {
      if (!settings?.stripe_account_id) {
        return new Response(JSON.stringify({ error: "No Stripe account connected" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const loginLink = await stripe.accounts.createLoginLink(settings.stripe_account_id);

      return new Response(JSON.stringify({ url: loginLink.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === "disconnect") {
      if (settings?.id) {
        await serviceSupabase
          .from("company_settings")
          .update({
            stripe_account_id: null,
            stripe_onboarding_complete: false,
            stripe_charges_enabled: false,
            stripe_payouts_enabled: false,
          })
          .eq("id", settings.id);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in connect-stripe-account:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
