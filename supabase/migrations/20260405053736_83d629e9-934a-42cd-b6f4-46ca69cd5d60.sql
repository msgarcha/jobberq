
-- 1. Fix connect_products: remove anon read, scope to team members
DROP POLICY IF EXISTS "Anyone can view connect products" ON connect_products;
CREATE POLICY "Team members can view connect products"
  ON connect_products FOR SELECT TO authenticated
  USING (is_team_member(auth.uid(), team_id));

-- 2. Fix user_roles: prevent admin self-grant escalation
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;

-- Admins can view all roles
CREATE POLICY "Admins can view all roles"
  ON user_roles FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Admins can insert non-admin roles only
CREATE POLICY "Admins can insert roles"
  ON user_roles FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin')
    AND role != 'admin'
  );

-- Admins can update non-admin roles only
CREATE POLICY "Admins can update roles"
  ON user_roles FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') AND role != 'admin')
  WITH CHECK (role != 'admin');

-- Admins can delete non-admin roles only
CREATE POLICY "Admins can delete roles"
  ON user_roles FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') AND role != 'admin');

-- 3. Fix storage policies: replace LIMIT 1 with IN for multi-team safety
DROP POLICY IF EXISTS "Team-scoped update company assets" ON storage.objects;
CREATE POLICY "Team-scoped update company assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'company-assets' AND
    (storage.foldername(name))[1] IN (
      SELECT team_id::text FROM team_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Team-scoped delete company assets" ON storage.objects;
CREATE POLICY "Team-scoped delete company assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'company-assets' AND
    (storage.foldername(name))[1] IN (
      SELECT team_id::text FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Also fix the INSERT policy if it exists with LIMIT 1
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Team-scoped upload company assets') THEN
    EXECUTE 'DROP POLICY "Team-scoped upload company assets" ON storage.objects';
  END IF;
END $$;

CREATE POLICY "Team-scoped upload company assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'company-assets' AND
    (storage.foldername(name))[1] IN (
      SELECT team_id::text FROM team_members WHERE user_id = auth.uid()
    )
  );
