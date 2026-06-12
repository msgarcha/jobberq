# Fix npm audit vulnerabilities & the broken Vite upgrade

## What's actually wrong

1. **All 6 high-severity vulnerabilities come from one dev dependency: `@capacitor/assets`.**
   Its dependency chain (`@trapezedev/project` → `replace` → `minimatch`, plus `tar`, plus a nested old `@capacitor/cli`, plus `xcode` → `uuid`) carries the advisories. npm reports **"No fix available"** because upstream hasn't patched them. This package is **build-time-only** (icon/splash generation) and is **never bundled into the shipped app**, so the runtime risk is effectively zero — but the noise is annoying and it's easy to remove.

2. **`vite@8.0.16` is a side effect of `npm audit fix --force`.**
   That command force-upgraded Vite from the supported **v5** to **v8**, which breaks the peer requirements of `lovable-tagger` (needs vite `<8`) and `@vitejs/plugin-react-swc` (needs vite `^4–^7`). The repo's `package.json` still correctly pins `vite ^5.4.19`; only your local clone was mutated. A clean reinstall from the repo restores it.

## The plan

### Code changes (in this repo)
1. **Remove `@capacitor/assets` from `devDependencies`** in `package.json`. This eliminates the entire vulnerable chain — all 6 highs and the moderate `uuid` finding go away, since `uuid`/`xcode`/`tar`/`replace` were only pulled in by this package.
2. **Remove the icon-generation step from `ci_scripts/ci_post_clone.sh`** (the `npx @capacitor/assets generate ...` line), since the package will no longer exist. The script keeps `npm ci` → `npm run build` → `npx cap sync ios`.
3. **Keep the already-generated `assets/icon.png`** (1024×1024, opaque cream + teal logo). Modern Xcode uses a single 1024pt icon for the whole AppIcon set, so no generator is needed.

### One-time Xcode step (you do this locally, documented in the plan output)
- Set the app icon by replacing the single 1024 file in the native project:
  `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` with `assets/icon.png`
  (or drag `assets/icon.png` onto the AppIcon "1024pt" slot in Xcode's asset catalog). `cap sync` does not overwrite this afterward.
- (Optional) For a branded launch screen, drop `assets/splash.png` into the `Splash.imageset` in the same asset catalog. Otherwise the splash shows the dark-teal background already set in `capacitor.config.ts`.

### Local cleanup to undo the forced Vite 8 upgrade (you run these)
```bash
git pull                       # restores package.json with vite ^5.4.19
git checkout -- package-lock.json   # discard the forced lockfile (if modified)
rm -rf node_modules package-lock.json
npm install                    # clean reinstall on vite 5
npm audit                      # should now report 0 vulnerabilities
```
Do **not** run `npm audit fix --force` again — it re-introduces the Vite 8 break.

## Expected result
- `npm audit` reports **0 vulnerabilities** (the only findings were from the removed `@capacitor/assets`).
- Vite is back on the supported v5, so `npm install`, `npm run build`, and `npx cap sync ios` all succeed.
- The app icon is your uploaded logo, set via the single 1024px image — no generator dependency required.

## Technical notes
- Removing `@capacitor/assets` does not affect the runtime app or `@capacitor/cli@8.4.0` (the top-level CLI is current and unaffected; only the nested old CLI inside `@capacitor/assets` was flagged).
- If you later want automated multi-size generation back, it can be re-added behind an opt-in step, but it's unnecessary given Xcode's single-icon support.
