

## Logo Upload, PDF Color & Style Options

### 1. Database: Storage bucket + new company_settings columns

**Storage bucket migration:**
- Create a public `company-assets` bucket for logo uploads
- Add RLS policy allowing authenticated users to upload/read

**Add PDF customization columns to `company_settings`:**
- `pdf_primary_color` (text, default `'#1a1a1a'`) — header/accent color
- `pdf_accent_color` (text, default `'#6366f1'`) — highlights, borders
- `pdf_style` (text, default `'classic'`) — one of: `classic`, `modern`, `minimal`

### 2. Settings UI: Logo file upload + PDF customization

**Replace the Logo URL input** in `src/pages/Settings.tsx` with a proper file upload:
- Click the logo area or an "Upload" button to select an image
- Upload to `company-assets/{team_id}/logo.{ext}` via Supabase Storage
- Get the public URL and save to `logo_url`
- Show a preview of the uploaded logo with a "Remove" option

**Add a "PDF Appearance" card** below Company Details:
- **Primary Color** — color picker input for headings and main text accents
- **Accent Color** — color picker input for borders, status badges
- **PDF Style** — radio/select with 3 options:
  - **Classic** — traditional layout with border lines (current look)
  - **Modern** — colored header band, rounded elements
  - **Minimal** — clean, no borders, lots of whitespace

### 3. Update PrintableInvoice and PrintableQuote

Both components receive `company` (CompanySettings). Update them to:
- Read `pdf_primary_color`, `pdf_accent_color`, `pdf_style` from company settings
- Apply inline styles based on the selected style:
  - **Classic**: current layout, uses primary color for headings
  - **Modern**: colored header bar using accent color, company info on colored background, rounded table
  - **Minimal**: no table borders, lighter feel, accent color only for totals line
- Logo renders from the storage public URL (already works, just needs a real URL)

### Files changed
- 1 migration: create `company-assets` bucket + add 3 columns to `company_settings`
- `src/pages/Settings.tsx` — file upload for logo, color pickers, style selector
- `src/components/PrintableInvoice.tsx` — apply PDF styles/colors
- `src/components/PrintableQuote.tsx` — apply PDF styles/colors

