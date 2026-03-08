

# ServicePro -- Current State & Full Build Plan

## What Exists Today

Everything is **frontend-only with mock data**. No database, no auth, no real CRUD.

| Area | Status |
|------|--------|
| Dashboard shell + sidebar + top bar | Done (static) |
| Clients list page | Mock table, no detail/create/edit |
| Quotes list page | Mock table, no create/edit |
| Invoices list page | Mock table, no create/edit |
| Jobs list page | Mock cards, no create/edit |
| Services catalog page | Mock table, no CRUD |
| Settings page | Static form, no persistence |
| Schedule page | Placeholder |
| Reports page | Placeholder |

**No backend. No auth. No forms. No line items. No PDF. No integrations.**

---

## Build Phases (Ordered by Priority)

### Phase 1A: Database & Auth Foundation
1. Enable Lovable Cloud / Supabase
2. Create database schema: `clients`, `properties`, `quotes`, `quote_line_items`, `invoices`, `invoice_line_items`, `services_catalog`, `payments`, `company_settings`
3. Create `user_roles` table with `has_role()` security definer function
4. Enable RLS on all tables
5. Auth: email/password sign-up, login, protected routes

### Phase 1B: Client Management (Full CRUD)
1. Client create/edit form (name, company, email, phone, address, tags, status, notes)
2. Client detail page with tabs: overview, properties, quotes, invoices, notes/activity
3. Properties/service addresses per client
4. Working search, filter by status, sort columns
5. Delete/archive client with confirmation

### Phase 1C: Service Catalog (Full CRUD)
1. Add/edit/delete services with name, description, default price, tax rate, category
2. Category management
3. Active/inactive toggle

### Phase 1D: Quoting System
1. Quote create form: select client, add line items from catalog or custom, qty, unit price, discount, tax
2. Line item editor (add/remove/reorder rows, subtotal/tax/total calculation)
3. Quote detail/preview page matching Jobber's layout
4. Status workflow: Draft -> Sent -> Approved -> Converted -> Expired
5. Internal notes vs client-visible notes fields
6. Customizable numbering (prefix from settings)
7. Duplicate quote action
8. Convert quote to invoice (carry over line items + client)

### Phase 1E: Invoicing System
1. Invoice create form (same line item editor as quotes)
2. Create invoice from quote (pre-filled)
3. Invoice detail/preview page
4. Status workflow: Draft -> Sent -> Viewed -> Paid -> Overdue
5. Payment terms (Net 15, Net 30, Due on Receipt)
6. Record manual payments (partial/full), payment history
7. Recurring invoice setup (frequency, start/end)
8. Credit notes
9. Invoice numbering from settings
10. Batch invoicing (select multiple jobs -> generate invoices)

### Phase 1F: PDF Generation
1. Quote PDF template (company header, line items, totals, terms)
2. Invoice PDF template
3. Download and print actions

### Phase 1G: Dashboard (Live Data)
1. Wire KPI cards to real aggregated data (revenue MTD, outstanding, overdue, active quotes)
2. Revenue chart from actual invoice/payment data
3. Invoice aging from real invoice dates
4. Recent activity feed from actual records
5. Quick actions already wired

### Phase 1H: Settings (Persistent)
1. Save/load company info from `company_settings` table
2. Invoice/quote prefix and numbering
3. Default tax rate
4. Dark/light mode toggle in top bar

---

### Phase 2A: Stripe Payments
1. Enable Stripe integration
2. Payment links on invoices
3. Credit card + ACH acceptance
4. Auto-record payments on invoice when Stripe webhook confirms
5. Payment receipts

### Phase 2B: QuickBooks / Xero Sync
1. OAuth connection flow in Settings -> Integrations
2. Sync clients, invoices, payments to QuickBooks Online
3. Account mapping configuration
4. Sync status + error log dashboard

### Phase 2C: Jobber Data Import
1. CSV upload UI with drag-and-drop
2. Field mapping interface (map columns to system fields)
3. Preview with validation and error rows highlighted
4. Import clients, quotes, invoices in batch
5. Import history log

---

### Phase 3: Jobs & Scheduling
1. Job CRUD: create from quote or standalone, assign crew, track status
2. Job detail page with line items, notes, photos
3. Job -> Invoice conversion
4. Calendar view (day/week/month) with drag-and-drop scheduling
5. Team member assignment
6. Time tracking per job

### Phase 4: Advanced
1. Client-facing portal (approve quotes, pay invoices online)
2. Email/SMS notifications (quote sent, invoice due, payment received)
3. Mobile crew view
4. Route optimization
5. Custom forms/checklists per job type
6. Multi-tenant SaaS (white-labeling, subscription billing)
7. API for third-party integrations

---

## Recommended Next Step

Start with **Phase 1A** -- enable Lovable Cloud and build the full database schema + auth. Everything else depends on this foundation. Once the schema is in place, we build Client CRUD (1B) and Service Catalog (1C) in parallel, then move to Quoting (1D) and Invoicing (1E).

