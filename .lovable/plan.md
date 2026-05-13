## Team Assignment on Jobs

Add an `assigned_to` field to jobs so each job can be owned by a team member, and surface that ownership in the Pipeline, Schedule, Job Detail, and Job Form views.

### Database

Migration on `public.jobs`:
- Add `assigned_to uuid` (nullable) — references the assigned user.
- Add index `idx_jobs_assigned_to` for filtering.
- No FK to `auth.users` (per project conventions). Resolve display via `team_members` + `profiles`.

No RLS changes needed — existing team-scoped policies cover it.

### Hook layer (`src/hooks/useJobs.ts`)

- Include `assigned_to` in all selects (already returned by `*`).
- Add a small `useTeamMembersWithProfiles()` helper (or extend `useTeam`) that returns `{ user_id, display_name, avatar_url, role }` for the current team — joined from `team_members` → `profiles`. Used by the assignee selector and badges.

### Job Form (`src/pages/JobForm.tsx`)

- Add an "Assigned To" select under the Client field in the Job Details card.
- Options: team members from the helper above + an "Unassigned" entry.
- Default to current user on new jobs; preserve existing value on edit.
- Persist via existing `createJob` / `updateJob` mutations.

### Job Detail (`src/pages/JobDetail.tsx`)

- Show a small "Assigned to" row with avatar + display name (or "Unassigned").
- Inline change via the same select (admins + the current assignee can reassign; otherwise read-only).

### Pipeline (`src/components/pipeline/PipelineCard.tsx` + `Pipeline.tsx`)

- Add a compact assignee avatar badge on each `PipelineCard` (bottom-right corner of the card).
- Add an "Assignee" filter at the top of `Pipeline.tsx`: `All | Me | <each team member> | Unassigned`. Filters `jobs` before grouping into stages.
- Mobile stages (`MobilePipelineStage`) inherit the same card change.

### Schedule (`src/pages/Schedule.tsx`)

- On each timeline card, render a small avatar + first name next to the job title.
- Add the same "Assignee" filter strip above the week strip; filter `jobs` client-side after the date query.

### UX details

- Avatar uses `Avatar` from `@/components/ui/avatar` with initials fallback.
- "Unassigned" shown as a muted dashed-circle icon.
- All colors via existing semantic tokens — no new palette.

### Out of scope

- Notifications/emails when assigned (can be a follow-up).
- Permission rules beyond what current team RLS already enforces.
- Bulk reassign UI.
