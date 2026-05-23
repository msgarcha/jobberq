# Legal Pages: Terms of Service & Privacy Policy

Add real, production-grade legal pages for QuickLinq (operated by Quiresoft Technologies Inc., BC Canada), wire them into the footer, and require explicit agreement on signup.

## Scope

**New pages**
- `/terms` — Terms of Service
- `/privacy` — Privacy Policy

Both rendered as public, SEO-friendly long-form pages using existing `LandingNav` + `LandingFooter` shell, `Seo` component, and `prose` typography. Mobile-first, anchor links for sections, "Last updated" date, print-friendly.

**Signup flow update (`src/pages/Login.tsx`)**
- Add a required checkbox above the "Create Account" button:
  > "I agree to the [Terms of Service](/terms) and [Privacy Policy](/privacy)."
- Button disabled until checked.
- Persist acceptance on signup by writing `terms_accepted_at` + `terms_version` to the user's `profiles` row (via a small upsert after `supabase.auth.signUp` succeeds).

**Footer update (`src/components/landing/LandingFooter.tsx`)**
- Replace the current placeholder "Privacy Policy" / "Terms of Service" buttons (which navigate to `/landing`) with real `<Link>`s to `/privacy` and `/terms`.
- Add a small corporate line: "QuickLinq is a product of Quiresoft Technologies Inc., a company registered in British Columbia, Canada."

**Routing (`src/App.tsx`)**
- Register `/terms` and `/privacy` as public routes (no auth required).

## Legal content (drafted in-app, Jobber-style structure)

Both documents will be written as substantive legal text — not lorem ipsum — modeled on the structure used by Jobber, Stripe, and similar SaaS providers, then tailored to QuickLinq's actual product (quotes, invoices, payments via Stripe Connect, AI features, team/multi-tenant). They explicitly state:

- **Operator identity:** "QuickLinq is a product operated by **Quiresoft Technologies Inc.** ('Quiresoft', 'we', 'us'), a corporation registered in **British Columbia, Canada**. QuickLinq is a wholly-owned subsidiary product of Quiresoft Technologies Inc."
- **Governing law:** Province of British Columbia, Canada; courts of BC for disputes.
- **Limitation of liability:** Standard SaaS cap — Quiresoft's aggregate liability limited to fees paid by the customer in the 12 months preceding the claim; no liability for indirect, incidental, consequential, special, or punitive damages; service provided "AS IS" and "AS AVAILABLE" to the extent permitted by law.
- **Payments via Stripe:** All card processing, payouts, Connect onboarding, refunds, chargebacks, and disputes are handled by **Stripe, Inc.** and **Stripe Payments Canada, Ltd.** Users and their end-customers are bound by the **Stripe Services Agreement** and **Stripe Connected Account Agreement** (linked). Quiresoft is not a payment processor, not a money transmitter, and does not hold funds. The 10% application fee on processed payments is disclosed.
- **AI features disclosure:** Inputs to AI assistant features may be processed by third-party model providers (Google, OpenAI) via the Lovable AI Gateway; outputs are provided "as is" and should be reviewed before use.
- **Acceptable use, account termination, data ownership** (customer owns their data; Quiresoft has a limited license to operate the service), **suspension for non-payment**, **modifications to the Terms** (with notice).

### Terms of Service — sections
1. Acceptance & eligibility
2. Definitions (Quiresoft, QuickLinq, Customer, End Client, Service)
3. Accounts, teams, and access
4. Subscriptions, trials, billing, taxes, auto-renewal, refunds
5. Payment processing through Stripe (rights, fees, disputes, payouts)
6. Customer data & content (ownership, license to Quiresoft, backups)
7. Acceptable use policy
8. AI-assisted features
9. Third-party services & integrations
10. Confidentiality
11. Intellectual property
12. Term, suspension, and termination
13. Disclaimers & warranties
14. **Limitation of liability** (12-month fees cap, exclusions)
15. Indemnification (by Customer for misuse; by Quiresoft for IP infringement, capped)
16. Governing law (BC, Canada) & dispute resolution
17. Changes to the Terms
18. Notices, assignment, severability, entire agreement
19. Contact: legal@quicklinq.app

### Privacy Policy — sections (PIPEDA + GDPR-aware)
1. Who we are (Quiresoft Technologies Inc., BC)
2. Scope (Customers vs. End Clients of Customers)
3. Information we collect (account, business, client/job/invoice data, payment metadata via Stripe, usage/analytics, device, cookies)
4. How we use information (provide the Service, billing, support, security, product improvement, AI features, communications)
5. Legal bases (PIPEDA consent / GDPR contract & legitimate interest)
6. Sharing & sub-processors (Supabase/Lovable Cloud, Stripe, Resend, AI providers, hosting/CDN) — table format
7. International transfers (data may be processed in Canada, US, EU)
8. Retention
9. Security (encryption in transit & at rest, RLS, access controls)
10. Your rights (access, correction, deletion, portability, withdraw consent; how to exercise)
11. Children (Service not directed to under 16)
12. Cookies & similar technologies
13. Changes to this Policy
14. Contact & Privacy Officer: privacy@quicklinq.app

A clear non-legal-advice notice is included in code comments — these are tailored templates, and Quiresoft should have BC counsel review before production launch.

## Database change

Add two nullable columns to `public.profiles` to record consent:
- `terms_accepted_at timestamptz`
- `terms_version text` (e.g. `"2026-05-23"`)

Migration runs via the standard migration tool. No RLS changes (existing profile policies already restrict to owner).

## Out of scope
- Cookie banner / consent management UI
- DPA, sub-processor change notifications, or in-app legal document versioning UI
- Re-prompting existing users to re-accept (only new signups will be gated; existing users can be migrated in a later pass if desired)
- Translations
