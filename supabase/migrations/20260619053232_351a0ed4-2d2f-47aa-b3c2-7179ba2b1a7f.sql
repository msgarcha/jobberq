-- Make new-signup trial assignment explicit (not just relying on the column default)
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_team_id uuid;
  invite_record RECORD;
BEGIN
  INSERT INTO public.profiles (user_id, display_name, trial_ends_at)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email), now() + interval '14 days');

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
$function$;

-- Keep the column default too, so any other insert path still gets a trial
ALTER TABLE public.profiles
  ALTER COLUMN trial_ends_at SET DEFAULT (now() + interval '14 days');

-- Backfill any existing profile missing a trial date
UPDATE public.profiles
SET trial_ends_at = COALESCE(created_at, now()) + interval '14 days'
WHERE trial_ends_at IS NULL;