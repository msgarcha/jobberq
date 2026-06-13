# App Store Screenshots v5 — Layout & Color Fixes

Apply 4 precise corrections to all 6 marketing screenshots, keeping every existing design element (moody photographic backgrounds, realistic iPhone frame, Dynamic Island, side buttons, floating accent card, hand-drawn marker, grain/vignette). Artifact-only — no app or source-code changes.

Output to a new folder `/mnt/documents/app-store-package/screenshots-v5/` (keeps v4 as fallback), then update `APP_STORE_LISTING.md` to point at v5.

## The 4 changes

### 1. Tighten gap between title and phone
The large empty band between the caption and the device is the main problem. Move the headline down a bit and the device up so they sit close with only a small breathing gap.
- Caption `top: 140px` and device positioning are recalculated so the device top edge sits just below the last caption line.

### 2. Remove white space at the bottom of the screenshot
Each source screenshot (883×1920) has ~108px of blank white safe-area at the very bottom (below the app's bottom nav). Crop that off before embedding so the screen content fills the device cleanly with no white strip.

### 3. Remove the tilt + make the phone bigger
- Drop the 3D transform entirely (`rotateX(4deg) rotateY(-9deg) rotateZ(-1.2deg)` → straight-on, `translateX(-50%)` only). Remove `perspective`.
- Increase device width from `792px` to ~`880px` so it reads larger and fills more of the frame.
- Adjust the contact shadow to a centered, straight drop shadow (no skew) to match the flat device.
- Re-check the floating accent card position so it still overlaps the (now larger, untilted) device edge without covering key UI.

### 4. Teal/aqua-green highlight instead of yellow
Replace the gold accent everywhere it appears:
- Marker underline stroke, marker circle stroke (`UNDER`, `CIRC` SVGs): `hsl(40 82% 64%)` → aqua green `hsl(162 78% 46%)`.
- Highlighted caption word color `.acc`: gold → same aqua green.
- Floating-card accent icon tints stay as-is (they're contextual greens/blues), unless they read as yellow — the branding card's `#caa24a` gold tint will be swapped to the aqua green for consistency.

## Technical details
- Edit `/tmp/asp4/build.py`: change `OUT` to the v5 folder; crop bottom 108px in `b64`/image load step for screenshots (load via PIL, crop, re-encode); update `.caption top`, `.stage`/`.device`/`.shadow` CSS (remove rotations + perspective, widen device, recenter shadow); swap accent HSL in `UNDER`, `CIRC`, `.acc`, and the branding card tint.
- Re-render all 6 at exactly 1290×2796 with headless Chromium.

## QA (mandatory before delivery)
Convert all 6 PNGs to inspection images and verify each: no tilt (phone perfectly straight), no white strip at screen bottom, small/tight gap under the headline, device noticeably larger and not clipped, highlight is aqua green (zero yellow remaining), marker aligns to its word, floating card overlaps device without hiding key UI, dimensions exactly 1290×2796, consistent across all 6. Fix and re-render until clean.
