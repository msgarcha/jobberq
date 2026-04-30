-- Revoke EXECUTE on trigger-only SECURITY DEFINER functions from public/anon/authenticated.
-- These are invoked by the database, not by clients.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_super_admin_self_update() FROM PUBLIC, anon, authenticated;