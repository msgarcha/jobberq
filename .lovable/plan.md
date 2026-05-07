## Goals

1. **Stop AI cost runaway** — cap how much any single user can spend on Lovable AI calls per minute and per day, tier-aware.
2. **Improve activation** — add a Day 0 / Day 2 / Day 7 onboarding email sequence so trial signups actually return.

> Heads-up: the platform doesn't have first-class rate-limiting primitives yet, so the AI cap will be an ad-hoc table-based counter. It's simple, effective, and easy to swap out later if Lovable ships native rate limiting.

---

## Part 1 — AI usage caps

### New table: `ai_usage_counters`

| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid | FK to auth.users |
| `function_name` | text | e.g. `linq-assistant` |
| `window_kind` | text | `minute` or `day` |
| `window_start` | timestamptz | truncated to the window |
| `count` | int | calls in window |

Primary key: `(user_id, function_name, window_kind, window_start)`. RLS: service_role only (writes happen inside edge functions).

### New shared helper: `supabase/functions/_shared/rate-limit.ts`

Single function `enforceAiQuota(supabase, userId, fnName, tier)`:

1. Look up the user's tier (`trial`, `starter`, `pro`, `super_admin`).
2. Atomic upsert into `ai_usage_counters` for the current minute and day windows.
3. If either count exceeds the cap, return `{ ok: false, retryAfterSec, reason }`. Otherwise `{ ok: true }`.
4. Super admins are always uncapped.

### Default caps (tunable)

| Tier | Per minute | Per day |
|---|---|---|
| Trial | 5 | 50 |
| Starter / Pro | 30 | 500 |
| Super admin | ∞ | ∞ |

Caps live as constants in the helper so they're easy to change without a migration.

### Apply the helper to all 4 AI functions

- `linq-assistant` (highest priority — multi-turn + tool calls)
- `quote-suggestions`
- `personalize-review-email`
- `review-suggestions-sweep` (skip user check — cron-only, restrict to `service_role`)

On exceed: respond `429` with `{ error, retry_after }` and a `Retry-After` header.

### UI surface

- `useLinqAssistant` and `useQuoteSuggestions` already return errors — toast a friendly *"You've hit today's AI limit — upgrade to keep going"* message when the function returns 429, with an upgrade CTA for trial users.
- No quota meter in the UI for v1 (keep scope tight). We can add one later.

### Cleanup

- A simple DB cron job once a day deletes `ai_usage_counters` rows older than 7 days so the table stays tiny.

---

## Part 2 — Onboarding email drip

### Approach

Use the existing transactional email infrastructure (`send-transactional-email`, queue, templates registry). No new providers.

### New scheduled edge function: `onboarding-drip-sweep`

Runs once an hour via `pg_cron`. For each user in `profiles`:

- **Day 0 — Welcome** *(already exists as `welcome-email`; wire it into `handle_new_user` trigger or first sign-in)*
- **Day 2 — "Send your first quote in 60 seconds"**: highlights the Linq AI assistant + voice quote feature. Skips if the user has already created a quote.
- **Day 7 — "How other contractors use QuickLinq"**: social proof + Stripe Connect setup nudge. Skips if Stripe is already connected.

### New table: `onboarding_email_log`

Tracks `(user_id, email_kind, sent_at)` so we never double-send. RLS: service_role only.

### New email templates

In `supabase/functions/_shared/transactional-email-templates/`:
- `onboarding-day-2.tsx`
- `onboarding-day-7.tsx`

Both branded with the existing QuickLinq dark teal + Poppins, same components as `welcome-email`.

### Skip / suppression rules

- Skip if user is in `suppressed_emails`.
- Skip if user has unsubscribed (existing token system).
- Skip Day 2 if quotes table has any row for the user's team.
- Skip Day 7 if `connected_accounts` row exists for the team.

---

## Files & technical changes

**Migrations**
- `ai_usage_counters` table + index + RLS
- `onboarding_email_log` table + RLS
- `pg_cron` job: hourly `onboarding-drip-sweep`
- `pg_cron` job: daily cleanup of `ai_usage_counters`

**New files**
- `supabase/functions/_shared/rate-limit.ts`
- `supabase/functions/onboarding-drip-sweep/index.ts`
- `supabase/functions/_shared/transactional-email-templates/onboarding-day-2.tsx`
- `supabase/functions/_shared/transactional-email-templates/onboarding-day-7.tsx`
- Register both templates in `_shared/transactional-email-templates/registry.ts`

**Edits**
- `supabase/functions/linq-assistant/index.ts` — call `enforceAiQuota` early
- `supabase/functions/quote-suggestions/index.ts` — same
- `supabase/functions/personalize-review-email/index.ts` — same
- `src/hooks/useLinqAssistant.ts` and `src/hooks/useQuoteSuggestions.ts` — show 429 toast with upgrade CTA

---

## Out of scope (intentional)

- No streaming usage meter UI (can add later)
- No A/B testing of drip copy
- No Day 14 / Day 30 reactivation emails (add after we see Day 7 open rates)
- No IP-based rate limiting (user-id is sufficient since all 4 functions require auth)
