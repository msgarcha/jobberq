
ALTER TABLE public.company_settings 
  ADD COLUMN IF NOT EXISTS google_place_id text,
  ADD COLUMN IF NOT EXISTS notify_low_ratings boolean NOT NULL DEFAULT true;

ALTER TABLE public.review_requests 
  ADD COLUMN IF NOT EXISTS posted_to_google_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS owner_notified_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;
