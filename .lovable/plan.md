

# 🚀 ServicePro — Full Jobber Replacement

## Phase 1: Core Infrastructure & Quoting/Invoicing (Starting Now)

### 1. Dashboard & Navigation Shell
- Sidebar navigation matching Jobber's layout: Dashboard, Clients, Quotes, Jobs, Invoices, Schedule, Reports
- Top bar with search, notifications bell, quick-create button (+)
- Dark/light mode toggle
- Responsive design with collapsible sidebar on mobile

### 2. Client Management (CRM Foundation)
- Client list with search, filter, sort (name, company, status, tags)
- Client detail page: contact info, properties/service addresses, notes, activity timeline
- Add/edit client forms with validation
- Tags and custom fields for categorization
- Client status tracking (lead, active, archived)

### 3. Quoting System
- Create quotes with line items (service, description, qty, unit price, tax)
- Quote templates for common services
- Quote statuses: Draft → Sent → Approved → Converted → Expired
- PDF generation and preview
- Client approval workflow (internal tracking for now)
- Convert approved quote → Job → Invoice flow
- Quote numbering system (customizable prefix)
- Optional discount per line item or total
- Internal notes vs client-visible notes

### 4. Invoicing System
- Create invoices manually or from jobs/quotes
- Line items with tax calculation
- Invoice statuses: Draft → Sent → Viewed → Paid → Overdue
- Recurring invoices (weekly, bi-weekly, monthly schedules)
- Payment terms (Net 15, Net 30, Due on Receipt, custom)
- Invoice numbering with customizable format
- Late payment reminders (manual triggers for now)
- Credit notes and partial payments tracking
- Batch invoicing for multiple jobs

### 5. Product/Service Line Items Library
- Reusable service catalog (name, description, default price, tax rate)
- Categories for organizing services
- Quick-add from catalog when building quotes/invoices

### 6. Database & Auth (Lovable Cloud / Supabase)
- User authentication (email/password)
- Tables: clients, properties, quotes, quote_line_items, invoices, invoice_line_items, services_catalog, payments, user_roles
- Row-level security for multi-tenant readiness
- Proper role-based access (admin, manager, user)

### 7. Dashboard Home
- Revenue summary cards (outstanding, overdue, collected this month)
- Recent activity feed
- Upcoming jobs/tasks
- Quick action buttons (New Quote, New Invoice, New Client)
- Charts: revenue over time, invoice aging

## Phase 2: Payments & Integrations

### 8. Stripe Integration
- Accept credit card and ACH payments on invoices
- Payment links sent with invoices
- Automatic payment recording and status updates
- Payment receipts

### 9. QuickBooks/Xero Sync
- OAuth connection to QuickBooks Online / Xero
- Two-way sync: clients, invoices, payments
- Account mapping configuration
- Sync status dashboard and error handling

### 10. Jobber Data Import
- CSV import tool for clients, quotes, invoices
- Field mapping interface (map CSV columns → system fields)
- Import preview with validation and error highlighting
- Jobber API import option (if API access available)
- Import history log

## Phase 3: Jobs & Scheduling

### 11. Job Management
- Job creation from quotes or standalone
- Job statuses: Pending → In Progress → Complete → Invoiced
- Job details: client, property, line items, notes, photos
- Job-to-invoice conversion

### 12. Calendar & Scheduling
- Calendar view (day, week, month) with drag-and-drop
- Assign team members to jobs
- Time tracking per job
- Schedule conflicts detection

## Phase 4: Advanced Features (Future)

- Client-facing portal (approve quotes, pay invoices, request work)
- Mobile-optimized crew view
- GPS tracking and route optimization
- Automated email/SMS notifications
- Custom forms and checklists per job type
- Expense tracking
- Multi-company/franchise support (SaaS multi-tenancy)
- API for third-party integrations
- White-labeling for resale

## Design Direction
- Clean, professional UI inspired by Jobber's layout
- Consistent card-based design with clear status badges
- Action-oriented: every screen has clear primary actions
- Color-coded statuses throughout (green=paid, yellow=pending, red=overdue)

