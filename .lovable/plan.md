

## Fix PGRST200: team_members → profiles join

### Problem
`useTeamMembers` does `.select("*, profiles(display_name, avatar_url)")` but there is no foreign key from `team_members.user_id` to `profiles.user_id`, so PostgREST returns PGRST200.

### Solution
Add a foreign key constraint from `team_members.user_id` to `profiles.user_id` via a database migration.

### Changes

**Migration SQL:**
```sql
ALTER TABLE public.team_members
ADD CONSTRAINT fk_team_members_profile
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);
```

No code changes needed — the existing join in `useTeam.ts` will work once the FK exists.

