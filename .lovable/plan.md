## Goal
Make sure the new voice-call experience (animated orb, personalized greeting, smart Linq replies) works on **mobile web (PWA)** and on the **Capacitor native iOS/Android app** — not just desktop browsers.

## What already works on mobile
- `AssistantSheet` is already a bottom sheet on mobile (`inset-x-0 bottom-0 h-[85vh] rounded-t-3xl`).
- `LinqLauncher` floats above the bottom nav with a safe-area inset.
- The composer mic button and orb overlay render inside that sheet, so they're already visible on phones in mobile Safari/Chrome (PWA).

## Gaps to fix

### 1. Capacitor native (iOS/Android) has no Web Speech API
On the bundled native app, `window.SpeechRecognition` is undefined and `speechSynthesis` is unreliable. Right now the mic button gets hidden and voice mode silently dies. Fix by routing through Capacitor plugins when running natively.

- Add deps: `@capacitor-community/speech-recognition` and `@capacitor-community/text-to-speech`.
- Update `src/lib/ai/voice.ts`:
  - `isVoiceSupported()` and `isSpeechSynthesisSupported()` return `true` on native (plugin-backed).
  - `startVoiceCapture()`: when `isNative()`, use `SpeechRecognition.start({ partialResults: true, popup: false })` and listen to `partialResults` / `listeningState` events. Map the same callback shape (interim text, end, error). Implement the same `silenceTimeoutMs` auto-stop.
  - `speak()`: when `isNative()`, call `TextToSpeech.speak({ text, rate, pitch })` and fire a synthetic `onBoundary` tick on a `setInterval` while speaking (best-effort, since plugin doesn't expose word boundaries).
  - First call must request mic permission via `SpeechRecognition.requestPermissions()`; if denied, surface a toast with a clear message.
- Update `ios/App/App/Info.plist` reminder in the change note: user must add `NSMicrophoneUsageDescription` and `NSSpeechRecognitionUsageDescription` after `npx cap sync` (Lovable can't edit native plist directly — flag this clearly to the user).

### 2. Responsive polish for small phones (320–375px width)
- `VoiceOrb`: reduce orb size on `< 380px` (e.g. `h-36 w-36` core + `h-28 w-28` orb) and tighten vertical spacing so End-call button never gets pushed under the iOS home indicator. Use `safe-area-bottom` and a min-height check.
- `AssistantSheet`: when voice mode is active, hide the underlying transcript scroll on mobile so the orb is fully unobstructed (already overlaid, but ensure `overflow-hidden` on the parent).
- Composer mic CTA: ensure the gradient mic button stays 44×44 minimum (Apple HIG) — already 11×11rem (44px). Confirm.

### 3. PWA / mobile-web tweaks
- Ensure `cancelSpeech()` and `voiceRef.current?.stop()` run when the page goes to background (`visibilitychange`) — iOS Safari kills audio context on background and leaves stale listening state.
- Add a one-time toast on the very first voice-call tap explaining "Linq needs mic access" so the browser permission prompt feels expected.

### 4. Mobile launcher visibility check
- `LinqLauncher` is a 56px FAB on mobile and only shows the icon. While voice mode is active inside the sheet, the launcher is hidden behind the sheet (good). No change needed, but verify it doesn't disappear behind the iOS notch — already uses `safe-area-inset-bottom`.

## Out of scope
- ElevenLabs / cloud TTS (deferred earlier — would add cost).
- Background voice (running while screen locked) — needs native audio session config; not requested.
- Android-specific permission flows beyond what the plugin handles automatically.

## Files to touch
- `src/lib/ai/voice.ts` — native plugin branches for STT + TTS.
- `src/components/ai/VoiceOrb.tsx` — small-screen sizing tweaks.
- `src/components/ai/AssistantSheet.tsx` — `visibilitychange` cleanup, first-tap permission toast.
- `package.json` — add the two Capacitor plugins.

## After-change instructions for the user (native build only)
1. `git pull` your repo.
2. `npm install`
3. Add to `ios/App/App/Info.plist`:
   - `NSMicrophoneUsageDescription` — "Linq uses your mic so you can talk to your AI assistant."
   - `NSSpeechRecognitionUsageDescription` — "Linq turns your voice into commands and questions."
4. `npx cap sync`
5. Rebuild & run on device.

For the PWA / mobile web, no extra steps — the new voice-call UI just works on the next preview reload.

## Acceptance
- On a phone in mobile Safari/Chrome (PWA), opening Linq shows the same gradient mic button; tapping it launches the orb full-bleed inside the bottom sheet, greets the user by name, and listens.
- On the iOS Capacitor app, the same flow works using native Speech Recognition + Text-to-Speech plugins after the user updates Info.plist and runs `cap sync`.
- Orb + End-call controls fit comfortably above the iOS home indicator on a 375×667 viewport.