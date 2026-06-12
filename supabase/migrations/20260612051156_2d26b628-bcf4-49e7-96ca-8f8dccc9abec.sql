DROP POLICY IF EXISTS "Team-scoped upload company assets" ON storage.objects;

CREATE POLICY "Team-scoped upload company assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT team_id::text FROM public.team_members WHERE user_id = auth.uid()
  )
);