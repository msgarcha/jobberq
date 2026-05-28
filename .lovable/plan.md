# Auto Payment Receipt to Client (with PDF)

## Goal
When an online payment makes an invoice fully paid, automatically email the **client** a branded "Payment received" message — like the Jobber screenshot — containing both a **Download receipt (PDF)** button and a **View invoice online** button. This sends only when the invoice becomes paid in full.

## Current behavior
- Online payments go through `create-payment-intent` (destination charge on the platform account) → the `stripe-webhook` function handles `payment_intent.succeeded`, records the payment, marks the invoice paid, and notifies **only the business owner** (`notifyOwner`). The client gets nothing.
- Invoice PDFs are only generated in the browser today (`PrintableInvoice.tsx`) — there is no server-side PDF.
- The branded email domain (`notify.quicklinq.ca`) is verified and ready.

## What will change

### 1. Server-side PDF generation (new edge function `generate-invoice-pdf`)
- Accepts an `invoice_id`, loads the invoice, line items (`invoice_line_items`), client, and company settings (logo, name, address, brand colors) using the service role.
- Renders a clean, branded **paid invoice / receipt** PDF (company header, bill-to, line items, totals, a "PAID" marker, payment date and amount).
- Uploads it to a new public storage bucket `invoice-receipts` under an unguessable random path, and returns the public URL. Re-uses the URL if already generated (idempotent).

### 2. New client-facing email template `payment-receipt`
- A "Payment received" template styled in QuickLinq branding (mirrors the Jobber layout: headline, the paid amount, invoice number, date, company name).
- Two buttons: **Download receipt (PDF)** (the generated PDF URL) and **View invoice online** (`/pay/:invoiceId`).
- Registered in the transactional email `registry.ts`. Sent to the client's email via the existing `send-transactional-email` function.

### 3. Hook into the payment webhook
- In `stripe-webhook` (`payment_intent.succeeded`, and the equivalent `checkout.session.completed` path), after the invoice is marked **paid in full**:
  1. Call `generate-invoice-pdf` to produce the receipt PDF.
  2. Send the `payment-receipt` email to the client (only if the client has an email).
  3. Keep the existing owner notification unchanged.
- Uses an idempotency key derived from the payment intent id so retries never double-send.
- Skips silently for partial/deposit payments (per your choice: full payment only).

## Notes / trade-offs
- The email system cannot physically attach files, so the PDF is delivered as a secure download link/button — this is the same pattern Jobber uses and the file is a real, downloadable PDF.
- Only fires for **online** payments (Stripe). Manually recorded payments won't trigger it unless you later ask for that.

## Technical details
- New bucket `invoice-receipts` (public read) created via migration with appropriate policies; PDFs stored at random UUID paths.
- `generate-invoice-pdf` built with `pdf-lib` (Deno-compatible), `verify_jwt = false`, called internally by the webhook with the service role.
- Receipt email reuses `send-transactional-email`; new template added to `_shared/transactional-email-templates/` and `registry.ts`.
- Webhook changes are additive to `stripe-webhook/index.ts`; `notifyOwner` flow stays intact.
- After edits: deploy `generate-invoice-pdf`, `send-transactional-email`, and `stripe-webhook`.
