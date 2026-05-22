## Goal

Every new signup must verify their email by entering a 6-digit OTP code (sent to their inbox) before they can log in. Replace the current "click the link in your email" verification with an in-app OTP entry screen.

## Current state

- `supabase/auth.users` has email confirmation **required** (auto-confirm disabled — per `mem://auth/verification-policy`).
- `src/pages/Login.tsx` signup uses `supabase.auth.signUp({ email, password, options: { emailRedirectTo } })` — relies on the confirmation link.
- Auth emails are custom-branded via `supabase/functions/auth-email-hook` + `_shared/email-templates/signup.tsx` and currently render a **"Verify Email" button** (link-based) with no `{{ .Token }}`.
- Supabase's `auth-email-hook` payload includes both `token_hash` (link) and `token` (6-digit OTP) for every signup — we just don't surface the OTP today.

## Plan

### 1. Email template — show the OTP code
Update `supabase/functions/_shared/email-templates/signup.tsx`:
- Accept a new `token` prop (the 6-digit code).
- Replace the "Verify Email" button with a large, monospaced, letter-spaced OTP block (e.g. `123 456`) and copy: *"Enter this code in QuickLinq to verify your email. Expires in 1 hour."*
- Keep brand styling (Poppins, dark teal `hsl(192 60% 22%)`, cream bg) — but per memory, email body bg stays white.
- Keep a small fallback link underneath ("Or click here") so users on the same device can still one-tap.

Update `supabase/functions/auth-email-hook/index.ts` to pass `email_data.token` into the `signup` template (today it likely only forwards `token_hash`/`confirmation_url`).

### 2. Frontend — OTP entry screen
In `src/pages/Login.tsx`:
- After a successful `signUp`, instead of just toasting "check your email", switch the form into a **"Verify your email" step** showing the email address and an OTP input (`@/components/ui/input-otp`, 6 slots).
- On submit, call:
  ```ts
  supabase.auth.verifyOtp({ email, token: code, type: 'email' })
  ```
- On success → user is signed in (Supabase returns a session); navigate to `redirectTo` (which will hit `/onboarding` via existing `ProtectedRoute` logic).
- Add **"Resend code"** button (60s cooldown) → `supabase.auth.resend({ type: 'signup', email })`.
- Add **"Use a different email"** link to reset the flow.

Also handle the case where an **existing unverified user tries to log in** (`signInWithPassword` returns `Email not confirmed`): auto-trigger the resend + show the same OTP screen.

### 3. Keep magic-link fallback working
The email still contains a clickable link as a backup; the existing default Supabase callback route will continue to work for users who click instead of typing. No route changes required.

### 4. No DB / auth config changes
- Email confirmation is already required.
- OTP length (6) and expiry (3600s) are Supabase defaults — no `configure_auth` call needed.
- No new migrations.

### 5. Deploy
After editing the template + hook, redeploy `auth-email-hook`.

## Files to change

- `supabase/functions/_shared/email-templates/signup.tsx` — show OTP code
- `supabase/functions/auth-email-hook/index.ts` — forward `token` to template
- `src/pages/Login.tsx` — add OTP verification step + resend flow

## Out of scope

- Changing other auth emails (recovery, magic-link, invite) — they keep their current link-based flow.
- Switching the password-reset flow to OTP.
- Phone/SMS OTP.

Confirm and I'll implement.
