# UI Polish: Toggles, Radio Buttons & FAB Close Button

Two surgical fixes, both addressing the issues in the screenshots without touching any business logic.

## 1. Toggles & radio buttons get squished into circles/tall ovals

**Cause:** The `Switch` track (`h-6 w-11`) and `RadioGroupItem` (`h-4 w-4`) have no `shrink-0`. Inside flex rows (e.g. "Deposit Required" header, "Percentage / Fixed Amount" row, PDF Style cards), flexbox compresses their width on narrow phone screens. The switch collapses toward a circle/sphere and the radio collapses into a tall vertical oval — exactly what the screenshots show.

**Fix (global, covers the whole app):**
- `src/components/ui/switch.tsx` — add `shrink-0` to the `Switch` root so the 44×24 pill keeps its shape everywhere.
- `src/components/ui/radio-group.tsx` — add `shrink-0` to `RadioGroupItem` so every radio stays a perfect 16×16 circle (Deposit type, PDF Style, and any other radios).

This automatically fixes every switch (Deposit Required, Automatic Reminders, recurring invoices, review settings) and every radio across the app — no per-page edits needed.

## 2. FAB "X" close button looks like it disappears

**Cause:** When the create menu opens, the FAB turns into a red ✕, but it lives in the bottom nav at `z-40`, while the menu overlay/backdrop sits at `z-50`. The backdrop is painted on top of the FAB, dimming it so it appears gone, and it reads as un-tappable.

**Fix:** In `src/components/layout/MobileBottomNav.tsx`, raise the bottom nav above the backdrop while the create menu is open (e.g. switch the nav's `z-40` to a higher z, such as `z-[60]`, when `fabOpen || fabClosing`). The red ✕ then renders bright and fully tappable alongside the New Client / Quote / Invoice / Job options, and tapping it closes the menu (existing `handleTab` already toggles it closed). Clicking outside still closes it too.

## Verification
- Confirm the web build compiles.
- Visually check (preview): switch is a clear horizontal pill, radios are clean circles, and the create menu shows a bright, tappable red ✕.

## Notes
These are presentation-only CSS/z-index changes. No data, auth, or backend changes.
