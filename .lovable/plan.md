## Goal

Produce a 6.5" iPhone display screenshot set (1242 × 2688 px) that is identical to the existing 6.9" `screenshots-v5` set (1290 × 2796 px), so they can be uploaded to App Store Connect's 6.5" Display slot.

## Source & target

- Source: `/mnt/documents/app-store-package/screenshots-v5/` — 6 PNGs at 1290 × 2796
  - `01-dashboard.png`, `02-create.png`, `03-reports.png`, `04-linq-ai.png`, `05-clients.png`, `06-branding.png`
- Target: new folder `/mnt/documents/app-store-package/screenshots-v5-65/` — same 6 files at **1242 × 2688** (the 6.5" Display requirement)

Aspect ratios are effectively identical (1290/2796 = 0.4613 vs 1242/2688 = 0.4620), so a direct high-quality downscale produces no visible distortion or cropping.

## Steps

1. Create the target folder.
2. For each of the 6 PNGs, resize to exactly 1242 × 2688 using a high-quality (Lanczos) downscale, keeping the same filenames.
3. QA: verify all 6 outputs are exactly 1242 × 2688 and visually inspect 1–2 of them to confirm no distortion, clipping, or quality loss.
4. Report the output path and emit artifact tags so the files can be previewed/downloaded.

## Technical notes

- Use Python + Pillow (`Image.resize((1242, 2688), Image.LANCZOS)`), already available in the sandbox.
- Output stays PNG (App Store Connect accepts PNG/JPEG; PNG matches the originals).
- No app/code changes — this is purely an asset-generation task written to `/mnt/documents`.
