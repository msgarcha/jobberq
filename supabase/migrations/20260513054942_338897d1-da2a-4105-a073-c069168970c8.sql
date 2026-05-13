ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS assigned_to uuid;
CREATE INDEX IF NOT EXISTS idx_jobs_assigned_to ON public.jobs(assigned_to);