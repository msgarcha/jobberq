
-- 1. Create teams table
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- 2. Create team_members table
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- 3. Create team_invitations table
CREATE TABLE public.team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  token text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by uuid NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, email)
);
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- 4. Add team_id to all data tables
ALTER TABLE public.clients ADD COLUMN team_id uuid REFERENCES public.teams(id);
ALTER TABLE public.company_settings ADD COLUMN team_id uuid REFERENCES public.teams(id);
ALTER TABLE public.invoices ADD COLUMN team_id uuid REFERENCES public.teams(id);
ALTER TABLE public.invoice_line_items ADD COLUMN team_id uuid REFERENCES public.teams(id);
ALTER TABLE public.jobs ADD COLUMN team_id uuid REFERENCES public.teams(id);
ALTER TABLE public.payments ADD COLUMN team_id uuid REFERENCES public.teams(id);
ALTER TABLE public.properties ADD COLUMN team_id uuid REFERENCES public.teams(id);
ALTER TABLE public.quotes ADD COLUMN team_id uuid REFERENCES public.teams(id);
ALTER TABLE public.quote_line_items ADD COLUMN team_id uuid REFERENCES public.teams(id);
ALTER TABLE public.services_catalog ADD COLUMN team_id uuid REFERENCES public.teams(id);

-- 5. Helper function: get user's team_id
CREATE OR REPLACE FUNCTION public.get_user_team_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT team_id FROM public.team_members WHERE user_id = _user_id LIMIT 1
$$;

-- 6. Helper function: check if user is member of a team
CREATE OR REPLACE FUNCTION public.is_team_member(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = _user_id AND team_id = _team_id
  )
$$;

-- 7. Helper function: check team role
CREATE OR REPLACE FUNCTION public.has_team_role(_user_id uuid, _team_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = _user_id AND team_id = _team_id AND role = _role
  )
$$;

-- 8. Backfill: Create a team for each existing user and assign them as admin
DO $$
DECLARE
  r RECORD;
  new_team_id uuid;
BEGIN
  FOR r IN SELECT DISTINCT user_id FROM public.profiles LOOP
    INSERT INTO public.teams (name, owner_id)
    VALUES ('My Team', r.user_id)
    RETURNING id INTO new_team_id;

    INSERT INTO public.team_members (team_id, user_id, role)
    VALUES (new_team_id, r.user_id, 'admin');

    -- Backfill team_id on all data tables
    UPDATE public.clients SET team_id = new_team_id WHERE user_id = r.user_id;
    UPDATE public.company_settings SET team_id = new_team_id WHERE user_id = r.user_id;
    UPDATE public.invoices SET team_id = new_team_id WHERE user_id = r.user_id;
    UPDATE public.invoice_line_items SET team_id = new_team_id WHERE user_id = r.user_id;
    UPDATE public.jobs SET team_id = new_team_id WHERE user_id = r.user_id;
    UPDATE public.payments SET team_id = new_team_id WHERE user_id = r.user_id;
    UPDATE public.properties SET team_id = new_team_id WHERE user_id = r.user_id;
    UPDATE public.quotes SET team_id = new_team_id WHERE user_id = r.user_id;
    UPDATE public.quote_line_items SET team_id = new_team_id WHERE user_id = r.user_id;
    UPDATE public.services_catalog SET team_id = new_team_id WHERE user_id = r.user_id;
  END LOOP;
END $$;

-- 9. Update handle_new_user to auto-create team
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $func$
DECLARE
  new_team_id uuid;
  invite_record RECORD;
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin');

  -- Check if there's a pending invitation for this email
  SELECT * INTO invite_record
  FROM public.team_invitations
  WHERE email = NEW.email AND accepted_at IS NULL AND expires_at > now()
  LIMIT 1;

  IF invite_record IS NOT NULL THEN
    -- Join existing team via invitation
    INSERT INTO public.team_members (team_id, user_id, role)
    VALUES (invite_record.team_id, NEW.id, invite_record.role);

    UPDATE public.team_invitations SET accepted_at = now() WHERE id = invite_record.id;
  ELSE
    -- Create a new team for this user
    INSERT INTO public.teams (name, owner_id)
    VALUES ('My Team', NEW.id)
    RETURNING id INTO new_team_id;

    INSERT INTO public.team_members (team_id, user_id, role)
    VALUES (new_team_id, NEW.id, 'admin');
  END IF;

  RETURN NEW;
END;
$func$;

-- 10. RLS for teams table
CREATE POLICY "Team members can view their team"
  ON public.teams FOR SELECT
  USING (public.is_team_member(auth.uid(), id));

CREATE POLICY "Team owner can update team"
  ON public.teams FOR UPDATE
  USING (owner_id = auth.uid());

-- 11. RLS for team_members
CREATE POLICY "Team members can view members"
  ON public.team_members FOR SELECT
  USING (public.is_team_member(auth.uid(), team_id));

CREATE POLICY "Team admins can manage members"
  ON public.team_members FOR ALL
  USING (public.has_team_role(auth.uid(), team_id, 'admin'));

