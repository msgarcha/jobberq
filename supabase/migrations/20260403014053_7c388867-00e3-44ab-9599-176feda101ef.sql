ALTER TABLE public.quotes
  ADD COLUMN deposit_type text DEFAULT NULL,
  ADD COLUMN deposit_value numeric DEFAULT 0,
  ADD COLUMN deposit_amount numeric DEFAULT 0;