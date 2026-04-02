

## Logo Variant System: White + Green Versions

### What We're Doing
The uploaded logo (white, transparent background) will be used on dark backgrounds. A green-tinted version (using the brand teal `hsl(170, 50%, 55%)`) will be created for light/white backgrounds. The `QuickLinqLogo` component gets a `variant` prop to switch between them.

### Assets
1. Copy uploaded white logo to `src/assets/quicklinq-logo-white.png`
2. Keep existing `src/assets/quicklinq-logo.png` as-is (fallback)
3. Upload the white logo to `public/images/quicklinq-logo-white.png` (for emails on dark sections)

### Component Update: `QuickLinqLogo.tsx`
Add a `variant` prop (`"white"` | `"green"`) that applies a CSS filter to tint the logo green when on light backgrounds. Since the logo is white, we use CSS `filter` with `hue-rotate`, `saturate`, and `brightness` to shift it to the brand teal-green. This avoids needing a separate image file for the green version.

```
variant="white" → original white logo (for dark backgrounds)
variant="green" → CSS-filtered to brand teal-green (for light backgrounds)
```

### Where Each Variant Goes

| Location | Background | Variant | Size |
|----------|-----------|---------|------|
| `AppSidebar.tsx` | Dark navy sidebar | `white` | 32 |
| `HeroSection.tsx` (fade area) | Dark | No logo currently, no change |  |
| `LandingNav.tsx` | Light (`bg-background`) | `green` | 28 |
| `LandingFooter.tsx` | Light (`bg-background`) | `green` | 24 |
| `TopBar.tsx` (mobile) | Light (`bg-card`) | `green` | 28 |
| `Login.tsx` | Light (`bg-background`) | `green` | 44 |
| `Onboarding.tsx` | Light (`bg-background`) | `green` | 32 |
| Email templates (all 6 auth + transactional) | White background | Green version hosted URL | 48px |

### Email Template Updates
Upload the logo to the `email-assets` storage bucket. For emails (white background), the logo needs to appear in the brand teal-green color. Since CSS filters don't work in emails, we'll reference the white logo and wrap it in a container with a dark background circle/badge so it's visible on white email backgrounds -- OR we use the white version with a small dark circular background behind it in the email HTML.

Better approach for emails: Since CSS filters aren't available in email clients, we'll keep the current hosted logo but add a small dark navy circular background behind it in the email template styles so the white logo is visible on the white email background. This matches the brand aesthetic.

### Files Modified
- `src/assets/quicklinq-logo-white.png` (new - copy of uploaded file)
- `src/components/QuickLinqLogo.tsx` (add variant prop with CSS filter)
- `src/components/layout/AppSidebar.tsx` (variant="white", size=32)
- `src/components/landing/LandingNav.tsx` (variant="green", size=28)
- `src/components/landing/LandingFooter.tsx` (variant="green", size=24)
- `src/components/layout/TopBar.tsx` (variant="green", size=28)
- `src/pages/Login.tsx` (variant="green", size=44)
- `src/pages/Onboarding.tsx` (variant="green", size=32)
- 6 auth email templates + `document-email.tsx` (add dark navy circle behind white logo)

### Technical Detail: CSS Filter for Green Tint
The white logo pixels will be shifted to the brand teal-green using:
```css
filter: brightness(0) saturate(100%) invert(58%) sepia(32%) saturate(600%) hue-rotate(115deg) brightness(92%) contrast(87%)
```
This produces a color close to `hsl(170, 50%, 55%)` from the white source. The exact filter values will be tuned to match.

