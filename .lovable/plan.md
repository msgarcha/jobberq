

# Convert ServicePro into a Multi-Tenant SaaS

This is a large initiative with four pillars. Given the scope, I recommend implementing them in phases across multiple messages. Here's the full plan:

---

## Phase 1: Landing Page + Onboarding Wizard

### Landing Page (`/landing`)
- Create `src/pages/Landing.tsx` -- a public marketing page with:
  - Hero section with headline, subtext, and "Start Free Trial" CTA
  - Feature grid (Clients, Quotes, Invoices, Jobs, Schedule, Payments)
  - Pricing section (3 tiers: Free trial, Pro, Business)
  - Footer with links
- Update `App.tsx` routing: unauthenticated users hitting `/` see Landing, authenticated users see Dashboard
- Move login/signup to `/login` (already there)

### Onboarding Wizard (`/onboarding`)
- Create `src/pages/Onboarding.tsx` -- a multi-step wizard shown after first signup:
  - **Step 1**: Company name + logo upload
  - **Step 2**: Address + phone + email
  - **Step 3**: Default tax rate + payment terms + invoice prefix
  - **Step 4**: "Add your first client" (optional, skip)
- Detect first-time user by checking if `company_settings` row exists; if not, redirect to `/onboarding`
- On completion, create the `company_settings` row and redirect to dashboard

---

## Phase 2: Subscription Billing (Stripe)

### Products & Prices
- Create Stripe products/prices for 2-3 tiers (e.g., Starter $29/mo, Pro $79/mo, Business $149/mo)
- Store tier config as a const map in `src/lib/subscriptionTiers.ts`

### Edge Functions
- `create-checkout` -- creates a Stripe Checkout session in subscription mode
- `check-subscription` -- verifies active subscription by customer email
- `customer-portal` -- opens Stripe billing portal for plan management

### Frontend
- Add subscription state to `AuthContext` (subscribed, tier, end date)
- Auto-check subscription on login and periodically
- Gate features behind subscription (e.g., free trial = 5 clients, Pro = unlimited)
- Add billing page at `/settings/billing` with current plan, upgrade/downgrade, manage subscription

### Trial Logic
- New signups get a 14-day free trial (no credit card required)
- Store `trial_ends_at` in a new column on `profiles` table
- After trial expires, show upgrade prompt on dashboard

---

## Phase 3: Team / Multi-User Support

### Database Changes
- Create `teams` table: `id`, `name`, `owner_id`, `created_at`
- Create `team_members` table: `id`, `team_id`, `user_id`, `role` (owner/admin/member), `invited_at`, `joined_at`
- Add `team_id` column to: `clients`, `invoices`, `quotes`, `jobs`, `payments`, `company_settings`, `services_catalog`, `properties`, `invoice_line_items`, `quote_line_items`
- Update all RLS policies to scope by `team_id` instead of just `user_id` (team members share data)
- Auto-create a team for each new user signup (solo team)

### Invite Flow
- Create `team_invitations` table: `id`, `team_id`, `email`, `role`, `token`, `expires_at`, `accepted_at`
- Edge function `send-team-invite` to send invitation emails
- `/invite/:token` page to accept invitations
- Team management UI in Settings (invite members, change roles, remove members)

### Auth Updates
- After login, determine which team the user belongs to
- Store `activeTeamId` in context
- All data queries filter by `team_id`

---

## Phase 4: Email Notifications (deferred)

This requires an email provider. Options:
- Set up a custom email domain through Lovable Cloud for branded transactional emails
- Or use a third-party service like Resend

I recommend tackling this after the core SaaS pieces are in place.

---

## Implementation Order

Given the complexity, I recommend building this across multiple messages:

1. **Message 1**: Landing page + routing changes
2. **Message 2**: Onboarding wizard
3. **Message 3**: Subscription billing (Stripe products, edge functions, billing UI)
4. **Message 4**: Team support (DB schema, RLS, invite flow)
5. **Message 5**: Polish + email notifications

### Files Summary

| Area | New Files | Modified Files |
|------|-----------|----------------|
| Landing | `src/pages/Landing.tsx` | `App.tsx` |
| Onboarding | `src/pages/Onboarding.tsx` | `App.tsx`, `ProtectedRoute.tsx` |
| Billing | `src/lib/subscriptionTiers.ts`, 3 edge functions | `AuthContext.tsx`, `Settings.tsx`, `App.tsx` |
| Teams | DB migration (5+ tables/columns) | All hooks, all pages, `AuthContext.tsx`, RLS policies |

Shall I start with Phase 1 (Landing page + Onboarding wizard)?

