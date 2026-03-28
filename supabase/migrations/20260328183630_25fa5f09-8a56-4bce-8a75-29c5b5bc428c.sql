
-- 1. Remove the dangerously permissive anon SELECT on review_requests
DROP POLICY IF EXISTS "Anyone can read review by token" ON public.review_requests;

-- 2. Fix webhook_errors: replace the permissive ALL policy with service_role only
DROP POLICY IF EXISTS "Service role manages webhook errors" ON public.webhook_errors;

CREATE POLICY "Service role manages webhook errors"
ON public.webhook_errors
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
