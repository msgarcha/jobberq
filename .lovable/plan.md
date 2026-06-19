## What I verified

- The current repo now has RevenueCat installed and IAP files, but your screenshot is showing the older billing UI (`Manage your subscription on the web`). That means the TestFlight build you are viewing is not running the latest IAP billing component, or the native billing branch is falling back before cards render.
- Backend secrets exist: `REVENUECAT_IOS_PUBLIC_SDK_KEY` and `REVENUECAT_WEBHOOK_SECRET` are configured.
- Function config now includes `verify_jwt = false` for `get-iap-config` and `revenuecat-webhook`.
- The database currently has profiles and every profile has `trial_ends_at` populated.
- There are currently no Apple/RevenueCat entitlement rows yet, so no real iOS purchase has successfully reached the webhook/database.
- No recent logs exist for `get-iap-config` or `revenuecat-webhook`, which strongly suggests this TestFlight build has not called the new IAP path yet.

## Fix plan

1. **Make trial tracking explicit and reliable**
   - Update the signup profile trigger so every new user explicitly receives `trial_ends_at = now() + 14 days` instead of depending only on the column default.
   - Backfill any profile where the trial date is ever missing.
   - Keep Billing status based on `profiles.trial_ends_at` as the source of truth for app trial display.

2. **Return a clear subscription tier from the backend**
   - Update `check-subscription` to return `tier` directly for both Stripe/web subscriptions and Apple/RevenueCat subscriptions.
   - Keep returning `source` as `stripe`, `apple`, or `null` so the app knows where the subscription was purchased.
   - This avoids fragile mapping where Apple products are converted into Stripe product IDs just so the UI can infer the tier.

3. **Fix Settings → Billing to always show plan choices**
   - Under the current trial/subscription status, always show all three plan cards: Starter, Pro, Business.
   - On iOS native, those cards will use RevenueCat/App Store products and purchase through Apple IAP.
   - On web, those same cards will continue using Stripe checkout.
   - If the user is still in trial, they will still see the trial end date plus all three subscription choices.
   - If trial is expired or no paid subscription exists, the cards stay visible and actionable.

4. **Make native IAP cards impossible to disappear silently**
   - Change `NativePlanCards` to render all three cards from `SUBSCRIPTION_TIERS` even while App Store offers are loading.
   - Once RevenueCat returns offerings, replace static prices with localized App Store prices.
   - If a tier’s App Store product is missing from RevenueCat, keep the card visible but disable that one purchase button and show a concise unavailable state.
   - Remove the old “manage your subscription on the web” replacement screen from the trial/no-subscription iOS path.

5. **Prevent double billing while still showing correct UI**
   - If a user already has an active web/Stripe subscription, show their active plan and disable iOS purchase buttons with a clear “active on web” state.
   - If the user has no active subscription or is only on app trial, show iOS “Start 14-day Free Trial” buttons.

6. **Deploy and verify the functions**
   - Deploy `check-subscription`, `get-iap-config`, and `revenuecat-webhook` after changes.
   - Test `check-subscription` from the current logged-in session to confirm it returns trial date, trial state, source, and tier correctly.
   - Check edge logs after an iOS launch to confirm `get-iap-config` is actually being called.

7. **Final native build verification steps**
   - After implementation, you must pull the latest code locally and run:
     - `npm install` if dependencies changed
     - `npx cap sync ios`
     - rebuild/archive in Xcode
   - The App Store review screenshot should be captured from iOS Settings → Billing after the three cards appear.
   - Read the Capacitor mobile development blog post before rebuilding/publishing the native app.