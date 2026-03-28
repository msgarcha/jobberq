
-- 1. Attach the existing trigger function to prevent is_super_admin escalation
CREATE TRIGGER prevent_super_admin_self_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_super_admin_self_update();

-- 2. Add INSERT policy on teams table
CREATE POLICY "Authenticated users can create teams"
  ON public.teams FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
