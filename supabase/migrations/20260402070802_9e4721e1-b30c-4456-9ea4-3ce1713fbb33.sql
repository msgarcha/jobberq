
-- 1. Fix company-assets storage: scope write policies to team-owned paths
DROP POLICY IF EXISTS "Authenticated users can upload company assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update company assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete company assets" ON storage.objects;

CREATE POLICY "Team-scoped upload company assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'company-assets'
    AND (storage.foldername(name))[1] = (
      SELECT team_id::text FROM public.team_members
      WHERE user_id = auth.uid() LIMIT 1
    )
  );

CREATE POLICY "Team-scoped update company assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'company-assets'
    AND (storage.foldername(name))[1] = (
      SELECT team_id::text FROM public.team_members
      WHERE user_id = auth.uid() LIMIT 1
    )
  );

CREATE POLICY "Team-scoped delete company assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'company-assets'
    AND (storage.foldername(name))[1] = (
      SELECT team_id::text FROM public.team_members
      WHERE user_id = auth.uid() LIMIT 1
    )
  );

-- 2. Fix payouts INSERT: only service_role should insert payouts
DROP POLICY IF EXISTS "Service role can insert payouts" ON public.payouts;

CREATE POLICY "Service role can insert payouts"
  ON public.payouts FOR INSERT TO service_role
  WITH CHECK (true);

-- 3. Ensure RLS is enabled on webhook_errors (should already be, but be explicit)
ALTER TABLE public.webhook_errors ENABLE ROW LEVEL SECURITY;
