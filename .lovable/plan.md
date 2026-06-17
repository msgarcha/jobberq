# Gate Stripe Connect onboarding off the native iOS app

On native, the Stripe Connect actions ("Connect with Stripe", "Complete Setup", "View Stripe Dashboard") call the `connect-stripe-account` edge function and then `window.location.href` to a Stripe-hosted onboarding/login URL. Inside the iOS WebView this redirect fails and surfaces the "Edge Function returned a non-2xx status code" error toast. We will stop offering Stripe onboarding on native and tell the user to finish it from a web browser, while keeping everything unchanged on web.

## Changes — `src/pages/Settings.tsx`, Payment Setup card (lines ~496–600)

All edits gate on the existing `isNative()` helper (already imported). Status checking (`checkStripeStatus` / Refresh Status) stays available everywhere — it's read-only and doesn't redirect.

1. **Not connected (web unchanged):**
   - Web: keep the "Connect with Stripe" button and description as-is.
   - Native: hide the "Connect with Stripe" button. Show a neutral, URL-free message instead, e.g. *"To set up payments, log into your account from a web browser and connect Stripe under Settings → Payment Setup."*

2. **Connected but onboarding incomplete (the screenshot case):**
   - Web: keep the "Complete Setup" button as-is.
   - Native: hide the "Complete Setup" button. Keep the existing "Setup Incomplete / Pending" status row. Replace the action with a message, e.g. *"Your payment setup isn't finished yet. Log into your account from a web browser to complete Stripe setup."* Keep "Refresh Status" so they can re-check after finishing on web.

3. **Connected & active:**
   - Web: unchanged ("View Stripe Dashboard", Refresh Status, Disconnect).
   - Native: hide the "View Stripe Dashboard" button (it also redirects to a Stripe URL). Keep Refresh Status and Disconnect (no external redirect). Optionally add small text: *"Manage your Stripe account from a web browser."*

No edge function, backend, or data changes — purely presentation gating. The `connect-stripe-account` function is untouched.

## Verification
- Confirm the web build compiles.
- Logic check: on native, no code path calls `handleConnectStripe` or the `create` / `login-link` actions, so the non-2xx redirect error can no longer be triggered from the app.
- Web behavior is byte-for-byte unchanged (all new branches are inside `isNative()` guards).
