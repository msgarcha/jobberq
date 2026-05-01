-- Add foreign keys so PostgREST can embed clients & invoices into review_suggestions.
-- Also add FKs for ai_actions for completeness/future joins.
ALTER TABLE public.review_suggestions
  ADD CONSTRAINT review_suggestions_client_id_fkey
    FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

ALTER TABLE public.review_suggestions
  ADD CONSTRAINT review_suggestions_invoice_id_fkey
    FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;

ALTER TABLE public.review_suggestions
  ADD CONSTRAINT review_suggestions_team_id_fkey
    FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;

-- Add an INSERT policy for service role on review_suggestions (so the sweep can write)
DROP POLICY IF EXISTS "Service role inserts review_suggestions" ON public.review_suggestions;
CREATE POLICY "Service role inserts review_suggestions"
ON public.review_suggestions
FOR INSERT
TO service_role
WITH CHECK (true);