

# Stripe Payment Integration for Invoice Payments

## Approach

This is **not** a product/subscription checkout. Instead, each invoice has a dynamic amount (the balance due). We'll use Stripe Checkout in `payment` mode with `price_data` to create a session for the exact invoice balance. This is the correct approach for invoice payments where amounts vary.

## Flow

1. Business owner clicks "Send Payment Link" on an unpaid invoice
2. Edge function creates a Stripe Checkout session for the invoice's balance due
3. A payment link URL is generated (can be copied/shared with the client)
4. Client pays via Stripe Checkout (no login required -- guest checkout)
5. A second edge function (webhook or verify) confirms payment and records it in the database

## Implementation

### 1. Edge Function: `create-invoice-checkout`
- Receives `invoice_id` from authenticated user
- Loads invoice details (balance_due, client email, invoice_number)
- Creates a Stripe Checkout session with:
  - `mode: "payment"`
  - `price_data` with the exact balance due amount
  - `success_url` pointing back to the invoice detail page
  - `metadata` containing `invoice_id` for tracking
- Returns the checkout session URL

### 2. Edge Function: `stripe-webhook`
- Listens for `checkout.session.completed` events
- Reads `invoice_id` from session metadata
- Records a payment in the `payments` table (method: "stripe", with Stripe session ID as reference)
- Updates invoice `amount_paid`, `balance_due`, and status to "paid" if fully paid
- Uses service role key (no auth needed -- webhook is from Stripe)

### 3. UI Changes (InvoiceDetail.tsx)
- Add "Payment Link" button for non-paid, non-draft invoices
- Button calls the edge function, then copies the Stripe Checkout URL or opens it
- Add a success handler on the invoice detail page when redirected back from Stripe

### 4. Config
- Add `verify_jwt = false` for both edge functions in `config.toml`
- Register the Stripe webhook endpoint (user will need to add webhook secret)

## Files

| File | Action |
|------|--------|
| `supabase/functions/create-invoice-checkout/index.ts` | New -- creates Stripe Checkout session for invoice |
| `supabase/functions/stripe-webhook/index.ts` | New -- handles payment completion webhook |
| `src/pages/InvoiceDetail.tsx` | Add "Payment Link" button |
| `supabase/config.toml` | Add function configs with `verify_jwt = false` |

## Secrets Needed
- `STRIPE_SECRET_KEY` -- already configured
- `STRIPE_WEBHOOK_SECRET` -- will need to be added (user gets this from Stripe dashboard after setting up the webhook endpoint)

