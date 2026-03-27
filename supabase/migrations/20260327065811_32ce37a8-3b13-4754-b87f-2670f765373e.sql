
-- Create company-assets storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-assets', 'company-assets', true);

-- Allow authenticated users to upload to their team folder
CREATE POLICY "Authenticated users can upload company assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'company-assets');

-- Allow public read access
CREATE POLICY "Public read access for company assets"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'company-assets');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update company assets"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'company-assets');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete company assets"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'company-assets');

-- Add PDF customization columns to company_settings
ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS pdf_primary_color text DEFAULT '#1a1a1a',
ADD COLUMN IF NOT EXISTS pdf_accent_color text DEFAULT '#6366f1',
ADD COLUMN IF NOT EXISTS pdf_style text DEFAULT 'classic';
