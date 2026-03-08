

## Mobile-First UX Overhaul

The screenshots reveal several core issues: horizontal overflow on tables/forms, cramped layout, no mobile bottom navigation, and the desktop sidebar pattern doesn't work on mobile. Here's the plan to make the app feel like a native mobile app (Jobber-style).

### 1. Mobile Bottom Tab Bar + Floating Action Button

**New component**: `src/components/layout/MobileBottomNav.tsx`
- Fixed bottom nav bar (visible only on mobile via `useIsMobile`) with 5 tabs: Home, Clients, Jobs, Invoices, More
- Each tab has icon + label, active state with primary color
- Center **floating action button (FAB)** — large circular `+` button
- Tapping FAB triggers a full-screen animated overlay (backdrop blur + dark overlay) with 4 options: New Client, New Quote, New Invoice, New Job — each as a large pill button with icon, stacked vertically with staggered fade-in animation
- Tapping outside or X closes the overlay with reverse animation

### 2. DashboardLayout Mobile Adaptation

**Edit**: `src/components/layout/DashboardLayout.tsx`
- On mobile: hide sidebar completely, reduce main padding from `p-6` to `px-4 pb-24 pt-4` (bottom padding for nav bar)
- Remove `SidebarTrigger` from TopBar on mobile

**Edit**: `src/components/layout/TopBar.tsx`
- On mobile: simplified header — just logo/title on left, notification bell + avatar on right
- Remove search bar on mobile (move to a dedicated search page or expandable)
- Remove the `+` Create dropdown on mobile (replaced by FAB)
- Hide `SidebarTrigger` on mobile

### 3. Mobile-Friendly Line Items Editor

**Edit**: `src/components/LineItemsEditor.tsx`
- On mobile: switch from `<Table>` to a **card-based layout** — each line item is a card with stacked fields
- Layout per card: Service selector (full width), Description (full width), then a 3-column row: Qty | Price | Total, and a row for Tax % | Disc % | Delete button
- "Add Line" button becomes full-width at bottom
- Totals section stays as-is but full width

### 4. Form Pages Mobile Polish

**Edit**: `src/pages/JobForm.tsx`, `src/pages/InvoiceForm.tsx`, `src/pages/QuoteForm.tsx`
- Replace `max-w-2xl`/`max-w-4xl` with responsive: full width on mobile
- Grid columns (`grid-cols-2`, `grid-cols-3`) become single column on mobile
- Save/Cancel buttons: on mobile, make primary save button full-width and sticky at bottom
- Form inputs get larger touch targets: `h-12` on mobile instead of default

### 5. List Pages Mobile Polish

**Edit**: `src/pages/Clients.tsx`, `src/pages/Jobs.tsx`, `src/pages/Invoices.tsx`, `src/pages/Quotes.tsx`
- Remove "New X" button from header on mobile (FAB handles this)
- Filter pills: horizontal scroll on mobile instead of wrapping
- Search input: full width on mobile
- List cards: slightly larger padding, bigger touch targets

### 6. Dashboard (Index) Mobile Polish

**Edit**: `src/pages/Index.tsx`
- KPI cards: 2-column grid stays but with tighter gaps
- Schedule/Activity sections: stack vertically (already does via lg:grid-cols)
- Greeting section: tighter spacing

### 7. Global CSS Touch Targets & Spacing

**Edit**: `src/index.css`
- Add mobile-specific utility: inputs and buttons get minimum 44px touch target on mobile
- Add safe-area inset padding for notched devices
- Add smooth scroll behavior

### 8. FAB Overlay Animation

The overlay uses:
- Backdrop: `bg-black/60 backdrop-blur-sm` with fade-in (200ms)
- Options animate in with staggered `translate-y + opacity` (each 50ms delay)
- Close: reverse animation
- All using Tailwind + CSS transitions (no extra library needed)

### Files to Create
- `src/components/layout/MobileBottomNav.tsx` — bottom tab bar + FAB + overlay

### Files to Edit
- `src/components/layout/DashboardLayout.tsx` — integrate MobileBottomNav, adjust padding
- `src/components/layout/TopBar.tsx` — simplify for mobile
- `src/components/LineItemsEditor.tsx` — card layout on mobile
- `src/pages/JobForm.tsx` — responsive form layout + sticky save
- `src/pages/InvoiceForm.tsx` — responsive form layout + sticky save
- `src/pages/QuoteForm.tsx` — responsive form layout + sticky save
- `src/pages/Clients.tsx` — mobile list polish
- `src/pages/Jobs.tsx` — mobile list polish
- `src/pages/Invoices.tsx` — mobile list polish
- `src/pages/Index.tsx` — mobile dashboard polish
- `src/index.css` — global mobile utilities, safe areas

### Implementation Priority
1. MobileBottomNav with FAB + animated overlay (biggest impact)
2. DashboardLayout + TopBar mobile adaptation
3. LineItemsEditor card layout
4. Form pages responsive fixes
5. List pages polish
6. Global CSS refinements

