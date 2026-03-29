

## Replace CinematicBanner + Fix Features Dashboard

### 1. Rewrite `src/components/landing/CinematicBanner.tsx`

Replace the "Trusted by 10,000+" banner with a **"How QuickLinq Works"** section using the same dark teal overlay style as `FinalCTA.tsx`:

- Background: Unsplash image of a trade team working on-site
- Dark overlay: `hsl(195 55% 10% / 0.88)` to `hsl(195 55% 10% / 0.95)` gradient
- Dot pattern overlay (same as FinalCTA)
- **4 numbered steps** in a horizontal row (responsive grid):
  1. **Quote** — "Create and send branded quotes in minutes"
  2. **Schedule** — "Assign crews and manage your calendar"
  3. **Invoice** — "One-click invoicing from completed jobs"
  4. **Get Paid** — "Online payments, automated reminders"
- Each step: large teal number, cream title, muted description
- Section header: "How QuickLinq Works" in cream/white, subtitle in muted text

### 2. Rewrite dashboard mockup in `src/components/landing/FeaturesGrid.tsx`

Replace the stock Unsplash `<img>` (lines ~37-47) with a **static HTML/CSS mini-dashboard** inside the browser chrome frame, mirroring the real `Index.tsx` layout:

- **4 KPI cards** across top: Revenue (MTD), Outstanding, Overdue, Active Quotes — with fake sample data ($12,450 / $3,200 / $890 / 7)
- **Quick action buttons row**: New Quote, New Invoice, New Job, New Client
- **2-3 schedule items** below: mock job entries with times and status badges
- All using existing Tailwind classes, scaled down with `text-[10px]` / `text-[8px]` sizing to fit the mockup frame
- Keeps the browser chrome header already in place

### 3. `src/pages/Landing.tsx`

No changes needed — `CinematicBanner` import stays, it just renders new content.

### Files

| File | Change |
|------|--------|
| `src/components/landing/CinematicBanner.tsx` | Full rewrite → "How It Works" with FinalCTA overlay style |
| `src/components/landing/FeaturesGrid.tsx` | Replace `<img>` with HTML dashboard mockup |

