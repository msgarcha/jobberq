## Goal
Stabilize the `/login` mobile layout so the email/password fields and primary button never spill outside the white card on narrow screens or iPhone Safari.

## What I’ll change
1. **Refactor the login page layout**
   - Give the auth shell a stricter mobile-safe width strategy (`w-full`, `max-w-*`, `min-w-0`, internal spacing that scales down on small screens).
   - Make the card content stack use consistent padding so child elements cannot exceed the card width.
   - Keep the current visual design intact.

2. **Harden the form controls against overflow**
   - Ensure the tab row, inputs, and button all inherit full width safely.
   - Add any missing `min-w-0` / overflow guards on the form wrappers so long intrinsic widths can’t break out.
   - Tighten mobile spacing if needed so controls stay inside the card at 320–402px widths.

3. **Remove/neutralize any legacy global layout constraint causing auth-page bleed**
   - Check whether the old Vite root styles are still affecting the app shell.
   - If they are, replace them with app-safe root sizing so standalone pages like login are not constrained or offset unexpectedly.

4. **Validate on mobile viewport**
   - Re-check `/login` at small mobile width and confirm the inputs/button remain fully inside the card.

## Technical notes
- Likely touchpoints: `src/pages/Login.tsx` and, if still active in the bundle, legacy root CSS affecting `#root` sizing.
- I will keep this scoped to layout only — no auth logic or backend changes.
- I’ll preserve the existing QuickLinq styling while making the card responsive and resilient.