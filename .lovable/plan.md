# Mobile App Fixes (iOS / Capacitor)

Three issues, all frontend/presentation only. No backend changes.

## 1. Back buttons on inner screens

**Symptom:** Tapping items in the More sheet opens pages (Quotes, Invoices, Pipeline, Projects, Reviews, Schedule, Reports, Services, Settings) with no way back other than the bottom tab bar. Native iOS users expect a back chevron in the header.

**Approach:** Make the mobile `TopBar` context-aware.
- In `src/components/layout/TopBar.tsx`, when `isMobile` is true and `location.pathname !== "/"`, replace the leading logo with a back chevron button (`ArrowLeft` → `navigate(-1)`) plus a compact page title derived from the route (lookup map: `/quotes` → "Quotes", `/clients` → "Clients", etc.; fall back to a sensible title for unknown routes).
- Keep the right-side notification bell + avatar identical.
- Detail pages (QuoteDetail, InvoiceDetail, JobDetail, ClientDetail, *Form pages) already render their own ArrowLeft inside the page body — those will continue to work; the new TopBar back is an additional, always-present escape hatch and removes ambiguity.
- Home (`/`) keeps the logo as today.

## 2. Home page cut off on iPhone

**Symptom:** Content clipped at top/bottom in the iOS shell.

**Approach:**
- `src/index.css`: strengthen safe-area utilities so they work even when nested inside flex containers — switch `.safe-area-top` / `.safe-area-bottom` to use `max(env(safe-area-inset-*), Npx)` and add `.safe-area-pt` / `.safe-area-pb` variants applied to the scrollable `<main>` so content (not just chrome) respects the inset.
- `src/components/layout/DashboardLayout.tsx`: on mobile, increase bottom padding on `<main>` (currently `pb-24`) to `pb-28` and add `safe-area-pb` so the last card clears the home-indicator + bottom nav. Add `safe-area-pt` to defend against any host that doesn't paint the TopBar safe area.
- `src/components/layout/TopBar.tsx` mobile header: bump height from `h-14` → `h-12` *content* with safe-area padding on top of it (so notch space adds, not replaces). Verify the header total height is `env(safe-area-inset-top) + 56px`.
- `src/pages/Index.tsx`: ensure the greeting row uses `pt-1` and the KPI grid wraps cleanly at 375px (no horizontal overflow); add `overflow-x-hidden` on the outer wrapper as a guard.

## 3. AI features missing on mobile

**Symptom:** No visible AI entry point or AI surfaces in the native app.

**Approach:**
- `src/components/ai/LinqLauncher.tsx`: on mobile, raise the FAB above the bottom nav using `bottom-[calc(6rem+env(safe-area-inset-bottom))]` and enlarge to `h-14 w-14` with a small "AI" label badge so it's recognisable. Currently `bottom-24` can sit behind the nav on devices with a home indicator.
- `src/components/layout/MobileBottomNav.tsx`: add an "Ask Linq" tile in the More overlay (with `Sparkles` icon) that opens the AssistantSheet — gives users a discoverable second entry path.
- `src/pages/Index.tsx`: keep the existing `<ReviewSuggestionsCard />` (already rendered) but verify it shows on mobile (no `hidden md:block` wrapper) so AI review drafts are visible.
- AssistantSheet: ensure the input area has `safe-area-bottom` (already present) and uses `inputMode` so the iOS keyboard plays nicely.

## Files touched

- `src/components/layout/TopBar.tsx` — context-aware mobile header (back + title)
- `src/components/layout/DashboardLayout.tsx` — safe-area padding for main
- `src/components/layout/MobileBottomNav.tsx` — Ask Linq entry
- `src/components/ai/LinqLauncher.tsx` — bigger, labeled FAB above home indicator
- `src/index.css` — robust safe-area utilities
- `src/pages/Index.tsx` — overflow guard

## Out of scope

- The Capacitor console warnings (`UIScene lifecycle`, `RTIInputSystemClient`, font-parser, splash auto-hide) are iOS simulator/Capacitor noise and don't affect functionality. The splash auto-hide can be addressed separately by calling `SplashScreen.hide()` after mount if desired — happy to add in a follow-up.
- No native plugin additions, no backend changes, no route changes.
