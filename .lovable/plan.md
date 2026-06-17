# Add Apple In‑App Purchase (RevenueCat) for QuickLinq subscriptions on iOS

Goal: resolve App Store rejection **Guideline 3.1.1** by making the QuickLinq subscription purchasable inside the native iOS app via StoreKit, using RevenueCat as the IAP engine. Web keeps Stripe unchanged. Entitlement from either source unlocks the app.

## How it will work

```text
iOS app ──purchase──> StoreKit ──> RevenueCat SDK ──> RevenueCat
   │                                                     │ webhook
   │ app_user_id = supabase user.id                      ▼
   │                                          revenuecat-webhook (edge fn)
   │                                                     │ upsert
   ▼                                                     ▼
check-subscription  <── reads ── public.iap_entitlements (Supabase)
   │
   ▼
AuthContext.subscription → ProtectedRoute / TrialExpired / Settings unlock
```

- On **native iOS**, subscriptions are bought through Apple. On **web**, nothing changes (Stripe).
- `check-subscription` becomes the single source of truth: it returns "subscribed" if the user has **either** an active Stripe sub **or** an active Apple entitlement.

## Pricing
No price was specified, so the plan assumes the nearest Apple price points: **Starter $14.99 / Pro $29.99 / Business $49.99 per month**. Easy to change in App Store Connect; tell me if you want different points.

---

## Part A — Code changes (I do these)

### 1. Database
New migration: `public.iap_entitlements`
- Columns: `user_id` (uuid, unique, FK auth.users), `provider` ('apple'), `product_id` (text), `tier` (text), `is_active` (bool), `expires_at` (timestamptz), `rc_app_user_id` (text), `raw` (jsonb), plus id/created_at/updated_at + update trigger.
- GRANTs: `authenticated` SELECT (own row), `service_role` ALL. RLS: user can read own row; only service role writes.

### 2. Edge function `revenuecat-webhook` (new)
- `verify_jwt = false`; validates a shared `Authorization` header against `REVENUECAT_WEBHOOK_SECRET`.
- Parses RevenueCat events (INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION, PRODUCT_CHANGE, BILLING_ISSUE).
- Maps the RevenueCat product id → tier; upserts `iap_entitlements` by `user_id` (= `app_user_id`) with `is_active` and `expires_at`.

### 3. Edge function `check-subscription` (extend)
- After existing Stripe logic, query `iap_entitlements` for the user.
- If an Apple entitlement is active (`is_active` and `expires_at > now`), set `subscribed = true`, set `product_id`/tier from it (so existing `getTierByProductId` still resolves), and use its `expires_at` as `subscription_end`. Stripe sub still wins if present. No change to trial logic.

### 4. RevenueCat SDK + IAP client layer
- Add dependency `@revenuecat/purchases-capacitor`.
- New `src/lib/native/iap.ts`: `configureIap()` (init with public SDK key, only on native), `logInIap(userId, email)`, `getOfferings()`, `purchasePackage(pkg)`, `restorePurchases()`, `getActiveEntitlement()`, `presentManageSubscriptions()` (App Store deep link). All no‑ops/guards on web.
- Call `configureIap()` from `src/lib/native/bootstrap.ts`, and `logInIap(...)` from `AuthContext` when a session is present (alongside push registration).

### 5. UI
- **`src/pages/Settings.tsx` (Billing tab, native branch):** replace the "manage on the web" card with RevenueCat offerings — the 3 packages with StoreKit‑localized prices, feature lists, and a **Subscribe** button per package that calls `purchasePackage`. Add **Restore Purchases** and **Manage Subscription** (App Store) buttons. On success, call `checkSubscription()` to refresh. Web branch unchanged.
- **`src/pages/TrialExpired.tsx` (native branch):** replace the "go to quicklinq.app" copy with the same in‑app purchase + Restore buttons so an expired user can subscribe without leaving the app. Web branch unchanged.
- After any successful purchase/restore, refresh entitlement via `checkSubscription()` (webhook + this gives prompt unlock).

### 6. Secrets (I will request, you enter values)
- `REVENUECAT_IOS_PUBLIC_SDK_KEY` (the `appl_…` key — used by the app).
- `REVENUECAT_WEBHOOK_SECRET` (shared secret you set on the RevenueCat webhook).

### 7. Memory
Update `mem://features/ios-app-store-compliance`: native iOS now sells the subscription via Apple IAP (RevenueCat); remove the "manage on web only" rule; document the entitlement-merge in `check-subscription`.

---

## Part B — Your manual steps (outside Lovable; required for it to work)

These cannot be automated and are needed before resubmission:

1. **App Store Connect → Subscriptions:** create one **Subscription Group** with 3 **auto‑renewable** subscriptions (Starter/Pro/Business) at the chosen prices, with display name, description, and a review screenshot. Note each product ID.
2. **Agreements:** ensure the **Paid Apps Agreement** is active (Business → Agreements). IAP won't load otherwise.
3. **RevenueCat account:** create a project, add the iOS app (App Store shared secret / App Store Connect API key), create the 3 products, one **Entitlement** (e.g. `pro_access`) attached to all 3, and an **Offering** with 3 packages. Give me the **Apple public SDK key**.
4. **RevenueCat → Integrations → Webhooks:** point it at the `revenuecat-webhook` function URL (I'll give you the URL) and set the **Authorization** header to the value you'll store in `REVENUECAT_WEBHOOK_SECRET`.
5. **Xcode:** after `git pull && npm install && npm run build && npx cap sync ios`, open the project and add the **In‑App Purchase** capability to the App target. Bump build number, archive, upload.
6. **App Store Connect → submit:** attach the new build and submit the in‑app purchases together with the app version. In the reviewer notes, mention IAP is now implemented.

---

## Sequencing
1. Migration → 2. edge functions → 3. request secrets (wait for you) → 4. RevenueCat client layer + bootstrap/AuthContext wiring → 5. Settings + TrialExpired UI → 6. memory update → 7. verify web build is clean.

I can build Part A now and hand you the function URL + secret prompts. Part B (App Store Connect / RevenueCat / Xcode) is yours, and the IAP UI will only show real products once those are configured.

## Technical notes
- Product‑id→tier mapping lives next to `SUBSCRIPTION_TIERS` (`src/lib/subscriptionTiers.ts`); I'll add the Apple product IDs there once you create them (placeholder constants until then).
- `app_user_id` passed to RevenueCat = Supabase `user.id`, so the webhook can key entitlements to the right account with no email matching.
- Everything is guarded by `isNative()` so the web app and `npm run build` are unaffected.
