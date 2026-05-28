-- Public bucket to store generated paid-invoice receipt PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoice-receipts', 'invoice-receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can read receipt PDFs (download links sent via email to clients)
CREATE POLICY "Public read access to invoice receipts"
ON storage.objects
FOR SELECT
USING (bucket_id = 'invoice-receipts');