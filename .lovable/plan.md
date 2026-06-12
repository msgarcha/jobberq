# iOS App Store Compliance — 3 Changes

Three code changes so QuickLinq passes Apple review on first submission.

---

## Change 1 — Hide QuickLinq subscription purchasing on iOS (Guideline 3.1.1)

Apple requires its own In‑App Purchase for selling a digital subscription inside an iOS app. The cleanest way to pass is to **remove the purchase entry points on native iOS** while keeping everything on the web/Android. Client invoice/quote payments (Stripe Connect) are untouched — those are real‑world services and are allowed.

Detection: use existing `isNative()` from `src/lib/native/platform.ts`.

**`src/pages/Settings.tsx` (Billing tab)**
- Keep the **current plan status card** (read‑only: plan name, trial/renewal date, Refresh button) so users still see what they have.
- On native: hide the pricing cards grid (the Subscribe / Start Free Trial / Switch Plan buttons) and the "Manage Subscription" button.
- Replace with a short, non‑actionable note: "To change your plan, sign in at quicklinq.app on the web." No tappable link to an external purchase page (Apple rejects those too).

**`src/pages/TrialExpired.tsx`**
- On native: hide the "Choose a plan" button. Show the same informational note + keep "Sign out".
- On web/Android: unchanged.

No backend changes; purely conditional rendering.

---

## Change 2 — Add Sign in with Apple (Guideline 4.8)

Enable managed Apple auth and add a button to the auth screen.

- Enable the provider via the Configure Social Login tool (managed Apple — no Apple Developer keys needed). This generates `src/integrations/lovable/` and installs the auth package (do not hand‑edit that folder).
- **`src/pages/Login.tsx`**: add a "Continue with Apple" button (with a divider "or") on both the Log In and Sign Up tabs, calling `lovable.auth.signInWithOAuth("apple", { redirect_uri: window.location.origin })`, handling `result.error` / `result.redirected`, then navigating to `redirectTo` on success.
- Email/password stays as the default. (Google is not currently present, so nothing to hide.)

---

## Change 3 — In‑app account deletion (Guideline 5.1.1(v))

Mandatory: users must be able to permanently delete their account from inside the app.

**New edge function `supabase/functions/delete-account/index.ts`**
- `verify_jwt = false` in `config.toml`; validates the caller's JWT manually (same pattern as other functions).
- Uses the service role to: delete the user's app data scoped to them/their team, then call `auth.admin.deleteUser(user.id)`.
- Returns success/error JSON with CORS headers.

**`src/pages/Settings.tsx` — new "Danger Zone" section** (bottom of Company tab)
- Red‑bordered card with "Delete Account" button.
- Opens an `AlertDialog` requiring the user to type `DELETE` to confirm.
- On confirm: invoke `delete-account`, then `signOut()` and redirect to `/login` with a toast.
- Visible on all platforms (also satisfies Android/Play and is required on iOS).

---

## Technical details

- **Platform gating:** `import { isNative } from "@/lib/native/platform"` — already used elsewhere; wrap purchase UI in `!isNative()`.
- **Apple auth:** managed mode means no `.p8`/Services ID setup required now; for custom branding on the Apple sheet later, BYOC can be configured in the backend dashboard.
- **delete-account function:** validates `Authorization` bearer token via `supabase.auth.getUser(token)`; deletes rows the user owns and team data only if they are the sole owner, then removes the auth user. Cascading FKs handle the rest. Will confirm exact tables to purge against the schema during build.
- **No changes** to Stripe Connect client‑payment flows, invoices, quotes, or reminders.

## Out of scope
- Native StoreKit IAP integration (not needed with the hide‑on‑iOS approach).
- Xcode capabilities, Info.plist strings, screenshots, store listing — covered in `APP_STORE_SUBMISSION.md`.
