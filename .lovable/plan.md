

# Email Notifications + UX Improvements

This plan covers four areas: (1) email notifications for invoice events, (2) inline "Add Client" from the client selector, (3) default payment terms on the client model, and (4) several quick UX wins.

---

## 1. Email Notifications (Invoice Sent + Payment Received)

Create a backend function `send-notification-email` that sends transactional emails when invoices are marked as sent or payments are recorded.

| File | Action |
|------|--------|
| `supabase/functions/send-notification-email/index.ts` | New edge function that accepts `{ type: "invoice_sent" | "payment_received", invoice_id, user_id }` and sends an email to the client using Lovable AI (via a simple template rendered in the function) |
| `src/pages/InvoiceDetail.tsx` | After `handleSend` succeeds, invoke `send-notification-email` with type `invoice_sent` |
| `src/hooks/useInvoices.ts` | After `useRecordPayment` succeeds, invoke `send-notification-email` with type `payment_received` |
| `supabase/functions/stripe-webhook/index.ts` | After recording Stripe payment, call `send-notification-email` internally |

**Note:** Since this project doesn't have a custom email domain configured, we'll use a transactional email approach. The edge function will use a third-party service. We'll need to check if a connector or Resend integration is appropriate, or if we should prompt the user to set up an email domain first.

**Revised approach:** Since sending arbitrary transactional emails requires a provider (Resend, etc.), I'll ask the user about email setup before proceeding with this part.

---

## 2. "Add New Client" Option in ClientSelector

When the user is selecting a client on Invoice/Quote forms, add a "+ New Client" button at the bottom of the dropdown that opens a quick inline dialog to create a client without leaving the form.

| File | Action |
|------|--------|
| `src/components/ClientSelector.tsx` | Add a "+ New Client" button at bottom of the popover list. Clicking it opens a Dialog with a minimal client form (first name, last name, email, company). On save, call `useCreateClient`, then auto-select the new client. |

---

## 3. Default Payment Terms per Client

Add a `default_payment_terms` column to the `clients` table so each client can have their preferred billing terms (Net 30, Due on Receipt, etc.). When creating an invoice for that client, auto-fill the payment terms.

| Step | Detail |
|------|--------|
| DB Migration | `ALTER TABLE clients ADD COLUMN default_payment_terms text DEFAULT 'net_30';` |
| `src/pages/ClientForm.tsx` | Add a "Default Payment Terms" select field (Net 30, Due on Receipt, etc.) |
| `src/pages/ClientDetail.tsx` | Show the default payment terms |
| `src/pages/InvoiceForm.tsx` | When a client is selected, fetch their `default_payment_terms` and auto-set the payment terms field |
| `src/pages/QuoteForm.tsx` | Same auto-fill behavior |

---

## 4. Quick UX Improvements

### 4a. Auto-set due date from payment terms
When payment terms change on the invoice form, auto-calculate the due date (e.g., Net 30 = today + 30 days). Currently the user has to set both manually.

**File:** `src/pages/InvoiceForm.tsx`

### 4b. Quick actions from dashboard
Make the recent activity items on the dashboard clickable to navigate to the invoice/quote detail.

**File:** `src/pages/Index.tsx` (already navigates on click based on code review -- verify)

### 4c. "Save & Create Another" button on forms
Add a secondary save action on Invoice/Quote forms that saves and immediately opens a new blank form instead of navigating to the detail page.

**Files:** `src/pages/InvoiceForm.tsx`, `src/pages/QuoteForm.tsx`

### 4d. Pre-fill line items from last invoice for same client
When selecting a client on a new invoice, offer a "Copy from last invoice" shortcut if that client has previous invoices.

**File:** `src/pages/InvoiceForm.tsx`

### 4e. Keyboard shortcut for Create menu
Add `Ctrl+N` / `Cmd+N` to open the Create dropdown in TopBar.

**File:** `src/components/layout/TopBar.tsx`

---

## Summary of All Changes

| Area | Files Affected |
|------|---------------|
| Email notifications | Edge function + InvoiceDetail + useInvoices + stripe-webhook (pending email setup) |
| Inline Add Client | `ClientSelector.tsx` |
| Client payment terms | DB migration + `ClientForm.tsx` + `ClientDetail.tsx` + `InvoiceForm.tsx` |
| Auto due date | `InvoiceForm.tsx` |
| Save & Create Another | `InvoiceForm.tsx`, `QuoteForm.tsx` |
| Copy from last invoice | `InvoiceForm.tsx` |
| Keyboard shortcut | `TopBar.tsx` |

