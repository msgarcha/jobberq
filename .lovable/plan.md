

# Production-Ready Invoice & Quote System Enhancements

## Current State Assessment

**What's working:**
- Full CRUD for Clients, Services, Quotes, Invoices, Jobs
- Quote workflow: Draft → Sent → Approved → Convert to Invoice
- Invoice workflow: Draft → Sent → Record Payment → Paid
- Line items editor with service catalog integration
- Job scheduling with calendar view
- Company settings with prefixes and numbering
- Authentication with login/signup/reset password

**What's missing (your requests):**

### 1. Duplicate Invoice for New Billing
No "Duplicate" button exists on InvoiceDetail. Need a button that clones an invoice (with its line items) as a new draft with a fresh invoice number.

### 2. Recurring / Auto-Billing
The database already has `is_recurring`, `recurring_frequency`, `recurring_start`, `recurring_end` columns on invoices, plus the `recurring_frequency` enum (weekly, biweekly, monthly, quarterly, yearly). But the UI doesn't expose these fields, and there's no automated generation of recurring invoices.

### 3. Paid Invoices Properly Separated
The Invoices list page already has a "Paid" filter chip, so paid invoices can be filtered. But the default "All" view mixes everything. We should show unpaid invoices by default and make the paid section more distinct.

### 4. Dashboard Uses Mock Data
The Index page has hardcoded KPIs, schedule, to-do items, and activity feed -- none connected to real data.

## Implementation Plan

### A. Duplicate Invoice (InvoiceDetail.tsx + useInvoices.ts)
- Add `useDuplicateInvoice` hook that copies invoice + line items with new number, resets status to "draft", clears payment fields
- Add "Duplicate" button on InvoiceDetail next to Edit/Send actions

### B. Recurring Invoice Settings (InvoiceForm.tsx + InvoiceDetail.tsx)
- Add recurring toggle + frequency/start/end fields to InvoiceForm
- Show recurring badge and info on InvoiceDetail
- Create edge function `generate-recurring-invoices` that:
  - Queries all recurring invoices where next billing date has passed
  - Creates new invoice copies with updated dates
  - Set up via cron (daily check)

### C. Invoice List UX (Invoices.tsx)
- Default filter to show non-paid ("Active") instead of "All"
- Reorder filters: Active | Draft | Sent | Overdue | Paid
- Show balance due alongside total on each card

### D. Live Dashboard (Index.tsx)
- Replace hardcoded KPIs with real queries: revenue MTD (sum of paid invoices this month), outstanding balance, overdue count, active quotes
- Today's schedule from `useJobsByDate`
- Recent activity from latest invoices/quotes/clients

### E. Reports Page (Reports.tsx)
- Wire up Revenue Summary with real invoice data using recharts
- Invoice aging report with real overdue/outstanding data

## Files

| File | Action |
|------|--------|
| `src/hooks/useInvoices.ts` | Add `useDuplicateInvoice` hook |
| `src/pages/InvoiceDetail.tsx` | Add Duplicate button, show recurring info |
| `src/pages/InvoiceForm.tsx` | Add recurring fields (toggle, frequency, start/end) |
| `src/pages/Invoices.tsx` | Default to "Active" filter, show balance due, better layout |
| `src/pages/Index.tsx` | Replace mock data with live queries |
| `src/pages/Reports.tsx` | Wire up revenue + aging reports with real data |
| `supabase/functions/generate-recurring-invoices/index.ts` | Edge function for auto-generating recurring invoices |

## Database
No schema changes needed -- all recurring fields already exist on the invoices table.

A cron job will be set up to call the edge function daily for recurring invoice generation.

