

## Landing Page Redesign -- Beat Jobber

### What We're Building

A complete rewrite of `src/pages/Landing.tsx` that transforms the current plain text-and-cards page into an emotionally compelling, visually rich landing page inspired by (and surpassing) Jobber's approach.

### Page Structure (top to bottom)

**1. Sticky Nav** -- Same branding, add "Features" / "Pricing" / "Industries" scroll links in the center for desktop.

**2. Dark Hero Section** -- Full-width dark background (using sidebar palette `hsl(195 55% 10%)`), split layout:
- Left: Bold emotional headline ("Your craft deserves better than paperwork"), subtext, two CTAs, trust badges (star rating, "No credit card required")
- Right: A mosaic photo grid (2x3 tiles) of tradespeople at work -- plumber, landscaper, electrician, painter, cleaner, roofer -- using high-quality Unsplash stock photos with overlaid name/trade labels (like Jobber's hero). CSS grid with `object-cover` images, subtle rounded corners, slight rotation/offset for visual energy.

**3. Scrolling Industry Ticker** -- A CSS-animated infinite horizontal scroll of industry pills: "Landscaping", "Plumbing", "HVAC", "Electrical", "Roofing", "Cleaning", "Painting", "Handyman", "Tree Care", "Pest Control", "Pool Service", "Pressure Washing" -- shows breadth at a glance.

**4. "How ServicePro Works" -- Tabbed Storytelling Section** (like Jobber's "Get Noticed / Win Jobs / Work Smarter / Boost Profits"):
- 4 tabs: "Win More Jobs" / "Work Smarter" / "Get Paid Faster" / "Grow Your Business"
- Each tab shows: illustration area (gradient placeholder with icon), headline, description, a stat callout ("44% average revenue growth"), and a real customer-style testimonial quote.

**5. Big Stats Banner** -- Full-width primary-colored section with 4 animated counters:
- "10,000+ Service Pros" / "2M+ Jobs Completed" / "12+ Hours Saved Weekly" / "44% Revenue Growth"

**6. Features Grid** -- Refined version of current grid but with larger icons, better copy, hover animations (scale + shadow).

**7. Testimonials Carousel** -- 3 rotating testimonial cards with quote, name, trade, star rating. Uses existing `embla-carousel-react`.

**8. Pricing Section** -- Keep existing tiers but with visual polish: gradient header on popular card, animated border glow.

**9. Final Emotional CTA** -- Dark section with hero image background, overlay, headline "Your clients are waiting. Your paperwork shouldn't be.", single large CTA button.

**10. Footer** -- Expanded with columns: Product links, Industries, Company, Legal.

### Technical Approach

- **Images**: Use curated Unsplash URLs for tradespeople (landscaper, plumber, electrician, painter, cleaner, contractor). These are free, high-quality, and load fast via Unsplash CDN with size parameters.
- **Animations**: Add keyframes to `tailwind.config.ts` for the infinite ticker scroll and counter fade-in. Use Intersection Observer via a small `useInView` hook for scroll-triggered animations.
- **Tabs**: Use Radix `Tabs` component already installed.
- **Carousel**: Use existing `embla-carousel-react` for testimonials.
- **Files changed**:
  - `src/pages/Landing.tsx` -- Full rewrite
  - `tailwind.config.ts` -- Add ticker animation keyframe
  - `src/index.css` -- Add ticker utility class

### Key Differentiators vs Jobber
- Warmer, more emotional color palette (the teal + cream already nails this)
- Scroll-triggered animations for stats/features
- Industry ticker that feels alive
- Testimonial carousel with star ratings
- Stronger emotional storytelling copy throughout
- Clean, modern card design vs Jobber's busier layout

