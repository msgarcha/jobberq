## Issue

Your Supabase project is configured to send **8-digit** OTP codes (the value `payload.data.token` in the auth hook is 8 chars, e.g. `00430193`). The email template renders all 8 digits, but:

- The **frontend OTP input only has 6 slots**, so leading `0`s can't be entered and the full code never reaches `verifyOtp`.
- When you skip the zeros (`430193`), Supabase rejects it because the real token is `00430193`.

## Fix

Make the verification flow handle 8-digit codes end-to-end. Two coordinated changes:

### 1. `src/pages/Login.tsx` — 8-slot OTP input
- Change the `InputOTP` from 6 slots to **8 slots** (`maxLength={8}`, add `InputOTPSlot` indexes 6 and 7).
- Insert an `InputOTPSeparator` between slot 3 and 4 (visual `0043 - 0193` grouping, matches the email).
- Update the submit guard from `otpCode.length !== 6` to `otpCode.length !== 8`.
- No change to `verifyOtp` itself — it accepts whatever length Supabase issued.

### 2. `supabase/functions/_shared/email-templates/signup.tsx` — match grouping
- Update the `formatted` line to render `XXXX XXXX` when the code is 8 chars (currently only handles length 6: `${code.slice(0,3)} ${code.slice(3)}`).
- Reduce `letterSpacing` slightly (from `8px` → `6px`) so 8 digits + a gap still fit on narrow mobile widths.
- No prop changes; still receives `token` from the hook.

### 3. No backend / config changes
- Do **not** touch `auth-email-hook` — it correctly forwards `payload.data.token`.
- Do **not** change Supabase OTP length (you'd have to do that manually in the Cloud auth settings UI; `configure_auth` doesn't expose it). Matching the UI to the issued length is the safer fix and works regardless of what length is configured.

## Files to change

- `src/pages/Login.tsx` — 8-slot OTP, separator, length guard
- `supabase/functions/_shared/email-templates/signup.tsx` — 4+4 grouping, tighter letter-spacing

## Out of scope

- Forcing OTP length back to 6 (requires manual Cloud dashboard change; not exposed via tools).
- Other auth emails (recovery, magic-link) — they don't use OTP in our flow.

Confirm and I'll implement.