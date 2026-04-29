## What's wrong

1. **All new review links say "invalid"** — root cause confirmed.
   The new short URLs (`quicklinq.ca/r/iyVAb2nQ`) carry a `short_token`, but the `get-review-request` edge function still only looks up by the legacy long `token` column. So the page loads, calls the function, and gets a 404 every time. (`submit-review` was already patched for both, but the *fetch* function was missed.)

2. **No way to cancel/delete a review request** — there's only "Resend". If you sent it to the wrong person, included the wrong job, or just want to start over, you're stuck.

3. **Public review portal feels bare** — it's functional but sits as floating text on a flat background, with no card, no subtle company footer, and no skeleton while loading. On a real client's phone it doesn't say "trusted business sent me this".

## Fixes

### 1. Fix the broken link lookup (the actual bug)
Update `supabase/functions/get-review-request/index.ts` to look up by either token, exactly like `submit-review` already does:
```ts
.from("review_requests")
.select("...")
.or(`token.eq.${token},short_token.eq.${token}`)
.maybeSingle();
```

### 2. Add Delete / Cancel for review requests
- Add a `useDeleteReviewRequest` mutation in `src/hooks/useReviews.ts` (simple `.delete().eq('id', id)` — RLS already restricts to team members).
- In `ReviewDetailDrawer.tsx`: add a destructive "Delete request" button at the bottom for **pending** requests, and a quieter "Remove from history" button for completed ones (with an AlertDialog confirm). After delete, close the drawer and invalidate the list.
- In `Reviews.tsx`: add a tiny trash icon on each card row (also confirm-gated) so power users don't have to open the drawer.

### 3. Polish the public review portal (`/r/:token`)
Refresh `src/pages/ReviewForm.tsx`:
- Wrap the content in a centered **Card** with `shadow-warm`, generous padding, and rounded-2xl — matches the rest of QuickLinq.
- Add a subtle gradient page background using brand tokens (cream → white).
- Show a proper skeleton (logo + stars placeholder) while loading instead of "Loading…".
- Larger, friendlier headline + warm subtext; client first name personalization ("Hi John, how was your experience with …?").
- Tap-target stars sized 14 on mobile, 12 on desktop, with a soft hover ring.
- Below the form add a small footer: *"Powered by QuickLinq · Your review is private until you choose to share it."* Builds trust + brand.
- After submission, the success card stays inside the same Card shell so the layout doesn't jump.
- Improve the error state copy: instead of bare "This review link is invalid…", suggest "Ask {company} to send a new link" and show their logo if available (we already have `companyName`/`logoUrl` from the function — surface them on the error path too by returning them even on 404).

### 4. Small companion tweak
- Have `get-review-request` always include `companyName` / `logoUrl` in error responses when possible, so the error page is still branded.

## Files touched

```text
supabase/functions/get-review-request/index.ts   (bug fix + branded error)
src/hooks/useReviews.ts                          (+ useDeleteReviewRequest)
src/components/review/ReviewDetailDrawer.tsx     (delete button + confirm)
src/pages/Reviews.tsx                            (row-level delete icon)
src/pages/ReviewForm.tsx                         (visual polish, card, footer, skeleton)
```

No DB migration needed — `short_token` already exists, and delete is covered by the existing "Team members can manage review requests" RLS policy.

## How I'll verify

After the edit, open the failing link `quicklinq.ca/r/iyVAb2nQ` in the preview and confirm it loads the rating screen instead of the error. Then submit a 5-star review and confirm the Google CTA appears, and a 2-star and confirm it stays private. Finally, delete a pending request from the dashboard and confirm it disappears from the list.
