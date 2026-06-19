# IAP Verification & Fixes

I reviewed the whole RevenueCat/IAP implementation. The code is **95% correct** — but there is **one critical bug** that would silently break purchases, plus a few smaller things to harden. Your App Store Connect (Part 1) and RevenueCat (Part 2) setup can't be fully verified from here, so I've also listed exactly what to check on those dashboards.

## What is already correct (verified)

- `subscriptionTiers.ts` Apple product IDs (`quicklinq_starter_monthly`, `_pro_`, `_business_monthly`) match the webhook's tier mapping exactly.
- `iap.ts` configures RevenueCat with the **Supabase user id** as `appUserID` — so web (Stripe) and iOS (Apple) converge on one account.
- `check-subscription` correctly merges the Apple entitlement (`iap_entitlements`, `provider='apple'`) with Stripe and returns a `source` field.
- `AuthContext` initializes RevenueCat on login and logs out on sign-out (prevents entitlement leakage).
- `Settings.tsx` (Billing tab) and `TrialExpired.tsx` both render `<NativePlanCards />` on native, and the cards render for not-subscribed users.
- Migration is correct: unique `(user_id, provider)`, grants, `updated_at` trigger.
- `@revenuecat/purchases-capacitor` is installed; App Store icon (1024×1024) is present.

## Critical bug to fix

`supabase/config.toml` is **missing entries** for the two new functions. Every other function is listed there with `verify_jwt = false`, but `revenuecat-webhook` and `get-iap-config` are not.

- `revenuecat-webhook` **must** be `verify_jwt = false` — RevenueCat sends its own `Authorization` secret, not a Supabase JWT. Without this the webhook can be rejected at the gateway, so **entitlements never get written** and a user who pays would still show as "not subscribed."
- `get-iap-config` must be `verify_jwt = false` (it validates the JWT in code).

**Fix:** add both blocks to `supabase/config.toml`:

```text
[functions.revenuecat-webhook]
  verify_jwt = false
[functions.get-iap-config]
  verify_jwt = false
```

## Robustness fix (recommended)

After a successful StoreKit purchase, `NativePlanCards` calls `checkSubscription()` immediately, but the entitlement row is written by the **webhook** (a second or two later). So the card can briefly still say "Start trial" instead of "Your Plan."

**Fix:** in `handleBuy` (and `handleRestore`), after `purchaseTier` succeeds, poll `checkSubscription()` a few times (e.g. every ~1.5s, up to ~4 attempts) until `subscription.subscribed` flips true, then stop. This makes the UI feel instant without trusting client-only state.

## Why you don't see cards in the web preview (not a bug)

`NativePlanCards` only fetches StoreKit offers when `isNative()` is true. In the Lovable web preview `isNative()` is false, so the iOS cards never load — you'll see the Stripe web pricing instead. The cards only appear in the **real iOS build** (simulator or device) after `git pull` → `npx cap sync`.

## App Store Connect metadata, screenshot & icon (your open item)

You don't need new art for most of this:

1. **App Store icon** — already done. The 1024×1024 icon ships in the build; App Store Connect pulls it automatically.
2. **Subscription localization (per product)** — each of the 3 subscriptions needs a *Display Name* and *Description*. I'll generate ready-to-paste copy for Starter/Pro/Business so you can paste it into App Store Connect.
3. **Subscription review screenshot (the blocker)** — Apple requires **one screenshot per subscription** showing the purchase UI. This must come from the running app, so once the config fix is in:
   - `git pull`, `npx cap sync`, run on the iOS simulator, log in, open **Settings → Billing** (or let the trial expire) so the plan cards render.
   - Screenshot that screen (⌘S in Simulator) and upload the **same** screenshot to all three subscription products' "Review Information" field. That satisfies the requirement.
4. **App preview/marketing screenshots** — optional for IAP approval; if you want polished store screenshots later I can generate framed marketing images, but they aren't required to clear the 3.1.1 rejection.

## Things to confirm on the dashboards (I can't see them)

- **App Store Connect:** one Subscription Group, 3 auto-renewable products with IDs exactly `quicklinq_starter_monthly`, `quicklinq_pro_monthly`, `quicklinq_business_monthly`, each with a 14-day free-trial introductory offer, all in "Ready to Submit."
- **RevenueCat:** App uses bundle `app.quicklinq`; one **Offering** marked *current/default* with 3 **packages**, each package's attached product = the matching App Store product ID (RevenueCat `getOfferings().current` is what the app reads). One entitlement (e.g. `pro`).
- **RevenueCat → Webhook:** URL points to the `revenuecat-webhook` function, and the **Authorization header value equals `REVENUECAT_WEBHOOK_SECRET` exactly** (no `Bearer ` prefix — the code compares the raw header).

## Files to change

- `supabase/config.toml` — add the two `verify_jwt = false` blocks (critical).
- `src/components/billing/NativePlanCards.tsx` — add short post-purchase/restore polling of `checkSubscription()`.

After these, I'll also paste the subscription display-name/description copy for App Store Connect.
