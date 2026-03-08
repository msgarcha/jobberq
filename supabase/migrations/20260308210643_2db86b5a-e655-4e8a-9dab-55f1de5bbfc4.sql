-- Add SELECT policy on team_invitations for authenticated users to read by token
CREATE POLICY "Anyone can read invitation by token"
ON public.team_invitations FOR SELECT
TO authenticated
USING (true);

-- Create a security definer function to handle invite acceptance
CREATE OR REPLACE FUNCTION public.accept_team_invitation(_token text, _user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv RECORD;
  current_membership RECORD;
  member_count int;
  result jsonb;
BEGIN
  -- Find the invitation
  SELECT ti.*, t.name as team_name
  INTO inv
  FROM team_invitations ti
  JOIN teams t ON t.id = ti.team_id
  WHERE ti.token = _token AND ti.accepted_at IS NULL;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Invalid or already used invite link.');
  END IF;

  IF inv.expires_at < now() THEN
    RETURN jsonb_build_object('error', 'This invite link has expired.');
  END IF;

  -- Check if user is already a member of this team
  IF EXISTS (SELECT 1 FROM team_members WHERE team_id = inv.team_id AND user_id = _user_id) THEN
    RETURN jsonb_build_object('success', true, 'message', 'You are already a member of this team!', 'team_name', inv.team_name);
  END IF;

  -- Remove from current team
  SELECT * INTO current_membership FROM team_members WHERE user_id = _user_id LIMIT 1;
  IF FOUND THEN
    SELECT count(*) INTO member_count FROM team_members WHERE team_id = current_membership.team_id;
    DELETE FROM team_members WHERE user_id = _user_id AND team_id = current_membership.team_id;
    IF member_count = 1 THEN
      -- Delete solo team's data
      DELETE FROM company_settings WHERE team_id = current_membership.team_id;
      DELETE FROM teams WHERE id = current_membership.team_id;
    END IF;
  END IF;

  -- Join new team
  INSERT INTO team_members (team_id, user_id, role) VALUES (inv.team_id, _user_id, inv.role);

  -- Mark invitation as accepted
  UPDATE team_invitations SET accepted_at = now() WHERE id = inv.id;

  RETURN jsonb_build_object('success', true, 'message', 'You have joined ' || inv.team_name || '!', 'team_name', inv.team_name);
END;
$$;