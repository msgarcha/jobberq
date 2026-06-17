# Make QuickLinq pass Apple review — remaining code-level fixes

## What's already compliant (verified, no changes needed)
- **Account deletion (5.1.1(v))** — working in-app: Settings → Delete Account → `delete-account` edge function deletes the auth user (cascades data) + cleans solo-team tables. Reachable on native.
- **Sign in with Apple / third-party login (4.8)** — Login is **email/password only** (Apple + Google buttons already removed), so 4.8 does not apply.
- **In-app purchase / anti-steering (3.1.1)** — native subscription UI is read-only, no pricing, no buy/switch buttons, no external purchase URL. Web Stripe checkout untouched.
- **Permission usage strings** — camera, photo library, photo add, microphone, speech all present in `Info.plist`.

## Gaps to fix in code

### 1. iOS Privacy Manifest — `ios/App/App/PrivacyInfo.xcprivacy` (NEW)
Apple requires a privacy manifest. Add one declaring:
- `NSPrivacyTracking` = `false` (no cross-app ad tracking).
- `NSPrivacyTrackingDomains` = empty.
- `NSPrivacyCollectedDataTypes` matching the App Privacy label: email address, name, phone number, photos/videos, payment info (Stripe), device ID / push token — all linked to user, used for app functionality, not for tracking.
- `NSPrivacyAccessedAPITypes` with required-reason codes used by the Capacitor runtime: `UserDefaults` (CA92.1), file timestamp (C617.1), system boot time (35F9.1), disk space (E174.1).

Wire the file into the Xcode target by editing `ios/App/App.xcodeproj/project.pbxproj`:
- Add a `PBXFileReference` for `PrivacyInfo.xcprivacy`.
- Add a `PBXBuildFile` entry.
- Add it to the App group `children`.
- Add it to the `PBXResourcesBuildPhase` files list.

### 2. Export-compliance flag — `ios/App/App/Info.plist`
Add `ITSAppUsesNonExemptEncryption` = `false`. QuickLinq uses only standard HTTPS, so this is exempt; the flag removes the encryption question on every upload and prevents a processing stall.

### 3. In-app legal links — `src/pages/Settings.tsx`
Add a small "Legal" card (and/or footer links) with **Privacy Policy** and **Terms** opening the public pages (`/privacy`, `/terms` via `getPublicAppUrl()` on native so they open the live site). This satisfies the 5.1.1 expectation that the privacy policy is accessible inside the app, not just in store metadata.

## Verification
- Run the web build to confirm the React change in `Settings.tsx` compiles (the iOS-native files don't affect the web build).
- Re-grep to confirm no purchase-steering strings leaked into native branches.

## Still required from you (App Store Connect metadata — cannot be done in code)
These are the remaining non-code reasons apps like this get rejected; I'll list them so nothing surprises you:
- **Demo reviewer account** with pre-loaded sample quotes/invoices + review notes (Stripe test card `4242…`).
- **App Privacy "nutrition label"** questionnaire — fill it to match the manifest above (tracking = No).
- **Screenshots** — 6.7" iPhone + the 13" iPad set you generated.
- **Privacy Policy URL** live at `https://quicklinq.app/privacy`.

## Technical notes
- The privacy manifest data types/reasons are conservative and accurate for this app; adjust only if you later add analytics/ad SDKs.
- `ITSAppUsesNonExemptEncryption=false` is valid because the app only uses OS-provided HTTPS/TLS.
- No backend, auth, subscription, or Stripe logic changes — purely additive compliance metadata + a UI links card.
