

## Comprehensive Reports Page — Jobber-Style

### Overview
Replace the current basic Reports page with a full financial reporting dashboard featuring date range filters, KPI summary cards, detailed invoice/payment tables, and multiple chart views.

### Structure

**1. Date Range Filter Bar**
- Preset buttons: This Month, Last Month, This Quarter, This Year, Last Year, All Time
- Custom date range picker (two date inputs)
- All charts/tables/KPIs filter based on selected range

**2. KPI Summary Cards (top row, 4 cards)**
- **Total Revenue** — sum of paid invoices in period
- **Outstanding** — total balance_due on unpaid invoices
- **Overdue** — balance_due where status=overdue or past due_date
- **Collected This Period** — sum of payments in the date range

**3. Revenue Over Time Chart**
- Bar chart grouped by month (or week for shorter ranges)
- Shows paid revenue per period
- Already exists but will be enhanced with date filtering

**4. Invoice Status Breakdown**
- Pie/donut chart: Draft, Sent, Viewed, Paid, Overdue counts and dollar amounts
- Replaces current aging chart with more useful status distribution

**5. Invoice Aging Report (enhanced)**
- Keep existing aging buckets but as a horizontal bar chart
- Current, 1-30, 31-60, 60+ days overdue

**6. Payments Table**
- Fetch from `payments` table within date range
- Columns: Date, Invoice #, Client, Amount, Method, Reference
- Sortable, shows payment method (cash, card, bank, etc.)
- This addresses "payment from proservice to bank" — shows all recorded payments

**7. Invoice History Table**
- All invoices in the date range
- Columns: Invoice #, Client, Date, Due Date, Total, Paid, Balance, Status
- Filter by status within the table
- Scrollable on mobile

### Files to Edit
- `src/pages/Reports.tsx` — complete rewrite with all sections above

### Files to Create
- None needed — all logic fits in the Reports page using existing hooks (`useInvoices`) plus a new inline query for payments

### Data Sources
- Invoices: `useInvoices()` (already fetches all with client join)
- Payments: new `useQuery` fetching from `payments` table joined with `invoices` for invoice_number and client info
- All filtering done client-side since data volumes are manageable

### Mobile Responsive
- KPI cards: 2-col grid on mobile
- Charts: full width, stacked vertically
- Tables: horizontal scroll with sticky first column
- Date filter: horizontal scroll pills, custom picker in a sheet/popover

### No Database Changes
All data already exists in `invoices` and `payments` tables. Just querying and displaying it differently.

