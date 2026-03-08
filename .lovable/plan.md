

## Mobile UI Fixes & Improvements

### Issues Identified

1. **Notification bell not clickable** — it's a `Button` but has no `onClick` handler
2. **Avatar (M icon) not interactive** — it's a plain `div`, needs to be a dropdown with account actions
3. **Settings page messy on mobile** — tabs overflow, grids don't stack, team invite form is horizontal
4. **More menu items too small** — grid is 4-col with tiny icons/text despite available space
5. **Login page buttons overflow** — the card lacks horizontal padding constraints, inputs hit edges

### Changes

**`src/components/layout/TopBar.tsx`**
- Make notification bell a toast/placeholder that says "Notifications coming soon"
- Replace the avatar `div` with a `DropdownMenu` containing: Account Settings, Change Password, Sign Out
- Both mobile and desktop versions get these changes

**`src/components/layout/MobileBottomNav.tsx`**
- Change More overlay grid from `grid-cols-4` to `grid-cols-3` with larger icons (`h-6 w-6`), larger text (`text-xs`), and more padding (`py-4`)

**`src/pages/Settings.tsx`**
- Make `TabsList` horizontally scrollable on mobile: wrap in a container with `overflow-x-auto` and use `flex` instead of inline for triggers
- Company details: stack logo above fields on mobile instead of side-by-side (`flex-col md:flex-row`)
- Address grid: `grid-cols-2 md:grid-cols-4` so city/state/zip don't crush on mobile
- Team invite form: stack vertically on mobile (`flex-col md:flex-row`)
- Billing current plan: stack vertically on mobile
- Pricing cards: single column on mobile (`grid-cols-1 sm:grid-cols-3`)

**`src/pages/Login.tsx`**
- Add `overflow-hidden` to the card wrapper
- Ensure padding is adequate: `px-5` on CardContent
- Constrain max-width with proper mobile margins

**Additional UI polish**
- Settings "Save Changes" button: full-width on mobile, sticky at bottom
- Team member rows: stack name/role vertically on mobile with action buttons below

### Technical Details

All changes are CSS/layout adjustments and adding a `DropdownMenu` to the TopBar avatar. No database or backend changes needed. Uses existing shadcn components (`DropdownMenu`, `ScrollArea`).

