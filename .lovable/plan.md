

# Quote & Invoice Management CRUD

## Overview

Build full CRUD for both quotes and invoices with line items, client selection, service catalog integration, status workflows, and payment recording. No database changes needed -- all tables exist with proper RLS.

## Files to Create/Edit

### New Files

| File | Purpose |
|------|---------|
| `src/hooks/useQuotes.ts` | React Query hooks: `useQuotes`, `useQuote`, `useCreateQuote`, `useUpdateQuote`, `useDeleteQuote`, `useQuoteLineItems`, `useSaveQuoteLineItems` |
| `src/hooks/useInvoices.ts` | React Query hooks: `useInvoices`, `useInvoice`, `useCreateInvoice`, `useUpdateInvoice`, `useDeleteInvoice`, `useInvoiceLineItems`, `useSaveInvoiceLineItems`, `usePayments`, `useRecordPayment` |
| `src/pages/QuoteForm.tsx` | Create/edit quote page with client selector, line items table, totals, notes |
| `src/pages/QuoteDetail.tsx` | View quote with status actions (Send, Approve, Convert to Invoice), line items, client info |
| `src/pages/InvoiceForm.tsx` | Create/edit invoice page with client selector, line items, payment terms, due date |
| `src/pages/InvoiceDetail.tsx` | View invoice with status actions (Send, Mark Paid), line items, payment history, record payment dialog |
| `src/components/LineItemsEditor.tsx` | Shared component for editing line items (used by both quote and invoice forms). Service catalog dropdown per row, qty, price, tax, discount, computed line total. Add/remove rows. |
| `src/components/ClientSelector.tsx` | Shared combobox/popover to search and select a client (used by both forms) |

### Edited Files

| File | Change |
|------|--------|
| `src/pages/Quotes.tsx` | Replace mock data with `useQuotes` hook, real filters, click navigates to `/quotes/:id` |
| `src/pages/Invoices.tsx` | Replace mock data with `useInvoices` hook, real filters, click navigates to `/invoices/:id` |
| `src/App.tsx` | Add routes: `/quotes/:id`, `/quotes/:id/edit`, `/invoices/:id`, `/invoices/:id/edit` |

## Key Design Decisions

### Quote Workflow
- **Draft** -> **Sent** (sets `sent_at`) -> **Approved** (sets `approved_at`) -> **Converted** (creates invoice from quote, links via `quote_id`)
- Status buttons shown contextually on QuoteDetail based on current status

### Invoice Workflow
- **Draft** -> **Sent** (sets `sent_at`) -> **Viewed** / **Paid** / **Overdue**
- "Record Payment" dialog on InvoiceDetail: amount, method (cash/check/credit_card/ach/stripe/other), date, reference number, notes
- Payment updates `amount_paid` and `balance_due` on invoice; auto-sets status to "paid" when `balance_due` reaches 0

### Line Items Editor (shared)
- Table with columns: Service (dropdown from services_catalog), Description, Qty, Unit Price, Tax %, Discount %, Line Total
- Selecting a service auto-fills description, unit price, and tax rate from catalog
- Add row button, delete row per row
- Computes subtotal, tax_amount, discount_amount, total in real-time
- On save: deletes existing line items for the quote/invoice, inserts new ones (simple replace strategy)

### Client Selector
- Popover with search input querying clients table
- Shows client name + company, creates the association via `client_id`

### Auto-numbering
- Reads `company_settings.next_quote_number` / `next_invoice_number` and prefix
- Increments after creation

## Technical Notes
- All hooks follow the established pattern from `useClients.ts` and `useServices.ts`
- Line items saved in a transaction-like pattern: delete old + insert new
- `user_id` set on all inserts from `useAuth`
- Warm UI styling consistent with existing pages (card-based lists, status badges, filter chips)

