
-- Dedupe clients by (team_id, lower(email)): keep oldest, repoint references, delete losers
WITH ranked AS (
  SELECT id, team_id, lower(email) AS lemail,
    row_number() OVER (PARTITION BY team_id, lower(email) ORDER BY created_at ASC) AS rn,
    first_value(id) OVER (PARTITION BY team_id, lower(email) ORDER BY created_at ASC) AS keeper_id
  FROM public.clients
  WHERE email IS NOT NULL
),
losers AS (SELECT id, keeper_id FROM ranked WHERE rn > 1)
UPDATE public.quotes q SET client_id = l.keeper_id FROM losers l WHERE q.client_id = l.id;

WITH ranked AS (
  SELECT id, team_id, lower(email) AS lemail,
    row_number() OVER (PARTITION BY team_id, lower(email) ORDER BY created_at ASC) AS rn,
    first_value(id) OVER (PARTITION BY team_id, lower(email) ORDER BY created_at ASC) AS keeper_id
  FROM public.clients WHERE email IS NOT NULL
),
losers AS (SELECT id, keeper_id FROM ranked WHERE rn > 1)
UPDATE public.invoices i SET client_id = l.keeper_id FROM losers l WHERE i.client_id = l.id;

WITH ranked AS (
  SELECT id, team_id, lower(email) AS lemail,
    row_number() OVER (PARTITION BY team_id, lower(email) ORDER BY created_at ASC) AS rn,
    first_value(id) OVER (PARTITION BY team_id, lower(email) ORDER BY created_at ASC) AS keeper_id
  FROM public.clients WHERE email IS NOT NULL
),
losers AS (SELECT id, keeper_id FROM ranked WHERE rn > 1)
UPDATE public.jobs j SET client_id = l.keeper_id FROM losers l WHERE j.client_id = l.id;

WITH ranked AS (
  SELECT id, team_id, lower(email) AS lemail,
    row_number() OVER (PARTITION BY team_id, lower(email) ORDER BY created_at ASC) AS rn,
    first_value(id) OVER (PARTITION BY team_id, lower(email) ORDER BY created_at ASC) AS keeper_id
  FROM public.clients WHERE email IS NOT NULL
),
losers AS (SELECT id, keeper_id FROM ranked WHERE rn > 1)
UPDATE public.properties p SET client_id = l.keeper_id FROM losers l WHERE p.client_id = l.id;

WITH ranked AS (
  SELECT id, team_id, lower(email) AS lemail,
    row_number() OVER (PARTITION BY team_id, lower(email) ORDER BY created_at ASC) AS rn,
    first_value(id) OVER (PARTITION BY team_id, lower(email) ORDER BY created_at ASC) AS keeper_id
  FROM public.clients WHERE email IS NOT NULL
),
losers AS (SELECT id, keeper_id FROM ranked WHERE rn > 1)
UPDATE public.review_requests r SET client_id = l.keeper_id FROM losers l WHERE r.client_id = l.id;

WITH ranked AS (
  SELECT id, team_id, lower(email) AS lemail,
    row_number() OVER (PARTITION BY team_id, lower(email) ORDER BY created_at ASC) AS rn,
    first_value(id) OVER (PARTITION BY team_id, lower(email) ORDER BY created_at ASC) AS keeper_id
  FROM public.clients WHERE email IS NOT NULL
),
losers AS (SELECT id, keeper_id FROM ranked WHERE rn > 1)
UPDATE public.pricing_form_submissions s SET client_id = l.keeper_id FROM losers l WHERE s.client_id = l.id;

WITH ranked AS (
  SELECT id, team_id, lower(email) AS lemail,
    row_number() OVER (PARTITION BY team_id, lower(email) ORDER BY created_at ASC) AS rn
  FROM public.clients WHERE email IS NOT NULL
)
DELETE FROM public.clients c USING ranked r WHERE c.id = r.id AND r.rn > 1;

-- Enforce no future dupes
CREATE UNIQUE INDEX IF NOT EXISTS clients_team_email_uniq
  ON public.clients (team_id, lower(email)) WHERE email IS NOT NULL;

-- Lead status pipeline
ALTER TABLE public.pricing_form_submissions ALTER COLUMN status SET DEFAULT 'new';

-- Backfill statuses based on linked quote state
UPDATE public.pricing_form_submissions s
SET status = CASE
  WHEN q.status::text IN ('approved','accepted') THEN 'won'
  WHEN q.status::text = 'sent' THEN 'quoted'
  ELSE 'new'
END
FROM public.quotes q
WHERE s.quote_id = q.id;

-- If linked invoice exists for the quote, mark won
UPDATE public.pricing_form_submissions s
SET status = 'won'
FROM public.invoices i
WHERE i.quote_id = s.quote_id;

-- Constrain status values
ALTER TABLE public.pricing_form_submissions
  DROP CONSTRAINT IF EXISTS pricing_form_submissions_status_check;
ALTER TABLE public.pricing_form_submissions
  ADD CONSTRAINT pricing_form_submissions_status_check
  CHECK (status IN ('new','quoted','won','lost'));

-- Auto-sync status when linked quote moves
CREATE OR REPLACE FUNCTION public.sync_lead_status_from_quote()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status::text IN ('approved','accepted') THEN
      UPDATE public.pricing_form_submissions SET status = 'won' WHERE quote_id = NEW.id AND status <> 'lost';
    ELSIF NEW.status::text = 'sent' THEN
      UPDATE public.pricing_form_submissions SET status = 'quoted' WHERE quote_id = NEW.id AND status = 'new';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_lead_status_from_quote ON public.quotes;
CREATE TRIGGER trg_sync_lead_status_from_quote
AFTER UPDATE ON public.quotes
FOR EACH ROW EXECUTE FUNCTION public.sync_lead_status_from_quote();

-- Auto-sync status when invoice is created from a quote
CREATE OR REPLACE FUNCTION public.sync_lead_status_from_invoice()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.quote_id IS NOT NULL THEN
    UPDATE public.pricing_form_submissions SET status = 'won'
      WHERE quote_id = NEW.quote_id AND status <> 'lost';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_lead_status_from_invoice ON public.invoices;
CREATE TRIGGER trg_sync_lead_status_from_invoice
AFTER INSERT ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.sync_lead_status_from_invoice();

-- Helpful indexes for the leads inbox
CREATE INDEX IF NOT EXISTS pricing_form_submissions_team_status_idx
  ON public.pricing_form_submissions (team_id, status, created_at DESC);
