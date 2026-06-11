-- Per-document reminder configuration for invoices
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS reminders_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_frequency text NOT NULL DEFAULT 'weekly',
  ADD COLUMN IF NOT EXISTS reminder_limit integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS reminders_sent integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_reminder_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_reminder_at timestamptz;

-- Per-document reminder configuration for quotes
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS reminders_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_frequency text NOT NULL DEFAULT 'weekly',
  ADD COLUMN IF NOT EXISTS reminder_limit integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS reminders_sent integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_reminder_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_reminder_at timestamptz;

-- Global default reminder settings on company_settings
ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS default_reminders_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS default_reminder_frequency text NOT NULL DEFAULT 'weekly',
  ADD COLUMN IF NOT EXISTS default_reminder_limit integer NOT NULL DEFAULT 3;

-- Validate reminder_frequency values and clamp reminder_limit (triggers, not CHECK)
CREATE OR REPLACE FUNCTION public.validate_reminder_settings()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.reminder_frequency IS NULL OR NEW.reminder_frequency NOT IN ('weekly','biweekly','monthly') THEN
    NEW.reminder_frequency := 'weekly';
  END IF;
  IF NEW.reminder_limit IS NULL OR NEW.reminder_limit < 1 THEN
    NEW.reminder_limit := 1;
  ELSIF NEW.reminder_limit > 12 THEN
    NEW.reminder_limit := 12;
  END IF;
  IF NEW.reminders_sent IS NULL OR NEW.reminders_sent < 0 THEN
    NEW.reminders_sent := 0;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_company_reminder_defaults()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.default_reminder_frequency IS NULL OR NEW.default_reminder_frequency NOT IN ('weekly','biweekly','monthly') THEN
    NEW.default_reminder_frequency := 'weekly';
  END IF;
  IF NEW.default_reminder_limit IS NULL OR NEW.default_reminder_limit < 1 THEN
    NEW.default_reminder_limit := 1;
  ELSIF NEW.default_reminder_limit > 12 THEN
    NEW.default_reminder_limit := 12;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_invoice_reminder_settings ON public.invoices;
CREATE TRIGGER validate_invoice_reminder_settings
  BEFORE INSERT OR UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.validate_reminder_settings();

DROP TRIGGER IF EXISTS validate_quote_reminder_settings ON public.quotes;
CREATE TRIGGER validate_quote_reminder_settings
  BEFORE INSERT OR UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.validate_reminder_settings();

DROP TRIGGER IF EXISTS validate_company_reminder_defaults_trg ON public.company_settings;
CREATE TRIGGER validate_company_reminder_defaults_trg
  BEFORE INSERT OR UPDATE ON public.company_settings
  FOR EACH ROW EXECUTE FUNCTION public.validate_company_reminder_defaults();

-- Index to make the cron sweep cheap
CREATE INDEX IF NOT EXISTS idx_invoices_reminder_due
  ON public.invoices (next_reminder_at)
  WHERE reminders_enabled = true;

CREATE INDEX IF NOT EXISTS idx_quotes_reminder_due
  ON public.quotes (next_reminder_at)
  WHERE reminders_enabled = true;