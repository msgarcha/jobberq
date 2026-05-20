# Landing polish, Features page, mobile menu & SEO

## 1. Fix landing flow & section boundaries
- In `src/pages/Landing.tsx`, move `IndustryTicker` from right after `HeroSection` to right after `CinematicBanner` (the 4-steps section). New order: Hero → CinematicBanner (4 steps) → IndustryTicker → StorytellingTabs → StatsBanner → ComparisonSection → FeaturesGrid → BuiltDifferent → Testimonials → ROI → Pricing → FinalCTA.
- Add alternating section backgrounds so boundaries are visible: wrap/alter neighboring sections with `bg-background` vs `bg-secondary/30` vs subtle gradient bands, plus a thin `border-t border-border/40` between adjacent same-tone sections. Touch only the section wrapper classNames — no content rewrite.

## 2. How It Works page
- Replace the local `<LandingNav />` usage on `src/pages/HowItWorks.tsx`: it already uses it, but the nav links use in-page `scrollTo("features")` which silently fails on non-landing routes (making the menu feel "inactive"). Update `LandingNav.tsx` so anchor links navigate to `/landing#features` (etc.) when not already on `/landing`, and add a `How It Works` active state via `useLocation`.
- Visual upgrade for the 4 step blocks: give each step its own accent tint (teal / gold / coral / indigo from existing tokens) for the icon tile + number, add a soft gradient card background, and a connector line on desktop between steps. Keep copy unchanged.

## 3. New Features page
- Create `src/pages/Features.tsx` with a hero, then one section per feature (Reviews, Jobs, Pipeline, Quotes, Invoicing, Scheduling, AI Linq Assistant, Pricing Forms, Client Hub, Payments). Each section: zig-zag layout with a "dashboard clip" mockup on one side and benefit copy + bullet highlights on the other. Reuse the visual style from `FeaturesGrid`'s `DashboardMockup` — build small focused mockups per feature (Pipeline kanban columns, Reviews stars + request card, AI assistant chat bubble, etc.) using semantic tokens so they match real dashboards. No screenshots from production — pure styled mockups for performance/SEO.
- Add `/features` route in `src/App.tsx` (public).
- Add `Features` link to `LandingNav` desktop menu and update `public/sitemap.xml` + `public/llms.txt`.

## 4. Mobile menu (LandingNav)
- Current nav hides links behind `md:flex` with no hamburger → mobile Safari/Chrome show nothing. Add a `Menu` icon button visible on `< md` that opens a `Sheet` (already in shadcn) from the right with: Features, Industries, Pricing, How It Works, Log In, Get Started.
- Ensure anchor links route correctly from any page (see point 2).

## 5. SEO
- Add `<Seo>` to the new `Features` page with unique title/description and canonical `/features`.
- Verify `HowItWorks` and `Landing` already have `<Seo>` (they do) — extend `Seo.tsx` to also emit `og:image` only when provided (optional prop), and `twitter:card="summary_large_image"`.
- Single H1 per new page, semantic `<section>` + `<h2>` for each feature block, descriptive `alt` on any decorative imagery (use `alt=""` for pure decoration).
- Add `Features` entry to `public/sitemap.xml` with `<priority>0.8</priority>` and to `public/llms.txt`.
- Add JSON-LD `ItemList` of features on `/features` and `BreadcrumbList` on `/how-it-works` and `/features`.

## Technical notes
- Files created: `src/pages/Features.tsx`, `src/components/landing/features/*` (small mockup components per feature, e.g. `PipelineClip.tsx`, `ReviewsClip.tsx`, `AIClip.tsx`, `JobsClip.tsx`).
- Files edited: `src/pages/Landing.tsx`, `src/pages/HowItWorks.tsx`, `src/components/landing/LandingNav.tsx`, `src/components/Seo.tsx`, `src/App.tsx`, `public/sitemap.xml`, `public/llms.txt`.
- All colors via semantic tokens from `index.css` / `tailwind.config.ts` — no raw hex in components beyond what's already in the landing files.
- No backend/data changes.

## Out of scope
- Real screenshots of the production app (kept as styled mockups for speed and consistency).
- Rewriting existing landing copy.
