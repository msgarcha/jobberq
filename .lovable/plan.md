# Native (Capacitor) UX Fix: Top Bar + Landing Skip

Two related issues only happen inside the iOS Capacitor wrapper, not in the browser:

1. The iOS status bar (clock / notch area) sits **on top of** the TopBar, hiding the QuickLinq logo and right-side icons.
2. Unauthenticated users land on the marketing `/landing` page, which doesn't make sense inside an installed app — they should go straight to Login.

Both fixes are scoped to native only; browser behavior stays identical.

## Changes

### 1. Detect native + add safe-area padding to mobile chrome
- `index.html`: change viewport meta to include `viewport-fit=cover` so iOS exposes `env(safe-area-inset-*)` to CSS.
- `src/index.css`: add a small utility class `.native-safe-top` that applies `padding-top: env(safe-area-inset-top)` and `.native-safe-bottom` for `env(safe-area-inset-bottom)`.
- `src/components/layout/TopBar.tsx`: in the mobile branch, when `isNative()` is true, wrap header with extra top padding (use the safe-area utility) and bump height so logo + bell + avatar are no longer clipped by the notch / status bar.
- `src/components/layout/MobileBottomNav.tsx`: add the safe-area-bottom utility so the home indicator on iPhones doesn't overlap the bottom nav (light touch — only if not already handled).
- `src/components/layout/DashboardLayout.tsx`: increase mobile `<main>` top padding slightly when native so content doesn't slide under the now-taller bar.

### 2. Skip the marketing landing page inside the native app
- `src/components/ProtectedRoute.tsx`: when not authenticated, redirect to `/login` if `isNative()` is true, otherwise keep current `/landing` redirect.
- `src/App.tsx`: leave `/landing` route in place (web only). No route removal needed because native users will simply never be sent there.

### Optional polish (Capacitor config)
- Confirm `capacitor.config.ts` `StatusBar` plugin already sets `style: 'DARK'` and a brand background color (it does). No change required, but the safe-area CSS approach above is what actually fixes the visual overlap when `contentInset: 'always'` is used.

## Files touched
- `index.html` (viewport meta)
- `src/index.css` (safe-area utilities)
- `src/components/layout/TopBar.tsx`
- `src/components/layout/MobileBottomNav.tsx`
- `src/components/layout/DashboardLayout.tsx`
- `src/components/ProtectedRoute.tsx`

## Out of scope
- No backend / RLS / edge function changes.
- No changes to the marketing site itself.
- No changes to Android-specific behavior beyond what `env(safe-area-inset-*)` already provides.

After approval I'll implement and you can test by running `npx cap sync` then re-launching the iOS app.
