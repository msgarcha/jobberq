## Reputation Shield v2 — Industry-Standard Review Funnel

### Reality check (read first)

**No software can auto-post reviews to Google** — Google's TOS forbids it and will ban your business listing. The industry standard is a **smart funnel**: 5-star happy customers are sent to Google with a one-click pre-filled link where they post themselves; low-rating customers are diverted to private feedback so you can fix issues before they become public 1-star reviews.

Your current logic in `submit-review/index.ts` already does this correctly. We're upgrading the UX, owner visibility, and Google deep-linking.

---

### What we'll build

#### 1. Clickable review detail drawer (Reviews page)
- Click any row → side drawer shows: client info, rating stars, full feedback text, submitted date, whether they were redirected to Google, and a "Copy link" / "Resend" button
- Distinguish: pending / completed-positive (4-5★, sent to Google) / completed-negative (1-3★, private feedback) / expired

#### 2. Owner alert email on negative review (the "Shield")
- New edge function trigger: when `submit-review` records rating ≤ 3, send transactional email to team admin: "⚠️ {Client} left {N}★ feedback — respond before they go public"
- Includes the feedback text + a deep link to the review in your dashboard
- This is what "Reputation Shield" actually means — intercepting unhappy customers before they post publicly

#### 3. Better Google deep-link (Place ID format)
- Add a new `google_place_id` field to `company_settings` alongside `google_review_url`
- Settings UI: helper text + link to Google's Place ID finder
- When Place ID is set, use `https://search.google.com/local/writereview?placeid={ID}` — opens Google's review form directly, pre-filled with your business, no extra clicks
- Falls back to existing `google_review_url` if no Place ID

#### 4. Resend / follow-up
- Button on pending reviews: "Resend reminder" (regenerates expiry, sends email/SMS link again)
- Button on completed-positive that did NOT click Google: "Send Google reminder" (nudge email with just the Google link)

#### 5. Confirmation step on the public review form
- After 5-star customer clicks "Leave Google Review" button → form switches to "Did you post your review? [Yes, posted] [Not yet]"
- "Yes" sets `posted_to_google_confirmed_at` (self-attested, but useful signal)
- "Not yet" offers to email them the link for later

---

### Database changes

```sql
-- company_settings
alter table company_settings 
  add column google_place_id text,
  add column notify_low_ratings boolean default true;

-- review_requests
alter table review_requests 
  add column posted_to_google_confirmed_at timestamptz,
  add column owner_notified_at timestamptz,
  add column reminder_sent_at timestamptz;
```

---

### Files to create / modify

**Create:**
- `src/components/review/ReviewDetailDrawer.tsx` — click-through detail view
- `supabase/functions/notify-low-rating/index.ts` — sends owner alert (called from `submit-review` when rating ≤ 3)
- `supabase/functions/resend-review-request/index.ts` — resend/follow-up

**Modify:**
- `src/pages/Reviews.tsx` — make rows clickable, add filters (negative/positive), wire drawer
- `src/pages/ReviewForm.tsx` — add post-Google confirmation step
- `supabase/functions/submit-review/index.ts` — invoke `notify-low-rating` for ratings ≤ 3; build Google URL from `google_place_id` if present
- `supabase/functions/get-review-request/index.ts` — return `google_place_id` in branding payload
- `src/pages/Settings.tsx` (Reviews tab) — add Place ID field + helper, low-rating notification toggle
- `src/hooks/useReviews.ts` — add `useResendReview`, drawer query

---

### How it answers your direct questions

| Your question | Answer |
|---|---|
| Why can't I click John Smith's review? | UI gap — fixed with detail drawer (#1) |
| Does it auto-post 5★ to Google? | **No platform can.** Google forbids it. We give the customer a one-click pre-filled Google form (#3) and confirm they posted (#5) |
| Does it ask for a new review on Google? | Yes — that's the only legal pattern. The customer writes & posts under their own Google account |
| What about 1-3★? | Stays private + you get an instant alert email so you can call/fix before they post publicly elsewhere (#2) — this IS the "Shield" |
| How do Birdeye/Podium do it? | Exactly this funnel. We're matching the industry standard |

---

### Out of scope (mention so you know)

- **Auto-importing posted Google reviews back into the dashboard** would require Google Business Profile API + OAuth per customer business — large separate feature, can be a v3
- **SMS sending** — currently links are copy-paste. Adding Twilio SMS is a separate feature

Approve and I'll implement all five items in one pass.