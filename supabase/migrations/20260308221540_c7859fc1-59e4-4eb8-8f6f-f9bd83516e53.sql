
-- Create review_requests table
CREATE TABLE public.review_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  token text NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex') UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  rating integer,
  feedback text,
  submitted_at timestamp with time zone,
  redirected_to_google boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '30 days')
);

-- Enable RLS
ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;

-- Team members can manage review requests
CREATE POLICY "Team members can manage review requests"
  ON public.review_requests
  FOR ALL
  TO authenticated
  USING (is_team_member(auth.uid(), team_id));

-- Allow anon to read by token (for public form)
CREATE POLICY "Anyone can read review by token"
  ON public.review_requests
  FOR SELECT
  TO anon
  USING (true);

-- Add review settings columns to company_settings
ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS google_review_url text,
  ADD COLUMN IF NOT EXISTS review_min_stars integer NOT NULL DEFAULT 4,
  ADD COLUMN IF NOT EXISTS review_gating_enabled boolean NOT NULL DEFAULT true;
