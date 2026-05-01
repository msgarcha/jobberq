
# AI Features Architecture — "Linq AI Assistant"

The app gets a single AI brand: **Linq** (the assistant). Three coordinated capabilities, all draft-first (never auto-send), all powered by **Lovable AI Gateway** (no extra API keys, free tier covers most usage).

---

## Feature 1 — Linq Assistant (voice + text → drafts)

The hero feature. A floating "✨ Linq" button on the FAB row that opens a chat sheet. User speaks or types one sentence; Linq creates a **draft** quote/invoice/client/job and opens it for review. Nothing is ever sent without a tap.

### UX surfaces
- New FAB primary action **"Ask Linq"** (replaces or sits beside the `+` on the bottom nav).
- Bottom-sheet chat panel (`AssistantSheet`) with mic button + text input + transcript.
- After Linq acts, an **Action Card** appears in chat: *"Draft quote Q-1042 created for Mark Henderson — $10,000 · Bathroom Reno"* with **[Open & Review]** / **[Discard]** buttons.
- Toolbar shortcut on Quote/Invoice forms: **"Add with Linq"** opens a mini prompt that only edits the current document.

### Voice pipeline (cost-optimized)
- Use the **browser's native `SpeechRecognition` API** first (free, on-device on iOS/Chrome). Fallback to Lovable AI `google/gemini-2.5-flash` audio transcription only if unavailable.
- On Capacitor iOS, use `@capacitor-community/speech-recognition` (free, native).
- No third-party STT bills.

### Brain: tool-calling agent
One edge function `linq-assistant` runs a single LLM turn with **structured tool calls** (no free-form JSON parsing). Default model: `google/gemini-3-flash-preview` (fast + free tier). Escalate to `google/gemini-2.5-pro` only when the user prompt > 800 chars or the previous turn returned `needs_clarification`.

**Tools exposed to the model** (server-side handlers do all DB writes):
- `find_or_create_client(name, email?, phone?, company?)` → fuzzy match on existing clients first (ILIKE + trigram on first/last/company), returns `{client_id, was_created, candidates[]}`. If 2+ candidates score > 0.6 it returns `needs_clarification` and Linq asks "Did you mean Mark Henderson or Mark Tran?"
- `find_service(query)` → searches `services_catalog` by name/category. Returns top 3.
- `create_draft_quote({client_id, title, line_items[], deposit?, valid_until?})`
- `create_draft_invoice({client_id, title, line_items[], from_quote_id?})`
- `create_draft_job({client_id, title, scheduled_for?})`
- `lookup_recent_documents(client_id, type)` → for "invoice Mark for the window cleaning quote that was approved" — finds the latest approved quote for that client and converts it.

**Why tool-calling not JSON**: model can't hallucinate `client_id`s — only the server function chooses them.

### Critical safety rules (hard-coded in the edge function, not the prompt)
- All created records get `status = 'draft'`. Never `'sent'`, never `'approved'`.
- Edge function refuses any tool call that would email, charge, or change status away from draft.
- Every mutation logs to a new `ai_actions` audit table (`user_id, team_id, action, payload, doc_id, created_at`) so users can see/undo.
- If confidence is low (multiple client candidates, ambiguous price, missing required field) → return `needs_clarification` with a follow-up question instead of guessing.

### Corner cases handled
| Case | Behavior |
|---|---|
| Client not found | Asks once: "I don't see Mark — is this a new client? I'll need a phone or email." Creates only after confirmation. |
| Two "Mark"s exist | Linq lists both with last-job hint, user picks. |
| Service not in catalog | Creates an ad-hoc line item with description from prompt, **does not** add to `services_catalog` (keeps catalog clean). Suggests "Add Bathroom Reno to your services?" as a separate tap. |
| Vague price ("a few thousand") | Asks for a number; never guesses. |
| "Invoice the bathroom quote" but no quote exists | Falls back to creating a draft invoice from scratch + notes "Couldn't find a matching quote." |
| Tax/deposits not specified | Uses `company_settings.default_tax_rate`; deposit only if user says so. |
| Voice transcription mishears amount | Always shows the parsed amount in the action card before opening the doc. |
| User on free trial / over usage | Surface 402/429 errors as a friendly toast: "Linq is at capacity — try again in a minute." |
| Offline / no team_id | Sheet shows disabled state with explanation. |

### Conversation memory
Per-session only. Stored in component state, sent as `messages[]` with each turn (last 6 turns max). **Not persisted** — keeps cost low and avoids privacy concerns. Users restart fresh each open.

---

## Feature 2 — Smart Review Reminders (personalized, context-aware)

Quietly nudges the user to ask for reviews after good jobs, and writes a personalized email body using the actual work done.

### Trigger surface
- **Daily background sweep**: scheduled edge function `review-suggestions-sweep` runs once per day (pg_cron). For each team, finds invoices marked `paid` in the last 14 days that don't yet have a `review_request`. Inserts a row into a new `review_suggestions` table with status `pending`.
- **In-app Inbox card** on the dashboard: "✨ 3 clients ready for a review request" → list with one-tap **[Send draft]** per client (still opens an editable preview before sending).

### Personalization brain
When the user opens the suggestion, an edge function `personalize-review-email` calls `google/gemini-3-flash-preview` with:
- Client first name
- Invoice line items (descriptions only, no prices)
- Job title / property address (city only)
- Company tone setting (defaults: friendly)

Returns a 2–3 sentence custom opening that mentions the actual work ("Hope the new bathroom vanity is treating you well…"). Falls back to the existing static template on AI failure.

### Cost controls
- Generation only happens **when the user clicks the suggestion** — not for every invoice. Avoids burning credits on customers who never review.
- Result is cached on the `review_requests` row (`personalized_body` column) so re-opens don't re-bill.
- Average prompt < 500 tokens → essentially free on the included tier.

