

## Replace "QL" Text Logo with Uploaded Logo Image

The uploaded image is a geometric interlocking logo mark (white on dark navy). It will replace every instance of the "QL" text block used as the logo across the app.

### Approach

1. **Copy the uploaded logo** to `src/assets/quicklinq-logo.png`

2. **Create an SVG version** for flexibility — trace the logo as a simple SVG component (`src/components/QuickLinqLogo.tsx`) that accepts `className`, `size`, and `variant` props:
   - `variant="light"` — white logo (for dark backgrounds: sidebar, hero, landing nav dark sections)
   - `variant="dark"` — dark navy logo (for light backgrounds: login page, email templates)
   - `variant="primary"` — uses the app's primary/teal color (for accents)

3. **Replace "QL" text blocks** in these files:

| File | Current | Replacement |
|------|---------|-------------|
| `AppSidebar.tsx` (line 67-69) | `<div>QL</div>` | `<QuickLinqLogo size={36} variant="light" />` |
| `LandingNav.tsx` (line 16-18) | `<div>QL</div>` | `<QuickLinqLogo size={36} variant="dark" />` |
| `LandingFooter.tsx` (line 8) | `<div>QL</div>` | `<QuickLinqLogo size={32} variant="dark" />` |
| `TopBar.tsx` (line 77-79) | `<div>QL</div>` | `<QuickLinqLogo size={32} variant="dark" />` |
| `Login.tsx` (lines 81, 115) | `<Link>QL</Link>` | `<Link><QuickLinqLogo size={56} variant="dark" /></Link>` |
| `Onboarding.tsx` (line 84-86) | `<div>QL</div>` | `<QuickLinqLogo size={36} variant="dark" />` |
| `HeroSection.tsx` | No QL text, but hero uses sidebar bg | No change needed |

4. **Update email templates** — Since email templates render in Deno/React Email (not browser React), the logo will be embedded as a hosted image URL. Copy the logo to `public/images/quicklinq-logo-dark.png` and reference it via the published URL in all 6 auth email templates and the transactional email template.

### Files Created
- `src/components/QuickLinqLogo.tsx` — Reusable logo component with size/variant props
- `src/assets/quicklinq-logo.png` — Source image asset
- `public/images/quicklinq-logo-dark.png` — For email template use (dark variant)

### Files Modified
- `src/components/layout/AppSidebar.tsx`
- `src/components/landing/LandingNav.tsx`
- `src/components/landing/LandingFooter.tsx`
- `src/components/layout/TopBar.tsx`
- `src/pages/Login.tsx`
- `src/pages/Onboarding.tsx`
- 6 auth email templates in `supabase/functions/_shared/email-templates/`
- `supabase/functions/_shared/transactional-email-templates/document-email.tsx`

