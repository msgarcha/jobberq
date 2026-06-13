# Native App Polish: Icon, Splash, Login & Jobber-style Navigation

Four focused changes so QuickLinq looks and feels like a real native app — and beats Jobber on polish.

## 1. App icon + splash actually generate on iOS (fixes the Capacitor default icon)

**Root cause:** `@capacitor/assets` is not installed and nothing ever turns `assets/icon.png` / `assets/splash.png` into the native iOS icon set and launch screen. So iOS ships the placeholder Capacitor icon and a plain splash.

**Fix:**
- Add `@capacitor/assets` as a dev dependency.
- Update `ci_scripts/ci_post_clone.sh` to regenerate icons + splash on every Xcode Cloud build, right after `npx cap sync ios`:
  ```sh
  echo "▸ Generating app icons + splash from assets/"
  npx capacitor-assets generate --ios
  ```
  This reads `assets/icon.png` (cream bg, teal logo) and `assets/splash.png` / `assets/splash-dark.png` (teal bg, cream logo) and writes the full iOS icon set + launch storyboard.
- Keep the existing `assets/` source files as-is (already the correct layout the tool expects).

**Manual command for the local Mac** (documented in the closing message): after `git pull` → `npm install` → `npx cap sync ios` → `npx capacitor-assets generate --ios`, then rebuild in Xcode with a bumped build number.

## 2. Splash screen shown on launch before login

The splash config in `capacitor.config.ts` is already correct (`backgroundColor: #1a3d44`, no spinner) and `initNative()` hides it after mount. Once step 1 generates the real launch screen from `assets/splash.png`, the teal screen with the cream QuickLinq mark appears on tap, then transitions into the app/login. Minor tweak: raise `launchShowDuration` slightly (1200 → 1500ms) so the splash doesn't flash away before the web view paints.

## 3. Login dialog centered, not scrollable

In `src/pages/Login.tsx`, the auth shell is currently top-aligned with page padding, so the card sits high and the page scrolls.

- Change `authShellClassName` to a centered flex frame:
  `min-h-[100svh] bg-background flex items-center justify-center px-4 py-6 overflow-hidden`
- The card stays vertically and horizontally centered. On very short screens (keyboard open) it falls back to `overflow-y-auto` so fields remain reachable, but by default there is no scroll.
- Applies to all three states (login, reset, OTP) since they share the shell class.

## 4. Clean top bar + Jobber-style bottom bar

### Top bar (`src/components/layout/TopBar.tsx`, mobile)
- Center the page title (Jobber-style): three-zone layout — back button (or logo on Home) on the left, centered title, actions on the right.
- Add an **AI sparkle button** (the `Sparkles` "Ask Linq" assistant) on the right, matching Jobber's top-right sparkle. Keep notifications bell + avatar.
- Desktop top bar unchanged in function; search stays there (mobile relies on the assistant/search flow, per your choice).

### Bottom bar (`src/components/layout/MobileBottomNav.tsx`)
Keep the current tab set (**Home, Clients, [+], Jobs, More**) and the **center-docked + FAB** — only refine the styling to look cleaner and more native than Jobber:
- Add an **active-tab indicator**: a short rounded accent bar at the top edge of the active tab (the dark tick Jobber shows above the active item), in brand teal.
- Tighten the bar: consistent icon size, slightly smaller labels, even spacing, crisp top border + subtle blur, correct `safe-area-bottom` padding so it sits flush on notched devices.
- Keep the FAB's open/close rotate-to-X animation and the staggered create menu; ensure the FAB notch reads cleanly against the refined bar.

## Technical notes
- No business-logic, data, or auth-flow changes — presentation, native config, and a CI step only.
- All native calls remain guarded by `isNative()`; web preview behavior is unchanged.
- After merge, the user must pull and run the cap sync + `capacitor-assets generate --ios` commands, then archive with a bumped build number for the icon/splash to take effect (these are native build artifacts, not visible in the Lovable web preview).

## Files changed
- `package.json` — add `@capacitor/assets` dev dependency
- `ci_scripts/ci_post_clone.sh` — add icon/splash generation step
- `capacitor.config.ts` — bump `launchShowDuration`
- `src/pages/Login.tsx` — center the auth shell, prevent page scroll
- `src/components/layout/TopBar.tsx` — centered title + AI sparkle (mobile)
- `src/components/layout/MobileBottomNav.tsx` — active-tab indicator + cleaner bar styling
