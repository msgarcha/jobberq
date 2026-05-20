/**
 * Stripe Connect V2 Edge Function
 * ================================
 * Configuration: Direct charges, sellers payout individually, Stripe covers
 * negative-balance liability, embedded onboarding + dashboard components.
 *
 * Actions:
 *   - get-config:             Return the platform publishable key for the browser
 *   - create-account:         Create a V2 connected account (no dashboard, merchant + recipient)
 *   - get-status:             Retrieve onboarding/capability status
 *   - create-account-session: Issue a client_secret for embedded components
 *   - create-product:         Save a product mapping (price_data is created at checkout)
 *   - list-products:          List storefront products
 *   - create-checkout:        Direct-charge Checkout Session on the connected account
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      return jsonResponse(
        { error: "STRIPE_SECRET_KEY is not configured. Add it in Lovable Cloud → Secrets." },
        500,
      );
    }

    const stripeClient = new Stripe(stripeSecretKey, {
      apiVersion: "2025-08-27.basil",
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { action } = body;

    // ----- Public action: return the publishable key -----
    if (action === "get-config") {
      return jsonResponse({
        publishable_key: Deno.env.get("STRIPE_PUBLISHABLE_KEY") || "",
      });
    }

    // ----- Auth (for everything except list-products / create-checkout / get-config) -----
    let userId: string | null = null;
    let teamId: string | null = null;
    const authHeader = req.headers.get("Authorization");

    if (authHeader?.startsWith("Bearer ")) {
      const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsError } = await userSupabase.auth.getClaims(token);
      if (!claimsError && claimsData?.claims) {
        userId = claimsData.claims.sub;
        const { data: membership } = await userSupabase
          .from("team_members")
          .select("team_id")
          .eq("user_id", userId)
          .maybeSingle();
        teamId = membership?.team_id ?? null;
      }
    }

    const requireAuth = () => {
      if (!userId || !teamId) {
        throw Object.assign(new Error("Authentication required"), { status: 401 });
      }
    };

    // =====================================================================
    //  create-account — direct-charge model, embedded dashboard (no Stripe UI)
    // =====================================================================
    if (action === "create-account") {
      requireAuth();
      const { display_name, contact_email, country } = body;
      if (!display_name) return jsonResponse({ error: "display_name is required" }, 400);

      const account = await (stripeClient as any).v2.core.accounts.create({
        display_name,
        contact_email: contact_email || undefined,
        identity: { country: (country || "ca").toLowerCase() },
        // No Stripe-hosted dashboard — we render embedded components ourselves.
        dashboard: "none",
        defaults: {
          responsibilities: {
            // Stripe deducts its processing fee from the seller (Stripe collects).
            // Platform still adds application_fee_amount on top.
            fees_collector: "stripe",
            // Stripe covers negative balances per the platform settings.
            losses_collector: "stripe",
          },
        },
        configuration: {
          // Merchant config — the connected account charges customers directly.
          merchant: {
            capabilities: {
              card_payments: { requested: true },
            },
          },
          // Recipient config — needed so the platform can pull application fees.
          recipient: {
            capabilities: {
              stripe_balance: {
                stripe_transfers: { requested: true },
              },
            },
          },
        },
      });

      await serviceSupabase.from("connected_accounts").insert({
        user_id: userId,
        team_id: teamId,
        stripe_account_id: account.id,
        display_name,
        contact_email: contact_email || null,
      });

      return jsonResponse({
        account_id: account.id,
        display_name,
        message: "Connected account created successfully",
      });
    }

    // =====================================================================
    //  get-status
    // =====================================================================
    if (action === "get-status") {
      requireAuth();
      const { account_id } = body;
      if (!account_id) return jsonResponse({ error: "account_id is required" }, 400);

      const account = await (stripeClient as any).v2.core.accounts.retrieve(account_id, {
        include: ["configuration.recipient", "configuration.merchant", "requirements"],
      });

      const transfersActive =
        account?.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers?.status === "active";
      const cardPaymentsActive =
        account?.configuration?.merchant?.capabilities?.card_payments?.status === "active";

      const requirementsStatus = account?.requirements?.summary?.minimum_deadline?.status;
      const onboardingComplete =
        requirementsStatus !== "currently_due" && requirementsStatus !== "past_due";

      return jsonResponse({
        account_id,
        ready_to_receive_payments: cardPaymentsActive && transfersActive,
        card_payments_active: cardPaymentsActive,
        transfers_active: transfersActive,
        onboarding_complete: onboardingComplete,
        requirements_status: requirementsStatus || "none",
      });
    }

    // =====================================================================
    //  create-account-session — issue client_secret for embedded components
    // =====================================================================
    if (action === "create-account-session") {
      requireAuth();
      const { account_id } = body;
      if (!account_id) return jsonResponse({ error: "account_id is required" }, 400);

      const session = await (stripeClient as any).accountSessions.create({
        account: account_id,
        components: {
          account_onboarding: { enabled: true },
          account_management: { enabled: true },
          payments: { enabled: true },
          payouts: { enabled: true },
          notification_banner: { enabled: true },
        },
      });

      return jsonResponse({ client_secret: session.client_secret });
    }

    // =====================================================================
    //  create-product — store mapping; price_data created at checkout time
    // =====================================================================
    if (action === "create-product") {
      requireAuth();
      const { name, description, price_cents, currency, connected_account_id } = body;
      if (!name || !price_cents || !connected_account_id) {
        return jsonResponse(
          { error: "name, price_cents, and connected_account_id are required" },
          400,
        );
      }

      await serviceSupabase.from("connect_products").insert({
        user_id: userId,
        team_id: teamId,
        stripe_product_id: "inline", // direct-charge uses inline price_data per checkout
        stripe_price_id: null,
        connected_account_id,
        name,
        description: description || null,
        price_cents: Number(price_cents),
        currency: currency || "cad",
      });

      return jsonResponse({ message: "Product created successfully" });
    }

    // =====================================================================
    //  list-products (public)
    // =====================================================================
    if (action === "list-products") {
      const { data: products, error } = await serviceSupabase
        .from("connect_products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ products });
    }

    // =====================================================================
    //  create-checkout — DIRECT CHARGE on the connected account
    // =====================================================================
    if (action === "create-checkout") {
      const { product_id } = body;
      if (!product_id) return jsonResponse({ error: "product_id is required" }, 400);

      const { data: product, error: prodErr } = await serviceSupabase
        .from("connect_products")
        .select("*")
        .eq("id", product_id)
        .single();

      if (prodErr || !product) return jsonResponse({ error: "Product not found" }, 404);

      const origin = req.headers.get("origin") || "http://localhost:5173";
      const feePercent = Number(Deno.env.get("PLATFORM_FEE_PERCENT") || "10");
      const applicationFeeAmount = Math.round(product.price_cents * feePercent / 100);

      // Direct charge: pass { stripeAccount } so the session is created
      // ON the connected account. Seller is merchant of record.
      const session = await stripeClient.checkout.sessions.create(
        {
          mode: "payment",
          line_items: [
            {
              price_data: {
                currency: product.currency,
                product_data: {
                  name: product.name,
                  description: product.description || undefined,
                },
                unit_amount: product.price_cents,
              },
              quantity: 1,
            },
          ],
          payment_intent_data: {
            application_fee_amount: applicationFeeAmount,
          },
          success_url: `${origin}/connect/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/connect`,
        },
        { stripeAccount: product.connected_account_id },
      );

      return jsonResponse({ url: session.url });
    }

    return jsonResponse({ error: `Invalid action: '${action}'` }, 400);
  } catch (error) {
    console.error("Error in stripe-connect-v2:", error);
    const status = (error as any).status || 500;
    return jsonResponse({ error: (error as Error).message }, status);
  }
});
