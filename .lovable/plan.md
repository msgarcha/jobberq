# Make QuickLinq Feel Like a Native App

## What's wrong (diagnosis)

Your screenshots are from the real iOS app (the Uber Eats Dynamic Island confirms native). The "feels like a website" problems all trace back to **missing native configuration** — the `@capacitor/status-bar` and `@capacitor/splash-screen` plugins are installed but **never initialized in code**, and the web layer is configured like a normal scrolling webpage:

1. **Pinch-zoom is enabled** — `index.html` viewport tag has no `maximum-scale`/`user-scalable=no`, so the whole UI zooms like a webpage (the "fake zoom" feel).
2. **Rubber-band / bounce scroll** — nothing sets `overscroll-behavior`, and the layout is `min-h-screen` (the whole document scrolls) instead of a fixed shell where only the content area scrolls. This is the "website scroll feel."
3. **Big white gap under the status bar** — `capacitor.config.ts` uses `ios.contentInset: 'always'` AND the header adds `safe-area-top` padding, so the safe-area gets counted twice. The status bar is also never told to overlay the web view, and its text style is wrong for the cream background.
4. **Bars not behaving like native chrome** — top/bottom bars are `sticky`/`fixed` inside a scrolling document, so they drift instead of being a locked app frame.

## The fix

### 1. `index.html` — lock the viewport
Update the viewport meta to prevent pinch-zoom and double-tap zoom:
```
width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover
```

### 2. `src/index.css` — native scroll behavior
- Add `overscroll-behavior: none` and `height: 100%` / fixed positioning rules to `html, body` so the document itself never bounces or scrolls.
- Keep momentum scrolling only inside the content area via `-webkit-overflow-scrolling: touch` and `overscroll-behavior: contain` on the scroll container.
- Disable text-size auto-adjust and callout/selection where it makes the app feel webby.

### 3. New `src/lib/native/bootstrap.ts` — initialize native chrome
A guarded `initNative()` (no-ops on web) that on native:
- `StatusBar.setOverlaysWebView({ overlay: true })` so content draws edge-to-edge and safe-area insets work correctly.
- `StatusBar.setStyle(...)` set to dark text (visible on the cream/white top bar).
- `SplashScreen.hide()` after the app mounts.

Call `initNative()` from `src/main.tsx`.

### 4. `capacitor.config.ts` — stop double-counting the safe area
- Change `ios.contentInset` from `'always'` to `'never'` (we now rely on CSS safe-area insets + the overlay status bar).
- Align the `StatusBar` plugin style so the status bar matches the light top bar instead of a dark fill.

### 5. `src/components/layout/DashboardLayout.tsx` — fixed app shell
- Make the shell a fixed-height frame (`h-[100dvh]`, `overflow-hidden`) so the top bar and bottom nav are a locked frame and **only** the `main` element scrolls. This removes the whole-page scroll/bounce and keeps the header and bottom nav rock-solid like a real app.

The `TopBar` (`safe-area-top`) and `MobileBottomNav` (`safe-area-bottom`) already read safe-area insets; once the status bar overlays correctly and `contentInset` is `never`, the oversized top gap and the bottom spacing will size correctly to the device.

## After the change (you'll need to do this on your Mac)
Because the native iOS project lives on your Mac, after pulling these changes run:
```
npm install
npx cap sync ios
```
then rebuild/archive in Xcode (bump Build number) and run on device to confirm: no pinch-zoom, no rubber-band bounce, status bar flush with the top bar, bottom bar pinned.

## Technical notes
- All native calls are wrapped in `isNative()` guards so the browser preview and PWA are unaffected.
- No business logic, data, or backend changes — this is purely shell/presentation + native config.
- `user-scalable=no` is intentional for an app shell; it does not affect your public web pages' usability since they're the same build but the app-store binary is the target here.
