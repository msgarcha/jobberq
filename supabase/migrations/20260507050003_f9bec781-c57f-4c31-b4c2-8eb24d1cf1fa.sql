
-- AI usage counters (for per-user rate limiting)
CREATE TABLE public.ai_usage_counters (
  user_id uuid NOT NULL,
  function_name text NOT NULL,
  window_kind text NOT NULL,
  window_start timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, function_name, window_kind, window_start)
);
CREATE INDEX idx_ai_usage_counters_window ON public.ai_usage_counters (window_start);

ALTER TABLE public.ai_usage_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages ai_usage_counters"
  ON public.ai_usage_counters FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Users view own ai_usage_counters"
  ON public.ai_usage_counters FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Atomic increment function (returns the new count)
CREATE OR REPLACE FUNCTION public.increment_ai_usage(
  _user_id uuid,
  _function_name text,
  _window_kind text,
  _window_start timestamptz
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count integer;
BEGIN
  INSERT INTO public.ai_usage_counters (user_id, function_name, window_kind, window_start, count)
  VALUES (_user_id, _function_name, _window_kind, _window_start, 1)
  ON CONFLICT (user_id, function_name, window_kind, window_start)
  DO UPDATE SET count = public.ai_usage_counters.count + 1, updated_at = now()
  RETURNING count INTO new_count;
  RETURN new_count;
END;
$$;

-- Onboarding email log (no double sends)
CREATE TABLE public.onboarding_email_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  email_kind text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, email_kind)
);
CREATE INDEX idx_onboarding_email_log_user ON public.onboarding_email_log (user_id);

ALTER TABLE public.onboarding_email_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages onboarding_email_log"
  ON public.onboarding_email_log FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);
