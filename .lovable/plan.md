

## Super Admin Dashboard

### Overview
A separate, protected dashboard for platform super admins to manage all subscribers, trials, subscriptions, and view platform-wide revenue analytics. Super admin access is determined by a new `super_admin` boolean on the `profiles` table (NOT client-side storage).

### Database Changes

1. **Add `is_super_admin` column to `profiles`** — `boolean DEFAULT false`. This is checked server-side in edge functions.
2. **No new enum value needed** — keeping it as a simple flag on profiles avoids touching the app_role enum which is team-scoped.

### New Edge Functions

1. **`supabase/functions/admin-list-subscribers/index.ts`**
   - Verifies caller is super admin (check profiles.is_super_admin via service_role)
   - Fetches all Stripe customers with subscriptions (active, trialing, past_due, canceled)
   - Joins with profiles/auth.users for display names and emails
   - Returns: list of subscribers with status, tier, trial_ends_at, current_period_end, payment failures

2. **`supabase/functions/admin-manage-subscription/index.ts`**
   - Verifies super admin
   - Actions: `extend_trial`, `cancel`, `grant_free`, `change_tier`, `resume`
   - Uses Stripe API to modify subscriptions directly
   - For "grant free": creates a 100% off coupon or sets trial_end far in future
   - For "extend trial": updates trial_end on the Stripe subscription

3. **`supabase/functions/admin-revenue-stats/index.ts`**
   - Verifies super admin
   - Fetches Stripe balance transactions, charges, and subscription metrics
   - Returns: MRR, total revenue, new subscribers this month, churn count, revenue by month (last 12 months)

### New Frontend Files

1. **`src/pages/SuperAdmin.tsx`** — Main dashboard with tabs:
   - **Subscribers** — Table of all users: email, plan, status (active/trialing/past_due/canceled), trial end, next billing, actions dropdown (extend trial, cancel, change tier, grant free)
   - **Revenue** — MRR card, total revenue card, new subs this month, churn rate, revenue-over-time bar chart (recharts)
   - **Pricing** — Display current tier pricing from `subscriptionTiers.ts`, with note that Stripe dashboard is needed for price changes (since prices are Stripe-managed)

2. **`src/components/admin/SubscriberTable.tsx`** — Searchable/filterable table of all subscribers with action dropdowns
3. **`src/components/admin/AdminRevenueCharts.tsx`** — Revenue charts and KPI cards
4. **`src/components/admin/ManageSubscriptionDialog.tsx`** — Dialog for extend trial (date picker), change tier (dropdown), cancel, grant free

### Route & Access Control

- Route: `/super-admin` in App.tsx
- **`src/components/SuperAdminRoute.tsx`** — Wraps children, checks `profiles.is_super_admin` via a query. Redirects non-admins to `/`.
- Add a subtle link in the sidebar footer (only visible to super admins) or accessible via direct URL

### Auth Context Changes

- Add `isSuperAdmin: boolean` to AuthContext
- Load from profiles table when session loads
- Used to conditionally show the super admin nav link

### Implementation Order

1. Database migration: add `is_super_admin` to profiles
2. Three edge functions (list subscribers, manage subscription, revenue stats)
3. SuperAdminRoute guard component
4. SuperAdmin page with all three tabs
5. Update AuthContext to load super admin flag
6. Add conditional sidebar link

### Security

- All edge functions verify `is_super_admin` server-side using service_role key
- The flag cannot be set by users (no RLS policy allows updating is_super_admin — we add a trigger or handle via service_role only)
- Frontend route guard is just UX; real protection is in the edge functions

