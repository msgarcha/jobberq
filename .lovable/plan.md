

## Fix Plan: 5 Issues

### Issue 1: Cannot add service in quotes
**Problem**: The service selector in `LineItemsEditor` only shows existing services from the catalog. If no services exist, the dropdown is empty with no way to add one.
**Fix**: Add a "Manage Services" link/button below the service dropdown in `LineItemsEditor` that navigates to `/services` (or opens inline). Also allow typing a custom description without selecting a service (this already works — the real issue may be that services haven't been created yet, so we need a clear CTA).

### Issue 2: Default tax rate should be 5% (from settings)
**Problem**: `LineItemsEditor` hardcodes `tax_rate: 0` in the `emptyItem`. The `company_settings` table has `default_tax_rate` (defaults to 13% in migration) but it's never read by the line items editor.
**Fix**: 
- Accept an optional `defaultTaxRate` prop in `LineItemsEditor`
- In `QuoteForm` and `InvoiceForm`, fetch `company_settings` and pass `default_tax_rate` to the editor
- New line items get the company's default tax rate instead of 0

### Issue 3: Invoice save button missing
**Problem**: The InvoiceForm already has Save/Create buttons at the bottom. This may be a visibility issue — the buttons are in a sticky bar that might not render properly, or the user is on the InvoiceDetail page expecting an inline save.
**Fix**: Ensure the save button is always visible. Add a floating save button on mobile if the sticky footer is obscured.

### Issue 4: Review dialog shows but link doesn't work
**Problem**: The `ReviewForm` page queries `review_requests` and `company_settings` directly using the anon supabase client. While `review_requests` has an anon SELECT policy, the query joins `clients(first_name, last_name)` — and `clients` has NO anon policy. The query fails silently, returning null, showing "Review request not found."
**Fix**: Create a new edge function `get-review-request` that:
- Takes a `token` parameter
- Uses service role key to fetch the review request + company branding
- Returns all data needed for the form (company name, logo, review status)
- `ReviewForm` calls this edge function instead of direct DB queries

### Issue 5: Review flow end-to-end broken
**Root cause** (same as #4): All client-side queries in `ReviewForm` fail because the user is unauthenticated. The `submit-review` edge function works correctly (uses service role), but the initial data fetch doesn't.

**Complete fix**:
1. **New edge function** `get-review-request` (verify_jwt = false):
   - Input: `{ token: string }`
   - Uses service role to query `review_requests` + `company_settings`
   - Returns: `{ review, companyName, logoUrl, status }` or `{ error }`
2. **Update `ReviewForm.tsx`**: Replace direct supabase queries with a fetch to the new edge function
3. **Update `supabase/config.toml`**: Add `[functions.get-review-request]` with `verify_jwt = false`

### Files changed
| File | Changes |
|------|---------|
| `src/components/LineItemsEditor.tsx` | Add `defaultTaxRate` prop, use it for new items, add "manage services" link |
| `src/pages/QuoteForm.tsx` | Pass `defaultTaxRate` from company settings |
| `src/pages/InvoiceForm.tsx` | Pass `defaultTaxRate` from company settings |
| `supabase/functions/get-review-request/index.ts` | New edge function for public review data |
| `src/pages/ReviewForm.tsx` | Use edge function instead of direct queries |
| `supabase/config.toml` | Add `get-review-request` function config |

