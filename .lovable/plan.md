

## Core Email and Client-Facing Portal System

This is a large, multi-part feature. It needs to be broken into phases to be manageable. Here is the full architecture and implementation plan.

---

### What We're Building

1. **Email Dialog** — Jobber-style dialog on Invoice/Quote detail pages: pre-filled To, Subject, Body, with Send button
2. **Send Email Edge Function** — Backend function that sends branded invoice/quote emails to clients
3. **Public Quote View + Approval** — Like `PublicInvoicePay` but for quotes, where clients can view and approve estimates
4. **Public Invoice View** — Enhance the existing `/pay/:invoiceId` page to show full invoice details (like Jobber's client hub) with company branding, plus the existing payment option
5. **Email domain setup** — Required first step before any emails can be sent

---

### Phase 1: Email Domain Setup

Before any emails can send, an email domain must be configured. This is a prerequisite.

**Action**: Show the email domain setup dialog so you can configure your sender domain (e.g., `notify@quicklinq.ca`). This is the domain clients will see emails come from.

---

### Phase 2: Email Infrastructure + Send Invoice/Quote Email

#### New Edge Function: `send-document-email`
A single backend function that handles sending both invoice and quote emails.

- Accepts: `{ type: "invoice" | "quote", document_id, to_email, subject, body, send_copy_to_self }`
- Loads the document, line items, company settings from the database
- Renders a branded HTML email (matching the Jobber-style screenshots: company logo, document summary with total/balance, "View Invoice" or "View Estimate" CTA button, company footer with address/phone/email)
- Links the CTA button to the public view page (`/pay/:id` for invoices, `/quote/:id` for quotes)
- Updates the document status to "sent" and sets `sent_at`

#### New UI Component: `EmailDocumentDialog`
A shared dialog component used on both InvoiceDetail and QuoteDetail pages.

- Opens from "Send" / "More Actions > Email" button
- Pre-fills:
  - **To**: Client email (editable, with chip/tag style like Jobber)
  - **Subject**: "Invoice from [Company] - [Title]" or "Quote from [Company] - [Date]"
  - **Body**: Pre-written template: "Hi [Client Name], Thank you for your recent business with us. The invoice total is $X, with $Y to be paid by [date]..."
  - **Send me a copy** checkbox
- Cancel / Send Email buttons (green, matching Jobber)

#### Files to create/modify

| File | Change |
|------|--------|
| `supabase/functions/send-document-email/index.ts` | New Edge Function for sending branded emails |
| `src/components/EmailDocumentDialog.tsx` | New reusable dialog for invoice + quote emailing |
| `src/pages/InvoiceDetail.tsx` | Add email dialog trigger to actions |
| `src/pages/QuoteDetail.tsx` | Add email dialog trigger to actions |

---

### Phase 3: Public Quote View + Approval

#### New Edge Function: `public-quote`
Similar to the existing `public-invoice` function. Loads quote, line items, and company settings by quote ID (no auth required).

#### New Page: `PublicQuoteView` (`/quote/:quoteId`)
A public-facing page where clients can:
- See the company logo, name, and branding
- View the full estimate with line items, totals, required deposit
- **Approve the estimate** (button that updates quote status to "approved" via a new edge function `approve-quote`)
- Contact the company via the listed email/phone
- Company footer with address, registration info

Styled to match the Jobber client hub screenshots: clean white background, company header bar, clear CTA button.

#### New Edge Function: `approve-quote`
- Accepts `{ quote_id }` (no auth needed — public)
- Updates quote status to "approved" and sets `approved_at`
- Returns success

#### Files

| File | Change |
|------|--------|
| `supabase/functions/public-quote/index.ts` | New — fetch quote data publicly |
| `supabase/functions/approve-quote/index.ts` | New — approve quote publicly |
| `src/pages/PublicQuoteView.tsx` | New — public quote view with approve button |
| `src/App.tsx` | Add route `/quote/:quoteId` |

---

### Phase 4: Enhance Public Invoice Page

The existing `PublicInvoicePay` already works but is minimal. Enhance it to match the Jobber invoice email/hub style:

- Add company header bar (logo + company name, like the Jobber screenshots)
- Show "Invoice from **[Company Name]**" heading
- Show INVOICE BALANCE prominently with due date
- Large "View Invoice" / "Pay Now" CTA
- Show full line items breakdown
- Company footer with address, phone, email, website
- "Powered by QuickLinq" footer badge

#### Files

| File | Change |
|------|--------|
| `src/pages/PublicInvoicePay.tsx` | Redesign to match Jobber client hub style |

---

### Phase 5: Onboarding Welcome Email (optional, after domain verified)

Once the email domain is set up and verified, we can add a welcome email that goes out when a new user signs up for QuickLinq.

---

### Architecture Summary

```text
┌─────────────────────────────────────────┐
│           QuickLinq App (Auth'd)         │
│                                          │
│  InvoiceDetail ──► EmailDocumentDialog   │
│  QuoteDetail   ──► EmailDocumentDialog   │
│                         │                │
│                    send-document-email    │
│                    (Edge Function)        │
│                         │                │
│              ┌──────────┴──────────┐     │
│              ▼                     ▼     │
│     Email to client         Status → sent│
│     with CTA link                        │
└──────────────────────────────────────────┘
              │
              ▼ (Client clicks CTA)
┌─────────────────────────────────────────┐
│         Public Pages (No Auth)           │
│                                          │
│  /pay/:invoiceId  → View + Pay invoice   │
│  /quote/:quoteId  → View + Approve quote │
│                                          │
│  Calls: public-invoice, public-quote,    │
│         approve-quote, create-payment-*  │
└──────────────────────────────────────────┘
```

### Implementation Order

1. Set up email domain (prerequisite)
2. Build `send-document-email` Edge Function + `EmailDocumentDialog` UI
3. Build public quote view + approval flow
4. Enhance public invoice page
5. Wire everything together and test end-to-end

### Technical Notes
- Email rendering uses inline HTML styles (not React Email components, since these are backend-rendered in Deno)
- All public edge functions use `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS
- Email sending uses Lovable's built-in email infrastructure (no third-party service needed)
- The email body template is editable in the dialog before sending, giving contractors control over their message

