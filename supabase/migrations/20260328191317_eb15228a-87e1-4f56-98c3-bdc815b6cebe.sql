
-- Tighten the profiles UPDATE policy to prevent is_super_admin modification
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND is_super_admin = (SELECT p.is_super_admin FROM public.profiles p WHERE p.user_id = auth.uid())
  );
