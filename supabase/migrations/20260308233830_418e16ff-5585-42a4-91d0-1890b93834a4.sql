-- Fix the trigger to allow migrations (postgres role) and service_role
CREATE OR REPLACE FUNCTION public.prevent_super_admin_self_update()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
BEGIN
  -- If is_super_admin is being changed
  IF OLD.is_super_admin IS DISTINCT FROM NEW.is_super_admin THEN
    -- Allow if:
    -- 1. Called via service_role 
    -- 2. Called via direct DB access (migration/postgres role - no JWT claim)
    -- 3. Called by database superuser
    DECLARE
      jwt_role TEXT := current_setting('request.jwt.claim.role', true);
    BEGIN
      IF jwt_role IS NOT NULL AND jwt_role != '' AND jwt_role != 'service_role' THEN
        -- Block client-side changes (reset to old value)
        NEW.is_super_admin := OLD.is_super_admin;
      END IF;
      -- Otherwise allow (service_role, postgres, or no JWT)
    END;
  END IF;
  RETURN NEW;
END;
$$;

-- Now set the super admin flag for the specific user
UPDATE public.profiles 
SET is_super_admin = true 
WHERE user_id = 'e0a5cf32-c9a6-4c71-8797-48f78401f627';