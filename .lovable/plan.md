## Goal
Make voice chat the primary mic action with a delightful, human-feeling experience. Remove the obscure "Radio" toggle in the header and turn the mic button into a proper voice-call button with rich animations and a smarter, personalized Linq voice.

## 1. Mic button = Voice Call (AssistantSheet.tsx)
- Drop the header `Radio` toggle entirely (and its `voiceMode` state in the header).
- Promote the mic button in the composer into the main "Start voice chat" call-to-action:
  - Idle: large circular gradient button with a `Mic` icon and subtle pulse ring, label "Tap to talk to Linq".
  - Active: switches to a `Waveform`/`AudioLines` icon, button glows, and a continuous voice-chat loop runs (listen → think → speak → listen).
  - Long-press or a small secondary "keyboard" icon falls back to dictate-only (single capture, fills textarea) for users who just want STT.
- Keep the speaker mute toggle in the header (cleaner header: just title + mute + close).

## 2. Voice-chat surface (new in-sheet overlay)
- When voice chat is active, render an overlay inside the sheet that takes over the message area:
  - Centered animated orb (concentric rings + radial gradient using `--primary`).
  - Different states with distinct animations:
    - `listening`: rings expand outward in sync with mic input (use a CSS pulse + scale loop; if `AudioContext` analyser is cheap, drive ring scale from volume — otherwise pure CSS).
    - `thinking`: rings rotate slowly with shimmer.
    - `speaking`: rings ripple from center outward in time with TTS (use `onboundary` from `SpeechSynthesisUtterance` to trigger a CSS keyframe re-trigger).
  - Live transcript text under the orb (interim STT result + last Linq reply).
  - Bottom row: "End call" (red, ends voice mode) and "Mute mic" / "Mute Linq" pills.
- All animations defined in `tailwind.config.ts` extending existing keyframes (`pulse-ring`, `orb-breathe`, `ripple`).

## 3. Smarter, more human Linq (linq-assistant edge function)
- Pull the user's display name on each request:
  - `profiles.display_name` (fallback to first part of email) and `teams.name`.
  - Inject into the system prompt: `The account owner is {name} from {team}. Greet them naturally on the first turn ("Hey Alex, it's Linq — what can I do?"). Use their first name occasionally, never robotically.`
- Rewrite the voice persona section of `SYSTEM_PROMPT`:
  - "You are Linq, a warm, confident assistant — think a sharp ops manager, not a chatbot."
  - Conversational contractions, short sentences, no lists when speaking.
  - Always introduce yourself as "Linq" on the very first reply of a conversation.
  - Keep replies under 25 words for confirmations, under 50 for answers.
- No new tools, no schema changes.

## 4. Better TTS voice (voice.ts)
- Improve `pickVoice()`:
  - Prefer voices matching `/Samantha|Ava|Serena|Karen|Google US English|Microsoft (Aria|Jenny|Guy)|Natural/i` for English locales.
  - Slight rate tweak (`rate: 1.0`, `pitch: 1.05`) for a warmer feel.
- Expose a tiny `onBoundary` callback on `speak()` so the orb can pulse with each spoken word.
- (Optional, deferred) Add a feature flag `useElevenLabs` — leave a TODO + commented stub but do **not** wire it now (would need a paid key; user asked to keep cost low).

## 5. Personalized greeting on voice-chat start
- When voice mode is activated and the conversation is empty, automatically `speak()` an opening line built client-side using the cached display name (fetched once via `useTeam`/profile hook) — e.g. "Hey Alex, Linq here. What are we working on?" — then start listening.

## What's not changing
- No backend tools, DB schema, or auth changes.
- Existing dictate-to-text behavior remains available.
- `useLinqAssistant` API stays the same except for an optional `setStatus` already exported.

## Technical notes
- Files touched:
  - `src/components/ai/AssistantSheet.tsx` — remove `Radio` header button, redesign composer mic, add voice-chat overlay.
  - `src/components/ai/VoiceOrb.tsx` (new) — small presentational component for the animated orb + transcript.
  - `src/lib/ai/voice.ts` — better voice pick, `onBoundary` hook.
  - `src/hooks/useLinqAssistant.ts` — accept optional `onSpeechBoundary` to forward to `speak`.
  - `supabase/functions/linq-assistant/index.ts` — fetch display name + team, update `SYSTEM_PROMPT`, inject context line.
  - `tailwind.config.ts` — add `pulse-ring`, `orb-breathe`, `ripple` keyframes/animations.
- All colors via existing semantic tokens (`--primary`, `--primary-foreground`, `--accent`).

## Acceptance
- Header no longer has the confusing radio button.
- Tapping the mic on the composer starts a full voice call with a visible animated orb.
- Linq greets the user by name on the first voice turn and sounds noticeably more natural.
- "End call" cleanly stops STT + TTS and returns to text chat.