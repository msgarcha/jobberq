

## Rebrand from "ServicePro" to "QuickLinq"

### Scope
Replace all instances of the "ServicePro" / "SP" branding with "QuickLinq" / "QL" across the entire app — landing page, dashboard, login, onboarding, and HTML meta tags.

### Files to Change

| File | What changes |
|------|-------------|
| `index.html` | Title → "QuickLinq", meta description, og:title, twitter:title, author |
| `src/components/layout/AppSidebar.tsx` | "SP" → "QL", "ServicePro" → "QuickLinq" |
| `src/components/layout/TopBar.tsx` | "SP" → "QL", "ServicePro" → "QuickLinq" |
| `src/components/landing/LandingNav.tsx` | "SP" → "QL", "ServicePro" → "QuickLinq" |
| `src/components/landing/LandingFooter.tsx` | "SP" → "QL", "ServicePro" → "QuickLinq", copyright text |
| `src/components/landing/FinalCTA.tsx` | "ServicePro" → "QuickLinq" in copy |
| `src/components/landing/FeaturesGrid.tsx` | "ServicePro" → "QuickLinq", fake URL bar text |
| `src/components/landing/StorytellingTabs.tsx` | "ServicePro" → "QuickLinq" |
| `src/components/landing/TestimonialsSection.tsx` | "ServicePro" → "QuickLinq" in testimonial quotes |
| `src/pages/Login.tsx` | "SP" → "QL", "ServicePro" → "QuickLinq" |
| `src/pages/Onboarding.tsx` | "ServicePro" → "QuickLinq" |
| `src/pages/Settings.tsx` | "ServicePro" toast message → "QuickLinq" |
| `src/lib/subscriptionTiers.ts` | Comment text only |

### Details
- Logo initials change from **SP** to **QL** everywhere (sidebar, topbar, nav, login, footer)
- Full name changes from **ServicePro** to **QuickLinq** everywhere
- Fake URL bar in FeaturesGrid: `app.servicepro.com/dashboard` → `app.quicklinq.com/dashboard`
- All testimonial text referencing ServicePro updated
- HTML meta tags updated with proper title and description

