# Plan: Align bundle ID to `app.quicklinq` & archive to the App Store

## The root problem
Three different bundle IDs are in play, which is why Xcode can't find a provisioning profile:

| Location | Current value | Correct value |
|---|---|---|
| App Store Connect (registered, authoritative) | `app.quicklinq` | ✅ keep |
| `capacitor.config.ts` | `app.quicklinq.ios` | → `app.quicklinq` |
| Xcode project (from the error) | `ios.quicklinq.app` | → `app.quicklinq` |

The error `Your team has no devices` is separate: automatic signing tried to make a *Development* profile. Archiving for the App Store uses *Distribution* signing and does not require a registered device — though we'll register your iPhone anyway for testing.

---

## Part A — Code & doc edits I'll make
Make `app.quicklinq` consistent across the repo so future `npx cap sync`/regeneration stays correct:

| File | Change |
|---|---|
| `capacitor.config.ts` | `appId: 'app.quicklinq.ios'` → `appId: 'app.quicklinq'` |
| `APP_STORE_SUBMISSION.md` | Replace every `app.quicklinq.ios` with `app.quicklinq` |
| `README.md` | Same bundle-ID replacement |
| `mem://infrastructure/capacitor-ios` + memory index | Update noted bundle ID to `app.quicklinq` |

> Editing `capacitor.config.ts` does **not** rewrite the already-generated native Xcode project. The live bundle ID must also be changed in Xcode (Part B). Keeping the config correct matters if `ios/` is ever regenerated.

---

## Part B — Xcode steps you'll run (cannot be done from here)

**1. Fix the bundle ID in Xcode**
- Open `ios/App/App.xcworkspace` → target **App** → *Signing & Capabilities* (and *General*).
- Set **Bundle Identifier** = `app.quicklinq` (must match App Store Connect exactly).

**2. Distribution signing (for archive)**
- Check **Automatically manage signing** → select your Team.
- Ensure capabilities match what the App ID has enabled: **Push Notifications**, **Background Modes → Remote notifications**, **Sign in with Apple**.

**3. (Optional) Register your iPhone for on-device testing**
- Plug in iPhone → *Window → Devices and Simulators* → it auto-registers, or add it at developer.apple.com → Devices.

**4. Archive & upload**
- Destination → **Any iOS Device (arm64)** (not a simulator).
- *Product → Archive* → Organizer → *Distribute App → App Store Connect → Upload*.

---

## Technical notes
- The App ID `app.quicklinq` must exist in developer.apple.com → Identifiers (it does, since App Store Connect created the app record) with Push Notifications + Sign in with Apple enabled — verify those capability toggles match Xcode.
- No device is required to upload an Archive; the "no devices" error only blocks Development builds.
- `server` block in `capacitor.config.ts` stays commented out (correct for App Store).
- After pulling these changes locally: `npm install && npm run build && npx cap sync ios`, then archive.

Approve and I'll apply the Part A edits and hand you the exact Xcode checklist.