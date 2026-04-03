

## Fix 7 Critical Issues: Landing Page, Dashboard, Footer

### Issues Identified

1. **Broken/mismatched hero images** -- Several Unsplash URLs return 404 or show wrong trades. Replace ALL with verified, category-accurate Unsplash photos.
2. **Hero buttons not clickable** -- "Start Your Free Trial" navigates to `/login` (works). "See How It Works" scrolls to `#features` which exists. Likely a z-index issue with the dot-pattern overlay intercepting clicks. Fix: add `pointer-events-none` to the overlay div.
3. **Create a "How It Works" page** -- New `/how-it-works` public route with branded step-by-step walkthrough. "See How It Works" button navigates there instead of scrolling.
4. **Scroll performance** -- The hero has heavy CSS animations (scroll-up/scroll-down at 30s with 10 large images). Use `will-change: transform` and `transform: translateZ(0)` for GPU acceleration. Also add `loading="lazy"` to all non-visible images.
5. **Notifications still "coming soon"** -- The bell icon in TopBar shows a toast saying "coming soon". Replace with a dropdown showing recent activity (reuse `useRecentActivity` data).
6. **Dashboard activity shows nothing** -- The `useRecentActivity` hook queries invoices and quotes. If it returns empty, it's likely because the user has no data yet OR there's an RLS issue. Need to verify the hook works. Also the status description maps may be incomplete.
7. **Footer doesn't use the new logo** -- Footer uses `QuickLinqLogo` with `type="icon"` + a text span "QuickLinq". Should use `type="full"` instead. Footer items (About, Privacy, Terms, Contact) are plain text, not links.

### Plan

| # | File | Change |
|---|------|--------|
| 1 | `src/components/landing/HeroSection.tsx` | Replace all 10 image URLs with verified Unsplash photos that accurately match their trade labels. Add `pointer-events-none` to the dot-pattern overlay. Change "See How It Works" to `navigate("/how-it-works")`. Add `will-change: transform` to scroll columns. |
| 2 | `src/index.css` | Add `will-change: transform` and `transform: translateZ(0)` to `.animate-scroll-up`, `.animate-scroll-down`, `.animate-scroll-horizontal` for GPU-accelerated smooth scrolling. |
| 3 | `src/pages/HowItWorks.tsx` | **New page** -- branded "How It Works" walkthrough. 4 steps (Quote, Schedule, Invoice, Get Paid) with icons, descriptions, and screenshots/illustrations. Uses QuickLinqLogo, consistent branding. CTA at bottom to start free trial. |
| 4 | `src/App.tsx` | Add route `/how-it-works` pointing to new HowItWorks page. |
| 5 | `src/components/layout/TopBar.tsx` | Replace `handleNotifications` toast with a dropdown/popover showing recent activity from `useRecentActivity`. Show bell badge only when there are items. Each item clickable to navigate to the invoice/quote. |
| 6 | `src/components/landing/LandingFooter.tsx` | Replace `type="icon"` + text span with `type="full"`. Make "About", "Privacy Policy", "Terms of Service", "Contact" into proper links (About -> `/how-it-works`, Privacy/Terms -> placeholder pages or scroll anchors, Contact -> `mailto:` or anchor). Make industry items clickable to scroll to industries section. |
| 7 | `src/components/landing/LandingNav.tsx` | Add "How It Works" link in nav that navigates to `/how-it-works`. |

### Verified Unsplash Image Replacements

Each URL will use specific, high-quality photos that clearly match the trade:
- **Landscaping**: Lawn mowing / garden work photo
- **Roofing**: Worker on roof with shingles
- **Plumbing**: Plumber under sink / pipe work
- **Cleaning**: Professional cleaner with equipment
- **Carpentry**: Woodworking / framing photo
- **Electrical**: Electrician at panel / wiring
- **Painting**: House painter with roller
- **HVAC**: Technician with AC unit
- **Concrete**: Concrete pouring / finishing
- **Pressure Wash**: Power washing deck/driveway

### Notification Dropdown Design

Replace the toast with a `DropdownMenu` triggered by the bell icon:
- Shows last 5-8 recent activity items (invoices + quotes with status descriptions)
- Each item: icon + description text + relative time
- "View All" link at bottom navigates to `/invoices`
- Badge dot only shows when there are unread/recent items
- Reuses `useRecentActivity` hook already in the codebase

### How It Works Page Structure

```text
LandingNav
Hero: "How QuickLinq Works" headline + subtext
Step 1: Quote -- description + visual
Step 2: Schedule -- description + visual
Step 3: Invoice -- description + visual
Step 4: Get Paid -- description + visual
CTA: "Start Your Free Trial" button
LandingFooter
```

