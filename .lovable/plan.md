

## Fix Hero Section Broken Images

### Problem
Two Unsplash images return errors (removed/unavailable):
1. **Roofing** (Chris W.) - `photo-1635424709498-bb2be0baa304` - broken
2. **HVAC** (Kevin P.) - `photo-1621460249485-4e4f92d9689a` - broken

Additionally, "Property Mgmt" is not a trade/service job type. It should be replaced with something more fitting.

### Fix in `src/components/landing/HeroSection.tsx`

Replace the 3 broken/mismatched images with verified working Unsplash URLs:

| Slot | Current Label | Issue | New Image | New Label |
|------|--------------|-------|-----------|-----------|
| Column 1, #2 | Roofing | Broken URL | Roofer on roof (`photo-1632759145351-1d592919f522`) | Roofing |
| Column 2, #3 | HVAC | Broken URL | HVAC technician (`photo-1558618666-fcd25c85f82e`) | HVAC |
| Column 2, #4 | Property Mgmt | Wrong trade type | Concrete/masonry worker (`photo-1590846083693-f23fdede555c`) | Concrete |

All replacement URLs will use the same `?w=600&h=800&fit=crop&crop=center` parameters.

### File
`src/components/landing/HeroSection.tsx` -- lines 7, 16, 17 updated with new URLs and labels.

