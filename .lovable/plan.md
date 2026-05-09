## Goal
Turn the Linq Assistant into a true voice-chat assistant — push to talk, hear the reply spoken back, and have it answer business questions from your data ("when did I last invoice Acme?", "which invoices are overdue?") in addition to drafting documents.

Keep cost near zero by using the browser's free Speech APIs and Lovable AI's cheapest model (`google/gemini-3-flash-preview`) for the brains. No third-party voice API is required.

## What you'll be able to do
- Tap the mic, speak a question or command — no need to hit Enter.
- Hear Linq speak the answer back (toggleable, defaults on for voice mode).
- Ask read-only questions like:
  - "When did I last invoice Mark Henderson?"
  - "What invoices are overdue?"
  - "How much did Acme pay me last month?"
  - "Any unpaid invoices over 30 days?"
  - "Show me approved quotes I haven't invoiced yet."
- Existing draft creation (quote / invoice / client / job) keeps working exactly as today.

## Cost approach (cheap)
| Layer | Choice | Cost |
| --- | --- | --- |
| Speech-to-text | Browser Web Speech API (already used) | Free |
| Text-to-speech | Browser `speechSynthesis` API | Free |
| LLM | Lovable AI Gateway, `google/gemini-3-flash-preview` (existing) | Lowest tier on the gateway, billed per request |
| Storage | None new | — |

If later you want better voice quality, we can swap browser TTS for ElevenLabs as a one-line change. Not part of this plan.

## UX changes
- Mic button gets a "Voice mode" long-press / second state:
  - Tap = single dictation (today's behavior, fills the textarea).
  - Hold or toggle = "Voice chat" mode: each utterance auto-sends on silence, and Linq's reply is spoken aloud.
- Small speaker icon in the header to mute/unmute spoken replies.
- A subtle "Listening… / Thinking… / Speaking…" status under the input.
- Voice mode auto-resumes listening after Linq finishes speaking, until you tap the mic again.

## New assistant capabilities (read tools)
Add four read-only tools to the existing `linq-assistant` edge function so the model can answer questions, not just draft. All scoped to the user's `team_id` via the existing service-role client + team filter:

1. `lookup_client_history` — input: client name or id. Returns: last quote, last invoice (date + total + paid status), lifetime revenue, open balance.
2. `list_overdue_invoices` — input: optional `min_days_overdue`. Returns up to 20 invoices with client, amount, days overdue, due date.
3. `list_unpaid_invoices` — input: optional `client_name`, `since_date`. Returns invoices with `balance_due > 0`.
4. `list_approved_quotes_not_invoiced` — Returns approved quotes with no linked invoice yet, so Linq can suggest "want me to draft an invoice for these?".

System prompt is updated to: "You can both DRAFT new records and ANSWER questions about the user's existing data using the lookup/list tools. Never send, charge, or modify — drafts and read-only answers only."

## Frontend files
- `src/lib/ai/voice.ts` — already does STT. Add `speak(text, opts)` and `cancelSpeech()` helpers using `window.speechSynthesis`. Add a `silenceTimeoutMs` option to the existing `startVoiceCapture` so we can auto-stop after ~1.2s of silence in voice mode.
- `src/hooks/useLinqAssistant.ts` — add a `voiceMode` boolean and `speakReplies` boolean. After `send()` resolves with a reply, if `speakReplies` is true call `speak(reply)`. Expose `status: "idle" | "listening" | "thinking" | "speaking"`.
- `src/components/ai/AssistantSheet.tsx` — wire the new mic states, status line, and a speaker mute toggle in the header. Keep current type-to-send path unchanged.

## Backend files
- `supabase/functions/linq-assistant/index.ts`:
  - Append the 4 read-only tools to the `TOOLS` array.
  - Add their handlers in the existing tool dispatch loop, all queries scoped to `team_id` and limited to ≤20 rows.
  - Tighten reply length (already "under 25 words"); for question-answers, allow up to ~50 words so spoken answers sound natural.
  - No schema changes, no new secrets.

## Out of scope (for this round)
- Native iOS speech recognition (Capacitor) — current Capacitor build will fall back to "Voice not supported" on iOS WebView the same way it does today; we can wire `@capacitor-community/speech-recognition` later as a separate task.
- Push notifications for overdue invoices ("remind me") — Linq will *tell* you about them when you ask; scheduled reminders are a separate feature.
- ElevenLabs / OpenAI Realtime voice — keeping this plan free.

## Acceptance
- Tap mic, say "What invoices are overdue?" — Linq replies in chat AND speaks the answer.
- Say "When did I last invoice Mark Henderson?" — answer mentions a date and amount, pulled from the database.
- Say "Quote Mark Henderson 10k for bathroom reno" — still creates a draft quote like today.
- Speaker icon mutes spoken replies without breaking text replies.
- Closing the assistant cancels any in-flight speech and stops the mic.
