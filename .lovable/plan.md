

## Stripe Connect for Multi-Tenant SaaS Payments

### The Problem
Right now, all payment functions use a single `STRIPE_SECRET_KEY` — your platform's key. Every business using your SaaS would need their own Stripe account so payments go to **their** bank account, not yours.

### The Solution: Stripe Connect
Stripe has a product called **Stripe Connect** built exactly for this. Here's how it works:

```text
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Your Client │────▶│  Your SaaS   │────▶│   Business   │
│  (end payer) │     │  (platform)  │     │ (contractor) │
│  pays invoice│     │  routes $$$  │     │ receives $   │
└──────────────┘     └──────────────┘     └──────────────┘
                      Uses YOUR key        Has Connected
                      + their account      Stripe Account
```

Each business **connects their Stripe account** through an OAuth-like onboarding flow in your Settings page. You keep your platform Stripe key. When a payment is made, you create a PaymentIntent with a `transfer_data.destination` pointing to that business's connected Stripe account — Stripe automatically routes the money to their bank.

### Plan

#### 1. Database: Add `stripe_account_id` to `company_settings`
- Add a `stripe_account_id` (text, nullable) column — stores the connected Stripe account ID (e.g., `acct_xxx`) for each business
- Add `stripe_onboarding_complete` (boolean, default false) to track if onboarding is done

#### 2. Stripe Connect Onboarding Edge Function (`connect-stripe-account`)
- Creates a Stripe Connect Account (Standard type) via `stripe.accounts.create()`
- Saves the `stripe_account_id` to the team's `company_settings`
- Returns a Stripe Account Link URL for the business owner to complete onboarding (enter bank details, verify identity)
- A second endpoint to check onboarding status and mark complete

#### 3. Settings Page: "Connect Stripe" Section
- New card in the Company Settings tab: "Payment Setup"
- If not connected: shows a "Connect with Stripe" button that triggers the onboarding flow
- If connected: shows status badge (connected/pending), the account ID, and a "Disconnect" option
- Business owners enter their bank info **directly on Stripe's hosted onboarding page** — we never touch their bank details

#### 4. Update All Payment Edge Functions
Currently 4 functions create charges using `STRIPE_SECRET_KEY` alone. Update them to:
- Look up the business's `stripe_account_id` from `company_settings` (via the invoice's `team_id`)
- Add `transfer_data: { destination: stripe_account_id }` to PaymentIntent params
- This routes the payment to the business's connected Stripe account
- Optionally set an `application_fee_amount` (your platform's cut)

Functions to update:
- `create-payment-intent` — add `transfer_data.destination`
- `create-invoice-checkout` — add `transfer_data.destination` to Checkout Session
- `charge-saved-card` — add `transfer_data.destination`
- `stripe-webhook` — handle `account.updated` events for onboarding status

#### 5. Update Client-Side Stripe Key
- Remove the hardcoded test publishable key from `src/lib/stripe.ts`
- Each business uses YOUR platform's publishable key (since you're the platform)
- The connected account is specified server-side only

### How Money Flows
1. Business signs up → connects Stripe in Settings → enters bank details on Stripe's page
2. Client receives invoice → pays via card
3. Payment goes through YOUR platform Stripe account
4. Stripe automatically transfers funds to the business's connected account (minus any platform fee you set)
5. Stripe handles payouts to the business's bank on their normal payout schedule

### Files Changed
- 1 migration: add `stripe_account_id`, `stripe_onboarding_complete` to `company_settings`
- New edge function: `connect-stripe-account/index.ts`
- Update 4 edge functions: `create-payment-intent`, `create-invoice-checkout`, `charge-saved-card`, `stripe-webhook`
- `src/pages/Settings.tsx` — add Stripe Connect onboarding UI
- `src/lib/stripe.ts` — clean up hardcoded key

### What the Business Owner Sees
1. Go to Settings → "Payment Setup" card
2. Click "Connect with Stripe"
3. Redirected to Stripe's hosted onboarding (enter bank, verify identity)
4. Redirected back → green "Connected" badge
5. All invoice payments now go to their bank account

### Platform Revenue (Optional)
You can set an `application_fee_amount` on each payment to take a percentage as your platform fee. This is separate from the subscription billing you already have.

