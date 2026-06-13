# App Store Screenshot Package — Rebuild from new clean screens

You uploaded a fresh set of simulator screenshots with a **clean status bar** (10:44, full wifi/battery, no "Uber Eats" Dynamic Island junk). These replace the older artifact-laden screens. I'll rebuild the 6 marketing screenshots using these exact screens, each caption matched to the feature actually shown.

## Source screens available (9 uploaded)
- Splash / logo (teal) — brand moment
- Login — "Send Quotes. Win Jobs. Get Paid."
- Dashboard — "Good evening, Manpreet", KPIs + quick actions
- Clients — leads/empty state
- Quick-action menu — New Client / Quote / Invoice / Job
- Reports (This Month, $0.00)
- Reports (All Time, $396k revenue, $23,990 outstanding)
- Linq AI assistant
- Settings — company branding (logo, name, email)

## The 6 I'll ship (feature → screen → caption)

| # | Feature | Source screen | Caption (gold marker accent in **bold**) |
|---|---|---|---|
| 1 | Command center | Dashboard (22.55.38) | Run your **whole business** from your phone |
| 2 | Fast creation | Quick-action menu (22.55.55) | Quotes, invoices & jobs in **one tap** |
| 3 | Money / reporting | Reports All Time (22.56.41) | Track **every dollar** in real time |
| 4 | AI | Linq Assistant (22.56.53) | Let **AI** do the busywork |
| 5 | Clients/CRM | Clients (22.55.51) | Every client & lead **in one place** |
| 6 | Branding | Settings (22.56.08) | Your **brand** on every quote |

Strongest, most "alive" screens chosen. I'm **skipping** the splash, login, and the $0.00 Reports screen (weaker for a store shelf). If you'd rather lead with the login tagline screen or swap any of these, tell me and I'll adjust.

## Visual treatment (unchanged from the approved hybrid style)
- 1290×2796 (iPhone 6.7"), the only size Apple requires.
- Dark-teal vertical gradient background (brand `hsl(192 60% 22%)`).
- Cream Poppins ExtraBold caption at top, one keyword underlined/circled in warm gold.
- Realistic iPhone frame + soft drop shadow, identical caption position/margins across all 6 for a cohesive row.
- Status bar left **as-is** (it's already clean in these new screens).

## Build
1. Copy the 9 uploaded screens, confirm each is 1290×2796 (or normalize without stretching).
2. One HTML/CSS template (Poppins) → render each at exact size with headless Chromium.
3. Output to `/mnt/documents/app-store-package/screenshots-v3/` as `01`–`06` PNGs (keeps v2 intact as a fallback).
4. QA pass: open every PNG, check dimensions, clipped text, marker alignment, frame proportions, no stretching.
5. Update `APP_STORE_LISTING.md` Section 8 to point at the v3 files with the new captions.

## Deliverables
- `screenshots-v3/01..06.png` — submit-ready.
- Updated `APP_STORE_LISTING.md` mapping table.
- No app/code changes — this is an artifact-only task.
