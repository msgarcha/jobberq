# Remove the "Continue with Apple" button

The "Continue with Apple" button on the login screen is non-functional and the app is already in review. We'll cleanly remove it. This is App Store–compliant: Guideline 4.8 only requires Sign in with Apple when the app offers *other* third-party logins (Google, Facebook, etc.). The login screen only offers email/password, so no Apple button is required.

## Changes (single file: `src/pages/Login.tsx`)

1. **Remove the Apple block in the Log In tab** (lines 337–343): the `or` divider and the `Continue with Apple` button.
2. **Remove the Apple block in the Sign Up tab** (lines 377–383): the `or` divider and the `Continue with Apple` button.
3. **Remove now-unused code:**
   - The `handleAppleSignIn` function (lines 174–193).
   - The `AppleIcon` component (lines 32–36).
   - The `import { lovable } from '@/integrations/lovable/index';` import (line 4), since it's only used by the Apple handler.

No other login behavior changes — email/password, OTP verification, password reset, terms acceptance, and sign-up all stay exactly as they are.

## Memory update

Update `mem://features/ios-app-store-compliance` (the "Sign in with Apple" bullet) to record that the Apple button was removed from Login because email/password is the only auth method, so Guideline 4.8 does not require it. This prevents a future session from re-adding it.

## Verification

- Confirm the build compiles with no unused-import/reference errors (no lingering references to `lovable`, `AppleIcon`, or `handleAppleSignIn`).
- Visually confirm the Log In and Sign Up tabs render with no Apple button and no leftover "or" divider.

## Notes / out of scope

- `src/integrations/lovable/index.ts` is auto-generated and will be left untouched (the package can stay installed; it's just no longer imported by Login).
- No backend/auth provider configuration changes are needed.
