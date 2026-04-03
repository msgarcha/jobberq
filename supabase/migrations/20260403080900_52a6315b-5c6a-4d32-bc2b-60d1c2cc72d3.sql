
-- Table to store connected Stripe V2 accounts linked to users/teams
CREATE TABLE public.connected_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  stripe_account_id text NOT NULL UNIQUE,
  display_name text NOT NULL,
  contact_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table to store products created on the platform, linked to a connected account
CREATE TABLE public.connect_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  stripe_product_id text NOT NULL UNIQUE,
  stripe_price_id text,
  connected_account_id text NOT NULL,
  name text NOT NULL,
  description text,
  price_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'usd',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_products ENABLE ROW LEVEL SECURITY;

-- Connected accounts: team members can read/write their team's accounts
CREATE POLICY "Team members can view connected accounts"
  ON public.connected_accounts FOR SELECT TO authenticated
  USING (public.is_team_member(auth.uid(), team_id));

CREATE POLICY "Team members can create connected accounts"
  ON public.connected_accounts FOR INSERT TO authenticated
  WITH CHECK (public.is_team_member(auth.uid(), team_id));

-- Products: team members can manage, anyone can read (storefront)
CREATE POLICY "Anyone can view connect products"
  ON public.connect_products FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Team members can create connect products"
  ON public.connect_products FOR INSERT TO authenticated
  WITH CHECK (public.is_team_member(auth.uid(), team_id));
