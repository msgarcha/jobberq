## Why the payment option is missing

The invoice is configured correctly. In the database for this link:
- `balance_due` = $2.10 (greater than 0)
- `stripe_charges_enabled` = true
- connected Stripe account is onboarded

The public pay page (`src/pages/PublicInvoicePay.tsx`) only renders the "Pay Now" section when **all three** of these are true:

```text
balanceDue > 0  AND  company.stripe_charges_enabled  AND  stripePromise
```

The first two are fine. The third — `stripePromise` — is produced by `getStripe()` in `src/lib/stripe.ts`, which reads `import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY`. That variable is **not present in the frontend build**, so `getStripe()` returns `null`, the gate fails, and the page shows "Online payment is not available."

The Stripe publishable key currently lives only as a backend secret (`STRIPE_PUBLISHABLE_KEY`), so the browser never receives it. A publishable key is safe to expose to the browser, so the fix is to deliver it to the page.

## What I'll build

### Part 1 — Make online card payment appear (the actual bug)

1. **Return the publishable key from the backend.** Extend the `public-invoice` edge function to also return `stripe_publishable_key` (read from the existing `STRIPE_PUBLISHABLE_KEY` secret). This is publishable and safe to send to the browser.
2. **Use that key on the pay page.** In `PublicInvoicePay.tsx`, initialize Stripe from the key returned by the function (via `loadStripe(...)`) instead of relying on the missing build-time env var. The "Pay Now" gate then becomes `balanceDue > 0 && stripe_charges_enabled && <key present>`.

This alone restores the card-entry form on the invoice link.

### Part 2 — Add Apple Pay & Google Pay (card + wallets in one widget)

The current form uses Stripe's `CardElement`, which is card-fields only — no Apple Pay. To get "enter card OR Apple Pay" I'll switch the public pay page to Stripe's **Payment Element**, which automatically shows the card form plus Apple Pay (on Safari/iOS) and Google Pay (on Chrome/Android) when available.

1. On page load (for the public link), call `create-payment-intent` to get a `client_secret` for the balance due (the function already supports `public_pay` and already routes funds to the connected account via destination charges).
2. Mount `<Elements stripe={...} options={{ clientSecret }}>` with `<PaymentElement />` and confirm with `stripe.confirmPayment(...)`.
3. **Apple Pay domain registration (required by Stripe).** Apple Pay only renders on domains registered with Stripe as payment-method domains. I'll register the live domains (`quicklinq.app`, `www.quicklinq.app`, and the preview domain) on the platform Stripe account. Because payments are destination charges on the platform account, registering on the platform account is sufficient. Google Pay needs no domain registration.

## Technical notes / decisions to confirm

- **Live vs test mode:** Apple Pay buttons only appear in **live mode** on a registered HTTPS domain — they will not show in the Lovable preview iframe even after the code change. We should verify against the live `quicklinq.app` URL. Google Pay can appear in test mode.
- **Other pages using `getStripe()`** (`ManualCardEntry`, `CollectPaymentSheet` inside the authenticated app) have the same missing-key issue. If you want, I can apply the same key-delivery fix there so in-app manual card entry also works. Tell me if that's in scope or if this is public-link only.
- No database or schema changes are required.

## Suggested order

1. Part 1 first (one edge-function tweak + one page change) so the card payment option is restored immediately — verifiable on the live link.
2. Part 2 (Payment Element migration + Apple Pay domain registration) for wallet support.

If you'd rather keep it simple, I can do **only Part 1** (restore card payments) and skip Apple Pay for now. Otherwise I'll do both.