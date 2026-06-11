# Automatic Invoice & Quote Reminders

Send recurring reminder emails to the **client** after an invoice/quote is **sent**, on a configurable cadence (weekly / bi-weekly / monthly), capped by a **per-document reminder limit**. Each document can be configured individually, with sensible global defaults from Settings. Reminders stop automatically when the invoice is paid (or quote approved/converted/expired) or the limit is reached. Existing documents are fully supported via an editable Reminders card on the detail pages.

## Behavior summary
- Clock starts after the document is **sent** (`sent_at`). Drafts never get reminders.
- Frequency = the **gap** between reminders. First reminder fires one interval after `sent_at`; each subsequent one fires one interval after the previous reminder.
- Reminders go to the **client only**. The owner keeps the existing in-app notifications (no extra owner email).
- A reminder is skipped/stopped when: invoice is `paid`/`draft`, quote is `approved`/`converted`/`expired`/`draft`, quote past `valid_until`, the per-document limit is reached, no client email, or the email is suppressed.

## 1. Database (migration)

Add per-document reminder columns to **`invoices`** and **`quotes`**:
- `reminders_enabled boolean not null default false`
- `reminder_frequency text not null default 'weekly'` (allowed: `weekly`, `biweekly`, `monthly`; validated by trigger)
- `reminder_limit integer not null default 3`
- `reminders_sent integer not null default 0`
- `last_reminder_at timestamptz`
- `next_reminder_at timestamptz` (maintained for display + cheap cron filtering)

Add global default columns to **`company_settings`**:
- `default_reminders_enabled boolean not null default false`
- `default_reminder_frequency text not null default 'weekly'`
- `default_reminder_limit integer not null default 3`

No new RLS needed — existing invoice/quote/company_settings policies already scope by team; new columns inherit them. (Defaults keep existing rows inert until a user opts in.)

## 2. Email templates

Create two React Email templates in `supabase/functions/_shared/transactional-email-templates/`, styled like the existing `document-email.tsx` (QuickLinq logo, Poppins, teal CTA):
- `invoice-reminder.tsx` — friendly "balance due" nudge with amount, due date, and a "View & Pay Invoice" button → `/pay/{id}`.
- `quote-reminder.tsx` — "still interested?" nudge with total and a "View & Approve Estimate" button → `/quote/view/{id}`.

Register both in `registry.ts`. Props: `companyName`, `clientName`, `documentNumber`, `amount`, `dueDate`, `ctaUrl`, plus reminder count context.

## 3. Cron sweep edge function

New function `supabase/functions/send-document-reminders/index.ts` (cron-only; same constant-time service-role-key auth as `onboarding-drip-sweep`). Runs **daily**:

1. Query invoices: `reminders_enabled = true`, `status in ('sent','viewed','overdue')`, `reminders_sent < reminder_limit`, `next_reminder_at <= now()`, with a client email.
2. For each: send `invoice-reminder` via `send-transactional-email` (service-role fetch, idempotency key `invoice-reminder-{id}-{reminders_sent+1}`). On success, set `reminders_sent += 1`, `last_reminder_at = now()`, and `next_reminder_at = now() + interval` (or `null` once the limit is hit).
3. Same loop for quotes: `status in ('sent','viewed')`, not past `valid_until`, using `quote-reminder`.
4. Skip + advance gracefully on suppression/missing email; log per-run stats.

Schedule via the **insert tool** (not migration — contains the service-role key), enabling `pg_cron`/`pg_net` and registering a daily `cron.schedule('document-reminder-sweep', '0 13 * * *', net.http_post(...))` calling the function with the service-role key in the Authorization header, mirroring existing sweeps.

`next_reminder_at` is seeded when reminders are enabled/sent (see below), and the sweep is the source of truth thereafter.

## 4. Frontend

**Shared component** `src/components/ReminderSettings.tsx`: enable toggle, frequency select (Weekly / Bi-weekly / Monthly), and a reminder-limit number input. Reused in all four places below.

- **InvoiceForm.tsx / QuoteForm.tsx** (creation + edit): add a "Automatic reminders" section, pre-filled from `company_settings` defaults. On save, persist the reminder columns. When the document already has `sent_at` and reminders are enabled with `reminders_sent = 0`, set `next_reminder_at = sent_at + interval`.
- **InvoiceDetail.tsx / QuoteDetail.tsx**: add a **Reminders card** (editable) so existing documents can opt in/adjust. Shows live status: "X of Y reminders sent · next on {date}" or "starts after this is sent". Saving updates the columns and recomputes `next_reminder_at`.
- **EmailDocumentDialog.tsx**: when it stamps `sent_at` on first send, also seed `next_reminder_at = now + interval` if reminders are enabled and none sent yet (so the clock starts at send time).
- **Settings.tsx**: add a "Reminder defaults" section writing the three `company_settings.default_*` fields.

**Hooks**: extend `useInvoices`/`useQuotes` update mutations and `useCompanySettings` to carry the new fields (types regenerate after the migration).

## 5. Verification
- Migration applies; types regenerate.
- Deploy `send-document-reminders`, `send-transactional-email`, and the template registry.
- Manually invoke the sweep (curl with service-role auth) against a test invoice whose `next_reminder_at` is in the past; confirm one reminder enqueues, `reminders_sent` increments, `next_reminder_at` advances, and a paid invoice / limit-reached document is skipped.
- Confirm UI: defaults in Settings pre-fill the form, detail card edits persist, and status text reflects counts.

## Technical notes
- Frequency→interval map: weekly = 7d, biweekly = 14d, monthly = 1 month.
- Idempotency key includes the reminder index so retries never double-send but each scheduled reminder is distinct.
- Reminders reuse the existing queue/suppression/unsubscribe pipeline in `send-transactional-email` — no bypass.
- All emails are strictly transactional (one specific recipient per triggering document), not bulk/marketing.
