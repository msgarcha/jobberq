## Part 1 — Custom Pricing Forms / Instant Quote Widget

A public, embeddable form where prospects pick a service, answer a few questions, see a live price, and submit. Submission auto-creates a **client + draft quote** in the owner's QuickLinq dashboard and notifies them. Modeled on Housecall Pro's online booking + price book combo.

### User stories
- **Owner**: builds a form in Settings → Pricing Forms. Picks services from their catalog, adds a few qualifying questions (text, number, dropdown, multi-select, address), sets price modifiers (per-unit, flat add-on, % surcharge), publishes to a unique slug `quicklinq.app/book/<slug>`, and copies an embed `<iframe>` snippet for their own website.
- **Prospect**: opens the form on owner's website or direct link → no login → picks a service → answers questions → sees instant subtotal + tax + total → enters name/email/phone/address → submits.
- **Result**: a draft quote with line items + a new client (status `lead`, `lead_source = 'pricing_form'`) appears in the owner's pipeline. Email notification fires to the owner.

### Architecture (no leaks)

**New tables** (all RLS scoped by `team_id`, except public read of *published* form definition only):

```text
pricing_forms
  id, team_id, slug (unique), title, description,
  is_published, primary_color, logo_url, success_message,
  require_address bool, require_phone bool,
  created_at, updated_at

pricing_form_services        -- which catalog services this form offers
  id, form_id, service_id, display_name, base_price,
  unit_label (e.g. "sq ft", "room"), min_qty, max_qty,
  sort_order

pricing_form_questions
  id, form_id, label, help_text,
  kind: 'text'|'number'|'select'|'multiselect'|'yesno',
  required bool, sort_order,
  options jsonb,                        -- [{label, value, price_delta, price_kind: 'flat'|'percent'|'per_unit'}]
  applies_to_service_ids uuid[]         -- empty = all

pricing_form_submissions
  id, team_id, form_id, slug,
  contact jsonb (name, email, phone, address...),
  selected_services jsonb,              -- snapshot of chosen + qty + computed line items
  answers jsonb,                        -- snapshot of question answers
  computed_subtotal, computed_tax, computed_total,
  client_id (nullable, set after processing),
  quote_id (nullable, set after processing),
  status: 'new'|'converted'|'spam',
  ip_hash text, ua text,                -- abuse forensics, not raw IP
  created_at
```

**RLS**:
- `pricing_forms`, `pricing_form_services`, `pricing_form_questions`: team-only CRUD via `is_team_member` + admin-only mutations.
- `pricing_form_submissions`: team-only SELECT/UPDATE; **no public INSERT** — submissions only via edge function with service role.
- **No public SELECT on any of these tables.** Public read is mediated through an edge function that returns only the published form shape — never raw rows.

**Edge functions** (all `verify_jwt = false`, manual validation; all CORS-enabled; all Zod-validated):

1. `public-pricing-form` (GET-style, by slug) → returns ONLY: `{title, description, primary_color, logo_url, success_message, services: [{display_name, base_price, unit_label, min/max}], questions: [{label, kind, options without internal pricing math leaked beyond what is needed to compute display}]}`. Returns 404 if `is_published = false`. **No team_id, no user_id, no internal IDs beyond what the form needs.**
2. `submit-pricing-form` → Zod-validates payload, **server-side recomputes price** (never trusts client total), rate-limited (5/min/IP via `_shared/rate-limit.ts`), hCaptcha/Turnstile token check (new secret `TURNSTILE_SECRET`), inserts submission + creates client + draft quote + line items via service role, fires owner email via existing `send-transactional-email`.
3. Reuse `_shared/rate-limit.ts` patterns.

**Security guarantees**:
- Slug is the only public identifier; submission UUIDs never exposed.
- All money math runs server-side; client display is hint only.
- IP stored as SHA-256 hash, never raw.
- Email/phone validated via Zod with strict regex + length caps.
- Submission rate-limit + Turnstile CAPTCHA → blocks bot floods.
- No `email` or other PII returned by the public form-fetch endpoint.
- Owner-side queries always filtered by `is_team_member(auth.uid(), team_id)`.

**Frontend (owner side)**
- New page `/settings/pricing-forms` (list) and `/settings/pricing-forms/:id` (builder with three tabs: Services, Questions, Branding & Publish).
- Live preview pane on the right showing the public form rendered.
- "Copy embed code" + "Copy public link" buttons.
- Submissions list at `/leads` (or extend Pipeline) showing `lead_source = pricing_form` with quick "Open quote" link.

**Frontend (public side)**
- New public route `/book/:slug` (no auth, no DashboardLayout).
- Lightweight, mobile-first, no Supabase client → only `fetch` to the two edge functions.
- Embed mode: `/book/:slug?embed=1` strips chrome, posts height to parent for auto-resize iframe.

