
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

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS next_job_number integer DEFAULT 1001,
  ADD COLUMN IF NOT EXISTS job_prefix text DEFAULT 'J-';
