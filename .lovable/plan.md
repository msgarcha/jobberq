

## Unified QuickLinq Branding Update

**Brand**: QuickLinq  
**Tagline**: Send Quotes. Win Jobs. Get Paid.

### Files to Update

| # | File | Change |
|---|------|--------|
| 1 | `index.html` | Update `<title>` and all meta tags to "QuickLinq — Send Quotes. Win Jobs. Get Paid." |
| 2 | `src/components/landing/LandingNav.tsx` | Already correct (QuickLinq). No change needed. |
| 3 | `src/components/landing/LandingFooter.tsx` | Fix "ServicePro" → "QuickLinq". Update description to include tagline. |
| 4 | `src/components/landing/HeroSection.tsx` | Add tagline as the subtitle/subheading under main headline |
| 5 | `src/components/landing/FinalCTA.tsx` | Reference tagline in CTA copy |
| 6 | `src/pages/Login.tsx` | Change `CardDescription` from "Manage your service business with ease." → "Send Quotes. Win Jobs. Get Paid." |
| 7 | `src/pages/Onboarding.tsx` | Update welcome subtitle to include tagline |
| 8 | `src/components/layout/AppSidebar.tsx` | Add small tagline text under "QuickLinq" in collapsed=false state |
| 9 | `supabase/functions/auth-email-hook/index.ts` | Change `SITE_NAME` from `"jobberq"` → `"QuickLinq"` |
| 10 | `supabase/functions/send-transactional-email/index.ts` | Change `SITE_NAME` from `"jobberq"` → `"QuickLinq"` |
| 11 | `supabase/functions/_shared/transactional-email-templates/document-email.tsx` | Already "QuickLinq". No change needed. |
| 12 | All 6 auth email templates (`signup`, `recovery`, `magic-link`, `invite`, `email-change`, `reauthentication`) | Add "Send Quotes. Win Jobs. Get Paid." as a subtle tagline below the heading in each template |
| 13 | `src/pages/PublicInvoicePay.tsx` | Ensure "Powered by QuickLinq" footer stays. No change needed. |
| 14 | `src/pages/PublicQuoteView.tsx` | Same as above. No change needed. |

### Edge Function Redeployment

After updating `auth-email-hook` and `send-transactional-email`, both must be redeployed for changes to take effect.

### Summary

- Fix the one "ServicePro" reference in the footer
- Fix `SITE_NAME = "jobberq"` in both edge functions → `"QuickLinq"`
- Add the tagline "Send Quotes. Win Jobs. Get Paid." to: login page, onboarding, hero section, all auth email templates, and the landing footer
- Keep existing correct "QuickLinq" references as-is

