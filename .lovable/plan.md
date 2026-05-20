
# Finalize Stripe Connect (Direct Charges + Embedded Components)

Your Stripe platform is now verified with this configuration:
- **Funds flow:** Sellers collect directly (direct charges, seller is merchant of record on the receipt)
- **Payouts:** Per-seller payouts (Stripe handles)
- **Liability:** Stripe covers negative balances
- **Fees:** Stripe collects Stripe fees from the seller
- **Account creation:** Embedded onboarding components
- **Dashboard:** Embedded account components
- **Compliance:** Stripe handles ongoing seller compliance

The current code does NOT match this. Today it uses **destination charges** (funds hit your balance first, then transfer) and **Stripe-hosted Account Links** with the Express dashboard. We need to migrate.

## What changes

### 1. Edge function: `stripe-connect-v2`
Replace the current actions:

- **`create-account`** — keep V2 Accounts API, but:
  - Set `identity.country` to `ca` (you're Canadian) — make it a parameter so US sellers also work.
  - Set `dashboard: "none"` (we render our own embedded dashboard, no Stripe-hosted one).
  - Keep `fees_collector: "application"` so your platform applies the application fee on top of Stripe's fees.
  - Keep `losses_collector: "stripe"` (Stripe covers negatives per your settings) — currently set to `application`, must change.
  - Request `card_payments` capability in addition to `stripe_transfers` (needed for direct charges on the connected account).

- **Replace `create-onboarding-link`** with **`create-account-session`**:
  - Calls `stripe.accountSessions.create({ account, components: { account_onboarding: { enabled: true }, payments: { enabled: true }, payouts: { enabled: true }, account_management: { enabled: true } } })`.
  - Returns `client_secret` (NOT a redirect URL). The frontend uses it to mount the embedded components.

- **Replace `create-checkout`** to use **direct charges**:
  - Pass `Stripe-Account: <connected_account_id>` header on the Checkout Session call (creates the session ON the connected account, not the platform).
  - Use `payment_intent_data.application_fee_amount` (no `transfer_data` — that's destination charges).
  - The product/price should also live on the connected account, OR keep them on platform and use inline `price_data` (we'll switch to `price_data` to avoid cross-account product copies — simpler given products are platform-scoped today).

- **Keep `get-status`, `create-product`, `list-products`** roughly as-is.

### 2. New page: Embedded onboarding & dashboard

Install `@stripe/connect-js` and `@stripe/react-connect-js`. Refactor `ConnectDashboard.tsx`:

- Replace the "Onboard" button (which currently redirects to Stripe-hosted onboarding) with an inline `<ConnectAccountOnboarding />` rendered inside a dialog or section, wrapped in `<ConnectComponentsProvider />` that loads the client secret from the new `create-account-session` action.
- Add a "Manage account" section that renders `<ConnectPayments />`, `<ConnectPayouts />`, `<ConnectAccountManagement />` — the embedded equivalent of the Express dashboard.
- Add `VITE_STRIPE_PUBLISHABLE_KEY` to env (you already reference it in `src/lib/stripe.ts`).

### 3. Webhook function: `stripe-connect-webhook-v2`
Verify it listens for `account.updated` on Connect events and updates `connected_accounts.charges_enabled` / `payouts_enabled`. With direct charges + embedded components there's no return URL to refresh status, so the webhook is the source of truth. (I'll inspect/patch as needed during build.)

### 4. Platform fee
`PLATFORM_FEE_PERCENT` secret already exists (10%). Keep using it. On direct charges this fee is taken from the seller's payment and transferred to your platform balance — exactly what you want.

### 5. Country default
Currently hardcoded `us` in V2 and `ca` in the legacy `connect-stripe-account` function. We'll standardize on `ca` as the default, accept `country` as an optional parameter on `create-account`, and retire the legacy function (the Settings page that calls it should switch to the V2 flow — out of scope for this plan unless you want it included).

## Technical details

### Edge function key snippets

```ts
// create-account (changed bits)
identity: { country: body.country || "ca" },
dashboard: "none",
defaults: {
  responsibilities: {
    fees_collector: "application",
    losses_collector: "stripe",   // was "application"
  },
},
configuration: {
  recipient: { capabilities: { stripe_balance: { stripe_transfers: { requested: true } } } },
  merchant:  { capabilities: { card_payments: { requested: true } } }, // NEW
},
```

```ts
// create-account-session (new)
const session = await (stripe as any).accountSessions.create({
  account: account_id,
  components: {
    account_onboarding: { enabled: true },
    payments: { enabled: true },
    payouts: { enabled: true },
    account_management: { enabled: true },
  },
});
return { client_secret: session.client_secret };
```

```ts
// create-checkout (direct charge)
const session = await stripe.checkout.sessions.create(
  {
    mode: "payment",
    line_items: [{ price_data: { currency, product_data: { name }, unit_amount: price_cents }, quantity: 1 }],
    payment_intent_data: { application_fee_amount: applicationFeeAmount },
    success_url, cancel_url,
  },
  { stripeAccount: product.connected_account_id }   // <-- direct charge
);
```

### Frontend wiring

```tsx
const stripeConnectInstance = useMemo(() => loadConnectAndInitialize({
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  fetchClientSecret: async () => {
    const r = await connectAction("create-account-session", { account_id });
    return r.client_secret;
  },
}), [account_id]);

<ConnectComponentsProvider connectInstance={stripeConnectInstance}>
  <ConnectAccountOnboarding onExit={() => refreshStatus(account_id)} />
</ConnectComponentsProvider>
```

## Out of scope (ask if you want included)
- Retiring the legacy `connect-stripe-account` function and migrating the Settings page to V2.
- Switching `connect_products` to be stored on each connected account instead of the platform.
- Multi-currency support (we'll keep current currency selector).

Confirm and I'll implement.
