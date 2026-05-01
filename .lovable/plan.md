## Goal

Today when you say "Quote Mark $10k for bathroom reno", Linq creates a quote with a single bare line item `bathroom reno — $10,000` and no link to your service catalog.

After this change Linq will:

1. Always resolve every line item to a row in `services_catalog` — matching an existing service if one fits, otherwise creating a new one with a proper, professional description.
2. Learn the description style and typical price from your past quotes/invoices and existing services, so new services it creates sound like yours and aren't priced out of thin air.
3. Set `service_id` on every quote/invoice line item so reporting, suggestions, and future matching get smarter over time.

This is purely a backend (edge-function) change. No UI changes, no DB schema changes — `service_id` already exists on `quote_line_items` / `invoice_line_items`, and `services_catalog` already has `name`, `description`, `default_price`, `category`, `tax_rate`.

## How it will work

### New tool: `resolve_service`

Add a tool to `linq-assistant` that the model calls once per line item before drafting the quote/invoice:

```text
resolve_service({
  user_phrase: "bathroom reno",        // what the user said
  hint_amount: 10000,                  // optional — the price they mentioned
  doc_context: "quote for Mark"        // optional context
})
→ {
  service_id, name, description,
  unit_price, tax_rate, was_created: true|false,
  match_confidence: 0..1
}
```

Internally the tool does this in one pass:

1. **Fetch candidates** — pull the team's `services_catalog` (active rows: `id, name, description, default_price, category, tax_rate`) plus the 30 most recent line items from `quote_line_items` + `invoice_line_items` (description, unit_price) for pricing/wording context. Capped to keep the prompt small.
2. **Ask Gemini Flash** (cheap, fast) with one tool call to either:
   - `pick_existing` — return `service_id` of best match + reason, or
   - `create_new` — return `{ name, description, suggested_price, category, tax_rate, confidence }` modeled on the user's existing wording style. Description should be 1-3 sentences, professional, not just echoing the user's phrase.
3. **Pricing rule**:
   - If the user gave a price → use it as `unit_price`. Only use it as the new service's `default_price` if confidence ≥ 0.7 AND it's within 3× the median of similar past line items (avoids polluting the catalog with one-off jumbo numbers). Otherwise store a sensible learned `default_price` and keep the user's number as the line price.
   - If the user gave no price → use the matched service's `default_price`, or the AI's learned suggestion, or ask the user.
4. **Persist** — if `create_new`, insert into `services_catalog` with `team_id`, `user_id`, `is_active=true`, audit-log via `ai_actions` (`action: "create_service"`).
5. **Return** a fully-resolved line item the model then feeds into `create_draft_quote` / `create_draft_invoice`.

### Tweaks to existing tools

`create_draft_quote` and `create_draft_invoice`:

- Each `line_items[i]` gains an optional `service_id` field.
- The line-item insert sets `service_id` from that field instead of hard-coded `null`.
- If the model forgets to call `resolve_service`, the function does a server-side fallback: best-effort exact/ILIKE match in `services_catalog` by description, and if nothing matches, creates a minimal service silently (so the catalog still grows, but ideally the model handles it).

### System prompt update

Add to `SYSTEM_PROMPT`:

> Before creating a quote or invoice, call `resolve_service` for **each** line item. Use the returned `service_id`, `description`, `unit_price`, and `tax_rate` when calling `create_draft_quote` / `create_draft_invoice`. Never invent a description — let `resolve_service` write it.

### Audit + safety

- Every new service creation is logged in `ai_actions` with `doc_type: "service"`, `payload: { source_phrase, confidence, reasoning }` so you can review what Linq added.
- Hard cap: max 6 line items per turn (prevents runaway tool loops). Existing 5-iteration cap stays.
- Total prompt size for `resolve_service` capped (~50 services + 30 history items) to keep cost on Gemini Flash near-zero.

## What changes in the codebase

- **edit** `supabase/functions/linq-assistant/index.ts`
  - Add `resolve_service` tool definition + handler
  - Add `service_id` to line-item params of `create_draft_quote` / `create_draft_invoice`
  - Pass `service_id` into the line-item insert (replace the hard-coded `null` on lines 308 and 375)
  - Server-side fallback matcher when `service_id` is missing
  - Update `SYSTEM_PROMPT`

That's the entire change. No new files, no migrations, no UI work.

## Out of scope (not doing now)

- Bulk back-fill of historical line items with `service_id` — only new ones from Linq onwards will be linked. Can be a separate one-off script later if you want.
- Changing the manual `LineItemsEditor` UI — it already supports picking from the catalog.
- Multi-language/voice changes — still uses existing voice pipeline.

Approve and I'll implement.