**Files to add**
- `src/pages/PublicPricingForm.tsx`
- `src/pages/settings/PricingForms.tsx`, `PricingFormBuilder.tsx`
- `src/components/pricing-form/{ServiceList,QuestionList,LivePreview,EmbedSnippet}.tsx`
- `src/hooks/usePricingForms.ts`
- `supabase/functions/public-pricing-form/index.ts`
- `supabase/functions/submit-pricing-form/index.ts`

**Out of scope (v1)**: time-slot booking, Stripe deposit at submission, file uploads, conditional question logic beyond `applies_to_service_ids`. These can come in v2.

---

## Part 2 — Fix mobile voice chat (stops after 1 second)

### Root cause
- **iOS Safari (PWA / mobile web)**: WebKit's `SpeechRecognition` ignores `continuous = true` and auto-fires `onend` after ~1s of silence. Our current `onend` handler unconditionally calls the consumer's `onEnd()`, which exits voice-chat mode.
- **Capacitor native (iOS app)**: `@capacitor-community/speech-recognition` on iOS also auto-stops; we listen to `partialResults` but never to `listeningState`, and we don't auto-restart.
- **Both platforms**: there is no "voice-chat mode" flag inside `voice.ts` — the controller can't distinguish "user pressed end" from "engine timed out", so it always tears down.

### Fix
Add an `autoRestart` option to `startVoiceCapture` (default `false`; `AssistantSheet` sets it `true` while in voice-chat mode).

**Web branch (`startWebCapture`)**
- On `onend`: if `autoRestart` and not user-stopped and not yet hit `silenceTimeoutMs`, call `recognition.start()` again inside a 250ms backoff (with an attempt cap to avoid runaway loops if mic permission is revoked mid-session).
- Track `lastSpeechAt` from `onresult` and `onspeechstart`; only fire the *real* `onEnd()` when `Date.now() - lastSpeechAt > silenceTimeoutMs`.
- Handle iOS-specific `not-allowed` and `service-not-allowed` errors with a user-visible toast and stop trying.

**Native branch (`startNativeCapture`)**
- Add a `listeningState` listener; when it goes to `false` and `autoRestart` is on, call `NativeSR.start(...)` again.
- Move the silence auto-stop into a real "no partials for N ms" check rather than "no callback ever" — currently `armSilence` only fires after first partial, so on iOS where partials are sparse the timer never arms.
- On `start()`, set `partialResults: true, popup: false, language` and re-issue start every time the engine reports `listening: false` (capped at e.g. 30 restarts per session).

**Context-awareness (the "platform is not context aware" complaint)**
- Add platform detection signal into `useLinqAssistant` greeting: pass `platform: 'ios-native' | 'android-native' | 'ios-web' | 'android-web' | 'desktop'` into the `linq-assistant` edge function so Linq can adjust style ("On your phone you can also tap the mic icon…") and avoid suggesting desktop-only actions.
- Pass `currentRoute` (e.g. `/quotes/:id`) so Linq's system prompt knows what the user is looking at and can answer questions like "what's this quote total?" without asking again.
- Pre-warm: when voice mode opens, fetch user display_name + most recent client/quote names server-side so Linq can greet by name and refer to current context.

**UI feedback while listening**
- VoiceOrb already shows a pulse — also add a *thin progress ring* that resets every time a new partial arrives, so the user can see the silence timer counting down. If the engine silently restarts behind the scenes, no flicker.
- Show a small "listening…" / "thinking…" / "speaking…" caption under the orb that reflects the real state.

**Files to touch**
- `src/lib/ai/voice.ts` — `autoRestart`, real silence detection on native, `listeningState` listener, restart cap.
- `src/components/ai/AssistantSheet.tsx` — pass `autoRestart: true` when in voice-chat mode; pass `platform` + `currentRoute` to assistant.
- `src/components/ai/VoiceOrb.tsx` — silence-timer ring + status caption.
- `src/hooks/useLinqAssistant.ts` — include `platform` + `currentRoute` + `userName` context in payload.
- `supabase/functions/linq-assistant/index.ts` — accept and use new context fields in the system prompt.

### Native build reminder for the user
After pull + `npm install`, run `npx cap sync` so the speech-recognition plugin re-binds. No new permissions needed beyond the existing `NSMicrophoneUsageDescription` / `NSSpeechRecognitionUsageDescription`.

---

## Order of work
1. Voice fix (small, unblocks current users).
2. Pricing-forms DB migration + RLS.
3. Two edge functions with Zod + rate-limit + Turnstile.
4. Owner builder UI.
5. Public `/book/:slug` page + embed mode.
6. Submission → quote pipeline + email notification.

## Acceptance
- Voice listens continuously on iPhone (Safari PWA + native app) until the user taps End or stays silent for the configured timeout; survives short pauses.
- Linq greets by name and references the page/quote the user is on.
- Owner can publish a pricing form, share `/book/:slug`, and embed the iframe on their website.
- Submitting the form creates a client + draft quote; owner gets an email; no PII leaks via public endpoints; recomputed totals always win over client-supplied totals; bot/floods rate-limited.
