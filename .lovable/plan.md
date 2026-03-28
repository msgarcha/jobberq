

## Fix Hero Carousel Images, Labels, and Color Contrast

### Problems
1. **Mismatched image-label pairs**: Unsplash photo IDs don't match their trade labels (e.g., a construction/wood worker labeled "Painter", a cleaning scene labeled "Plumbing")
2. **Broken/missing Cleaning image**: `photo-1558618666-fcd25c85f82e` used twice and doesn't show cleaning
3. **Poor color contrast**: Hero text and images blend into the dark teal background — no visual separation or pop

### Changes

#### 1. Replace all Unsplash image URLs with correct trade-matching photos
Swap every image URL to one that actually depicts the labeled trade. Research and use verified Unsplash photo IDs:

| Label | Current Issue | New Photo Subject |
|-------|--------------|-------------------|
| Landscaping | OK-ish | Lawn mower / garden work |
| Roofing | Shows construction | Roofer on roof |
| Plumbing | Shows cleaning | Plumber under sink |
| Cleaning | Broken/wrong image | Person cleaning/mopping |
| Carpentry | OK | Carpenter with wood |
| Electrical | OK | Electrician at panel |
| Painting | Shows woodwork | Painter with roller/brush |
| HVAC | Unclear | HVAC tech with unit |
| Property Mgmt | Shows house exterior | Person inspecting property |
| Pressure Wash | Duplicate of cleaning | Pressure washing surface |

**File**: `src/components/landing/HeroSection.tsx` (lines 5-19)

#### 2. Add visual pop to hero section
- Add a **subtle teal-to-transparent gradient border/glow** around the image mosaic columns
- Add a **light teal accent strip or glow** behind the carousel area to separate it from the background
- Make the "better than paperwork" accent text use a brighter, more vibrant teal (`#00C9A7` or similar) instead of the muted primary
- Add a subtle **white/teal gradient overlay** at the top and bottom of scroll columns for a polished fade effect

**File**: `src/components/landing/HeroSection.tsx` (lines 26-44, 52-65, 97-100)

#### 3. Improve heading contrast
- Make the main heading pure white instead of `hsl(var(--background))` which blends
- Bump the subtext to a lighter shade for readability

**File**: `src/components/landing/HeroSection.tsx` (lines 63-65, 68)

