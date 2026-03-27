
-- Add new Stripe Connect columns to company_settings
ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS stripe_charges_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_payouts_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS payout_schedule text DEFAULT 'every_3_days';

-- Create payouts table
CREATE TABLE public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams(id),
  user_id uuid NOT NULL,
  stripe_payout_id text,
  amount_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  arrival_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view payouts"
ON public.payouts FOR SELECT TO authenticated
USING (is_team_member(auth.uid(), team_id));

CREATE POLICY "Service role can insert payouts"
ON public.payouts FOR INSERT TO authenticated
WITH CHECK (is_team_member(auth.uid(), team_id));

-- Create webhook_errors table for logging
CREATE TABLE public.webhook_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text,
  error_message text,
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_errors ENABLE ROW LEVEL SECURITY;
