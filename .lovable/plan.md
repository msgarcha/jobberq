## Goal
Transform onboarding into a guided startup-style wizard that captures the user's **trade**, business basics, and defaults — then automatically seeds **5 AI-generated starter services** while showing a "Preparing your dashboard" animation before landing on the home screen.

## New Flow (6 steps)

```
1. Pick Trade  →  2. Business Name & Logo  →  3. Address & Contact
       ↓
4. Defaults (tax, terms, prefixes)  →  5. Review  →  6. Preparing Dashboard ✨
```

### Step 1 — Choose Trade (NEW)
Grid of selectable cards (icon + label) for common trades, plus "Other" with free-text:
- Landscaping, Lawn Care, Plumbing, Electrical, HVAC, Roofing, Painting, Cleaning, Handyman, Carpentry, Flooring, Pressure Washing, Snow Removal, Pest Control, General Contractor, Other

Selected trade drives the AI service generation in step 6.

### Steps 2–4
Keep existing Company / Address / Defaults steps (already built), restyled as part of the new 6-step shell.

### Step 5 — Review
Read-only summary card of everything entered with edit-pencils that jump back to the relevant step.

### Step 6 — Preparing Dashboard (NEW)
Full-screen animated loader (Linq logo pulse + animated checklist):
- ✓ Creating your workspace
- ✓ Saving company details
- ⠋ Generating starter services for {trade}…
- ⠋ Personalizing your dashboard

During this step we:
1. `upsert` company_settings (now includes `trade`)
2. Invoke new edge function `generate-starter-services` → inserts 5 rows into `services_catalog`
3. Send welcome email (existing)
4. Navigate to `/` with a brief confetti/fade-in

## Technical Changes

### Database (migration)
- Add `trade text` column to `company_settings`.

### Edge function — `generate-starter-services` (NEW)
- Auth: validate JWT, get user + team_id.
- Input: `{ trade: string }`.
- Calls Lovable AI (`google/gemini-3-flash-preview`) with tool-calling to return structured JSON:
  ```
  { services: [{ name, description, default_price, category }] x5 }
  ```
- Inserts the 5 rows into `services_catalog` (user_id, team_id, is_active=true).
- Uses existing `enforceAiQuota` pattern for rate limiting.
- Returns `{ created: 5 }`.

### Frontend
- `src/pages/Onboarding.tsx` — rebuild as 6-step wizard:
  - New `TradeSelector` step (card grid, animated select).
  - Reuse existing Company/Address/Defaults step content.
  - New `ReviewStep` component.
  - New `PreparingDashboard` step with framer-motion animated checklist, sequential task completion as promises resolve.
- Use existing `Progress` + step indicator pattern, expand to 6 stops.
- Add trade icons from `lucide-react` (Sprout, Wrench, Zap, Thermometer, Home, Paintbrush, Sparkles, Hammer, etc.).

### Files Created
- `supabase/migrations/<ts>_add_trade_to_company_settings.sql`
- `supabase/functions/generate-starter-services/index.ts`
- `src/components/onboarding/TradeStep.tsx`
- `src/components/onboarding/ReviewStep.tsx`
- `src/components/onboarding/PreparingDashboard.tsx`

### Files Edited
- `src/pages/Onboarding.tsx` (refactor into wizard shell)
- `src/hooks/useCompanySettings.ts` (no change needed — types regenerate from migration)

## Notes / Decisions
- AI generation is best-effort: if it fails, we still proceed to dashboard and toast a soft warning ("We'll suggest services later"). Onboarding never gets blocked by AI.
- Services are inserted as `is_active=true` with sensible default prices the AI proposes; user can edit anytime in Services page.
- "Other" trade still triggers AI generation using the free-text label.
- All animations use framer-motion (already used elsewhere) — no new deps.
