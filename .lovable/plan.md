## What I found

All plan cards become **Unavailable** only when `getTierOffers()` returns no matching RevenueCat/App Store offers. In this codebase that can happen for three likely reasons:

1. **The current TestFlight app still has old native code/assets** and is not loading the latest IAP flow correctly.
2. **RevenueCat offerings are empty or not attached to the current offering** for the production iOS app key.
3. **The returned StoreKit product IDs do not exactly match the app mapping:**
   - `quicklinq_starter_monthly`
   - `quicklinq_pro_monthly`
   - `quicklinq_business_monthly`

The backend secret `REVENUECAT_IOS_PUBLIC_SDK_KEY` exists, but when I tested `get-iap-config` without an authenticated app session it correctly rejected the request with `No authorization header`. So the secret is present; this symptom points more to RevenueCat/App Store offerings/products not being returned or not matching, rather than the key being missing.

## Plan

1. Add temporary, safe IAP diagnostics in the app:
   - Log whether `get-iap-config` succeeds.
   - Log the RevenueCat current offering identifier.
   - Log every package/product ID returned by RevenueCat.
   - Log which IDs fail to map to QuickLinq tiers.

2. Improve the Settings billing UI error state:
   - Instead of silently showing every package as `Unavailable`, show a small diagnostic message when no iOS packages load.
   - Keep the plan cards visible, but make the reason clearer for TestFlight debugging.

3. Preserve production behavior:
   - Do not expose secret values.
   - Do not change Stripe/web billing.
   - Do not change product IDs unless the diagnostics prove the App Store/RevenueCat IDs differ.

4. After you run the TestFlight app once with this diagnostic build, use the logs to identify the exact cause:
   - No packages returned → fix RevenueCat offering/App Store product attachment.
   - Package IDs returned but names differ → update `appleProductId` mapping in `subscriptionTiers.ts`.
   - Config fetch/auth failure → fix app session/function auth path.

## What you should also check in RevenueCat/App Store Connect now

- The production iOS RevenueCat app uses the `appl_...` key you stored.
- The RevenueCat offering marked **Current** contains three packages.
- Each package points to App Store products with exactly these IDs:
  - `quicklinq_starter_monthly`
  - `quicklinq_pro_monthly`
  - `quicklinq_business_monthly`
- The App Store products are approved/ready for TestFlight and available for the app bundle ID.