

## Data Import Hub — CSV & Platform Migration Tool

### Overview
A dedicated import system that lets users migrate their existing data from Jobber, QuickBooks, or any CSV file into the platform. This is a Settings-level feature with a guided wizard flow.

### How It Works

1. User goes to **Settings → Import Data** tab (new tab)
2. Chooses source: **Jobber CSV**, **QuickBooks CSV**, **Generic CSV**, or **Other Platform**
3. Uploads a CSV file
4. System auto-detects columns and maps them to the app's fields (client name, email, phone, address, etc.)
5. User reviews/adjusts the field mapping
6. Preview of first 5 rows showing how data will be imported
7. User confirms → bulk insert into the database
8. Summary screen: X clients imported, Y skipped (duplicates/errors)

### Supported Import Types (Phase 1)

**Clients** — the critical one. Fields: first_name, last_name, company_name, email, phone, address, city, state, zip, status, notes, tags

**Services** — name, description, default_price, category

**Jobs** — title, description, status, scheduled_start, client (matched by name/email)

### Smart Column Mapping

The system uses known column header patterns to auto-map:

| Platform | Their Column | Our Field |
|----------|-------------|-----------|
| Jobber | `First name` | first_name |
| Jobber | `Last name` | last_name |
| Jobber | `Company` | company_name |
| Jobber | `Email` | email |
| Jobber | `Phone number` | phone |
| Jobber | `Street 1` | address_line1 |
| Jobber | `Street 2` | address_line2 |
| QuickBooks | `Customer` | first_name + last_name (split) |
| QuickBooks | `Company Name` | company_name |
| QuickBooks | `Main Email` | email |
| QuickBooks | `Main Phone` | phone |
| QuickBooks | `Billing Address Line 1` | address_line1 |
| Generic | Fuzzy match on common names | Best guess |

For unrecognized columns, user gets a dropdown to manually assign each column to a field or skip it.

### New Files

1. **`src/pages/ImportData.tsx`** — Full import wizard page with steps: Source → Upload → Map → Preview → Import → Summary
2. **`src/components/import/ImportWizard.tsx`** — Step container with progress indicator
3. **`src/components/import/SourceSelector.tsx`** — Cards for Jobber, QuickBooks, Generic CSV
4. **`src/components/import/FileUploader.tsx`** — Drag-and-drop CSV upload with file validation
5. **`src/components/import/ColumnMapper.tsx`** — Auto-mapped columns with manual override dropdowns
6. **`src/components/import/ImportPreview.tsx`** — Table showing first 5 mapped rows
7. **`src/components/import/ImportSummary.tsx`** — Results: imported, skipped, errors
8. **`src/lib/csvParser.ts`** — CSV parsing utility (using native browser APIs, no extra dependency)
9. **`src/lib/columnMappings.ts`** — Known mappings for Jobber, QuickBooks, and fuzzy matching logic

### CSV Parsing Strategy

All parsing happens **client-side** using the browser's built-in text processing:
- Parse CSV with proper quote/comma handling
- Detect headers from first row
- Auto-map using the known mappings dictionary
- Fuzzy match remaining columns (Levenshtein-like similarity on header names)
- Bulk insert via Supabase client in batches of 100 rows

### Duplicate Detection

Before inserting, check for duplicates by matching on `email` or `first_name + last_name + phone`. Show duplicates in preview and let user choose: skip, overwrite, or import as new.

### Integration into Settings

Add an **"Import"** tab to Settings page with a prominent card:
- "Import from Jobber" — with Jobber-style icon
- "Import from QuickBooks" — with QB-style icon  
- "Import from CSV" — generic
- Each card links to `/import` with a `?source=jobber|quickbooks|csv` query param

### Navigation

- Route: `/import` (protected)
- Accessible from: Settings → Import tab, and also from the Clients page (empty state "Import clients" button)

### No Database Changes Needed

All imports use existing tables (clients, services_catalog, jobs). The CSV parsing and mapping is entirely client-side. Bulk inserts use the existing Supabase client with the user's auth context and team_id.

### Implementation Order

1. CSV parser utility + column mapping dictionaries
2. Import wizard page with all step components
3. Settings "Import" tab integration
4. Clients page empty-state "Import" button
5. Mobile-responsive polish for the wizard

