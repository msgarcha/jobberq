# Stop the npm audit loop — your build break is self-inflicted

## What's actually happening

Every time you run `npm audit fix --force`, npm upgrades your build tools to **major new versions that are incompatible with this project**:

- `vite` 5 → **8** (this project must stay on Vite 5)
- `vitest` 3 → **4**
- `lovable-tagger` → a version that pulls those in

That is why the build fails afterward. The audit "fix" is the cause of the breakage, not a cure.

## The remaining vulnerabilities do NOT matter for your app

The 6 high warnings left are all in **`esbuild` / `vite` / `vitest` / `lovable-tagger`**. Read the advisory text yourself:

- "esbuild enables any website to send requests to the **development server**"
- "arbitrary file read when running the **development server** on Windows"

These only affect a **local dev server running on your machine**. They are:

- **Dev-only dependencies** — they are never installed or executed in production.
- **Not shipped in your iOS app.** Your app bundles the static `dist/` output (plain HTML/CSS/JS). esbuild/vite/vitest are not part of that bundle.
- **Irrelevant to Apple.** App Store review does not run `npm audit`. There is nothing to remediate for submission.

There is no Vite-5-compatible patched esbuild that clears these, so chasing a "0 vulnerabilities" result forces you onto Vite 8 and breaks everything. This is a known, accepted trade-off for every Lovable/Vite 5 project.

## The plan

### 1. Recover your local checkout (run on your Mac)
Your `package.json` / `package-lock.json` are now corrupted by the forced upgrades. Restore the committed, working versions:

```text
git checkout -- package.json package-lock.json
rm -rf node_modules
npm install
npm run build
```

This puts you back on Vite 5 + Vitest 3, and the build will succeed.

### 2. Never run `npm audit fix --force` again on this project
Use this instead when you want to *see* findings without changing anything:

```text
npm audit            # read-only, informational
```

Ignore the esbuild/vite/vitest entries — they are dev-only and expected.

### 3. (Optional, on my side) Document this so it stops recurring
I'll add a short "Dependency & npm audit policy" note to `README.md` (and `APP_STORE_SUBMISSION.md`) stating:
- Pinned to Vite 5 / Vitest 3 on purpose.
- The remaining audit warnings are dev-tooling only and must not be "fixed" with `--force`.
- Correct recovery steps if a forced upgrade happens again.

I'll also save this as a project memory rule so future changes never re-trigger the upgrade.

### 4. Full clean rebuild path for the iOS submission
Once package files are restored:

```text
git pull
rm -rf node_modules ios
npm install
npm run build
npx cap add ios      # only if ios/ was deleted; otherwise skip
npx cap sync ios
npx cap open ios
```

## What I will NOT do
- I will **not** upgrade Vite, Vitest, esbuild, or lovable-tagger to satisfy the audit — that breaks the build.
- No app feature or business-logic changes; this is purely toolchain hygiene + documentation.

## Verification
- Confirm `package.json` still pins `vite ^5` and `vitest ^3`.
- Run `npm install` and `npm run build` in the sandbox to prove a clean build.
- Confirm `npx cap sync ios` resolves all plugins.
