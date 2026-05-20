
-- Notification type enum
DO $$ BEGIN
  CREATE TYPE public.notification_type AS ENUM (
    'quote_viewed', 'quote_approved', 'invoice_viewed', 'deposit_paid', 'invoice_paid'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  type public.notification_type NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_team_created
  ON public.notifications (team_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_team_unread
  ON public.notifications (team_id) WHERE read_at IS NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team members can view notifications" ON public.notifications;
CREATE POLICY "Team members can view notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (public.is_team_member(auth.uid(), team_id));

DROP POLICY IF EXISTS "Team members can mark notifications" ON public.notifications;
CREATE POLICY "Team members can mark notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (public.is_team_member(auth.uid(), team_id))
  WITH CHECK (public.is_team_member(auth.uid(), team_id));

-- Realtime
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Preferences on company_settings
ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS notify_on_quote_viewed boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_on_quote_approved boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_on_invoice_viewed boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_on_deposit_paid boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_on_invoice_paid boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notification_email text;
