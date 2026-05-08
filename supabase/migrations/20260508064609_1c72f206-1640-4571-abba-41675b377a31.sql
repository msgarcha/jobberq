-- Harden team_members policies to prevent self-insertion privilege escalation
DROP POLICY IF EXISTS "Team admins can manage members" ON public.team_members;

CREATE POLICY "Team admins can insert members"
ON public.team_members
FOR INSERT
TO authenticated
WITH CHECK (has_team_role(auth.uid(), team_id, 'admin'::app_role));

CREATE POLICY "Team admins can update members"
ON public.team_members
FOR UPDATE
TO authenticated
USING (has_team_role(auth.uid(), team_id, 'admin'::app_role))
WITH CHECK (has_team_role(auth.uid(), team_id, 'admin'::app_role));

CREATE POLICY "Team admins can delete members"
ON public.team_members
FOR DELETE
TO authenticated
USING (has_team_role(auth.uid(), team_id, 'admin'::app_role));