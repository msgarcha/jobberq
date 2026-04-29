## Fix Review Request: Auto-Email + Short Branded Link

Three problems to fix in the "Request a Review" flow:

1. **URL exposes Lovable** (`9d83c575-...lovableproject.com`) — should use the QuickLinq custom domain.
2. **Token is too long** (64-char hex) — produces unwieldy links.
3. **No automatic email** — owner has to manually copy/share the link.

### What changes for the user

When you click "Request a Review":
- Pick the client (must have an email on file).
- Click **Send Review Request**.
- The client instantly receives a branded QuickLinq email with a short, clean link like `https://quicklinq.ca/r/aB3xK9p`.
- A confirmation toast shows the email was sent. The link is also shown for manual sharing as a fallback.
- If the client has no email, the dialog warns the owner and offers copy-only mode.

### Technical changes

**1. Database migration** — add a short token column
```sql
ALTER TABLE review_requests
  ADD COLUMN short_token text UNIQUE
  DEFAULT substr(encode(gen_random_bytes(6), 'base64'), 1, 8);
-- backfill existing rows, strip URL-unsafe chars (/, +, =)
```
The 8-char token gives ~10^14 combinations — collision-safe for this scale, and links become ~30 chars total.

**2. Public route** — add `/r/:shortToken` in `App.tsx` that resolves to the existing `ReviewForm` page (which already loads by token). Update `ReviewForm` to look up by either `token` or `short_token`. Keep the old `/review/:token` route working for already-sent links.

**3. Base URL** — replace `window.location.origin` in `SendReviewDialog.tsx`, `ReviewDetailDrawer.tsx`, and `Reviews.tsx` with `https://quicklinq.ca` (the configured custom domain). Centralize as `PUBLIC_REVIEW_BASE` constant in `src/lib/constants.ts`.

**4. Auto-send email** — `SendReviewDialog.tsx` after creating the request:
- Fetch client email + company name.
- Invoke `send-transactional-email` with template `review-request` (already exists in registry), passing `clientName`, `companyName`, `reviewUrl` (short URL), and `idempotencyKey: review-${requestId}`.
- Show success/failure toast.
- If client has no email, skip the send and show "Client has no email on file — copy the link instead."

**5. UI cleanup in dialog** — after send:
- Replace the long code-block link with a compact "Sent to john@example.com ✓" confirmation.
- Show the short link below in a smaller "Or share manually" section with copy button.

### Files touched

- `supabase/migrations/<new>.sql` — short_token column + backfill
- `src/integrations/supabase/types.ts` — auto-regenerated
- `src/lib/constants.ts` — new file, exports `PUBLIC_REVIEW_BASE`
- `src/components/review/SendReviewDialog.tsx` — auto-send + UI redesign
- `src/components/review/ReviewDetailDrawer.tsx` — use short URL
- `src/pages/Reviews.tsx` — use short URL in copy action
- `src/pages/ReviewForm.tsx` — accept short_token route param
- `src/App.tsx` — add `/r/:shortToken` route
- `src/hooks/useReviews.ts` — return short_token from create mutation

No new edge functions needed — `send-transactional-email` and the `review-request` template are already in place from the v2 work.