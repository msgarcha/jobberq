-- Ensure one entitlement row per (user, provider) for upserts
ALTER TABLE public.iap_entitlements
  ADD CONSTRAINT iap_entitlements_user_provider_unique UNIQUE (user_id, provider);

-- Data API grants (writes happen via service role in the webhook)
GRANT SELECT, INSERT, UPDATE ON public.iap_entitlements TO authenticated;
GRANT ALL ON public.iap_entitlements TO service_role;

-- Keep updated_at fresh
DROP TRIGGER IF EXISTS update_iap_entitlements_updated_at ON public.iap_entitlements;
CREATE TRIGGER update_iap_entitlements_updated_at
  BEFORE UPDATE ON public.iap_entitlements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();