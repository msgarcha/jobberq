
-- connect_products: team-scoped UPDATE & DELETE
CREATE POLICY "Team members can update connect products"
ON public.connect_products
FOR UPDATE
TO authenticated
USING (public.is_team_member(auth.uid(), team_id))
WITH CHECK (public.is_team_member(auth.uid(), team_id));

CREATE POLICY "Team members can delete connect products"
ON public.connect_products
FOR DELETE
TO authenticated
USING (public.is_team_member(auth.uid(), team_id));

-- onboarding_email_log: explicit owner-scoped SELECT
CREATE POLICY "Users can view their own onboarding email log"
ON public.onboarding_email_log
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Realtime channel authorization for notifications-{team_id} topics.
-- Restricts subscribers to members of the team identified in the topic string.
CREATE POLICY "Team members can subscribe to their team notifications channel"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() LIKE 'notifications-%'
  AND public.is_team_member(
    auth.uid(),
    NULLIF(substring(realtime.topic() FROM 'notifications-(.*)$'), '')::uuid
  )
);
