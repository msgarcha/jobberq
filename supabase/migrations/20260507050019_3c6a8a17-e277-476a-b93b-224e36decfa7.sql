
REVOKE EXECUTE ON FUNCTION public.increment_ai_usage(uuid, text, text, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_ai_usage(uuid, text, text, timestamptz) TO service_role;
