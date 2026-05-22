## Rebrand: "trades" → all service businesses

Drop trades-specific wording. Position QuickLinq as the back-office tool for **all service businesses** — trades stay represented as one of many verticals.

### 1. Hero (`src/components/landing/HeroSection.tsx`)

- Headline: "Your craft deserves better than paperwork" → **"Your business deserves better than paperwork"**
- Subhead: "Built for every trade, from landscapers to electricians." → **"Built for every service business — from salons and clinics to landscapers and electricians."**
- Trust pill: "Rated 4.9/5 by 2,000+ service pros" → **"Rated 4.9/5 by 2,000+ service businesses"**
- Mosaic: replace 4 of the 10 photos with new SMB verticals (keep 6 trades for balance). Add:
  - Column 1: **Hair Salon**, **Dental Clinic**
  - Column 2: **Massage / Spa**, **Yoga / Pilates**
  - Mobile horizontal scroll inherits both columns automatically.
- New Unsplash URLs (same `?w=600&h=800&fit=crop&crop=center` style):
  - Hair: `photo-1560066984-138dadb4c035`
  - Dental: `photo-1606811971618-4486d14f3f99`
  - Massage: `photo-1544161515-4ab6ce6db874`
  - Yoga: `photo-1518611012118-696072aa579a`
- Names updated to match (e.g. "Ava M. — Hair Salon", "Dr. Patel — Dental Clinic", etc.).

### 2. Industry ticker (`src/components/landing/IndustryTicker.tsx`)

Replace the all-trades list with a mixed list of **31 categories** covering both trades and the screenshot's SMB set:

Hair Salon, Barbershop, Nail Salon, Massage & Spa, Dental Clinic, Beauty & Aesthetics, Tattoo Studio, Physiotherapy, Personal Training, Yoga & Pilates, Pet Grooming, Photography Studio, Consulting, Medical Clinic, Landscaping, Plumbing, HVAC, Electrical, Roofing, Cleaning, Painting, Handyman, Tree Care, Pest Control, Pool Service, Pressure Washing, Fencing, Flooring, Carpentry, Junk Removal, Snow Removal.

### 3. Other landing copy

- **`TestimonialsSection.tsx`** — "Loved by service pros everywhere" → **"Loved by service businesses everywhere"**. Swap 1 of the 4 testimonials from a trade to a salon/clinic owner (keep the other 3 trades for continuity).
- **`StatsBanner.tsx`** — "Service Pros" → **"Service Businesses"**.
- **`ComparisonSection.tsx`** — "Why service pros are switching" → **"Why service businesses are switching"**.
- **`FinalCTA.tsx`** — "thousands of service professionals" → **"thousands of service businesses"**.

### 4. SEO (`index.html`)

- `<title>`: update to reference service businesses, not trades.
- `<meta name="description">`: rewrite to cover salons, clinics, studios, trades.
- `og:title` / `og:description` mirror the above.
- JSON-LD `Organization.description` updated to match.

### Out of scope

- In-app copy (dashboard tips, onboarding) — left as-is per your answer.
- New images for industries beyond the 4 added to the hero mosaic (ticker is text-only).
- Pricing, auth, billing flows — untouched.

### Technical notes

- All edits are presentation-only (string + image-URL changes in JSX). No new dependencies, no schema/edge-function changes.
- Unsplash URLs follow the existing pattern; no asset uploads needed.
- After edit I'll mark any related SEO findings as fixed via `seo_chat--update_findings`.
