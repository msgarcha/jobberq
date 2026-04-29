-- Helper to generate a URL-safe 8-char token
CREATE OR REPLACE FUNCTION public.gen_short_review_token()
RETURNS text
LANGUAGE sql
VOLATILE
SET search_path = public
AS $$
  SELECT translate(substr(encode(extensions.gen_random_bytes(9), 'base64'), 1, 8), '/+=', 'abc');
$$;

ALTER TABLE public.review_requests
  ADD COLUMN IF NOT EXISTS short_token text;

-- Backfill existing rows
UPDATE public.review_requests
SET short_token = public.gen_short_review_token()
WHERE short_token IS NULL;

-- Make NOT NULL + default for new rows
ALTER TABLE public.review_requests
  ALTER COLUMN short_token SET DEFAULT public.gen_short_review_token(),
  ALTER COLUMN short_token SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS review_requests_short_token_key
  ON public.review_requests (short_token);