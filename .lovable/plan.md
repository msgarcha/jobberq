# Make QuickLinq feel like a real native app (icon, splash, keyboard, Linq, settings)

## Root cause I confirmed (this is why it keeps "not working")

Your **source assets are already correct** — `assets/icon.png` and `assets/splash.png` are the teal QuickLinq mark, and the committed `ios/` folder already has the right teal AppIcon + Splash. The blue "X" you see in TestFlight build 5 is the **default Capacitor icon/splash**.

Why you get the default: your local recovery flow is

```text
rm -rf ios   →   npx cap add ios   →   build in Xcode
```

`npx cap add ios` scaffolds a **fresh** iOS project with Capacitor's default icon + gray splash. The step that turns `assets/icon.png` into the real iOS icons — `npx @capacitor/assets generate` — only runs in **Xcode Cloud CI** (`ci_scripts/ci_post_clone.sh`), never in a local Xcode build. And `@capacitor/assets` isn't even a saved dependency. So every local rebuild wipes the branding. That single gap explains both "no app icon" and "no splash."

The keyboard, Linq button, and Settings issues are real frontend bugs and are fixed in code (they'll show up in any build).

## What I'll change

### 1. Bullet-proof the app icon + splash (so deletion of `ios/` can't break it)
- Add `@capacitor/assets` to `devDependencies` (pinned), so it's deterministic and offline-safe.
- Add npm scripts so there is ONE reliable command:
  ```text
  npm run ios:rebuild   # = build + cap sync ios + capacitor-assets generate --ios
  ```
- Keep `assets/icon.png`, `assets/splash.png`, `assets/splash-dark.png` as the single source of truth (already correct teal brand). `capacitor-assets generate` regenerates every AppIcon size, the Splash imageset, AND sets the LaunchScreen storyboard background to teal — eliminating the gray flash.
- Update `APP_STORE_SUBMISSION.md` + `README.md` with the exact local flow and a warning: after `npx cap add ios` you MUST run `npm run ios:rebuild` (or just never delete `ios/`).

### 2. Branded animated loading splash (cherry on top + "splash ≥1s while data loads")
- Inject a teal full-screen splash with an animated QuickLinq logo directly into `index.html` (`#app-splash`) so it paints instantly with zero white flash, before React even loads.
- Add a small fade-out controller in `src/main.tsx`: keep it visible a **minimum of 1000 ms**, then fade out once React has mounted — smooth hand-off from the native splash to the web splash to the app.
- Animation: gentle logo pulse/draw + fade, using CSS only (no library), brand teal `#1a3d44` background matching the native splash so the transition is seamless.

### 3. Fix keyboard pushing the input above the header (critical)
- In `src/lib/native/bootstrap.ts`: disable Capacitor's buggy native scroll-assist with `Keyboard.setScroll({ isDisabled: true })` while keeping `resize: native`. That auto-scroll is what shoves the focused field above the sticky `TopBar` and under the status bar.
- Add a focus handler that, when an `input`/`textarea`/`select` gains focus on native, scrolls it to the center of the `.app-scroll` container (`scrollIntoView({ block: 'center' })`) after the keyboard animates in — so the active field is always visible above the keyboard and never above the header.
- Add `scroll-padding` to the `.app-scroll` container so scrolled fields keep clearance below the header.

### 4. Move "Ask Linq" back to a floating bottom-right button with a proper window
- `LinqLauncher.tsx`: remove the `if (isMobile) return null` guard so the floating round button shows on mobile again, anchored bottom-right above the bottom nav (respecting `safe-area-inset-bottom`), using the brand mark (not a generic sparkle where possible).
- `TopBar.tsx`: remove the header Sparkle/Linq button on mobile (kills the duplicate + the popup-above-header problem).
- `AssistantSheet.tsx`: it already renders as a fixed bottom sheet (`bottom-0 h-[85dvh]`) on mobile and a docked window on desktop. I'll add top safe-area padding + a max height that never overlaps the status bar, so it's fully visible and "window sized."

### 5. Settings: clean horizontal tab bar + smooth controls, clear boundaries
- Wrap the `TabsList` in a bordered, rounded, single-row container that scrolls **horizontally** with momentum + scroll-snap, with a clear boundary (the current version visually collides with the floating "Save Changes" button).
- Move "Save Changes" out of the floating overlap into a clean sticky action row beneath the tab bar so it never sits on top of the tabs.
- Verify the `Slider` and `Switch` controls render with proper touch sizing and smooth interaction on mobile.

## Proof I'll provide before declaring done
1. `npm run build` succeeds (no errors) and `npm install` is clean — required for your Apple submission.
2. Run `npx capacitor-assets generate --ios` in the sandbox and show the generated `AppIcon-512@2x.png` + Splash imageset rendered = teal QuickLinq mark (not blue X).
3. Browser screenshots at mobile viewport showing: (a) the animated branded loading splash, (b) the floating bottom-right Linq button, (c) the Settings horizontal tab bar with clear boundary, (d) the Linq window fully visible below the header.
4. Note clearly which proof is device-only (the on-device icon/splash appears after YOU run `npm run ios:rebuild` — I'll give the exact commands).

## Your one-time local commands after I implement (I'll restate these at the end)
```text
git pull
npm install
npm run ios:rebuild      # build + cap sync + generate icon/splash
npx cap open ios         # then Archive → submit
```
If Xcode shows "Missing package product 'CapApp-SPM'": File → Packages → Reset Package Caches → Resolve → Clean (⇧⌘K) → build.

## Guardrails
- No Vite/Vitest upgrades, no `npm audit fix --force` (stays on pinned Vite 5 / Vitest 3).
- No backend/business-logic changes — frontend, native config, and build tooling only.
