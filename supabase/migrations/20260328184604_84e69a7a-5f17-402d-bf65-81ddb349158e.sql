
-- Remove the overly permissive SELECT policy that exposes all invitation tokens
DROP POLICY IF EXISTS "Anyone can read invitation by token" ON public.team_invitations;

-- Replace with a scoped policy: team admins can see their team's invitations,
-- and invited users can see invitations sent to their email
CREATE POLICY "Team admins and invited users can read invitations"
ON public.team_invitations
FOR SELECT
TO authenticated
USING (
  has_team_role(auth.uid(), team_id, 'admin'::app_role)
  OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
);
