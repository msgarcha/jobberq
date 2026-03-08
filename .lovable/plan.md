

# PDF Generation for Invoices and Quotes

## Approach

Use the browser's built-in `window.print()` with a dedicated print-optimized view. This is the most reliable approach -- no external libraries needed, works everywhere, and produces high-quality PDFs via the browser's "Save as PDF" option.

Create a shared `PrintableDocument` component that renders a clean, print-ready layout (no sidebar, no nav, no action buttons). Both InvoiceDetail and QuoteDetail get a "Download PDF" button that opens a new window with the printable view, which auto-triggers print.

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/PrintableInvoice.tsx` | Print-optimized invoice layout with company info, client info, line items table, totals, and notes |
| `src/components/PrintableQuote.tsx` | Print-optimized quote layout (same structure, different labels) |
| `src/pages/InvoicePrint.tsx` | Route wrapper that loads invoice data and renders `PrintableInvoice`, auto-calls `window.print()` |
| `src/pages/QuotePrint.tsx` | Route wrapper that loads quote data and renders `PrintableQuote`, auto-calls `window.print()` |

## Files to Edit

| File | Change |
|------|--------|
| `src/pages/InvoiceDetail.tsx` | Add "Download PDF" button (opens `/invoices/:id/print` in new tab) |
| `src/pages/QuoteDetail.tsx` | Add "Download PDF" button (opens `/quotes/:id/print` in new tab) |
| `src/App.tsx` | Add routes for `/invoices/:id/print` and `/quotes/:id/print` |

## Design

- Print pages use `@media print` CSS to hide browser chrome and render a clean A4-sized document
- Company logo + name from `useCompanySettings` displayed in header
- Client billing info on the left, document number/date on the right
- Full line items table with subtotal/tax/discount/total summary
- Notes section at the bottom
- `useEffect` triggers `window.print()` after data loads, then `window.close()` after print dialog
- No external dependencies needed

