

## Mobile UI/UX Fixes -- 6 Issues + General Polish

### 1. Login Page -- Button Outside Container (IMG_2180)
The "Forgot password?" button renders outside the card on small screens due to the `min-height: 44px` CSS rule applying to all buttons on mobile. Fix: scope the `min-height` rule to exclude link-variant buttons, and ensure the login card has proper bottom padding.

**File:** `src/index.css` -- adjust the mobile `min-height` rule to exclude `variant="link"` buttons
**File:** `src/pages/Login.tsx` -- add `pb-6` to CardContent, ensure the forgot password button sits inside the card

### 2. Dashboard KPI Cards -- Make Clickable (IMG_2183)
The 4 KPI cards (Revenue, Outstanding, Overdue, Active Quotes) are not clickable. Each should navigate to the relevant page.

**File:** `src/pages/Index.tsx`
- Revenue (MTD) → `/invoices?status=paid`
- Outstanding → `/invoices?status=sent`
- Overdue → `/invoices?status=overdue`
- Active Quotes → `/quotes`
- Add `cursor-pointer` and `onClick` to each KPI card

### 3. Quote Detail -- Mobile-Friendly Layout
The quote detail page (QuoteDetail.tsx) has a horizontal button row that overflows on mobile. Needs the same mobile treatment as InvoiceDetail.

**File:** `src/pages/QuoteDetail.tsx`
- Replace the desktop-only `flex gap-2` action bar with a mobile-responsive layout
- On mobile: stack action buttons as full-width rows inside the card (like InvoiceDetail's hero card pattern)
- On desktop: keep the horizontal button row
- Add mobile line items view (stacked cards instead of table) matching InvoiceDetail's `sm:hidden` pattern
- Add `pb-24` to the container for bottom nav clearance

### 4. Recent Activity -- Include Quotes + Meaningful Descriptions
Currently `useRecentActivity` only fetches invoices. It should also include quotes and show descriptive activity text (e.g., "Invoice INV-001 marked as paid", "Quote QT-005 approved by client").

**File:** `src/hooks/useInvoices.ts` -- update `useRecentActivity`:
- Fetch recent quotes alongside invoices
- Map status to human-readable descriptions: draft→"created", sent→"sent to client", paid→"marked as paid", approved→"approved by client", viewed→"viewed by client", overdue→"is overdue"
- Merge and sort both lists by `updated_at` descending
- Include timestamp in the activity item

**File:** `src/pages/Index.tsx` -- update activity item rendering:
- Use different icons for invoices vs quotes (Receipt vs FileText)
- Navigate to correct detail page based on type
- Show relative time (e.g., "2h ago", "Yesterday")

### 5. Client Viewed Timestamp
Invoices already have `viewed_at`. Quotes do not.

**Database migration:** Add `viewed_at` column to the `quotes` table.

**File:** `supabase/functions/public-quote/index.ts` -- record `viewed_at` when the public quote is accessed (same pattern as public-invoice)
**File:** `src/pages/QuoteDetail.tsx` -- display "Viewed" timestamp in the Details card
**File:** `src/pages/InvoiceDetail.tsx` -- display "Viewed" timestamp in the Details card (check if already shown)

### 6. FAB Toggle (Center + Button)
Looking at the code, the FAB already toggles correctly (`setFabOpen((p) => !p)`). The X icon shows when open and clicking it closes. This appears to already work. Will verify and ensure the overlay click also closes it (it does via `onClick={() => setFabOpen(false)}`). No changes needed unless testing reveals a bug.

### Additional Mobile Polish
- **All detail pages**: Ensure `pb-24` padding bottom for bottom nav clearance
- **Quote detail mobile actions**: Add Copy Link, Email, Edit, Send as stacked buttons in a hero card (matching InvoiceDetail pattern)
- **Relative timestamps**: Add a `formatRelativeTime` utility for "2h ago", "Yesterday" style times in activity feed

### Summary of Changes

| # | File | Change |
|---|------|--------|
| 1 | `src/index.css` | Fix mobile button min-height for link buttons |
| 2 | `src/pages/Login.tsx` | Ensure card padding contains all elements |
| 3 | `src/pages/Index.tsx` | Clickable KPIs, improved activity rendering with icons + relative time |
| 4 | `src/hooks/useInvoices.ts` | Expand `useRecentActivity` to include quotes + descriptive text |
| 5 | `src/pages/QuoteDetail.tsx` | Mobile-responsive layout with hero card, stacked actions, mobile line items |
| 6 | Database migration | Add `viewed_at` to quotes table |
| 7 | `supabase/functions/public-quote/index.ts` | Record viewed_at on public access |
| 8 | `src/pages/InvoiceDetail.tsx` | Show viewed_at timestamp in Details card |

