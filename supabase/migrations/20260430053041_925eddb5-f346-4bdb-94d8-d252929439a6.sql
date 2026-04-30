-- Defensive: explicitly revoke anon/authenticated access to email_unsubscribe_tokens table
REVOKE ALL ON TABLE public.email_unsubscribe_tokens FROM anon, authenticated;
GRANT ALL ON TABLE public.email_unsubscribe_tokens TO service_role;

-- Revoke EXECUTE on internal queue/email helper SECURITY DEFINER functions from anon/authenticated
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated, public;

GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;

-- gen_short_review_token is a helper used by a column default; restrict from anon/authenticated
REVOKE EXECUTE ON FUNCTION public.gen_short_review_token() FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.gen_short_review_token() TO service_role;