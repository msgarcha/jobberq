

## Feature: Review Gating ("Reputation Shield")

### How It Works

1. **After a job completes**, you can send the client a review request (via the Job Detail page or Client Detail page)
2. Client receives a link to a **branded review form** (public page, no login required)
3. Client rates 1-5 stars and writes feedback
4. **If rating >= threshold** (configurable, default 4 stars) → "Thank you!" screen with a prominent **"Leave us a Google Review"** button that opens your Google Review link
5. **If rating < threshold** → "Thank you for your feedback" screen (no Google redirect). Feedback saved internally for private follow-up

### Database Changes

**New table: `review_requests`**
- `id`, `client_id`, `job_id` (nullable), `team_id`, `user_id`
- `token` (unique, for public URL)
- `status` (pending / completed / expired)
- `rating` (1-5, nullable until submitted)
- `feedback` (text, nullable)
- `submitted_at`, `redirected_to_google` (boolean)
- `created_at`, `expires_at`

**New columns on `company_settings`**:
- `google_review_url` (text) — your Google Review link
- `review_min_stars` (integer, default 4) — threshold for Google redirect
- `review_gating_enabled` (boolean, default true)

### New Files

1. **`src/pages/ReviewForm.tsx`** — Public-facing branded review form (no auth). Accessed via `/review/:token`. Shows company logo/name, star picker, feedback textarea. On submit, calls edge function.
2. **`src/pages/Reviews.tsx`** — Dashboard page listing all review requests with status, rating, feedback. Filter by rating. Shows which went to Google vs stayed internal.
3. **`src/hooks/useReviews.ts`** — CRUD hooks for review_requests table
4. **`src/components/review/SendReviewDialog.tsx`** — Dialog to send review request from Job Detail or Client Detail. Shows preview of the link, copy button, and option to send via email.
5. **`supabase/functions/submit-review/index.ts`** — Edge function (no auth) to handle public review submission. Validates token, saves rating/feedback, returns whether to redirect to Google.
6. **`supabase/functions/send-review-request/index.ts`** — Edge function to email the review link to the client (uses Lovable AI or simple email).

### Settings Integration

Add a **"Reviews"** tab in Settings page:
- Google Review URL input (with help text: "Find this by searching your business on Google → Write a review → copy the URL")
- Minimum star threshold slider (1-5, default 4)
- Enable/disable review gating toggle

### Navigation

- Add "Reviews" to sidebar under main nav (Star icon)
- Route: `/reviews`

### Entry Points for Sending Review Requests

- **Job Detail** (when status is `complete`) — "Request Review" button
- **Client Detail** — "Request Review" in actions
- **Reviews page** — "New Request" button with client selector

### Public Review Form Flow

```text
Client clicks link → /review/:token
    ↓
Branded page: logo, "How was your experience?"
    ↓
Star rating (1-5) + feedback textarea → Submit
    ↓
If rating >= threshold:
    "Thank you! Would you mind sharing on Google?"
    [Leave Google Review] button → opens google_review_url
    ↓
If rating < threshold:
    "Thank you for your feedback. We'll use it to improve."
    (No Google link shown)
```

### Implementation Order

1. DB migration: `review_requests` table + `company_settings` columns
2. Edge function: `submit-review` (public, validates token)
3. Public review form page (`/review/:token`)
4. Reviews dashboard page (`/reviews`)
5. Settings tab for review configuration
6. Send review dialog + integration into Job/Client detail
7. Sidebar nav update

### Security

- Public review form uses token-based access (no auth)
- `review_requests` table has RLS: team members can view/manage, public can only update via edge function
- Token is a 32-byte random hex string
- Reviews expire after configurable period (default 30 days)

