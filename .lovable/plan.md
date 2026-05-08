# Fix Home Card Horizontal Overflow

**Symptom:** On mobile (and inside the iOS app) the "Today's Schedule" and "Recent Activity" cards push past the right edge — "View all" gets clipped and the page gets a horizontal scrollbar. Visible in the screenshot: the green "converted" badge and the "View all" links are cut off.

**Root cause:** In `src/pages/Index.tsx` the activity row uses a flex layout where the right-hand column (`text-right shrink-0`) holds a Badge whose text (`converted`, `converted_to_invoice`, etc.) can be long. Combined with the long left-side title (`Quote Q-54151005 converted to invoice`), the row's intrinsic width exceeds the card. The Card itself has no `overflow-hidden`, so it stretches the parent grid past the viewport. Same pattern on the schedule card header (`View all` button + title).

## Changes (presentation-only, `src/pages/Index.tsx`)

1. Add `overflow-hidden` to both the Schedule and Recent Activity `<Card>` wrappers so nothing can paint outside the rounded card.
2. Add `min-w-0` to the outer Main Content Grid columns (`lg:col-span-2` / `lg:col-span-3`) — required so flex/grid children can actually shrink and truncate.
3. Recent Activity row: add `min-w-0` to the row, keep `truncate` on title/detail, and constrain the right column with `max-w-[40%]` + `truncate` on the Badge (Badge becomes `<Badge className="... max-w-full truncate inline-block">`).
4. Schedule card header: add `min-w-0` to the title flex container and `shrink-0` already on button — verify "View all" button label is hidden below a tiny breakpoint or shortened to an icon-only chevron when card is narrow.
5. Greeting/Tip wrapper: add `overflow-hidden` to the outer `space-y-6` container as a last-line guard so any future overflow is clipped, not scrolled.

## Out of scope

- No backend, no layout restructure, no new components.
- DashboardLayout already has `overflow-x-hidden` from the previous change; this fix targets the cards themselves so the layout doesn't need a horizontal scrollbar in the first place.
