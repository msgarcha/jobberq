

## Import Jobber Invoices with Full Data Preservation

### Problem
The current import system only supports clients, services, and jobs — not invoices. Your Jobber CSV contains 458 invoices with rich data: invoice numbers, client details, line items, taxes, discounts, deposits, payment dates, and statuses. All of this needs to be imported and linked to the correct clients so that when you open a client, all their invoices appear.

### CSV Fields to Capture
Every column from the Jobber invoice export will be preserved:
- **Invoice #** → `invoice_number`
- **Client name/email/phone** → match to existing clients (or create new ones)
- **Subject** → `title`
- **Created date, Issued date, Due date, Marked paid date** → `created_at`, `sent_at`, `due_date`, `paid_at`
- **Status** (Paid, Awaiting Payment, Past Due, Draft) → mapped to our statuses (paid, sent, overdue, draft)
- **Pre-tax total, Total, Balance, Tax amount, Discount, Deposit** → `subtotal`, `total`, `balance_due`, `tax_amount`, `discount_amount`, `amount_paid`
- **Line items** string → parsed into individual `invoice_line_items` rows with description, quantity, unit_price
- **Tax (%)** → extract rate (e.g., "GST (5.0%)" → 5.0) for line items

### Plan

#### 1. Add `invoices` as an import data type
Update `src/lib/columnMappings.ts`:
- Add `INVOICE_FIELDS` with all relevant field definitions
- Add a `JOBBER_INVOICE_MAP` mapping Jobber headers to field keys
- Add `'invoices'` to the `ImportDataType` union and `getFieldsForType`

#### 2. Build invoice import logic in `src/pages/ImportData.tsx`
Add a new `dataType === 'invoices'` branch in `handleImport`:

**Client matching**: For each invoice row, look up the client by email (primary) or name (fallback) from existing clients in the database. If no match, auto-create the client with the billing info from the CSV row.

**Date parsing**: Jobber uses `"Mar 03, 2026"` format — add a parser for `MMM DD, YYYY`.

**Status mapping**:
- `Paid` → `paid`
- `Awaiting Payment` → `sent`
- `Past Due` → `overdue`
- `Draft` → `draft`
- `Bad Debt` → `overdue`

**Financial fields**:
- `amount_paid` = `total - balance_due`
- `discount_amount` from CSV
- Deposit captured in internal notes (no dedicated column in our schema)

**Line items parsing**: Parse strings like `"Monthly SEM (1, $500), CRM charges (1, $75)"` using regex. Each item becomes an `invoice_line_items` row with description, quantity, unit_price, tax_rate (extracted from the Tax % column), and computed line_total.

**Deduplication**: Skip invoices where `invoice_number` already exists in the database.

**Invoice number counter**: After import, update `company_settings.next_invoice_number` to be higher than the max imported number.

#### 3. Update the Import UI
- Add "Invoices" option to the data type selector in `FileUploader`
- The existing map → preview → import flow works as-is since we're adding proper field definitions

#### 4. Client-Invoice linking
Since each imported invoice gets the correct `client_id`, the existing `useClientInvoices` hook in `ClientDetail.tsx` will automatically show all imported invoices under each client — no changes needed there.

### Files Changed
- `src/lib/columnMappings.ts` — add INVOICE_FIELDS, JOBBER_INVOICE_MAP, update types
- `src/pages/ImportData.tsx` — add invoice import logic with client matching, line item parsing, date handling
- `src/components/import/FileUploader.tsx` — add "Invoices" data type option

### What Gets Preserved (nothing missed)
Invoice #, client link, subject, all 4 dates, status, subtotal, total, tax amount, discount, deposit, balance, amount_paid, every individual line item with qty and price, tax rate per line item, and the client association for browsing invoices from the client detail page.

