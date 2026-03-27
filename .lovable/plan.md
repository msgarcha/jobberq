

## Current vs Proposed Payment Architecture — Gap Analysis & Plan

### What's Already Working
- Stripe Connect onboarding flow via `connect-stripe-account` edge function
- `stripe_account_id` and `stripe_onboarding_complete` in `company_settings`
- `transfer_data.destination` routing in `create-payment-intent`, `create-invoice-checkout`, `charge-saved-card`
- Webhook handling for `account.updated` and `checkout.session.completed`
- Manual card entry with Stripe Elements (`ManualCardEntry.tsx`)
- Saved cards via `save-card-setup` and `client_saved_cards` table
- Settings UI for "Connect with Stripe"

### Critical Gaps (Current → Your Proposed Architecture)

```text
FEATURE                        CURRENT              PROPOSED
─────────────────────────────────────────────────────────────
Account type                   Standard             Express
Amounts                        Decimal dollars      Integer cents
Currency                       USD                  CAD
Platform fee                   Commented out         Active (configurable)
stripe_charges_enabled col     Missing              Required
stripe_payouts_enabled col     Missing              Required
payout_schedule col            Missing              Required
Payouts table                  Missing              Required
Login link (Express dash)      Missing              Required
Public pay page /pay/:id       Missing              Required
Contractor onboarding page     Missing              Required
Payments dashboard             Missing              Required
Webhook: payment_intent.*      Missing              Required
Webhook: payout.paid           Missing              Required
Invoice blocking if !enabled   Not enforced         Required
Persistent setup banner        Missing              Required
Min invoice $50                Not enforced         Required
```

### Implementation Plan

#### Phase 1: Database Changes
- Add `stripe_charges_enabled` (bool), `stripe_payouts_enabled` (bool), `payout_schedule` (text, default `'every_3_days'`) to `company_settings`
- Create `payouts` table: `id`, `team_id`, `user_id`, `stripe_payout_id`, `amount_cents`, `status`, `arrival_date`, `created_at` with team RLS
- (Optional) Create `webhook_errors` table for failed webhook logging

#### Phase 2: Switch to Express Accounts
- Update `connect-stripe-account` edge function:
  - Change `type: 'standard'` → `type: 'express'` with `capabilities: { card_payments: { requested: true }, transfers: { requested: true } }`
  - Add `country: 'CA'`
  - Add `action: 'login-link'` handler using `stripe.accounts.createLoginLink()`
  - Update status check to save `charges_enabled` and `payouts_enabled` separately

#### Phase 3: Enable Platform Fee
- Add `PLATFORM_FEE_PERCENT` secret (default 0, configurable via super admin)
- Update `create-payment-intent`: add `application_fee_amount: Math.round(amountCents * feePercent / 100)`
- Update `create-invoice-checkout`: same fee logic
- Update `charge-saved-card`: same fee logic
- Convert all amount handling to cents (integers) in edge functions

#### Phase 4: Expand Webhooks
- Add handlers for: `payment_intent.succeeded`, `payment_intent.payment_failed`, `payout.paid`
- On `payment_intent.succeeded`: update invoice to paid, record payment
- On `payout.paid`: insert into `payouts` table
- On failure: log to `webhook_errors` table

#### Phase 5: Public Invoice Payment Page (`/pay/:invoiceId`)
- New public page (no auth required) showing contractor branding, line items, total
- Stripe Elements card input
- Calls `create-payment-intent` (modified to work without auth for public pay links)
- Success/failure states

#### Phase 6: Contractor Onboarding Page
- New page at `/onboarding/payments` with intro + "Set Up Payments" button
- Return page at `/onboarding/payments/return` that checks account status
- Payout schedule selector

#### Phase 7: Payments Dashboard (`/dashboard/payments`)
- Summary cards: total earned, pending payout, last payout
- Invoices table with fee breakdown (Amount, Platform Fee, Net to You)
- Payout history from `payouts` table
- "View Stripe Dashboard" button (Express login link)

#### Phase 8: Business Logic Enforcement
- Block invoice sending if `stripe_charges_enabled !== true`
- Persistent banner: "Complete payment setup to send invoices"
- Minimum invoice $50 CAD validation
- Currency switch USD → CAD throughout

#### Phase 9: Settings Update
- Show connected bank info (masked) from Stripe account object
- Payout schedule selector in settings
- "Update Bank Account" re-triggers account link
- "View Stripe Dashboard" opens Express login link

### Files Changed
- 1-2 migrations (new columns + payouts table)
- `supabase/functions/connect-stripe-account/index.ts` — Express type + login link
- `supabase/functions/create-payment-intent/index.ts` — cents + fee + public access
- `supabase/functions/create-invoice-checkout/index.ts` — cents + fee
- `supabase/functions/charge-saved-card/index.ts` — cents + fee
- `supabase/functions/stripe-webhook/index.ts` — new event handlers
- `src/pages/PublicInvoicePay.tsx` — new public pay page
- `src/pages/PaymentOnboarding.tsx` — new onboarding flow
- `src/pages/PaymentsDashboard.tsx` — new dashboard
- `src/pages/Settings.tsx` — expanded payment settings
- `src/App.tsx` — new routes
- `src/components/invoice/CollectPaymentSheet.tsx` — enforce charges_enabled check

### Recommendation
Your proposed architecture is significantly more robust. The current implementation is about 40% there — the Connect routing works but uses Standard (not Express), has no platform fee, no public pay page, no payouts tracking, and no business logic enforcement. I recommend implementing this in phases, starting with Phase 1-3 (database + Express + fees) as the foundation, then Phase 4-5 (webhooks + public pay) for the core payment flow, and finally Phase 6-9 for the full contractor experience.

