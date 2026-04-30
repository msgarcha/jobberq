# Plan: Publish QuickLinq to iOS App Store via Capacitor

Wrap the existing web app in a native iOS shell, with **push notifications** and **camera** support, ready for App Store submission.

## What I'll do in Lovable

### 1. Install Capacitor + native plugins
Add to `package.json`:
- `@capacitor/core`, `@capacitor/ios`, `@capacitor/android`
- `@capacitor/cli` (dev)
- `@capacitor/push-notifications`
- `@capacitor/camera`
- `@capacitor/splash-screen`, `@capacitor/status-bar`, `@capacitor/haptics` (small UX wins)

### 2. Create `capacitor.config.ts`
- `appId: "app.quicklinq.ios"`
- `appName: "QuickLinq"`
- **Bundled mode** (no `server.url`) — required for App Store
- iOS background color matching brand (cream)
- Splash screen + status bar config (dark teal status bar to match brand)
- Push + Camera plugin permission strings (Info.plist usage descriptions)

### 3. Add a tiny native-features layer
Two thin wrappers under `src/lib/native/`:
- `pushNotifications.ts` — register device, request permission, store APNs token in a new `device_tokens` table (per user) so backend can target the device
- `camera.ts` — `takePhoto()` / `pickFromLibrary()` returning a base64 image, usable from job/client screens later

Web fallbacks included so nothing breaks in the browser.

### 4. Backend: device tokens table
Migration to create `public.device_tokens`:
- `id`, `user_id`, `team_id`, `token`, `platform` ('ios'|'android'|'web'), `created_at`, `last_seen_at`
- RLS: users can insert/update/delete only their own tokens
- Unique on `(user_id, token)`

(Actual sending of pushes via APNs is a separate later step — needs your APNs key from Apple. This plan just captures tokens so you're ready.)

### 5. Mobile shell verification
- Confirm safe-area insets work in iOS WebView (already partly handled from prior mobile fix)
- Make sure `MobileBottomNav` respects iOS home-indicator inset
- Ensure existing `manifest.json` icons + splash assets are reused as iOS app icon / launch screen sources

### 6. README section
Add a "Building for iOS" section with the exact Mac commands you'll run.

## What you'll do on your Mac (one time)

Prereqs: Xcode (latest), Apple Developer membership ($99/yr), CocoaPods (`sudo gem install cocoapods`), Node.

After exporting to your GitHub and `git pull`:

```sh
npm install
npx cap add ios
npx cap update ios
npm run build
npx cap sync ios
npx cap open ios
```

In Xcode:
- **Signing & Capabilities** → pick your Team
- Bundle ID will already be `app.quicklinq.ios`
- Add **Push Notifications** capability + **Background Modes → Remote notifications**
- Drop in your App Icon set (1024×1024 marketing icon required) and Launch Screen
- Set Version `1.0.0`, Build `1`
- Run on Simulator, then on a real iPhone (push only works on real device)

## App Store submission

1. **App Store Connect** → My Apps → **+** → New App
   - Bundle ID: `app.quicklinq.ios`
   - Name: QuickLinq
   - Primary language, SKU (any unique string)
2. Fill listing: subtitle, description, keywords, support URL (`https://quicklinq.ca`), marketing URL, **Privacy Policy URL** (mandatory)
3. **App Privacy** questionnaire — declare:
   - Email + name (auth)
   - Payment info (handled by Stripe — declare "Third party")
   - Photos (camera)
   - Device ID / push token
4. Screenshots: 6.7" iPhone (1290×2796) required, 6.5" recommended. ~5 screenshots showing dashboard, quote, invoice, payment, schedule.
5. **Xcode → Product → Archive → Distribute App → App Store Connect → Upload**
6. Back in App Store Connect: attach build, answer Export Compliance (typically "uses standard encryption only — exempt"), submit for review.

Review usually takes 24–48h. Common rejection reasons to avoid:
- Missing Privacy Policy URL
- Camera/Push usage strings not descriptive enough (I'll write good ones)
- Web-view-only apps without enough native value — push + camera + Stripe payments give us a solid case here

## Things only you can do (I cannot)

- Apple Developer enrollment + APNs Auth Key (`.p8`) generation
- Anything inside Xcode (signing, archiving, uploading)
- App Store Connect listing, screenshots, submission

## Technical details

- `capacitor.config.ts` will sit at project root (Vite-friendly, TypeScript)
- iOS Info.plist usage strings injected via `capacitor.config.ts` `ios.infoPlist`:
  - `NSCameraUsageDescription`: "QuickLinq uses the camera to attach photos to jobs and quotes."
  - `NSPhotoLibraryUsageDescription`: "QuickLinq accesses your photo library to attach images to jobs and quotes."
- Push token registration runs only when `Capacitor.isNativePlatform()` is true — web build is unaffected
- `device_tokens` RLS mirrors existing multi-tenant pattern (scoped by `user_id`, `team_id` from `get_user_team_id(auth.uid())`)
- No changes to existing auth, Stripe, or RLS — the wrapper is additive

After approval, click **Update** in Lovable's Publish dialog whenever you ship a JS-only change (the native shell loads bundled assets, so each native update requires a new Xcode archive + App Store submission). For OTA-style web updates without resubmission, we'd need to add Capacitor Live Updates later — not included here.