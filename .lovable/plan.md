## Problem

In `src/pages/Services.tsx`, the new/edit service form falls back to a hardcoded `13` tax rate in three places (lines 63, 68, 79). The tax rate set during onboarding (`company_settings.default_tax_rate`) is never read here, so users see 13% even after entering 5% at signup.

## Fix

In `src/pages/Services.tsx`:

1. Import and call `useCompanySettings()` to get `companySettings.default_tax_rate`.
2. Compute `const defaultTaxRate = Number(companySettings?.default_tax_rate ?? 0);`.
3. Replace the three hardcoded `13` values:
   - `defaultValues` (line 63) → `defaultTaxRate`
   - `form.reset` on create (line 68) → `defaultTaxRate`
   - `form.reset` on edit (line 79) → `s.tax_rate ?? defaultTaxRate`
4. Ensure the create dialog's reset runs after settings load (use the existing reset on open; settings hook is already cached so value will be present).

No DB or backend changes. Onboarding already correctly saves `default_tax_rate` to `company_settings`.

## Out of scope

- `InvoiceForm.tsx` already uses `companySettings?.default_tax_rate` (falls back to 5). If desired we can change its fallback to 0, but that's separate.
