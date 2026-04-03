

## Two Issues: Quote Deposit System + Stripe Connect 401 Fix

### Issue 1: Stripe Connect Returns 401

**Root cause:** The `connect-stripe-account` edge function is NOT listed in `supabase/config.toml`, so the Supabase gateway enforces JWT verification at the gateway level and rejects the request before it reaches the function. The function has its own auth logic inside but never gets to run it.

Additionally, many other edge functions are missing from config.toml and will also fail: `charge-saved-card`, `check-subscription`, `create-invoice-checkout`, `create-payment-intent`, `create-subscription-checkout`, `customer-portal`, `generate-recurring-invoices`, `save-card-setup`, `send-team-invite`, `stripe-webhook`.

**Fix:** Add all missing functions to `supabase/config.toml` with `verify_jwt = false`. Each function already handles auth internally via Authorization header parsing. The `stripe-webhook` function validates via Stripe signature, not JWT.

**File:** `supabase/config.toml`

### Issue 2: Quote Deposit Option

**What's needed:** When creating/editing a quote, the user should be able to set a required deposit as either a percentage of the total or a fixed dollar amount. When the client views the public quote and approves it, they should see and pay the deposit. When the quote is converted to an invoice, the deposit payment should be reflected as `amount_paid` on the invoice.

**Implementation:**

#### Database migration
Add three columns to the `quotes` table:
- `deposit_type` (text, nullable) -- `'percent'` or `'fixed'` or null (no deposit)
- `deposit_value` (numeric, default 0) -- the percentage or dollar amount
- `deposit_amount` (numeric, default 0) -- the calculated deposit in dollars (computed on save)

#### Quote Form (`src/pages/QuoteForm.tsx`)
Add a "Deposit Required" section below the line items card:
- Toggle switch to enable deposit
- Radio group: "Percentage" or "Fixed Amount"
- Input field for the value (% or $)
- Display the calculated deposit amount

#### Quote Detail (`src/pages/QuoteDetail.tsx`)
- Show deposit info in the summary if set
- When converting to invoice: set `amount_paid = deposit_amount` and `balance_due = total - deposit_amount` if deposit was collected

#### Public Quote View (`src/pages/PublicQuoteView.tsx`)
- Show deposit amount required below the total
- After approving, show a "Pay Deposit" button that initiates a Stripe payment for the deposit amount (using the existing `create-payment-intent` flow)

#### Public Quote Edge Function (`supabase/functions/public-quote/index.ts`)
- Include deposit fields in the response

### Summary of Changes

| # | File | Change |
|---|------|--------|
| 1 | `supabase/config.toml` | Add all missing edge functions with `verify_jwt = false` |
| 2 | Database migration | Add `deposit_type`, `deposit_value`, `deposit_amount` to quotes |
| 3 | `src/pages/QuoteForm.tsx` | Add deposit configuration UI |
| 4 | `src/hooks/useQuotes.ts` | Include deposit fields in create/update |
| 5 | `src/pages/QuoteDetail.tsx` | Display deposit info, account for deposit when converting to invoice |
| 6 | `src/pages/PublicQuoteView.tsx` | Show deposit, add "Pay Deposit" button after approval |
| 7 | `supabase/functions/public-quote/index.ts` | Return deposit fields |

