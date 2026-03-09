

## Import Jobber Clients with All Data Preserved

### Problem
The current Jobber import mapping doesn't match the actual Jobber CSV headers. For example, Jobber exports "Main Phone #s" but the mapper only knows "phone". Key fields like **Created Date**, **Title**, **Lead Source**, and **Service Property addresses** are completely ignored.

Your CSV has 114 clients with these important fields that aren't currently captured:
- **Created Date** (client joining date) — not mapped at all
- **Title** (Mr., Ms.) — no column in the `clients` table
- **Lead Source** — no column in the `clients` table
- **Service Property** (name, address, city, state, country, zip) — should go into the `properties` table
- **Archived** flag — should map to `status = 'archived'`
- Actual Jobber headers like "Main Phone #s", "E-mails", "Billing Street 1" don't match the current mapping keys

Also, some clients appear multiple times (e.g., Sarbjeet Walia) with different service property addresses — the import should create one client + multiple properties.

---

### Plan

#### 1. Database Migration — Add missing columns to `clients`
Add `title` (text, nullable) and `lead_source` (text, nullable) to the `clients` table so we don't lose that data.

#### 2. Fix Jobber Column Mappings (`src/lib/columnMappings.ts`)
- Add `title`, `lead_source`, `created_date` to `CLIENT_FIELDS`
- Update `JOBBER_CLIENT_MAP` to include actual Jobber export headers:
  - `'main phone #s'` → `phone`
  - `'e-mails'` → `email`
  - `'billing street 1'` → `address_line1`
  - `'billing street 2'` → `address_line2`
  - `'billing city'` → `city`
  - `'billing state'` → `state`
  - `'billing zip code'` → `zip`
  - `'billing country'` → `country`
  - `'title'` → `title`
  - `'created date'` → `created_date`
  - `'archived'` → `_archived`
  - `'lead source'` → `lead_source`
  - `'service property name'` → `_prop_name`
  - `'service street 1'` → `_prop_street1`
  - `'service street 2'` → `_prop_street2`
  - `'service city'` → `_prop_city`
  - `'service state'` → `_prop_state`
  - `'service country'` → `_prop_country`
  - `'service zip code'` → `_prop_zip`
- Property fields use `_prop_` prefix — handled specially during import (not stored on clients)

#### 3. Update Import Logic (`src/pages/ImportData.tsx`)
- **Deduplication by name**: When the same client (first+last name + email) appears multiple times in the CSV, merge them into one client record with multiple properties
- **Set `created_at`**: Parse Jobber's DD/MM/YYYY date format and pass it as `created_at` on insert
- **Set `title` and `lead_source`**: Include new fields in the insert
- **Archived → status**: If `_archived` is `'true'`, set status to `'archived'`
- **Create properties**: After inserting clients, batch-insert property records from `_prop_*` fields, linked to the newly created client IDs
- **Country default**: Change from 'US' to 'Canada' when billing country is Canada

#### 4. Update `transformRow` handling
Add special handling for `_archived` (converts to status) and `_prop_*` fields (preserved for property creation).

### Files Changed
- 1 migration (add `title`, `lead_source` to `clients`)
- `src/lib/columnMappings.ts` — expand CLIENT_FIELDS + JOBBER_CLIENT_MAP
- `src/pages/ImportData.tsx` — handle date parsing, dedup within CSV, property creation, new fields