-- 12. RLS for team_invitations
CREATE POLICY "Team admins can manage invitations"
  ON public.team_invitations FOR ALL
  USING (public.has_team_role(auth.uid(), team_id, 'admin'));

-- 13. Update RLS on data tables to use team-based access
-- Drop old policies first, then create team-based ones

-- clients
DROP POLICY IF EXISTS "Users can manage own clients" ON public.clients;
CREATE POLICY "Team members can view clients"
  ON public.clients FOR SELECT
  USING (public.is_team_member(auth.uid(), team_id));
CREATE POLICY "Team members can insert clients"
  ON public.clients FOR INSERT
  WITH CHECK (public.is_team_member(auth.uid(), team_id));
CREATE POLICY "Team members can update clients"
  ON public.clients FOR UPDATE
  USING (public.is_team_member(auth.uid(), team_id));
CREATE POLICY "Team members can delete clients"
  ON public.clients FOR DELETE
  USING (public.is_team_member(auth.uid(), team_id));

-- company_settings
DROP POLICY IF EXISTS "Users can manage own settings" ON public.company_settings;
CREATE POLICY "Team members can view settings"
  ON public.company_settings FOR SELECT
  USING (public.is_team_member(auth.uid(), team_id));
CREATE POLICY "Team admins can manage settings"
  ON public.company_settings FOR ALL
  USING (public.has_team_role(auth.uid(), team_id, 'admin'));

-- invoices
DROP POLICY IF EXISTS "Users can manage own invoices" ON public.invoices;
CREATE POLICY "Team members can view invoices"
  ON public.invoices FOR SELECT
  USING (public.is_team_member(auth.uid(), team_id));
CREATE POLICY "Team members can insert invoices"
  ON public.invoices FOR INSERT
  WITH CHECK (public.is_team_member(auth.uid(), team_id));
CREATE POLICY "Team members can update invoices"
  ON public.invoices FOR UPDATE
  USING (public.is_team_member(auth.uid(), team_id));
CREATE POLICY "Team members can delete invoices"
  ON public.invoices FOR DELETE
  USING (public.is_team_member(auth.uid(), team_id));

-- invoice_line_items
DROP POLICY IF EXISTS "Users can manage own invoice line items" ON public.invoice_line_items;
CREATE POLICY "Team members can manage invoice line items"
  ON public.invoice_line_items FOR ALL
  USING (public.is_team_member(auth.uid(), team_id));

-- jobs
DROP POLICY IF EXISTS "Users can manage own jobs" ON public.jobs;
CREATE POLICY "Team members can view jobs"
  ON public.jobs FOR SELECT
  USING (public.is_team_member(auth.uid(), team_id));
CREATE POLICY "Team members can insert jobs"
  ON public.jobs FOR INSERT
  WITH CHECK (public.is_team_member(auth.uid(), team_id));
CREATE POLICY "Team members can update jobs"
  ON public.jobs FOR UPDATE
  USING (public.is_team_member(auth.uid(), team_id));
CREATE POLICY "Team members can delete jobs"
  ON public.jobs FOR DELETE
  USING (public.is_team_member(auth.uid(), team_id));

-- payments
DROP POLICY IF EXISTS "Users can manage own payments" ON public.payments;
CREATE POLICY "Team members can manage payments"
  ON public.payments FOR ALL
  USING (public.is_team_member(auth.uid(), team_id));

-- properties
DROP POLICY IF EXISTS "Users can manage own properties" ON public.properties;
CREATE POLICY "Team members can manage properties"
  ON public.properties FOR ALL
  USING (public.is_team_member(auth.uid(), team_id));

-- quotes
DROP POLICY IF EXISTS "Users can manage own quotes" ON public.quotes;
CREATE POLICY "Team members can view quotes"
  ON public.quotes FOR SELECT
  USING (public.is_team_member(auth.uid(), team_id));
CREATE POLICY "Team members can insert quotes"
  ON public.quotes FOR INSERT
  WITH CHECK (public.is_team_member(auth.uid(), team_id));
CREATE POLICY "Team members can update quotes"
  ON public.quotes FOR UPDATE
  USING (public.is_team_member(auth.uid(), team_id));
CREATE POLICY "Team members can delete quotes"
  ON public.quotes FOR DELETE
  USING (public.is_team_member(auth.uid(), team_id));

-- quote_line_items
DROP POLICY IF EXISTS "Users can manage own quote line items" ON public.quote_line_items;
CREATE POLICY "Team members can manage quote line items"
  ON public.quote_line_items FOR ALL
  USING (public.is_team_member(auth.uid(), team_id));

-- services_catalog
DROP POLICY IF EXISTS "Users can manage own services" ON public.services_catalog;
CREATE POLICY "Team members can view services"
  ON public.services_catalog FOR SELECT
  USING (public.is_team_member(auth.uid(), team_id));
CREATE POLICY "Team members can insert services"
  ON public.services_catalog FOR INSERT
  WITH CHECK (public.is_team_member(auth.uid(), team_id));
CREATE POLICY "Team admins can manage services"
  ON public.services_catalog FOR ALL
  USING (public.has_team_role(auth.uid(), team_id, 'admin'));
