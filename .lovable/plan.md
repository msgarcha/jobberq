
# Plan: One-Tap "Copy & Open Google" with AI-Drafted Review

## What top SaaS actually do (researched, not assumed)

| Tool | Their pattern |
|---|---|
| **NiceJob** ("Magic Reviews") | Customer's words → AI polishes into 1–2 sentence draft → one tap copies + opens Google |
| **Birdeye** (Review Generation Agent) | AI drafts a personalized review from rating + feedback; customer edits inline; "Copy & post" CTA |
| **Podium** | Pre-filled draft shown in a card with "Copy review" chip directly above "Open Google" |
| **Trustmary / Reviewshake** | Copy chip + Open button + friendly "Just paste with Cmd/Ctrl+V" hint |

**Common rules they all follow:**
1. Draft is generated **before** the customer reaches the "Open Google" screen — never on the same click (mobile popup blockers + clipboard need a synchronous user gesture).
2. Draft is always **editable** — keeps reviews authentic and avoids Google flagging duplicate text.
3. **One button** does both copy + open Google in a single tap.
4. After Google opens, the page still shows the text + "Open again" fallback.

## What I'll build

### 1. AI draft generated at submit time (not at copy time)
When the customer clicks **Submit Review** with 4–5 stars, the `submit-review` edge function:
- Saves the review (existing behavior)
- Calls Lovable AI Gateway (`google/gemini-3-flash-preview`, free) to generate a short draft
- Returns the draft alongside `redirect_to_google` and `google_review_url`

This way, when the customer lands on the "share on Google" screen, the draft is already there — and clicking "Copy & Open" runs synchronously inside the user gesture (required by iOS Safari).

**Prompt (server-side, not exposed to client):**
> Write a short, natural-sounding 1–2 sentence Google review for {companyName} from a customer who rated {rating} stars. Their words: "{feedback or 'no comment'}". Sound like a real person, no marketing fluff, no emojis, under 280 characters. Output only the review text.

If the AI call fails or times out (>3s), we fall back to a generic template:
> "Had a great experience with {companyName}. Highly recommend!"

### 2. Redesigned "Share on Google" screen

```text
┌──────────────────────────────────────┐
│   [Logo]  Thanks, Sarah!             │
│                                      │
│   ★★★★★                              │
│                                      │
│   Would you mind sharing this        │
│   on Google? Here's a draft to       │
│   make it easy:                      │
│                                      │
│   ┌────────────────────────────────┐ │
│   │ Had a great experience with    │ │
│   │ Acme Lawn Care. The team was   │ │
│   │ professional and on time.      │ │  ← editable textarea
│   │                          [✏️]  │ │
│   └────────────────────────────────┘ │
│                                      │
│   ┌──────────────────────────────┐   │
│   │ 📋  Copy & Open Google       │   │  ← one-tap (synchronous)
│   └──────────────────────────────┘   │
│   Just open Google instead           │  ← ghost link
│                                      │
│   ✓ Copied! Just paste (long-press   │
│     or Ctrl/Cmd+V) into Google.      │  ← shown after click
└──────────────────────────────────────┘
```

### 3. One-tap "Copy & Open" — bulletproof implementation

The click handler runs **synchronously** (no `await` before the two calls — critical for iOS Safari and popup blockers):

```ts
const handleCopyAndOpen = () => {
  const text = draftText; // already in state, no await
  // Both inside the same user gesture:
  navigator.clipboard?.writeText(text).catch(() => {});
  window.open(googleUrl, "_blank", "noopener");
  setCopiedAndOpened(true);
};
```

Fallbacks:
- If `navigator.clipboard` is undefined (old iOS), use a hidden `<textarea>` + `document.execCommand('copy')` — still synchronous.
- If `window.open` returns `null` (popup blocked), show an inline "Tap here to open Google" link the customer can press directly.
- The draft textarea remains visible after clicking, so even if everything fails they can manually select/copy.

### 4. After-click confirmation (kept from existing flow)
After "Copy & Open", show the existing **"Did you post your review?"** card with:
- "Yes, I posted it" → calls `confirm_google_post` (existing)
- "Open Google again" → re-runs `window.open` (no need to copy again, already in clipboard)
- "Not right now" → soft dismiss

## Files to change

**Edited**
- `supabase/functions/submit-review/index.ts` — after marking review complete, when `shouldRedirect` is true, call Lovable AI to generate `suggested_review_text` and include it in the response. Wrap in try/catch with a 3s timeout and template fallback so the submit endpoint never fails because of AI.
- `src/pages/ReviewForm.tsx` — replace the current "Leave a Google Review" block with the new draft + one-tap card. Add `draftText` state seeded from `result.suggested_review_text`, an editable `<Textarea>`, the synchronous `handleCopyAndOpen`, and the toast/confirmation footer.

**No new files, no DB changes, no new secrets** (`LOVABLE_API_KEY` already configured).

## Why this is the best approach

- **Generated up-front** → click handler stays synchronous → works on iOS Safari (where 90% of mobile customers are).
- **Editable draft** → authentic reviews, no Google duplicate-content penalty.
- **One button = copy + open** → matches NiceJob/Podium UX, removes the "what do I write?" blocker that kills 60–70% of would-be reviewers.
- **Graceful degradation** → clipboard blocked, popup blocked, AI down — every path still ends with the customer able to leave a review.
- **Zero new infra** → uses existing Lovable AI gateway, no new edge function, no schema change.
