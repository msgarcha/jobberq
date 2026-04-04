

## Fix Hero Section: Replace All 10 Images with Verified Trade-Accurate Photos

### Problem
Multiple hero images are mismatched to their trade labels (Carpentry shows concrete, Painting shows carpenter, Pressure Wash is broken, Roofing shows wrong content, HVAC shows headphones).

### Solution
Replace all 10 image URLs in `HeroSection.tsx` with web-searched and verified FREE Unsplash photos. Each photo was found by searching Unsplash for the specific trade, visiting the photo page, confirming it's free (not Unsplash+), and extracting the actual `photo-` ID from the image URL.

### Verified Image Replacements

| Trade | Photo ID | Confirmed Content |
|-------|----------|-------------------|
| **Landscaping** | `photo-1768268004427-6fb88cbd1605` | Man trimming grass with string trimmer outdoors |
| **Roofing** | `photo-1763665814965-b5c4b3547908` | Construction workers installing roof tiles on building |
| **Plumbing** | `photo-1607472586893-edb57bdc0e39` | Keep current (verified plumbing wrench image) |
| **Cleaning** | `photo-1758272421751-963195322eaa` | Woman wearing yellow gloves cleaning wooden surface |
| **Carpentry** | `photo-1769353086138-19ee65291a04` | Carpenter working with wood in a workshop |
| **Electrical** | `photo-1741388222137-c0d3007ec173` | Electrician working on wiring from ladder indoors |
| **Painting** | `photo-1717281234297-3def5ae3eee1` | Man painting a wall with a paint roller |
| **HVAC** | `photo-1558382689-c1c29cc9b37e` | Two persons fixing AC motor |
| **Concrete** | `photo-1743130940757-42d780087c3a` | Construction workers pouring and leveling concrete |
| **Pressure Wash** | `photo-1704475386627-dcfcd97ed51a` | Woman using power washer on brick wall |

### File Changed

**`src/components/landing/HeroSection.tsx`** -- Replace all 10 Unsplash URLs in `columnOneImages` and `columnTwoImages` arrays with the verified photo IDs above, using the format `https://images.unsplash.com/{photo-id}?w=600&h=800&fit=crop&crop=center`.

### Verification Method
Every photo was:
1. Found via web search for the specific trade term
2. Confirmed as FREE (not Unsplash+) by checking the photo page says "Free to use under the Unsplash License"
3. The actual `photo-` ID extracted from the rendered `<img>` tag on the Unsplash page

