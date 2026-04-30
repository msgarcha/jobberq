-- Revoke anon EXECUTE on permission-check SECURITY DEFINER functions.
-- Keep authenticated access since RLS policies invoke these.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_team_role(uuid, uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_team_member(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_team_id(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.accept_team_invitation(text, uuid) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_team_role(uuid, uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_team_member(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_team_id(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.accept_team_invitation(text, uuid) TO authenticated, service_role;