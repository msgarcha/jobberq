CREATE TABLE public.client_saved_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  team_id uuid REFERENCES public.teams(id),
  stripe_customer_id text NOT NULL,
  stripe_payment_method_id text NOT NULL,
  card_brand text,
  card_last4 text,
  card_exp_month integer,
  card_exp_year integer,
  is_default boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.client_saved_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can manage saved cards"
  ON public.client_saved_cards FOR ALL
  TO authenticated
  USING (public.is_team_member(auth.uid(), team_id));