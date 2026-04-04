

## Make QuickLinq an Installable PWA (No Offline/Service Worker)

Since you only need installability (Add to Home Screen) with splash screens, this is a simple setup -- just a `manifest.json` and meta tags. No `vite-plugin-pwa` or service workers needed.

### Files to Create/Change

| # | File | Change |
|---|------|--------|
| 1 | `public/manifest.json` | Create web app manifest with app name, theme color (teal `#0d9488`), background color, `display: "standalone"`, start URL `/landing`, and icon references |
| 2 | `public/icon-192.png` | Copy from existing `favicon.png` / icon asset, scaled to 192x192 |
| 3 | `public/icon-512.png` | Copy from existing icon asset, scaled to 512x512 |
| 4 | `public/apple-touch-icon.png` | 180x180 icon for iOS home screen |
| 5 | `public/splash-*.png` | Generate splash screen images for common iOS device sizes using the brand icon on teal background |
| 6 | `index.html` | Add `<link rel="manifest">`, `<meta name="apple-mobile-web-app-capable">`, `<meta name="apple-mobile-web-app-status-bar-style">`, `<meta name="theme-color">`, apple-touch-icon link, and `<link rel="apple-touch-startup-image">` tags for iOS splash screens |

### Manifest Content
```json
{
  "name": "QuickLinq",
  "short_name": "QuickLinq",
  "description": "Send Quotes. Win Jobs. Get Paid.",
  "start_url": "/landing",
  "display": "standalone",
  "background_color": "#0d9488",
  "theme_color": "#0d9488",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### iOS Splash Screens
Generate splash images for these sizes (white QuickLinq icon centered on teal `#0d9488` background):
- iPhone SE: 640x1136
- iPhone 8: 750x1334
- iPhone X/11 Pro: 1125x2436
- iPhone 11/XR: 828x1792
- iPhone 12/13/14 Pro Max: 1284x2778
- iPad: 1536x2048

### Android
Android uses the manifest icons and `theme_color` to auto-generate splash screens -- no extra assets needed.

### No Service Worker
No service worker will be registered. The app will not work offline, but it will be installable and launch in standalone mode with proper splash screens and branding.

