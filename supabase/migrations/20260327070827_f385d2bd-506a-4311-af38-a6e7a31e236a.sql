
-- webhook_errors is only written by service role edge functions, allow service role full access
CREATE POLICY "Service role manages webhook errors"
ON public.webhook_errors FOR ALL
USING (true)
WITH CHECK (true);
