# Fix QA Issues — Quotes, Invoices, AI & PDF

Five distinct issues from today's testing. Each fix is scoped tight.

---

## 1. Deposit tracking (quote → invoice carry-forward bug)

**Problem:** When a quote has a deposit, `handleConvert` blindly subtracts `deposit_amount` from the invoice total and marks it as `amount_paid` — even when the deposit was never actually paid. There's no concept of "deposit paid yet" on quotes.

**Fix:**
- Add `deposit_paid_at TIMESTAMPTZ` and `deposit_paid_amount NUMERIC` to `quotes` table (migration).
- Public quote payment flow (Stripe checkout) already exists for deposits — wire success webhook to set `deposit_paid_at` + `deposit_paid_amount`. (Verify in `stripe-webhook` / `public-quote` flow.)
- On manual approve in `QuoteDetail`, if deposit set but unpaid → show a modal: "Deposit not collected. Mark as paid (cash/etransfer) or skip?"
- In `handleConvert` (QuoteDetail.tsx ~46-79):
  - Only carry forward `deposit_paid_amount` (not the planned amount).
  - If unpaid, invoice starts with `amount_paid = 0` and full balance due.
  - If paid, also create a row in `payments` table linked to the new invoice (method = whatever was used) so the audit trail is real.
- On QuoteDetail UI, show deposit status badge: "Deposit pending $X" vs "Deposit paid $X · [date]" with a "Mark deposit paid" / "Mark unpaid" toggle for owners.

---

## 2. Email send dialog — no AI personalization visible

**Problem:** `EmailDocumentDialog` has no AI button. Earlier work added `personalize-review-email` for review emails only — quote/invoice emails were missed.

**Fix:**
- Add a ✨ "Write with Linq" button next to the body textarea in `EmailDocumentDialog`.
- New edge function `personalize-document-email` (or extend existing pattern): takes `{type, clientName, companyName, documentNumber, total, dueDate, tone}` → returns 2-3 sentence personalized body. Uses Lovable AI (`google/gemini-2.5-flash`). Wraps with `enforceAiQuota`.
- Click → loading state on textarea, replaces body with AI output. User can re-roll or edit.
- Optional tone chip row: "Friendly · Professional · Brief".

---

## 3. Add New Service dialog — no description field, no AI

**Problem:** Dialog only collects name/price/tax. No description (needed for line-item description and richer quotes). No AI assist.

**Fix to `LineItemsEditor.tsx` newServiceDialog:**
- Add `Description` textarea field.
- Add ✨ "Write with Linq" button beside it. Calls a new lightweight edge function `service-describe` (or extend `quote-suggestions`) — takes `{name, price}`, returns a 1-2 sentence service description learned from the user's existing services_catalog + past line-item descriptions in their team.
- Pass `description` into `useCreateService` (already supports it via `services_catalog.description`).
- After create, populate the line-item `description` with `name – description` (already done) so the new field flows through.

---

## 4. Quote suggestions UX polish + "Add" bug

**Problems:**
- No loading indicator while AI thinks.
- Card is pale and not clickable as a whole.
- Clicking "Add" only fills description, not service name (selector stays "Select…").

**Fixes:**
- `useQuoteSuggestions`: already has `loading` state — surface it.
- `SuggestionChip`:
  - When `loading && suggestions.length===0` → render a subtle skeleton row: "Linq is thinking…" with animated dots.
  - Make whole row clickable (entire row triggers `onAdd`); add hover state (`hover:bg-primary/10 cursor-pointer transition`); keep dismiss as separate stop-propagation button.
  - Bump contrast: stronger border, primary-tinted background.
- `LineItemsEditor` — when adding from suggestion, auto-create a `services_catalog` entry (or link to one if name matches existing service, case-insensitive) so `service_id` is set on the line item. Currently the suggestion only carries `description` + `suggested_price` — extend `onAdd` in `QuoteForm.tsx` to:
  1. Look up service by name in catalog.
  2. If missing, call `useCreateService` with `{name: suggestion.description (short form), default_price, tax_rate, description}`.
  3. Then push line item with `service_id` set.

---

## 5. Downloaded PDF differs from in-browser preview

**Problem:** "Download PDF" opens `/quotes/:id/print` which calls `window.print()`. Browser print uses default page CSS; the on-screen `PrintableQuote` component looks different from the resulting PDF (margins, fonts, color profiles).

**Fix:**
- Add a dedicated `@media print` stylesheet in `PrintableQuote.tsx` / `PrintableInvoice.tsx`:
  - `@page { size: A4; margin: 16mm; }`
  - Force colors: `-webkit-print-color-adjust: exact; print-color-adjust: exact;`
  - Hide everything outside `.printable-root`.
  - Lock font to a web-safe stack (Poppins may not embed in print) — load Poppins via Google Fonts in print view, or fall back cleanly.
- Verify `QuotePrint.tsx` route renders ONLY the printable component (no nav, no padding).
- Add a quick visual QA pass at 1106px wide and at print size.

---

## Technical Summary

**Files touched:**
- Migration: add deposit-paid columns to `quotes`.
- `src/pages/QuoteDetail.tsx` — convert logic, deposit status UI, mark-paid action.
- `src/components/EmailDocumentDialog.tsx` — AI personalize button.
- `supabase/functions/personalize-document-email/index.ts` — new (or extend existing).
- `src/components/LineItemsEditor.tsx` — description field + AI in dialog.
- `supabase/functions/service-describe/index.ts` — new (lightweight).
- `src/components/ai/SuggestionChip.tsx` — loading state, hover, clickable row.
- `src/hooks/useQuoteSuggestions.ts` — expose loading.
- `src/pages/QuoteForm.tsx` / `InvoiceForm.tsx` — onAdd suggestion → ensure service_id is set.
- `src/components/PrintableQuote.tsx` & `PrintableInvoice.tsx` — `@media print` rules + `@page`.
- `src/pages/QuotePrint.tsx` / `InvoicePrint.tsx` — strip layout chrome.

**Out of scope:** Stripe Connect deposit payment routing changes (already wired); rebuilding PDF via server-side renderer (use print-CSS approach first).

Approve and I'll implement all five.
