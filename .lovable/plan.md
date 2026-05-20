## Current state

The app captures every relevant event but never tells the business owner:

- `public-quote` edge function stamps `viewed_at` on first client view → no email/notification sent.
- `public-invoice` edge function records views → nothing sent.
- `approve-quote` edge function flips quote `status = 'approved'` → nothing sent.
- `stripe-connect-webhook-v2` handles `payment_intent.succeeded` for deposit and full invoice payments → only updates the invoice row; comment in code literally says `// TODO: Send a notification to the account owner`.

So this is a real gap. Plan below adds both **email** (via existing `send-transactional-email` infra on `notify.quicklinq.ca`) and **in-app notifications** with a bell icon, since the user called this "critical".

## What we'll build

### 1. In-app notifications

New `notifications` table (team-scoped, RLS by `team_id`):
- `id`, `team_id`, `user_id` (nullable — null = whole team), `type` (enum: `quote_viewed`, `quote_approved`, `invoice_viewed`, `deposit_paid`, `invoice_paid`), `title`, `body`, `link` (e.g. `/quotes/:id`), `read_at`, `created_at`, plus `entity_type` + `entity_id` for dedupe.
- Realtime enabled so the bell updates live.
- Bell icon in top bar (desktop nav + mobile header) with unread count and a dropdown list; click marks read and navigates to `link`.

### 2. Notification preferences

Add columns to `company_settings`:
- `notify_on_quote_viewed` (bool, default true)
- `notify_on_quote_approved` (bool, default true)
- `notify_on_invoice_viewed` (bool, default true)
- `notify_on_deposit_paid` (bool, default true)
- `notify_on_invoice_paid` (bool, default true)
- `notification_email` (text, nullable — falls back to team owner's auth email)

Settings page gets a new "Notifications" card with toggles + optional override email.

### 3. Email templates

Four new React Email templates in `_shared/transactional-email-templates/`, all branded to match existing QuickLinq templates (teal `#0d9488`, Poppins-ish system stack, white body):

- `quote-viewed.tsx` — "Marcus just opened your quote QT-1042"
- `quote-approved.tsx` — "Quote QT-1042 was approved — $3,450"
- `invoice-viewed.tsx` — "Acme Co. opened invoice INV-2231"
- `payment-received.tsx` — handles both deposit and full payment with a `kind` prop ("Deposit received" vs "Invoice paid in full"), shows amount, invoice number, client.

Each template includes a CTA button deep-linking back into the app (`https://app.quicklinq.com/...`).

Registered in `registry.ts`.

### 4. Trigger wiring

A small shared helper `_shared/notify-owner.ts` that, given `team_id` + event type + payload:
1. Loads `company_settings` to check the relevant `notify_on_*` toggle.
2. Resolves recipient (`notification_email` override, else team owner's auth email via service role).
3. Inserts a row into `notifications`.
4. Invokes `send-transactional-email` with the correct template + idempotency key (`${event}-${entity_id}`).

Wired into existing functions (no new edge functions needed):

| Edge function | Event hook |
|---|---|
| `public-quote/index.ts` | when `viewed_at` is stamped → `quote_viewed` |
| `public-invoice/index.ts` | first view → `invoice_viewed` |
| `approve-quote/index.ts` | after status flips to approved → `quote_approved` |
| `stripe-connect-webhook-v2/index.ts` | on `payment_intent.succeeded`, branch on `metadata.payment_type` (`deposit` vs `full`) → `deposit_paid` or `invoice_paid` |

Idempotency keys prevent duplicate sends on Stripe webhook retries and quote re-views.

### 5. Settings UI + Bell UI

- `src/pages/Settings.tsx` → new "Notifications" section with the 5 toggles and the override email input.
- `src/components/notifications/NotificationBell.tsx` → bell + unread badge + dropdown list, used in the existing top nav for both desktop and mobile.
- `src/hooks/useNotifications.ts` → subscribes to realtime inserts on `notifications` for the current `team_id`.

## Technical notes

- Email infrastructure (queues, `send-transactional-email`, `notify.quicklinq.ca`) is already set up — we just add templates and call sites.
- All new DB objects use the existing `team_id` RLS pattern (`has_team_role` / `is_team_member`).
- `notifications` insert happens from edge functions using service role; reads use authed client filtered by `team_id`.
- Realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;`
- No changes to Stripe Connect flow or fee logic.

## Out of scope (can do later)

- Push notifications to the iOS Capacitor app.
- SMS via Twilio.
- Per-user (not per-team) preferences.
- Digest mode ("only email me once an hour").
