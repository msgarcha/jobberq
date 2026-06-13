## Goal

Produce **6 submit-ready App Store marketing screenshots** for QuickLinq at **1290×2796 (iPhone 6.7")**, built from your *genuine* simulator screenshots, with a **hybrid branded treatment** (teal background + bold Poppins caption + a hand-drawn marker accent on one keyword) — cleaner and more premium than Jobber's listing. Output to `/mnt/documents/app-store-package/screenshots-v2/`.

Per your choices: **real data kept as-is**, **original status bar kept**, **6 screenshots**.

No app code changes — this is a standalone deliverable in `/mnt/documents`.

## Why the previous set was wrong

The earlier PNGs were oversized/iPad-proportioned mock screens. This version uses your **real iPhone screens** (883×1920) dropped into a correctly-proportioned 1290×2796 (≈9:19.5) canvas, so they read as true iPhone screenshots.

## The 6 screenshots (feature → caption)

Each caption gets a marker circle/underline on the **bold** keyword.

1. **Dashboard** (`7.20.16` — Quicklinq header, KPIs, quick actions) → "Run your **whole business** from your pocket"
2. **Linq AI assistant** (`7.20.03` — Ask Linq / drafting) → "Your **AI assistant** does the busywork"
3. **Invoices + recurring billing** (`8.40.32`) → "Get **paid faster**, automatically"
4. **Jobs / scheduling** (`8.40.45` — job details) → "Schedule & **track every job**"
5. **Notifications** (`8.40.57` — paid / opened invoice) → "Know the **second you're paid**"
6. **Search** (`7.30.19` — recently active) → "Find any client or quote **instantly**"

I will only use **clean** frames (no green annotations, no open keyboard, no error banners, no TestFlight/app-icon screens). If a chosen feature's only clean variant is weak, I'll substitute the next-best clean screen for that same feature during the QA pass and note the swap.

## Visual treatment (hybrid)

```text
┌───────────────────────────┐
│   [ caption headline ]     │  ← Poppins 700, cream text on teal,
│   keyword w/ marker accent │     one word circled/underlined in warm gold
│                            │
│      ┌──────────────┐      │
│      │              │      │
│      │  real iPhone │      │  ← your screenshot inside a clean
│      │   screenshot │      │     iPhone frame, soft drop shadow
│      │              │      │
│      └──────────────┘      │
│                            │
└───────────────────────────┘
```

- **Background:** subtle dark-teal vertical gradient (brand `hsl(192 60% 22%)` → deeper teal), faint brand-mark watermark.
- **Caption:** Poppins Bold, cream `#F7F4EF`, ~2 lines, generous top padding; the keyword gets a freehand marker stroke (warm gold) for the Jobber-energy accent.
- **Device:** realistic iPhone 15-style frame, rounded corners, soft shadow; screenshot fills the screen area at native aspect with no stretching.
- **Consistency:** identical caption position, frame size, margins, and color across all 6 for a cohesive shelf.

## How they're built

1. One self-contained HTML/CSS template (Poppins via local/Google fonts, brand tokens), screenshot embedded as base64, rendered at exact 1290×2796 with headless Chromium (`deviceScaleFactor` for crispness). Falls back to `nix run nixpkgs#chromium` if needed.
2. Generate all 6.
3. **QA pass (mandatory):** open every PNG, check exact dimensions, clipped/overflowing caption text, marker accent alignment, device-frame proportions, screenshot stretching, and color fidelity. Fix template and re-render until clean. QA crops are temporary.

## Deliverables

```text
/mnt/documents/app-store-package/screenshots-v2/
  01-dashboard.png
  02-linq-ai.png
  03-get-paid.png
  04-jobs.png
  05-notifications.png
  06-search.png
```

Each surfaced for preview/download when complete. The existing `APP_STORE_LISTING.md` already covers copy/metadata; I'll update its screenshot-order section to map to these 6.
