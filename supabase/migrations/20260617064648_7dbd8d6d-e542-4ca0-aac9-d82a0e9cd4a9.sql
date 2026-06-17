CREATE TABLE public.iap_entitlements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'apple',
  product_id text,
  tier text,
  is_active boolean NOT NULL DEFAULT false,
  expires_at timestamptz,
  rc_app_user_id text,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

GRANT SELECT ON public.iap_entitlements TO authenticated;
GRANT ALL ON public.iap_entitlements TO service_role;

ALTER TABLE public.iap_entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own entitlement"
ON public.iap_entitlements
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER update_iap_entitlements_updated_at
BEFORE UPDATE ON public.iap_entitlements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();