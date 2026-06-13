# App Store Screenshots v4 — Jobber-beating redesign

The v3 device read as a flat rectangle. v4 rebuilds the whole art direction to look like a premium, professionally-shot App Store set: a **realistic, slightly-tilted iPhone**, **moody photographic backgrounds**, a **hand-drawn marker accent**, and a **floating UI card** in front of the phone for depth.

## What was wrong (and the fix)
- **Rectangle, not an iPhone** → rebuild the device: deep iPhone-15 corner radius, true Dynamic Island, brushed-titanium edge with highlight, visible side buttons (volume + action + power), thin inner bezel, screenshot inset with matching corner clip. Then apply a subtle 3D tilt (perspective + ~7° rotateY, small rotateX) with a contact shadow so it sits in space.
- **Flat empty gradient** → full-bleed moody photographic background per screen, color-graded to brand teal, darkened with a gradient + fine film grain so text and device pop.
- **Plain caption** → keep Poppins ExtraBold cream headline, but the accent keyword gets a **rough hand-drawn marker** (gold), like Jobber's scribble — circle or underline, slightly imperfect.
- **No depth** → a small real-looking **floating card/toast** overlaps the device edge (e.g. "Payment received +$1,157.10"), with its own soft shadow.

## Art direction
- Canvas 1290×2796 (iPhone 6.7"). Identical headline position, device scale/tilt, margins across all 6 → cohesive shelf.
- Background: dark, textured, *environmental* (worksite materials, tools, concrete, desk at dusk) kept abstract/blurred and heavily graded teal so it never looks like cheap stock or uncanny AI faces. Generated with the image tool, then teal-graded + grain + vignette in the compositor.
- Palette: brand teal `hsl(192 60% 22%)`, cream text `hsl(40 30% 94%)`, gold marker `hsl(40 80% 66%)`.
- Type: Poppins ExtraBold headline (~96px), Poppins SemiBold on floating cards.

## The 6 screens (screen → caption → floating card → background mood)
| # | Screen | Caption (marker word in **bold**) | Floating card | Background |
|---|---|---|---|---|
| 1 | Dashboard | Run your **whole business** from your phone | "Revenue ▲ $23,990 outstanding" KPI chip | Tradesperson's truck/worksite at dusk |
| 2 | Quick-create | Quotes & invoices **in one tap** | "✓ New quote created" toast | Workshop bench / tools, dark |
| 3 | Reports | Track **every dollar** in real time | "+$1,157.10 payment received" toast | Dim office desk, paperwork |
| 4 | Linq AI | Let **AI** do the busywork | "✨ Draft ready to review" toast | Moody abstract teal light |
| 5 | Clients | Every client & lead **in one place** | "+ New lead added" toast | Handshake/jobsite, distant & dark |
| 6 | Branding | Your **brand** on every quote | Mini branded quote chip | Clean dark studio surface |

## Build pipeline
1. Generate 6 moody backgrounds (image tool), save to `/tmp/asp4/bg/`.
2. One HTML/CSS template: layered as background image → grain/vignette overlay → headline w/ marker SVG → tilted iPhone (CSS) with embedded screenshot → floating card. Poppins embedded as base64 (already downloaded).
3. Render each at exact 1290×2796 with headless Chromium (`--force-device-scale-factor=1`).
4. Output to `/mnt/documents/app-store-package/screenshots-v4/` as `01`–`06` (keeps v3 as fallback).

## QA (mandatory)
Open every PNG and check: device looks like a real iPhone (corners, island, edge, buttons, no stretch), tilt shadow reads correctly, screenshot aspect intact, marker aligns to its word, floating card doesn't cover key UI or clip off-canvas, text legible over photo, dimensions exactly 1290×2796, consistent across all 6. Iterate until clean.

## Deliverables
- `screenshots-v4/01..06.png` — submit-ready.
- `APP_STORE_LISTING.md` Section 8 updated to point at v4.
- Artifact-only; no app/code changes.
