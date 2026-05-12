# Leads Inbox — Pricing Form Submissions

## Where leads go today (already wired)
When someone submits a public pricing form, the `submit-pricing-form` edge function:
1. Looks up `clients` by `team_id + email`. If found, reuses it. If not, inserts a new client with `status='lead'` and `lead_source='pricing_form'`.
2. Creates a draft `quote` with all the chosen services as line items (server-side priced).
3. Records the full submission in `pricing_form_submissions` (contact JSON, selected services, answers, computed totals, `client_id`, `quote_id`, `status='converted'`).

So data is already de-duplicated and integrated — there just isn't a dedicated UI for it. Today these leads only appear mixed into Clients (filter "Leads") and the draft quote shows up in Quotes.

## What we'll build

A dedicated **Leads** workspace that treats each pricing-form submission as a lead card with a clear pipeline.

### 1. Lead status model (lives on `pricing_form_submissions.status`)
Repurpose the existing `status` column (already there, currently set to `'converted'`) into a real pipeline:

- `new` — submission just arrived, owner hasn't acted
- `quoted` — quote has been sent to the client (we flip this when the linked quote moves from `draft` → `sent`)
- `won` — quote was approved OR an invoice was generated from it
- `lost` — owner manually marks dead

Auto-transitions:
- On insert from edge function → `new` (change default from `'converted'`)
- When linked quote `status` becomes `sent` → bump submission to `quoted`
- When linked quote `status` becomes `approved`, or an invoice is created from it → `won`
- Manual override always allowed by team members

We'll do auto-transitions with a small Postgres trigger on `quotes` that updates the matching `pricing_form_submissions` row by `quote_id`. No client trust needed.

### 2. Routes & navigation
- New sidebar entry **Leads** (between Clients and Quotes), icon `Inbox`.
- `/leads` — list view (tabs: New • Quoted • Won • Lost • All)
- `/leads/:id` — detail drawer/page

### 3. Leads list (`/leads`)
Columns: Name, Source form, Submitted, Total, Status badge, quick actions.
Filters: status tab, form, date range, search by name/email.
Row click opens detail.

### 4. Lead detail (`/leads/:id`)
Single screen showing everything from the submission:
- Contact card (name, email, phone, address) with link to the underlying client record
- Selected services + answers (read-only, exactly what they picked)
- Computed subtotal / tax / total
- Linked draft quote (with its current status) and any resulting invoice
- Action buttons:
  - **Open quote** → jumps to `/quotes/:quote_id` (already pre-filled from submission)
  - **Send quote** → reuses existing quote-send flow; will auto-flip lead to `quoted`
  - **Convert to invoice** → uses existing quote→invoice path; will auto-flip to `won`
  - **Mark won / lost** (manual override)
  - **Archive**

### 5. Anti-duplication (reinforce what's there)
- Edge function already matches client by `team_id + email`. Add a partial unique index `(team_id, lower(email)) WHERE email IS NOT NULL` on `clients` to make this guarantee at the DB level and stop races.
- When a returning lead submits again, the new submission attaches to the existing client and creates a new draft quote — surfaced in the lead detail's "previous submissions" list.

### 6. Notifications (optional, low effort)
Reuse `device_tokens` push channel + email to notify the team owner on each new lead. Stub now, ship in a follow-up if not in scope.

## Technical section

**Migrations**
- `ALTER TABLE pricing_form_submissions ALTER COLUMN status SET DEFAULT 'new';`
- Backfill: `UPDATE pricing_form_submissions SET status='new' WHERE status='converted' AND quote_id IN (SELECT id FROM quotes WHERE status='draft');` and `'quoted'`/`'won'` for sent/approved.
- Add CHECK-via-trigger validating status ∈ {new, quoted, won, lost}.
- Trigger `pricing_form_sub_sync_from_quote` AFTER UPDATE ON quotes: if NEW.status='sent' set submission.status='quoted'; if 'approved' set 'won'.
- Trigger `pricing_form_sub_sync_from_invoice` AFTER INSERT ON invoices: if NEW.quote_id matches a submission, set 'won'.
- `CREATE UNIQUE INDEX clients_team_email_uniq ON clients(team_id, lower(email)) WHERE email IS NOT NULL;` (run a dedupe pass first — collapse duplicates into oldest row, repoint quotes/invoices/jobs).
- Update `submit-pricing-form` edge function: change initial `status` insert from `'converted'` to `'new'`; use `lower(email)` lookup.

**Frontend**
- New hook `src/hooks/useLeads.ts` (TanStack Query):
  - `useLeads(filters)` joins `pricing_form_submissions` → `quotes(id, quote_number, status, total)` and `clients(first_name, last_name, email, phone)`.
  - `useUpdateLeadStatus(id, status)`.
- New pages: `src/pages/Leads.tsx`, `src/pages/LeadDetail.tsx`.
- Sidebar update in `AppSidebar.tsx` (add Leads under Main).
- Route registration in `App.tsx`.
- Reuse existing `Badge`, `Table`, `Card`, `Button` primitives — no new design tokens.

**RLS** — already in place: team members can SELECT/UPDATE `pricing_form_submissions` scoped by `team_id`. No new policies needed beyond confirming UPDATE allows status field.

**No duplication of contacts**: the edge function is the single write path for lead-derived clients, and the new unique index makes accidental dupes impossible going forward.

## Out of scope for this pass
- Push/email notification on new lead (note where to wire it).
- Lead assignment to specific team members.
- Custom pipeline stages per team.
