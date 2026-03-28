

## Redesign Hero Image Carousel and Add Cinematic Sections

### Problem
The hero section currently shows a flat row of small cards that look cramped and generic. The "Cleaning" image is broken. The layout doesn't match the cinematic, storytelling feel of Jobber's landing page which uses large, full-bleed photos in an auto-scrolling grid.

### Changes

#### 1. Hero Section — Full-width Auto-scrolling Carousel
Replace the current small card grid with a Jobber-inspired layout:
- **Left side**: Keep the headline/CTA copy (already good)
- **Right side**: Replace the 3x2 grid with a **2-column vertical auto-scrolling mosaic** — two columns of tall portrait photos that slowly scroll in opposite directions (one up, one down), creating a cinematic parallax effect
- Use high-quality Unsplash photos of real tradespeople in action (landscaping, plumbing, electrical, HVAC, roofing, cleaning, painting, carpentry)
- Each photo is large (~280px wide, ~360px tall) with rounded corners, name overlay at bottom
- CSS animation for the infinite vertical scroll (no JS library needed)
- On mobile: horizontal auto-scrolling carousel using CSS animation instead

**File**: `src/components/landing/HeroSection.tsx`

#### 2. New Cinematic Video/Story Section
Add a full-width cinematic section between IndustryTicker and StorytellingTabs that shows a large hero-style background image with a subtle Ken Burns (slow zoom) CSS animation, overlaid with a bold stat or quote. This breaks up the page and adds visual drama without actual video.

- Full-bleed background image of a trade pro at work
- Slow CSS zoom animation (8-10 seconds cycle)
- Overlaid bold text: "Trusted by 10,000+ service businesses across 50+ trades"
- Dark gradient overlay for readability

**File**: `src/components/landing/CinematicBanner.tsx` (new)

#### 3. Update StorytellingTabs Images
Replace the current generic stock images with better, more cinematic Unsplash photos that show real tradespeople in warm, golden-hour lighting — not sterile stock photo vibes.

**File**: `src/components/landing/StorytellingTabs.tsx`

#### 4. Add Infinite Scroll CSS Animation
Add the `@keyframes` for the vertical auto-scroll columns and Ken Burns zoom to the global CSS.

**File**: `src/index.css`

#### 5. Wire CinematicBanner into Landing Page
Insert between IndustryTicker and StorytellingTabs.

**File**: `src/pages/Landing.tsx`

### Image Strategy
Use Unsplash photos with `w=800&h=1000&fit=crop` for high resolution. Select images that show:
- People actually working (not posing)
- Warm, natural lighting
- Diverse trades: lawn mowing, plumbing under sink, electrician at panel, painter on ladder, cleaner, roofer, HVAC tech, carpenter
- 10-12 images total for the scrolling mosaic (5-6 per column)

### Technical Details
- Vertical scroll animation via CSS `@keyframes` with `translateY` — two copies of images stacked, animating upward infinitely
- Opposite column animates downward for visual contrast
- `animation-play-state: paused` on hover
- Ken Burns effect: `@keyframes` scaling from `scale(1)` to `scale(1.08)` over 10s
- No new dependencies needed

