-- Enable trigram for fuzzy client matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- AI actions audit log
CREATE TABLE public.ai_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  doc_type TEXT,
  doc_id UUID,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members view ai_actions"
  ON public.ai_actions FOR SELECT TO authenticated
  USING (public.is_team_member(auth.uid(), team_id));

CREATE POLICY "Team members insert ai_actions"
  ON public.ai_actions FOR INSERT TO authenticated
  WITH CHECK (public.is_team_member(auth.uid(), team_id) AND user_id = auth.uid());

CREATE INDEX idx_ai_actions_team_created ON public.ai_actions(team_id, created_at DESC);

-- Review suggestions queue
CREATE TABLE public.review_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL,
  invoice_id UUID NOT NULL,
  client_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(invoice_id)
);

ALTER TABLE public.review_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team views review_suggestions"
  ON public.review_suggestions FOR SELECT TO authenticated
  USING (public.is_team_member(auth.uid(), team_id));

CREATE POLICY "Team updates review_suggestions"
  ON public.review_suggestions FOR UPDATE TO authenticated
  USING (public.is_team_member(auth.uid(), team_id));

CREATE POLICY "Team deletes review_suggestions"
  ON public.review_suggestions FOR DELETE TO authenticated
  USING (public.is_team_member(auth.uid(), team_id));

CREATE INDEX idx_review_suggestions_team_status ON public.review_suggestions(team_id, status, created_at DESC);

CREATE TRIGGER update_review_suggestions_updated_at
  BEFORE UPDATE ON public.review_suggestions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Dismissed suggestion types (per-team learning)
CREATE TABLE public.ai_dismissed_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL,
  suggestion_key TEXT NOT NULL,
  dismiss_count INT NOT NULL DEFAULT 1,
  dismissed_until TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, suggestion_key)
);

ALTER TABLE public.ai_dismissed_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team views ai_dismissed"
  ON public.ai_dismissed_suggestions FOR SELECT TO authenticated
  USING (public.is_team_member(auth.uid(), team_id));

CREATE POLICY "Team manages ai_dismissed"
  ON public.ai_dismissed_suggestions FOR ALL TO authenticated
  USING (public.is_team_member(auth.uid(), team_id))
  WITH CHECK (public.is_team_member(auth.uid(), team_id));

CREATE TRIGGER update_ai_dismissed_updated_at
  BEFORE UPDATE ON public.ai_dismissed_suggestions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add personalized_body to review_requests
ALTER TABLE public.review_requests
  ADD COLUMN IF NOT EXISTS personalized_body TEXT;

-- Add industry + AI toggle to company_settings
ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS ai_assistant_enabled BOOLEAN NOT NULL DEFAULT TRUE;

-- Trigram index on clients for fuzzy match
CREATE INDEX IF NOT EXISTS idx_clients_first_name_trgm ON public.clients USING gin (first_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_clients_last_name_trgm ON public.clients USING gin (last_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_clients_company_name_trgm ON public.clients USING gin (company_name gin_trgm_ops);