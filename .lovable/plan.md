## What’s actually broken

The failure is in the native iOS shell, not the UI changes.

- `package.json` includes the Capacitor plugins your app uses (`@capacitor/camera`, `@capacitor/haptics`, `@capacitor/push-notifications`, `@capacitor/splash-screen`, `@capacitor/status-bar`, `@capacitor-community/text-to-speech`).
- `src/main.tsx` and `src/lib/native/bootstrap.ts` initialize native features correctly.
- But this repo currently has **no committed `ios/` project**, so Xcode is building a stale local native shell with broken package links.
- That is why Xcode reports all six products missing at once: `CapacitorCamera`, `CapacitorHaptics`, `CapacitorPushNotifications`, `CapacitorSplashScreen`, `CapacitorStatusBar`, and `CapacitorCommunityTextToSpeech`.

## Plan

### 1. Rebuild the native iOS shell so it is source-controlled and repeatable
- Generate a clean Capacitor iOS project from the current repo.
- Commit the native iOS project into the repository so future pulls don’t depend on an old local Xcode state.
- Standardize the project on **one** dependency resolution path so you are not guessing between stale package references and regenerated ones.

### 2. Repair the Capacitor package resolution chain
- Recreate the native package references from the current `package.json` plugin list.
- Normalize any Capacitor version mismatches that could make package resolution brittle.
- Verify the native project references every plugin used by the app before considering the fix complete.

### 3. Make the build workflow stop drifting
- Update the iOS instructions so they match the actual repo state and the exact file Xcode should open.
- Align the CI/native setup steps with the same workflow used locally.
- Remove contradictory guidance so you don’t keep getting “looks fixed in web preview, broken in Xcode” outcomes.

### 4. Do a real review before closing it
I will validate against a clean native flow, not just the browser preview:
- dependency install succeeds
- native sync succeeds
- iOS project contains resolved Capacitor plugin references
- splash/icon generation still works
- previous UI changes still exist: centered login card, updated top bar, updated bottom tabs
- only then mark it done

## Technical details

**Files likely affected**
- `package.json`
- `package-lock.json` / lock alignment if needed
- `capacitor.config.ts`
- `ci_scripts/ci_post_clone.sh`
- `README.md`
- `APP_STORE_SUBMISSION.md`
- new committed native iOS project under `ios/`

**Why this keeps happening**
- The repo currently ships the web layer and Capacitor config, but not the actual native iOS shell.
- Xcode then depends on whatever local native project already exists on your Mac.
- Once that local project’s Swift package references drift or partially resolve, you get the exact “Missing package product” failure in your screenshot.

**Outcome I’m targeting**
- After a normal pull, your path becomes predictable:
  ```sh
  npm install
  npx cap sync ios
  ```
  then open the standardized Xcode project and build without manually re-fixing package references.

## Validation standard

I won’t call it complete until the repo-level native setup is consistent and the fix has been checked against the native build path, not just the web app.