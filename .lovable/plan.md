

## Generate QuickLinq Logo and Replace Text Initials

### Approach
Use the AI image generation capability (Nano banana pro model) to generate a professional QuickLinq logo icon, then save it to the `public/` directory and replace all "QL" text-based div blocks with an `<img>` tag referencing the logo.

### Step 1: Generate the Logo
Call the Lovable AI image generation model (`google/gemini-3-pro-image-preview`) via a backend function or script to create a clean, modern logo mark for "QuickLinq". Design brief:
- Monogram/icon style — works at small sizes (32x32 to 64x64)
- Uses the app's primary color palette (teal/dark cyan — `hsl(192, 60%, 22%)`)
- Clean, modern, rounded — fits the existing rounded-xl containers
- Transparent or white background
- Save to `public/logo.png`

### Step 2: Replace QL Text Blocks with Logo Image

**Files to update (5 locations across 5 files):**

| File | Change |
|------|--------|
| `src/components/layout/AppSidebar.tsx` | Replace the `<div>QL</div>` block with `<img src="/logo.png" className="h-9 w-9 rounded-xl" />` |
| `src/components/layout/TopBar.tsx` | Replace mobile header QL div with `<img src="/logo.png" className="h-8 w-8 rounded-lg" />` |
| `src/components/landing/LandingNav.tsx` | Replace QL div with `<img>` |
| `src/components/landing/LandingFooter.tsx` | Replace QL div with `<img>` (also fix "ServicePro" → "QuickLinq" on line 9) |
| `src/pages/Login.tsx` | Replace QL div with larger `<img src="/logo.png" className="h-14 w-14 rounded-2xl" />` |

### Step 3: Update Favicon
Also set `public/logo.png` as the favicon in `index.html` for brand consistency.

### Files Changed
- `public/logo.png` — new generated logo image
- `src/components/layout/AppSidebar.tsx`
- `src/components/layout/TopBar.tsx`
- `src/components/landing/LandingNav.tsx`
- `src/components/landing/LandingFooter.tsx`
- `src/pages/Login.tsx`
- `index.html` — favicon update

