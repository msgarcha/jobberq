

## Make the Landing Page Visually Stunning with Real Imagery

### Problem
1. **Hero mosaic is hidden on mobile/tablet** -- `hidden lg:grid` means most preview viewers see zero images
2. **Storytelling tabs** use plain gradient boxes with icons instead of real product/trade photos
3. **Features grid** is icon-only -- no imagery to create emotional connection
4. **Final CTA** has no background imagery -- just a dark box with text
5. **No screenshots or product mockups** anywhere on the page

### Plan

**1. Hero Section (`HeroSection.tsx`)**
- Make the photo mosaic visible on all screen sizes (responsive: 2 columns on mobile, 3 on desktop)
- On mobile, show a horizontal scrolling strip of 3 trade photos above the CTA
- Add a subtle parallax/overlay effect for depth

**2. Storytelling Tabs (`StorytellingTabs.tsx`)**
- Replace gradient placeholder boxes with real Unsplash stock photos for each tab:
  - "Win More Jobs" -- contractor shaking hands with homeowner / presenting a quote on tablet
  - "Work Smarter" -- crew working on a job site / scheduling on tablet
  - "Get Paid Faster" -- happy business owner on phone / mobile payment
  - "Grow Your Business" -- business owner reviewing reports / thriving business
- Photos displayed in a styled rounded container with overlay stat badge

**3. Features Grid (`FeaturesGrid.tsx`)**
- Add a large hero image above the grid showing a polished app screenshot mockup (use a styled div simulating a browser/phone frame with a gradient background)
- Keep the 6 icon cards but add subtle background patterns

**4. Final CTA (`FinalCTA.tsx`)**
- Add a background stock image (contractor at golden hour / team photo) with dark overlay
- Creates the emotional "join us" feeling like Jobber's closing sections

**5. Testimonials (`TestimonialsSection.tsx`)**
- Add avatar images (Unsplash face portraits) for each testimonial author
- Makes quotes feel real and trustworthy

### Image Sources (all Unsplash CDN with size params)
- Curated trade-specific photos: landscaping, plumbing, electrical, painting, cleaning, roofing
- Professional portrait photos for testimonial avatars
- All loaded via `?w=600&h=400&fit=crop` for fast delivery

### Files to Edit
- `src/components/landing/HeroSection.tsx` -- responsive mosaic
- `src/components/landing/StorytellingTabs.tsx` -- real photos per tab
- `src/components/landing/FeaturesGrid.tsx` -- hero image above grid
- `src/components/landing/FinalCTA.tsx` -- background image with overlay
- `src/components/landing/TestimonialsSection.tsx` -- avatar images

