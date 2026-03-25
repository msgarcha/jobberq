ALTER TABLE public.company_settings
  ADD COLUMN stripe_account_id text,
  ADD COLUMN stripe_onboarding_complete boolean NOT NULL DEFAULT false;