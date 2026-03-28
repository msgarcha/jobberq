

## Upgrade QuickLinq: Fonts, Landing Page Sections, Dashboard Polish

### 1. Font Update (Jobber-style)

Jobber uses **Poppins** for headings and body text. We will:

- Replace `Space Grotesk` (display/heading font) with **Poppins**
- Replace `DM Sans` (body font) with **Poppins** (lighter weight for body, semibold/bold for headings)
- Update heading sizes to match Jobber's larger, bolder style (hero h1 ~56-64px, section h2 ~40-48px)

**Files**: `src/index.css` (Google Fonts import), `tailwind.config.ts` (fontFamily), all landing components (font-size adjustments)

### 2. New Landing Page Sections (Differentiators)

Add 3 new sections that position QuickLinq as better than Jobber, without copying their layout:

**A. "Why Pros Switch" Comparison Section** (after StatsBanner)
- A clean, non-aggressive comparison table showing what QuickLinq includes at lower tiers that competitors charge more for
- Columns: Feature | Others | QuickLinq
- Not naming Jobber directly — just "Other platforms"
- Warm, confident tone

**B. "Built Different" Split-Feature Showcase** (after FeaturesGrid)
- 3 horizontal cards, each with a left illustration area and right text
- Highlights: (1) No per-user fees, (2) AI-powered smart scheduling, (3) One-click review collection
- Each card has a subtle gradient background, not boxy/AI-looking

**C. "Real Results" ROI Calculator Section** (before Pricing)
- Interactive mini-calculator: user enters # of jobs/week → shows estimated time saved, revenue recovered
- Simple slider + live output numbers
- Makes the value tangible and personal

### 3. Dashboard Improvements

Based on the Jobber reference screenshots, improve the dashboard:

- **Quick action cards row** below KPIs: "New Quote", "New Invoice", "New Job", "New Client" as icon cards (not just the top-bar dropdown)
- **Revenue mini-chart** in the KPI area (sparkline or small bar chart for last 7 days)
- **Better today's schedule styling**: time-based vertical timeline layout instead of flat list
- **Welcome banner with progress**: show onboarding completeness or a tip of the day

### Files to Change

| File | Changes |
|------|---------|
| `src/index.css` | Swap Google Fonts import to Poppins |
| `tailwind.config.ts` | Update fontFamily sans + display to Poppins |
| `src/components/landing/HeroSection.tsx` | Increase heading size, adjust font weights |
| `src/components/landing/StorytellingTabs.tsx` | Font size bump on headings |
| `src/components/landing/FeaturesGrid.tsx` | Font size bump |
| `src/components/landing/TestimonialsSection.tsx` | Font size bump |
| `src/components/landing/PricingSection.tsx` | Font size bump |
| `src/components/landing/StatsBanner.tsx` | Font size bump |
| `src/components/landing/FinalCTA.tsx` | Font size bump |
| `src/components/landing/ComparisonSection.tsx` | **NEW** — "Why Pros Switch" table |
| `src/components/landing/BuiltDifferent.tsx` | **NEW** — 3 differentiator cards |
| `src/components/landing/ROICalculator.tsx` | **NEW** — interactive savings calculator |
| `src/pages/Landing.tsx` | Import + render new sections |
| `src/pages/Index.tsx` | Dashboard: quick actions, better schedule, welcome banner |

### Design Notes
- All new sections use existing color palette (dark teal, cream, warm gold)
- No stock-looking card grids — use asymmetric layouts, subtle gradients, real spacing
- Interactive calculator uses native React state (no external deps)
- Dashboard quick actions use the same icon set already in the sidebar

