# QuickLinq iOS Polish & Bug-Fix Pass (App Store ready)

A senior-iOS review of every screenshot. Each issue below has a confirmed root cause from code review, not a guess.

## The 8 confirmed problems

### 1. App icon is still the Capacitor default (blue X)
- `assets/icon.png` IS the correct QuickLinq mark, but the committed iOS catalog `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` is the stock Capacitor blue-X-on-grid icon. It only gets replaced if the user remembers to run `npx @capacitor/assets generate` — which they aren't.
- **Fix:** Generate the full branded icon set from `assets/icon.png` now, in the project, and commit the real PNGs into the iOS asset catalog so the branding is baked in regardless of CI.

### 2. Splash screen is not QuickLinq
- Same root cause: committed `Splash.imageset` PNGs are Capacitor stock. `assets/splash.png` / `assets/splash-dark.png` are the correct teal QuickLinq splash.
- **Fix:** Generate and commit the branded splash images into the iOS catalog, and verify `capacitor.config.ts` splash background matches (`#1a3d44`).

### 3. Keyboard pushes the text field above the top header (invisible)
- No `@capacitor/keyboard` plugin is installed, and the status bar overlays the WebView. When a lower input is focused, iOS shoves the whole WebView up and the sticky header scrolls out of view.
- **Fix:** Add `@capacitor/keyboard` (wired into SPM `Package.swift` + Info.plist), configure resize mode so the WebView shrinks instead of scrolling, and ensure focused inputs scroll into view under the fixed header.

### 4. "Ask Linq" popup opens above the top header / not visible
- Same keyboard interaction plus the `AssistantSheet` is mounted in three places (TopBar, MobileBottomNav, LinqLauncher). On mobile the sheet uses `bottom-0 h-[85vh]`; when the keyboard opens it gets lifted off-screen at the top.
- **Fix:** Switch the sheet to dynamic-viewport height, keep it pinned correctly when the keyboard opens, and consolidate to a single mount/entry point on mobile (the top-bar sparkle).

### 5. Voice fails with "SpeechRecognition plugin is not implemented on iOS"
- `@capacitor-community/speech-recognition` is in `package.json` but is NOT in the iOS `Package.swift`, so the native call throws and shows a red error toast on the home screen.
- **Fix:** Wire the speech-recognition plugin into SPM properly if it supports SPM; otherwise make `isVoiceSupported()` return false on native so voice degrades gracefully (no red error, mic entry hidden) instead of crashing. Either way: no error toast on launch.

### 6. Create Invoice / Quote / Job action buttons float in the middle of the screen
- In `InvoiceForm`, `QuoteForm`, `JobForm` the action row uses `sticky bottom-20`, which parks Cancel / Save / Create floating over the form content (visible in screenshots 3 & 4) so you can't read the fields behind them.
- **Fix:** Replace the broken `sticky bottom-20` with a normal inline footer at the end of the scrollable form (with proper bottom padding to clear the tab bar), matching native form behavior — buttons sit at the bottom of the content, not floating.

### 7. Quote/Invoice link in client emails is not clickable when sent from the app
- `EmailDocumentDialog`, `QuoteDetail`, `InvoiceDetail`, `PricingForms` build links from `window.location.origin`. Inside the native app that is `capacitor://localhost`, so the client receives a dead `capacitor://localhost/quote/view/...` link.
- **Fix:** Add a `getPublicAppUrl()` helper that returns the real web origin (`https://quicklinq.app`) when running native, and use it everywhere a public/shareable link is generated.

### 8. General "doesn't feel like a polished iOS app" polish
- Review each screenshot for novice spacing/hierarchy issues: top-bar alignment and safe-area padding, consistent card spacing, form field rhythm, button sizing/contrast (the greyed-out "Create Job" disabled state), notification dropdown width on small screens, and tap-target sizes (≥44px).
- **Fix:** Tighten spacing tokens and layout on the home dashboard, forms, and top bar so everything reads as intentionally designed.

## Verification before I call it done
1. `npm install` — clean, no errors.
2. `npm run build` — succeeds (stays on Vite 5; no forced upgrades).
3. `npx cap sync ios` — all plugins resolve in `Package.swift`.
4. Confirm the committed iOS AppIcon and Splash PNGs are the QuickLinq branding (visually inspect the generated files).
5. Re-check each screenshot scenario in code: form footers inline, links use public URL, no voice error path on native, keyboard/header behavior corrected.

## Technical notes
- Icon/splash generation runs via `@capacitor/assets` in the sandbox (cross-platform, uses sharp) and the output PNGs are committed; CI keeps the generate step as a safety net.
- Keyboard + speech-recognition both require matching entries in `ios/App/CapApp-SPM/Package.swift` and the app target; I will keep that file consistent with `package.json` and re-run `cap sync` to validate.
- `getPublicAppUrl()` will live in `src/lib/native/platform.ts` and default to `https://quicklinq.app` on native, `window.location.origin` on web.
- No backend/business-logic changes beyond the URL helper; this is presentation + native-shell work.

## Files affected (expected)
- `ios/App/App/Assets.xcassets/AppIcon.appiconset/*` and `Splash.imageset/*` (regenerated PNGs + Contents.json)
- `package.json`, `ios/App/CapApp-SPM/Package.swift`, `ios/App/App/Info.plist` (keyboard plugin)
- `capacitor.config.ts` (keyboard + splash config)
- `src/lib/native/platform.ts` (public URL helper), `src/lib/ai/voice.ts` (graceful voice degradation)
- `src/components/ai/AssistantSheet.tsx`, `src/components/ai/LinqLauncher.tsx`, `src/components/layout/TopBar.tsx`, `src/components/layout/MobileBottomNav.tsx`
- `src/pages/InvoiceForm.tsx`, `src/pages/QuoteForm.tsx`, `src/pages/JobForm.tsx`
- `src/components/EmailDocumentDialog.tsx`, `src/pages/QuoteDetail.tsx`, `src/pages/InvoiceDetail.tsx`, `src/pages/PricingForms.tsx`, `src/pages/PricingFormBuilder.tsx`
- `src/index.css` (keyboard/safe-area + spacing polish)
