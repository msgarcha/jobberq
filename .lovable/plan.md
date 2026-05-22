## Problem

1. **Trial-expired users can't subscribe.** On `/settings?tab=billing`, the buttons still say "Start Free Trial" and clicking returns *"Edge Function returned a non-2xx status code"*. The cause: `create-subscription-checkout` always sends `trial_period_days: 14`, and Stripe rejects a second trial for a customer who already consumed one (which the trial-expired user has).
2. **New pricing.** Move tiers from $29/$79/$149 to **$14 / $29 / $49 USD**, applied to new signups now and to existing subscribers on next renewal.

## Fix

### A. Trial-expired billing flow

- **`supabase/functions/create-subscription-checkout/index.ts`**
  - Read `profiles.trial_ends_at` for the caller.
  - Compute `eligibleForTrial = !trial_ends_at || new Date(trial_ends_at) > new Date()` (also false if the email already has any non-active Stripe sub history).
  - Only include `subscription_data.trial_period_days: 14` when `eligibleForTrial` is true; otherwise omit it so checkout charges immediately.
  - Improve error responses (return clear message, keep 4xx vs 500 distinction).

- **`src/pages/Settings.tsx` (Billing tab)**
  - Derive `trialExpired = subscription.trialExpired && !subscription.subscribed`.
  - Plan-status card: when `trialExpired`, show heading "Trial expired", red/destructive badge, copy *"Choose a plan to continue using QuickLinq."*
  - Pricing card button label logic:
    - current plan → "Current Plan" (disabled)
    - subscribed (different tier) → "Switch plan"
    - trial active (not subscribed) → "Start Free Trial"
    - **trial expired (not subscribed) → "Subscribe — {tier.price}/mo"**
  - Toast errors from `handleCheckout` already surface; keep as is.

- **`src/pages/TrialExpired.tsx`** — no logic change; copy already routes to `/settings?tab=billing`. (Optional: tighten wording.)

### B. New pricing $14 / $29 / $49

- **Create 3 new monthly USD Stripe prices** (via Stripe tool) on the existing products:
  - Starter: `$14/mo` on `prod_U6yyGorJZoTTuw`
  - Pro: `$29/mo` on `prod_U6z3Y8rbHA1uhQ`
  - Business: `$49/mo` on `prod_U6z4mV3LY4CeeP`
- **`src/lib/subscriptionTiers.ts`**
  - Update `price`, `priceAmount`, and `priceId` for each tier to the new values/IDs.
  - Old `priceId`s are retained only in Stripe (not referenced anywhere else in code).
- **`src/components/landing/PricingSection.tsx`** — update displayed prices to $14 / $29 / $49 to stay in sync.

### C. Existing subscribers — replace at renewal

- One-time backfill via Stripe tool: for every active/trialing subscription on the three old price IDs, call `update_subscription` swapping the item to the new price with `proration_behavior: "none"`. Stripe keeps the current period at the old price and renews at the new price — no immediate charge, no prorations.
- No code change to `customer-portal` or webhook handlers required.

## Out of scope

- No DB schema changes.
- Landing page copy beyond price numbers stays the same.
- Refund/credit logic for current period — Stripe's `none` proration handles it cleanly.

## Verification

- Logged-in trial-expired test user clicks "Subscribe — $14/mo" on Starter → Stripe Checkout opens with $14 due today, no trial.
- A user still inside their trial sees "Start Free Trial" and gets a 14-day trial on checkout.
- An active subscriber sees "Switch plan" on other tiers and "Current Plan" on theirs.
- Landing page shows $14/$29/$49.
- An existing Pro subscriber sees their subscription move to the new $29 price on next renewal (verified via Stripe dashboard list).
