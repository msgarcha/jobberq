## Goal

Deliver a complete, submit-ready App Store package for QuickLinq into `/mnt/documents/app-store-package/`:
- **6 marketing screenshots** (1290×2796, iPhone 6.7") — branded background, bold caption headline, and a designed mock app screen inside an iPhone frame. All data is realistic but fake.
- **One consolidated listing document** with every field you select/paste in App Store Connect, plus a copy-paste checklist.

No app code changes — this is a standalone deliverable generated to `/mnt/documents`.

## The 6 screenshots

Each uses brand colors (dark teal `#1a3d44`, cream `#FAF7F2`, Poppins), a caption bar at top, and a mock screen in an iPhone frame. Fake names throughout (e.g. *Jordan Reyes*, *Maple Lane Landscaping*, *Coastline Cleaning Co.*, *Devon Carter*).

1. **"Send pro quotes in seconds"** — quote builder with line items + branded total.
2. **"Win more jobs"** — pipeline / quote-approved view with status chips.
3. **"Get paid faster"** — invoice with a "Pay now" card-payment screen.
4. **"Run your whole business"** — dashboard with revenue stats + recent activity.
5. **"Never miss a follow-up"** — schedule / reminders view.
6. **"Collect 5-star reviews"** — reviews screen with star ratings.

## How the screenshots are built

1. Build each screen as a self-contained HTML/CSS file using the real QuickLinq brand tokens (teal/cream, Poppins via Google Fonts), faithfully mimicking the app's actual UI components (cards, badges, top bar, bottom nav) with fake sample data.
2. Compose each into a 1290×2796 canvas: caption headline at top, mock screen inside a clean iPhone device frame, brand-colored background.
3. Render to PNG at exact resolution with a headless browser.
4. **QA pass:** open every rendered PNG and check for clipped text, overflow, misalignment, wrong colors, and that no real names slipped in. Fix and re-render until clean.

## The listing document

A single `APP_STORE_LISTING.md` (consolidated and cleaned from the existing `APP_STORE_SUBMISSION.md`) containing ready-to-paste fields:

- App Name (+ backup), Subtitle, Promotional Text
- Full Description (4000-char), Keywords
- Support / Marketing / Privacy Policy URLs
- Category (Business / Productivity), Age rating guidance
- "What's New" notes
- App Privacy ("nutrition label") table
- App Review notes + demo-account guidance (with fake reviewer name)
- Screenshot upload order (maps to the 6 PNGs)
- Pre-submit compliance checklist (IAP/3.1.1, Sign in with Apple/4.8, account deletion/5.1.1, permission strings)

## Deliverables in `/mnt/documents/app-store-package/`

```text
APP_STORE_LISTING.md          ← all selectable/paste-able copy
screenshots/
  01-send-quotes.png
  02-win-jobs.png
  03-get-paid.png
  04-dashboard.png
  05-reminders.png
  06-reviews.png
```

Each artifact will be surfaced for preview/download when complete.

## Technical notes

- Rendering uses a headless Chromium (via Playwright/puppeteer-core, falling back to `nix run nixpkgs#chromium` if needed) to rasterize HTML at 1290×2796 with `deviceScaleFactor` set for crisp output.
- No changes to `src/`, `ios/`, or any app config — output is confined to `/mnt/documents`.
