
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS lead_source text;
