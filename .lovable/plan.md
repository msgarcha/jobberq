# Super Admin: Usage, Access Control & Trial Enforcement

## Current state findings

- **Trial expiry today does nothing.** `resolveTier()` in `supabase/functions/_shared/rate-limit.ts` returns `"paid"` once `trial_ends_at` passes, even if the user never subscribed — so they keep full app access with higher AI caps. There is no app-level gate on routes or document creation.
- Super Admin already lists subscribers + trial-only users, can extend/cancel/resume subscriptions and extend app trial. There is **no usage view** and **no way to revoke a user**.
- Trial counts exist in revenue stats KPI (`trialing_count`) but not broken out clearly.

---

## 1. Usage Dashboard (new "Usage" tab in `/super-admin`)

New edge function `admin-account-usage` (super-admin gated):

Input: `{ user_id?, email? }` (lookup) or no args = list all accounts with rollups.

Returns per account:
- `team_id`, `email`, `display_name`, `created_at`, `trial_ends_at`, `subscribed`, `tier`
- Counts (lifetime + last 30 days): `quotes`, `invoices`, `clients`, `jobs`, `payments_total_cents`
- AI usage: sum from `ai_usage_counters` last 30 days, grouped by `function_name`, plus today's count
- `ai_actions` count last 30 days

UI: new component `AdminUsageTable.tsx`
- Searchable table of accounts (email, plan, quotes, invoices, AI calls 30d, last activity)
- Row click opens `AccountUsageDrawer` with: KPI cards, AI usage by function (bar chart via existing recharts), spark counts for quotes/invoices/clients over 30d.

## 2. Revoke Access

Add `profiles.access_revoked boolean default false` and `access_revoked_at timestamptz` via migration.

`admin-manage-subscription` gains two actions:
- `revoke_access`: sets `access_revoked=true`, sets `trial_ends_at = now()`, signs the user out of all sessions (`auth.admin.signOut(user_id, 'global')`), and if they have an active Stripe sub, cancels immediately.
- `restore_access`: clears `access_revoked`, optionally extends trial 14 days.

Enforcement:
- `check-subscription` returns `access_revoked` flag.
- `AuthContext` exposes `accessRevoked`; new top-level guard in `App.tsx` (or `ProtectedRoute`) redirects revoked users to a `/access-revoked` page.
- `_shared/rate-limit.ts` short-circuits all AI calls when revoked.
- RLS-side: optional follow-up; primary defense is auth gate + Stripe cancel.

UI: SubscriberTable + new UsageTable get a "Revoke access" menu item (with confirm dialog) and "Restore access" for revoked rows. Revoked rows show a red badge.

## 3. Trials Counter

`admin-revenue-stats` already returns `trialing_count` (Stripe trialing). Extend it to also return:
- `app_trial_active`: profiles with `trial_ends_at > now()` AND no Stripe sub
- `app_trial_expired_unconverted`: profiles where `trial_ends_at < now()` AND no Stripe sub AND not revoked (these are the users currently slipping through)

Show 3 KPI tiles on Revenue tab: "Stripe trialing", "App trials active", "Expired trials (not converted)". Clicking "Expired trials" filters the Subscribers/Usage tab to that segment.

## 4. Trial-Expiry Enforcement (the bug)

Today: expired-trial-without-sub → treated as `paid` tier and allowed in. Fix:

- New tier `"expired"` in `_shared/rate-limit.ts`. `resolveTier` returns `expired` when `trial_ends_at <= now()` AND no active Stripe subscription. `enforceAiQuota` rejects with 402 `upgrade_required`.
- `check-subscription` adds `trial_expired: boolean` to its response.
- Frontend: `AuthContext` exposes `trialExpired`. New guard renders a `<TrialExpiredScreen />` (upgrade CTA → existing checkout flow) for app routes, while keeping `/settings/billing` and `/auth` reachable. Super admins bypass.
- Mutating server actions for quotes/invoices/AI already gated through edge functions where applicable; for direct-RLS inserts, add a client-side check using `trialExpired` to disable "New Quote/Invoice" buttons and show upgrade banner.

## Technical changes

```text
DB migration
  ALTER TABLE profiles
    ADD COLUMN access_revoked boolean NOT NULL DEFAULT false,
    ADD COLUMN access_revoked_at timestamptz;

Edge functions
  NEW   supabase/functions/admin-account-usage/index.ts
  EDIT  supabase/functions/admin-manage-subscription/index.ts  (+revoke_access, +restore_access)
  EDIT  supabase/functions/admin-revenue-stats/index.ts        (+app trial buckets)
  EDIT  supabase/functions/check-subscription/index.ts         (+access_revoked, +trial_expired)
  EDIT  supabase/functions/_shared/rate-limit.ts               ("expired" tier + reject)

Frontend
  NEW   src/components/admin/AdminUsageTable.tsx
  NEW   src/components/admin/AccountUsageDrawer.tsx
  NEW   src/pages/TrialExpired.tsx  +  src/pages/AccessRevoked.tsx
  EDIT  src/pages/SuperAdmin.tsx              (Usage tab, expired-trial KPI)
  EDIT  src/components/admin/SubscriberTable.tsx (revoke / restore actions, revoked badge)
  EDIT  src/components/admin/ManageSubscriptionDialog.tsx (confirm dialog for revoke/restore)
  EDIT  src/components/admin/AdminRevenueCharts.tsx (3 trial KPI tiles)
  EDIT  src/contexts/AuthContext.tsx          (accessRevoked, trialExpired)
  EDIT  src/components/ProtectedRoute.tsx (or App.tsx) — gate revoked/expired users
```

All admin endpoints continue to require `is_super_admin` (already enforced). Audit logging follows existing super-admin pattern.
