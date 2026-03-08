
-- Add is_super_admin flag to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_super_admin boolean NOT NULL DEFAULT false;

-- Prevent users from updating their own is_super_admin flag
CREATE OR REPLACE FUNCTION public.prevent_super_admin_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- If is_super_admin is being changed and the caller is not using service_role
  IF OLD.is_super_admin IS DISTINCT FROM NEW.is_super_admin THEN
    -- Only allow if called via service_role (current_setting will be 'service_role' for service key)
    IF current_setting('request.jwt.claim.role', true) != 'service_role' THEN
      NEW.is_super_admin := OLD.is_super_admin;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_super_admin_flag
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_super_admin_self_update();
