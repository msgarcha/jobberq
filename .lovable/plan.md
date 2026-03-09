

## Super Admin Audit Logging

### Overview
Add an `admin_audit_logs` table and wire it into the `admin-manage-subscription` edge function so every super admin action is recorded. Then add an "Activity Log" tab to the Super Admin dashboard to view the history.

### Database Changes
Create a new `admin_audit_logs` table via migration:
- `id` (uuid, PK)
- `admin_user_id` (uuid, not null) — the super admin who performed the action
- `action` (text, not null) — e.g. `extend_trial`, `cancel`, `resume`, `change_tier`, `grant_free`, `extend_app_trial`
- `target_email` (text) — the subscriber's email
- `target_subscription_id` (text, nullable) — Stripe subscription ID if applicable
- `details` (jsonb, nullable) — action-specific params (trial_end_date, new_price_id, etc.)
- `created_at` (timestamptz, default now())

RLS: Only super admins can SELECT (using a security definer function check on `profiles.is_super_admin`). No client-side inserts — all writes happen via service role in the edge function.

### Edge Function Changes (`admin-manage-subscription/index.ts`)
After each successful action (inside each `case` block, before returning), insert a row into `admin_audit_logs` using the `supabaseAdmin` client (service role), capturing:
- `admin_user_id`: the authenticated user's ID
- `action`: the switch case action string
- `target_email`: from request body or looked up from Stripe
- `target_subscription_id`: from request body
- `details`: remaining params as JSON

### Frontend Changes

1. **New component `src/components/admin/AdminAuditLog.tsx`**
   - Fetches logs from a new edge function `admin-list-audit-logs`
   - Displays a table with columns: Date, Admin, Action, Target, Details
   - Uses badges for action types, formats timestamps with `date-fns`

2. **New edge function `supabase/functions/admin-list-audit-logs/index.ts`**
   - Authenticates caller, verifies super admin status
   - Queries `admin_audit_logs` ordered by `created_at DESC`, limit 200
   - Joins with `profiles` to get admin display name

3. **Update `src/pages/SuperAdmin.tsx`**
   - Add a fourth tab "Activity Log" to the TabsList
   - Import and render `AdminAuditLog` in the new TabsContent

### Summary of files touched
- 1 migration (create table + RLS policy)
- `supabase/functions/admin-manage-subscription/index.ts` — add audit log insert
- `supabase/functions/admin-list-audit-logs/index.ts` — new edge function
- `supabase/config.toml` — add verify_jwt config for new function (auto-managed)
- `src/components/admin/AdminAuditLog.tsx` — new component
- `src/pages/SuperAdmin.tsx` — add Activity Log tab

