# Add iOS In-App Purchases (RevenueCat) with unified entitlement

## Why the app keeps getting rejected
The current build shows subscription state on iOS but offers no way to buy it in-app. Apple's 3.1.1 requires that any paid digital subscription the app unlocks must be purchasable via In-App Purchase. Making it "read-only" is not enough — we must sell the subscription through StoreKit on iOS. We'll use RevenueCat (Capacitor plugin) on iOS, keep Stripe on web, and merge both into one entitlement so an account is "subscribed" no matter where it paid.

## What already exists (from a prior session)
- DB table `public.iap_entitlements` (user_id, provider, product_id, tier, is_active, expires_at, rc_app_user_id, raw, timestamps) with a SELECT-own RLS policy.
- Secrets `REVENUECAT_IOS_PUBLIC_SDK_KEY` and `REVENUECAT_WEBHOOK_SECRET`.
- No plugin, no client code, no webhook, and `check-subscription` does not look at Apple.

## High-level architecture
```text
iOS app ── RevenueCat SDK ──> Apple StoreKit (purchase/trial/restore)
   │                               │
   │ logIn(app_user_id = supabase user id)
   ▼                               ▼
RevenueCat ── webhook ──> edge fn `revenuecat-webhook` ──> iap_entitlements (upsert)
                                                                │
web app ── Stripe Checkout ──> Stripe subscription             │
                                   │                            │
                                   ▼                            ▼
                         check-subscription merges Stripe + iap_entitlements
                                   ▼
                         AuthContext.subscription (subscribed / tier / end)
```

## Part 1 — App Store Connect (you do this; I'll give exact steps)
1. Create one **Subscription Group** (e.g. "QuickLinq Plans").
2. Create 3 **auto-renewable subscriptions** in that group at Apple price points matching web:
   - Starter — `quicklinq_starter_monthly` — $14.99/mo
   - Pro — `quicklinq_pro_monthly` — $29.99/mo
   - Business — `quicklinq_business_monthly` — $49.99/mo
3. On each product add a **14-day free-trial Introductory Offer** (new subscribers).
4. Generate the **App-Specific Shared Secret** and an **In-App Purchase Key** (for RevenueCat).
5. Add the localized display name, description, and a screenshot per product (Apple requires this to approve IAP).

## Part 2 — RevenueCat dashboard (you do this; I'll give exact steps)
1. App with the iOS bundle id `app.quicklinq`; paste the App-Specific Shared Secret + In-App Purchase Key.
2. One **Entitlement** `pro` (the gate). Attach all 3 store products to it.
3. One **Offering** `default` with 3 packages (Starter/Pro/Business) → mapped to the App Store product ids above.
4. Add a **Webhook** pointing at the new `revenuecat-webhook` function URL, with the Authorization header value set to our `REVENUECAT_WEBHOOK_SECRET`.
5. The iOS public SDK key is already stored; I'll expose it to the client (publishable key, safe in code/env).

## Part 3 — Code changes I will make

### Dependency
- Add `@revenuecat/purchases-capacitor` (Capacitor 8 compatible). Native iOS only; no-ops on web.

### Subscription tier mapping (`src/lib/subscriptionTiers.ts`)
- Add `appleProductId` to each tier and a `getTierByAppleProductId()` helper, plus include Apple product ids in tier resolution.

### New `src/lib/native/iap.ts`
- `initIap(userId)` — configure `Purchases` with the iOS public key and `logIn(userId)` so RevenueCat's app_user_id == Supabase user id (this is what makes cross-platform identity work).
- `getOfferings()`, `purchaseTier(tierKey)`, `restorePurchases()`, `presentManageSubscriptions()` (opens Apple's manage-subscription sheet), `logoutIap()`.
- A `customerInfo` listener that calls `checkSubscription()` whenever entitlements change.
- All wrapped in `isNative()`/try-catch so web and PWA are untouched.

### `src/contexts/AuthContext.tsx`
- On login (native): call `initIap(user.id)`. On signOut: `logoutIap()`.
- Keep the existing 60s `checkSubscription` poll (now merges Apple too).

### `src/pages/Settings.tsx` (billing tab, native branch)
- Replace the read-only card with **real pricing cards + Subscribe buttons** that call `purchaseTier()`.
- Prices shown come from the live StoreKit offering (`priceString`) so they always match App Store / locale.
- Add **Restore Purchases** and **Manage Subscription** (opens Apple's sheet) buttons.
- If the account already has an active **Stripe** sub (bought on web), show a "managed on the web" note instead of buy buttons to prevent double-billing. Web branch stays Stripe-only and unchanged.

### `src/pages/TrialExpired.tsx`
- On native, show the plan cards + Subscribe (StoreKit) and Restore buttons instead of "log in on web".

### New edge function `supabase/functions/revenuecat-webhook/index.ts` (`verify_jwt=false`)
- Validate the incoming `Authorization` header equals `REVENUECAT_WEBHOOK_SECRET` (reject otherwise).
- Parse RC event; resolve `user_id` from `app_user_id`, `tier` from product id.
- Upsert `iap_entitlements` keyed by `(user_id, provider='apple')`:
  - `INITIAL_PURCHASE`, `RENEWAL`, `PRODUCT_CHANGE`, `UNCANCELLATION` → `is_active=true`, set tier/product/expires.
  - `CANCELLATION` (auto-renew off) → keep `is_active=true` until `expires_at`.
  - `EXPIRATION`, `REFUND`, `SUBSCRIPTION_PAUSED` → `is_active=false`.
  - `BILLING_ISSUE` → stay active through the grace period (use `grace_period_expires_at`).
- Store the full payload in `raw`; write via service role.

### `check-subscription` (merge logic)
- After the existing Stripe lookup, also read `iap_entitlements` for the user.
- `subscribed = stripeActive OR (iap.is_active AND expires_at > now)`.
- Resolve tier/subscription_end from whichever source is active (prefer the active one); return a `source` field (`stripe` | `apple`).
- Super-admin and app-trial logic unchanged.

### Migration
- Add `UNIQUE (user_id, provider)` to `iap_entitlements` (needed for upsert).
- Add the missing grants: `GRANT SELECT, INSERT, UPDATE ON public.iap_entitlements TO authenticated; GRANT ALL ... TO service_role;` (keep SELECT-own policy; writes happen via service role in the webhook).

## Part 4 — Edge cases handled
- **Restore purchases** (reinstall / new device) → button + RC restore → entitlement re-synced.
- **Cross-platform**: same Supabase id = same RC app_user_id, so Apple + web converge on one entitlement; UI hides the other platform's buy button when one is active.
- **Refund / chargeback** → webhook deactivates; next poll downgrades access.
- **Billing grace period** → access preserved until grace expiry.
- **Free-trial eligibility** is enforced by Apple (intro offer), so no double-trial abuse.
- **Sandbox testing** works with a sandbox Apple ID before going live.
- **Logout / account switch** → `Purchases.logOut()` prevents leaking entitlement to the next account.
- **Web unchanged** → Stripe checkout, portal, trial all keep working; PWA unaffected.

## Part 5 — Native rebuild & resubmission
- After merge: `git pull` → `npm install` → `npm run build` → `npx cap sync ios` → archive in Xcode.
- I'll update the App Review notes to state IAP is now available in-app, and refresh the `ios-app-store-compliance` memory.

## Notes / decisions reflected
- Engine: **RevenueCat**. iOS prices: **match web** ($14.99/$29.99/$49.99 Apple points). Sync: **unified entitlement**. Trial: **14-day Apple intro offer**.
- The RevenueCat iOS key is publishable; I'll surface it to the client via a Vite env var (no secret exposure risk).