### Corner cases
- Low-rated past reviews from same client → suggestion suppressed (reputation shield rule already in place).
- Client has no email → suggestion shows "SMS only" mode and still personalizes the SMS body (shorter).
- Multiple invoices same client same week → single grouped suggestion.
- Unsubscribed client → never suggested.
- User dismisses suggestion → marked `dismissed`, never re-suggested for that invoice.

---

## Feature 3 — Quote/Invoice Inline Suggestions ("Did you forget?")

Subtle, never gimmicky. A single `✨ Suggestions` chip below the line items list, only visible when the AI has at least one **high-confidence** suggestion.

### Trigger
- Debounced 1.5s after the user stops editing line items, **and** has at least 1 line item, **and** has a title or client selected.
- Calls edge function `quote-suggestions` with current line items + title + (optional) past quotes for similar jobs (top 3 by client industry / title similarity).

### What it suggests
Examples:
- "Disposal fee — most bathroom renos include this"
- "Permit fee — your last 4 reno quotes had one"
- "Tax on materials — current items are labor-only"
- "2-year workmanship warranty line"

### Brain
- Model: `google/gemini-3-flash-preview` with tool-calling for structured output.
- Server pulls **the user's own historical line items** (last 50 quotes) and feeds those as context. The model only suggests items the user has actually used before — this is what makes it feel relevant, not generic.
- Returns 0–3 suggestions, each with: `description`, `suggested_price` (median from user's history), `confidence` (only show ≥ 0.7).

### Anti-gimmick rules
- If model can't find historical precedent → returns empty array → chip stays hidden.
- Suggestions appear inline with a soft sparkle, not a popup or modal.
- One-tap **[Add]** appends to line items; **[Dismiss]** hides for the rest of this edit session.
- Dismissed suggestion types per-team are remembered (`ai_dismissed_suggestions` table) — if user dismisses "permit fee" three times, stop suggesting it for 30 days.

### Corner cases
- Brand-new account with no history → uses generic industry templates (plumbing/landscaping/cleaning) only if `company_settings.industry` is set; otherwise stays silent.
- Editing a converted quote → no suggestions (avoid changing approved scope).
- Very short quote (1 line under $200) → suppressed; not worth interrupting.
- Network/AI failure → silent. Never shows an error toast for suggestions.

---

## Cross-cutting: cost & performance

| Lever | Choice |
|---|---|
| Default model | `google/gemini-3-flash-preview` (free tier) |
| Escalation | Only Linq Assistant escalates to `google/gemini-2.5-pro` for long/ambiguous prompts |
| STT | Browser native + Capacitor native — **$0** |
| Caching | Personalized review bodies + suggestion results cached per-doc |
| Streaming | Linq Assistant streams token-by-token (perceived speed) |
| Prompt size | Trim conversation to last 6 turns; never send full client list |
| Rate limit handling | 429/402 surface as toasts with clear next-step copy |

Expected cost per active user/month: **near zero on the included free tier** for typical contractor usage (under 200 assistant turns/month).

---

## Database additions (one migration)

```text
ai_actions          (user_id, team_id, action, doc_type, doc_id, payload jsonb, created_at) — RLS by team
review_suggestions  (id, team_id, invoice_id, status [pending|sent|dismissed], created_at) — RLS by team
ai_dismissed_suggestions (team_id, suggestion_key, dismissed_until) — RLS by team
review_requests.personalized_body  (text nullable, added column)
company_settings.industry  (text nullable, used by suggestions)
company_settings.ai_assistant_enabled  (boolean default true)
```

Plus pg_cron job for the daily review sweep.

---

## New edge functions

| Function | Purpose | verify_jwt |
|---|---|---|
| `linq-assistant` | Tool-calling agent for Feature 1 | false (validate session in code) |
| `quote-suggestions` | Inline suggestions for Feature 3 | false (validate in code) |
| `personalize-review-email` | On-demand body for Feature 2 | false (validate in code) |
| `review-suggestions-sweep` | Daily cron sweep | true (cron via pg_net w/ service role) |

---

## UI components to build

- `src/components/ai/AssistantSheet.tsx` — chat sheet with mic + text + action cards
- `src/components/ai/AssistantFAB.tsx` — sparkle button in bottom nav
- `src/components/ai/SuggestionChip.tsx` — inline chip on line item editor
- `src/components/ai/ReviewSuggestionCard.tsx` — dashboard inbox card
- `src/lib/ai/voice.ts` — unified STT (browser + capacitor)
- `src/hooks/useLinqAssistant.ts` — streaming + tool-call handling
- `src/hooks/useQuoteSuggestions.ts` — debounced suggestion fetcher

No redesign of existing forms — AI hooks in via the chip + the sheet only.

---

## Phased rollout (so we don't revamp later)

```text
Phase 1 — Foundations       DB tables, ai_actions audit, edge function scaffolding
Phase 2 — Linq Assistant    The hero. Voice + text + tool-calling drafts. Marketing-ready.
Phase 3 — Quote suggestions Inline chip on line items
Phase 4 — Review reminders  Cron sweep + personalized bodies + inbox card
```

Each phase ships independently and is feature-flagged via `company_settings.ai_assistant_enabled` so we can dark-launch.

---

## What this plan deliberately does NOT do

- No auto-send of any email, quote, invoice, or SMS — every outbound action keeps its existing manual confirm step.
- No free-form JSON output — only tool calls, eliminating hallucinated IDs.
- No persistent chat history — keeps cost + complexity low; can add later if users ask.
- No third-party STT/TTS bills — browser + Capacitor native only.
- No suggestions on already-sent or approved documents.
