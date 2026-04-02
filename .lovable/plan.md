

## Fix Critical Email Issues (3 Problems)

### Problem Summary

1. **Signup verification email not sent**: Auth logs show `immediate_login_after_signup: true` — auto-confirm is enabled, so no verification email is sent. Users bypass email verification entirely.
2. **No onboarding/welcome email**: No welcome email template exists — this needs to be created as a transactional email.
3. **Quote/Invoice email returns 401**: The `send-transactional-email` function has `verify_jwt = true` in `config.toml`, and edge function logs show `POST | 401` responses. The client is calling the function but the JWT is being rejected or not passed.

### Root Causes & Fixes

#### Issue 1: Disable Auto-Confirm for Email Signups
- Use the auth configuration tool to **disable auto-confirm email signups**
- Once disabled, Supabase Auth will trigger the `auth-email-hook` to send a verification email before the user can sign in
- Update `src/pages/Login.tsx` to show a "Check your email to verify" message after signup instead of immediately redirecting

#### Issue 2: Welcome/Onboarding Email
- Create a new transactional email template `welcome-email.tsx` in `_shared/transactional-email-templates/`
- Register it in `registry.ts`
- Trigger it from `AuthContext.tsx` or `Onboarding.tsx` after the user completes onboarding
- Deploy `send-transactional-email`

#### Issue 3: Fix 401 on send-transactional-email
- The 401 is coming from Supabase's gateway JWT verification. The function has `verify_jwt = true` which is correct for authenticated users. However, the client might not be passing the JWT correctly, or the user's session may be invalid.
- **Fix**: Change `verify_jwt = false` in `config.toml` for `send-transactional-email` and add manual JWT validation inside the function instead. This is more resilient and matches how other functions in the project work.
- Alternatively, verify the Supabase client is correctly passing auth headers — but since `supabase.functions.invoke()` should do this automatically, the safer fix is to handle auth in-function.

### Implementation Steps

| # | Step | Files |
|---|------|-------|
| 1 | Disable auto-confirm email signups via auth config tool | Auth settings |
| 2 | Update Login page to show verification message after signup | `src/pages/Login.tsx` |
| 3 | Set `verify_jwt = false` for `send-transactional-email` and add in-function auth check | `supabase/config.toml`, `supabase/functions/send-transactional-email/index.ts` |
| 4 | Create welcome email template | `supabase/functions/_shared/transactional-email-templates/welcome-email.tsx` |
| 5 | Register welcome template in registry | `supabase/functions/_shared/transactional-email-templates/registry.ts` |
| 6 | Add welcome email trigger after onboarding | `src/pages/Onboarding.tsx` |
| 7 | Deploy all updated edge functions | `send-transactional-email`, `auth-email-hook` |
| 8 | Test all email flows via edge function logs | Verify auth emails queue, transactional emails send |

### Email Flows After Fix

```text
Signup → verification email (auth-email-hook) → user verifies → login
Onboarding complete → welcome email (send-transactional-email)
Send Quote → document email (send-transactional-email) ✓
Send Invoice → document email (send-transactional-email) ✓
Password Reset → recovery email (auth-email-hook)
```

### Key Detail: Why 401 Happens
The `send-transactional-email` function uses `verify_jwt = true`, which means Supabase's API gateway validates the JWT before the request reaches the function. If the user's token is expired or the session refresh failed, the gateway returns 401 without the function ever executing — hence no error logs in the function itself. Setting `verify_jwt = false` and checking auth manually inside the function gives better error messages and more control.

