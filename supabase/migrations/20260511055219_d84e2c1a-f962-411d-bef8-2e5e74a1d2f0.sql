
-- Pricing Forms feature

CREATE TABLE public.pricing_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  user_id uuid NOT NULL,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  is_published boolean NOT NULL DEFAULT false,
  primary_color text NOT NULL DEFAULT '#1f5f6e',
  logo_url text,
  success_message text NOT NULL DEFAULT 'Thanks! We''ll be in touch shortly with your quote.',
  require_address boolean NOT NULL DEFAULT false,
  require_phone boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pricing_forms_team ON public.pricing_forms(team_id);
CREATE INDEX idx_pricing_forms_slug ON public.pricing_forms(slug) WHERE is_published = true;

ALTER TABLE public.pricing_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members view pricing forms"
  ON public.pricing_forms FOR SELECT TO authenticated
  USING (is_team_member(auth.uid(), team_id));

CREATE POLICY "Team members insert pricing forms"
  ON public.pricing_forms FOR INSERT TO authenticated
  WITH CHECK (is_team_member(auth.uid(), team_id) AND user_id = auth.uid());

CREATE POLICY "Team members update pricing forms"
  ON public.pricing_forms FOR UPDATE TO authenticated
  USING (is_team_member(auth.uid(), team_id))
  WITH CHECK (is_team_member(auth.uid(), team_id));

CREATE POLICY "Team admins delete pricing forms"
  ON public.pricing_forms FOR DELETE TO authenticated
  USING (has_team_role(auth.uid(), team_id, 'admin'::app_role));

CREATE TRIGGER trg_pricing_forms_updated
  BEFORE UPDATE ON public.pricing_forms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Services offered on a form
CREATE TABLE public.pricing_form_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.pricing_forms(id) ON DELETE CASCADE,
  team_id uuid NOT NULL,
  service_id uuid,
  display_name text NOT NULL,
  base_price numeric NOT NULL DEFAULT 0,
  unit_label text,
  min_qty numeric NOT NULL DEFAULT 1,
  max_qty numeric NOT NULL DEFAULT 1,
  tax_rate numeric,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pricing_form_services_form ON public.pricing_form_services(form_id);

ALTER TABLE public.pricing_form_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team manages pricing form services"
  ON public.pricing_form_services FOR ALL TO authenticated
  USING (is_team_member(auth.uid(), team_id))
  WITH CHECK (is_team_member(auth.uid(), team_id));

-- Qualifying questions
CREATE TABLE public.pricing_form_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.pricing_forms(id) ON DELETE CASCADE,
  team_id uuid NOT NULL,
  label text NOT NULL,
  help_text text,
  kind text NOT NULL CHECK (kind IN ('text','number','select','multiselect','yesno')),
  required boolean NOT NULL DEFAULT false,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  applies_to_service_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pricing_form_questions_form ON public.pricing_form_questions(form_id);

ALTER TABLE public.pricing_form_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team manages pricing form questions"
  ON public.pricing_form_questions FOR ALL TO authenticated
  USING (is_team_member(auth.uid(), team_id))
  WITH CHECK (is_team_member(auth.uid(), team_id));

-- Submissions
CREATE TABLE public.pricing_form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  form_id uuid NOT NULL REFERENCES public.pricing_forms(id) ON DELETE CASCADE,
  slug text NOT NULL,
  contact jsonb NOT NULL DEFAULT '{}'::jsonb,
  selected_services jsonb NOT NULL DEFAULT '[]'::jsonb,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  computed_subtotal numeric NOT NULL DEFAULT 0,
  computed_tax numeric NOT NULL DEFAULT 0,
  computed_total numeric NOT NULL DEFAULT 0,
  client_id uuid,
  quote_id uuid,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','converted','spam')),
  ip_hash text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pricing_form_submissions_team ON public.pricing_form_submissions(team_id, created_at DESC);
CREATE INDEX idx_pricing_form_submissions_form ON public.pricing_form_submissions(form_id);

ALTER TABLE public.pricing_form_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team views submissions"
  ON public.pricing_form_submissions FOR SELECT TO authenticated
  USING (is_team_member(auth.uid(), team_id));

CREATE POLICY "Team updates submissions"
  ON public.pricing_form_submissions FOR UPDATE TO authenticated
  USING (is_team_member(auth.uid(), team_id))
  WITH CHECK (is_team_member(auth.uid(), team_id));

-- No INSERT policy: submissions only flow through the edge function with service role.
-- No DELETE policy: keep audit trail.
