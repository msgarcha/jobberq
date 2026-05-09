## Goal

Make Linq behave like a guided assistant when the user asks to create a quote or invoice but hasn't given all the info yet — instead of guessing or failing, it asks short follow-up questions for: client → quote vs invoice → services & prices → confirm.

## Current state

The edge function `supabase/functions/linq-assistant/index.ts` already has all the tools needed: `find_or_create_client`, `resolve_service`, `create_draft_quote`, `create_draft_invoice`. What's missing is the **conversational behavior** — today the system prompt tells it to "always call tools" and only asks back when a name is ambiguous or a price is vague. So if you say "make a quote", it tries to act with no info instead of guiding you.

## Plan (single file change)

Update the `SYSTEM_PROMPT` in `supabase/functions/linq-assistant/index.ts` to add an explicit guided-creation flow:

1. **Detect intent first.** If the user says "create / make / draft" without specifying quote vs invoice → ask which one.
2. **Collect client.** If no client mentioned → ask "Who is this for?". If only first name given and multiple matches exist → ask which one (already handled, keep).
3. **Collect new-client info on the fly.** If the client doesn't exist, ask for the missing essentials one at a time in this order, only what's missing: last name → phone OR email → address (optional, can skip). Don't ask for everything in one wall of text.
4. **Collect services & prices.** Ask "What services and prices?" if none given. Accept multiple in one answer ("bathroom reno 8k and faucet install 200"). If a price is missing for a mentioned service → ask for it.
5. **Confirm before creating.** Read back a one-line summary ("Draft quote for Mark Henderson, bathroom reno $8,000 — create it?") and only call `create_draft_quote` / `create_draft_invoice` after a yes.
6. **Voice-friendly.** Keep each question under 15 words so it sounds natural when spoken.

Also tighten two existing rules so they fit the new flow:
- Replace "Always call tools to do work" with "Call tools once you have the info you need; otherwise ask one short question."
- Keep the existing "convert approved quote to invoice" shortcut untouched.

## Out of scope

- No new tools, no schema changes, no UI changes.
- No editing/sending of drafts — still draft-only.
- No multi-line-item editing after creation (user can open the draft to tweak).

## Acceptance

- "Create a quote" → Linq replies "Sure — who's it for?"
- "For Mark, bathroom reno" → "What price for the bathroom reno?"
- "8k" → "Draft quote for Mark Henderson, bathroom reno $8,000. Create it?"
- "Yes" → calls `create_draft_quote`, confirms with quote number.
- Existing one-shot path still works: "Quote Mark Henderson 10k for bathroom reno" creates the draft immediately as it does today.
