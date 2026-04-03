/**
 * Stripe Connect V2 Edge Function
 * ================================
 * A multi-action edge function that handles all Stripe Connect V2 operations:
 *   - create-account:       Create a V2 connected account
 *   - get-status:           Retrieve onboarding/capability status for a connected account
 *   - create-onboarding-link: Generate an Account Link for Express onboarding
 *   - create-product:       Create a product + price on the platform
 *   - list-products:        List all products in the connect_products table
 *   - create-checkout:      Create a Checkout Session with destination charge
 *
 * All Stripe API calls use a "Stripe Client" instance (`stripeClient`).
 * The V2 Accounts API is used for account creation, retrieval, and onboarding.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

// ------------------------------------------------------------------
// CORS headers — required for browser requests to edge functions
// ------------------------------------------------------------------
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ------------------------------------------------------------------
// Helper: JSON response with CORS
// ------------------------------------------------------------------
function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ------------------------------------------------------------------
    // 1. Initialise the Stripe Client
    //    STRIPE_SECRET_KEY must be set as a secret in Lovable Cloud.
    //    If it's missing, we return a helpful error instead of crashing.
    // ------------------------------------------------------------------
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      return jsonResponse(
        { error: "STRIPE_SECRET_KEY is not configured. Add it in Lovable Cloud → Secrets." },
        500,
      );
    }

    // Create the Stripe Client — all subsequent requests go through this instance.
    // The SDK automatically uses the latest API version.
    const stripeClient = new Stripe(stripeSecretKey, {
      apiVersion: "2025-08-27.basil",
    });

    // ------------------------------------------------------------------
    // 2. Supabase clients (anon for user-scoped queries, service for admin writes)
    // ------------------------------------------------------------------
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);

    // ------------------------------------------------------------------
    // 3. Parse request body & determine action
    // ------------------------------------------------------------------
    const body = await req.json();
    const { action } = body;

    // ------------------------------------------------------------------
    // 4. Authenticate user (required for most actions except list-products/create-checkout)
    // ------------------------------------------------------------------
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
        // Look up the user's team
        const { data: membership } = await userSupabase
          .from("team_members")
          .select("team_id")
          .eq("user_id", userId)
          .maybeSingle();
        teamId = membership?.team_id ?? null;
      }
    }

    // Helper: require auth
    const requireAuth = () => {
      if (!userId || !teamId) {
        throw Object.assign(new Error("Authentication required"), { status: 401 });
      }
    };

    // ================================================================
    //  ACTION: create-account
    //  Creates a V2 connected account using the platform-managed model.
    //  The platform is responsible for fees and losses collection.
    // ================================================================
    if (action === "create-account") {
      requireAuth();

      const { display_name, contact_email } = body;
      if (!display_name) {
        return jsonResponse({ error: "display_name is required" }, 400);
      }

      // Create the V2 connected account via the Stripe Client.
      // NOTE: We do NOT pass top-level `type`. The V2 API uses `dashboard`
      // and `defaults.responsibilities` to determine the account model.
      const account = await (stripeClient as any).v2.core.accounts.create({
        display_name,
        contact_email: contact_email || undefined,
        identity: {
          country: "us", // Default country — adjust per your requirements
        },
        dashboard: "express", // Express dashboard for the connected account
        defaults: {
          responsibilities: {
            fees_collector: "application",   // Platform collects fees
            losses_collector: "application", // Platform is responsible for losses
          },
        },
        configuration: {
          recipient: {
            capabilities: {
              stripe_balance: {
                stripe_transfers: {
                  requested: true, // Request the ability to receive transfers
                },
              },
            },
          },
        },
      });

      // Persist the account mapping in the database
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

    // ================================================================
    //  ACTION: get-status
    //  Retrieves the onboarding and capability status of a connected
    //  account directly from the Stripe API (not from the database).
    // ================================================================
    if (action === "get-status") {
      requireAuth();
      const { account_id } = body;
      if (!account_id) {
        return jsonResponse({ error: "account_id is required" }, 400);
      }

      // Retrieve the V2 account with configuration and requirements included
      const account = await (stripeClient as any).v2.core.accounts.retrieve(account_id, {
        include: ["configuration.recipient", "requirements"],
      });

      // Check if the account can receive payments
      const readyToReceivePayments =
        account?.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers?.status === "active";

      // Check onboarding requirements status
      const requirementsStatus =
        account?.requirements?.summary?.minimum_deadline?.status;
      const onboardingComplete =
        requirementsStatus !== "currently_due" && requirementsStatus !== "past_due";

      return jsonResponse({
        account_id,
        ready_to_receive_payments: readyToReceivePayments,
        onboarding_complete: onboardingComplete,
        requirements_status: requirementsStatus || "none",
        // Include the raw requirements for debugging
        requirements_summary: account?.requirements?.summary || null,
      });
    }

    // ================================================================
    //  ACTION: create-onboarding-link
    //  Generates an Account Link so the user can complete Express
    //  onboarding in a Stripe-hosted flow.
    // ================================================================
    if (action === "create-onboarding-link") {
      requireAuth();
      const { account_id } = body;
      if (!account_id) {
        return jsonResponse({ error: "account_id is required" }, 400);
      }

      const origin = req.headers.get("origin") || "http://localhost:5173";

      // Create a V2 account link for onboarding
      const accountLink = await (stripeClient as any).v2.core.accountLinks.create({
        account: account_id,
        use_case: {
          type: "account_onboarding",
          account_onboarding: {
            configurations: ["recipient"],
            // Where Stripe redirects if the link expires or needs refresh
            refresh_url: `${origin}/connect?refresh=true&accountId=${account_id}`,
            // Where Stripe redirects after onboarding is complete
            return_url: `${origin}/connect?accountId=${account_id}`,
          },
        },
      });

      return jsonResponse({ url: accountLink.url });
    }

    // ================================================================
    //  ACTION: create-product
    //  Creates a product + default price on the PLATFORM (not on the
    //  connected account). Stores the mapping to the connected account
    //  in the database so the storefront knows where to route payments.
    // ================================================================
    if (action === "create-product") {
      requireAuth();
      const { name, description, price_cents, currency, connected_account_id } = body;

      if (!name || !price_cents || !connected_account_id) {
        return jsonResponse(
          { error: "name, price_cents, and connected_account_id are required" },
          400,
        );
      }

      // Create the product at the platform level using the Stripe Client.
      // The `default_price_data` creates an associated price automatically.
      const product = await stripeClient.products.create({
        name,
        description: description || undefined,
        default_price_data: {
          unit_amount: Number(price_cents),
          currency: currency || "usd",
        },
      });

      // Extract the price ID from the newly created product
      const priceId =
        typeof product.default_price === "string"
          ? product.default_price
          : product.default_price?.id;

      // Persist product → connected account mapping in the database
      await serviceSupabase.from("connect_products").insert({
        user_id: userId,
        team_id: teamId,
        stripe_product_id: product.id,
        stripe_price_id: priceId || null,
        connected_account_id,
        name,
        description: description || null,
        price_cents: Number(price_cents),
        currency: currency || "usd",
      });

      return jsonResponse({
        product_id: product.id,
        price_id: priceId,
        message: "Product created successfully",
      });
    }

    // ================================================================
    //  ACTION: list-products
    //  Lists all products from the connect_products table.
    //  This is a public action (no auth required) for the storefront.
    // ================================================================
    if (action === "list-products") {
      const { data: products, error } = await serviceSupabase
        .from("connect_products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        return jsonResponse({ error: error.message }, 500);
      }

      return jsonResponse({ products });
    }

    // ================================================================
    //  ACTION: create-checkout
    //  Creates a Stripe Checkout Session with a destination charge.
    //  An application fee is taken from each transaction.
    //  No auth required — this is for end customers on the storefront.
    // ================================================================
    if (action === "create-checkout") {
      const { product_id } = body;
      if (!product_id) {
        return jsonResponse({ error: "product_id is required" }, 400);
      }

      // Look up the product to get connected account and pricing info
      const { data: product, error: prodErr } = await serviceSupabase
        .from("connect_products")
        .select("*")
        .eq("id", product_id)
        .single();

      if (prodErr || !product) {
        return jsonResponse({ error: "Product not found" }, 404);
      }

      const origin = req.headers.get("origin") || "http://localhost:5173";

      // Calculate application fee (e.g., 10% of the price).
      // Adjust PLATFORM_FEE_PERCENT in your secrets as needed.
      const feePercent = Number(Deno.env.get("PLATFORM_FEE_PERCENT") || "10");
      const applicationFeeAmount = Math.round(product.price_cents * feePercent / 100);

      // Create a Checkout Session using the Stripe Client.
      // Uses a destination charge: payment goes to the platform, then
      // the net amount is transferred to the connected account.
      const session = await stripeClient.checkout.sessions.create({
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
          // Platform fee deducted before transferring to connected account
          application_fee_amount: applicationFeeAmount,
          transfer_data: {
            // Funds are routed to this connected account
            destination: product.connected_account_id,
          },
        },
        mode: "payment",
        success_url: `${origin}/connect/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/connect/storefront`,
      });

      return jsonResponse({ url: session.url });
    }

    // If no valid action matched, return an error
    return jsonResponse({ error: `Invalid action: '${action}'` }, 400);
  } catch (error) {
    console.error("Error in stripe-connect-v2:", error);
    const status = (error as any).status || 500;
    return jsonResponse({ error: (error as Error).message }, status);
  }
});
