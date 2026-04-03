

## Replace All Logos/Icons with New Brand Assets

### What's Changing
The new uploaded images replace all existing logo usage:
- **`2.png`** = Icon mark (the interlinked Q symbol) -- used as favicon, small icon contexts, and sidebar collapsed state
- **`1.png`** = Full logo (icon + "Quicklinq" wordmark) -- used where logo + text appears together (landing nav, footer, login, etc.)

On dark surfaces (sidebar, email dark badges), the logos will be inverted to white using a CSS filter.

### Files to Change

| # | File | Change |
|---|------|--------|
| 1 | `public/favicon.png` | Replace with `2.png` (icon mark) |
| 2 | `src/assets/quicklinq-icon.png` | Copy `2.png` here (dark/green icon) |
| 3 | `src/assets/quicklinq-logo-full.png` | Copy `1.png` here (dark/green full logo) |
| 4 | `src/components/QuickLinqLogo.tsx` | Refactor: add `type` prop (`icon` vs `full`). `icon` uses the icon mark, `full` uses the wordmark logo. Keep `variant` prop: `dark` (original green) and `white` (CSS filter invert to white). Remove old CSS green filter, replace with white filter for dark surfaces. |
| 5 | `src/components/layout/AppSidebar.tsx` | Use `type="icon"` `variant="white"` (sidebar is dark). Remove the separate "QuickLinq" text span since the full logo includes wordmark -- or keep icon-only in collapsed, full logo when expanded. |
| 6 | `src/components/layout/TopBar.tsx` | Use `type="icon"` `variant="dark"` + remove the separate text "QuickLinq" span, or use `type="full"`. |
| 7 | `src/components/landing/LandingNav.tsx` | Use `type="icon"` `variant="dark"` (light bg). Keep text span "QuickLinq" or switch to `type="full"`. |
| 8 | `src/components/landing/LandingFooter.tsx` | Same as nav. |
| 9 | `src/pages/Login.tsx` | Use `type="full"` `variant="dark"` to show the full branded logo. Remove the separate "QuickLinq" CardTitle text. |
| 10 | `src/pages/Onboarding.tsx` | Use `type="full"` `variant="dark"`. |
| 11 | 6 auth email templates + `document-email.tsx` + `welcome-email.tsx` | Update `LOGO_URL` to point to new icon uploaded to storage. Note: the new icon/logo PNGs need to be uploaded to the `email-assets` storage bucket. Will update URLs to reference new filenames. |
| 12 | Delete old `src/assets/quicklinq-logo-white.png` and `src/assets/quicklinq-logo.png` | Clean up old assets |

### CSS Filter for White Version (Dark Surfaces)
The uploaded logos are dark teal/green on transparent background. For dark surfaces (sidebar, email badges), invert to white:
```css
filter: brightness(0) invert(1);
```
This converts any colored pixels to pure white.

### QuickLinqLogo Component API
```tsx
interface QuickLinqLogoProps {
  size?: number;
  className?: string;
  variant?: "dark" | "white";  // dark = original teal, white = inverted
  type?: "icon" | "full";      // icon = mark only, full = icon+wordmark
}
```

### Email Asset Note
The email templates reference logos hosted in cloud storage (`email-assets` bucket). The new icon and logo files will need to be uploaded there. The URLs in the templates will be updated to reference the new filenames (`quicklinq-icon.png` and `quicklinq-logo-full.png`).

