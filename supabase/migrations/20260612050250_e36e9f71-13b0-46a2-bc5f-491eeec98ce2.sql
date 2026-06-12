-- invoice-receipts is now a private bucket. Receipt PDFs contain client PII and
-- financial details. Access is via long-lived signed URLs generated server-side
-- by the service role, so no public SELECT policy is needed.
DROP POLICY IF EXISTS "Public read access to invoice receipts" ON storage.objects;