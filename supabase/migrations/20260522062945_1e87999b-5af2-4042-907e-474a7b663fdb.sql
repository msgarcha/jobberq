ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS access_revoked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS access_revoked_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_profiles_access_revoked ON public.profiles(access_revoked) WHERE access_revoked = true;