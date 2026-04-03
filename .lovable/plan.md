

## Replace Logo Assets with Background-Removed Versions

The user has provided new background-removed versions of the icon and full logo. These need to replace the current assets everywhere.

### Files to Change

| # | File | Change |
|---|------|--------|
| 1 | `src/assets/quicklinq-icon.png` | Replace with `2-removebg-preview-2.png` |
| 2 | `src/assets/quicklinq-logo-full.png` | Replace with `1-removebg-preview-2.png` |
| 3 | `public/favicon.png` | Replace with `2-removebg-preview-2.png` |
| 4 | Email assets bucket | Upload new icon to `email-assets` storage bucket |

The `QuickLinqLogo.tsx` component already has the white inversion filter (`brightness(0) invert(1)`) for dark surfaces -- no code changes needed. Just swapping the asset files.

