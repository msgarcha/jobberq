-- email-assets is an admin/server-managed bucket holding static brand logos
-- referenced by email templates. Uploads happen only via service_role
-- (which bypasses RLS). Add explicit write-deny policies for anon/authenticated
-- so no signed-in user can upload, overwrite, or delete brand assets.

CREATE POLICY "No client insert email-assets"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (false);

CREATE POLICY "No client update email-assets"
ON storage.objects FOR UPDATE TO anon, authenticated
USING (bucket_id = 'email-assets' AND false);

CREATE POLICY "No client delete email-assets"
ON storage.objects FOR DELETE TO anon, authenticated
USING (bucket_id = 'email-assets' AND false);