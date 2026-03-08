

# Jobs Management CRUD

## Database Changes

Create a `jobs` table -- the `job_status` enum already exists (`pending`, `in_progress`, `complete`, `invoiced`).

```sql
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id),
  property_id uuid REFERENCES public.properties(id),
  quote_id uuid REFERENCES public.quotes(id),
  title text NOT NULL,
  description text,
  status job_status NOT NULL DEFAULT 'pending',
  scheduled_start timestamp with time zone,
  scheduled_end timestamp with time zone,
  completed_at timestamp with time zone,
  address text,
  internal_notes text,
  job_number text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own jobs"
  ON public.jobs FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

Also add `next_job_number` and `job_prefix` to `company_settings`:

```sql
ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS next_job_number integer DEFAULT 1001,
  ADD COLUMN IF NOT EXISTS job_prefix text DEFAULT 'J-';
```

## Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useJobs.ts` | `useJobs`, `useJob`, `useCreateJob`, `useUpdateJob`, `useDeleteJob` -- follows `useClients` pattern |
| `src/pages/JobForm.tsx` | Create/edit form with client selector, scheduling (date/time pickers), description, address, link to quote |
| `src/pages/JobDetail.tsx` | View job with status actions (Start, Complete, Create Invoice), linked quote/invoice info, scheduling details |

## Files to Edit

| File | Change |
|------|--------|
| `src/pages/Jobs.tsx` | Replace mock data with `useJobs`, real filters (All/Pending/In Progress/Complete), search, click to navigate to `/jobs/:id` |
| `src/pages/Schedule.tsx` | Replace mock data with `useJobs` filtered by date, show real scheduled jobs in the day timeline |
| `src/App.tsx` | Add routes: `/jobs/:id`, `/jobs/:id/edit`, `/jobs/new` -> `JobForm` |

## Key Design

- **Status workflow**: Pending -> In Progress (sets `scheduled_start`) -> Complete (sets `completed_at`) -> Invoiced (creates invoice linked via `job_id`)
- **"Create Invoice from Job"** on JobDetail: creates a new invoice with `job_id` set, copies client_id, and navigates to invoice form
- **Schedule page**: queries jobs where `scheduled_start` falls on the selected date, renders in timeline view
- **Job form**: Client selector (reuse existing component), date/time pickers for scheduling, textarea for description/notes
- **Auto-numbering**: reads `company_settings.job_prefix` + `next_job_number`, increments after creation

