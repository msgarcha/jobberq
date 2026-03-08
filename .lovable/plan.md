

## Project Pipeline & Projects Page

### Current State
- Job statuses: `pending`, `in_progress`, `complete`, `invoiced`
- Jobs page is a flat list with status filter pills
- No pipeline/kanban view, no archive concept

### What We're Building

**1. Pipeline Page (`/pipeline`)** -- A visual kanban board showing jobs flowing through stages
- **Desktop**: Horizontal columns for each stage, cards are draggable-feeling (click to move)
- **Mobile**: Vertical accordion/swipeable view -- each stage is a collapsible section with count badge, tap to expand. This is superior to horizontal kanban on mobile (which every other SaaS gets wrong)

**Pipeline Stages (mapped to statuses):**
- New → `pending`
- In Progress → `in_progress`  
- On Hold → `on_hold` (NEW status)
- Invoice Created → `invoiced`
- Finished → `complete`

**2. Projects Page (`/projects`)** -- A filtered list/archive view
- Filter tabs: "Active" (pending + in_progress + on_hold), "Past" (complete + invoiced), "New" (pending only)
- Search bar, sort by date
- Card-based layout optimized for scanning

**3. Database Migration**
- Add `on_hold` to `job_status` enum: `ALTER TYPE job_status ADD VALUE 'on_hold'`

### Mobile UX Strategy (the differentiator)
- Pipeline on mobile: stacked vertical lanes with sticky headers showing stage name + count
- Each lane collapses/expands with smooth animation
- Quick-action buttons on each card: long-press or swipe to move to next stage
- Bottom sheet for moving a job to any stage (select from list)
- Large touch targets (min 44px), generous spacing

### Technical Plan

**Files to create:**
- `src/pages/Pipeline.tsx` -- Kanban pipeline page
- `src/pages/Projects.tsx` -- Archive/filtered projects list
- `src/components/pipeline/PipelineColumn.tsx` -- Single kanban column
- `src/components/pipeline/PipelineCard.tsx` -- Job card in pipeline
- `src/components/pipeline/MobilePipelineStage.tsx` -- Collapsible mobile stage

**Files to edit:**
- `src/components/layout/AppSidebar.tsx` -- Add Pipeline + Projects nav items
- `src/App.tsx` -- Add routes for `/pipeline` and `/projects`
- `src/hooks/useJobs.ts` -- Add `useJobsByStatus` hook for pipeline grouping
- `src/pages/JobDetail.tsx` -- Add "on_hold" status actions (pause/resume)
- `src/pages/Jobs.tsx` -- Add "On Hold" filter option

**Database migration:**
```sql
ALTER TYPE job_status ADD VALUE 'on_hold';
```

### Component Architecture

```text
Pipeline Page
├── Desktop: CSS Grid with 5 columns
│   └── PipelineColumn (per stage)
│       └── PipelineCard[] (job cards with status actions)
└── Mobile: Vertical stack
    └── MobilePipelineStage (collapsible, with count badge)
        └── PipelineCard[] (compact cards with quick-move button)

Projects Page
├── Filter tabs (Active / Past / New)
├── Search + sort controls
└── Job cards list (reuses similar card pattern from Jobs page)
```

### Key UX Details
- Pipeline cards show: job title, client name, scheduled date, and a "move to next stage" arrow button
- Color-coded stage headers (yellow=new, blue=in progress, orange=on hold, purple=invoiced, green=finished)
- On mobile, tapping a card opens a bottom drawer with full details + stage-move options
- Stage counts animate when jobs move between them
- Empty states per column with helpful prompts

