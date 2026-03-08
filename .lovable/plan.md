

# Service Catalog CRUD

## What to Build

Replace the mock data in Services page with full database-connected CRUD:

1. **`src/hooks/useServices.ts`** -- React Query hooks following the same pattern as `useClients.ts`:
   - `useServices(filters?)` -- list with search and active/inactive filter
   - `useCreateService` -- insert mutation
   - `useUpdateService` -- update mutation
   - `useDeleteService` -- delete mutation (with confirmation)

2. **`src/pages/Services.tsx`** -- Rebuild to:
   - Connect to real `services_catalog` table via hooks
   - Filter chips: All / Active / Inactive
   - Search input (debounced)
   - "Add Service" button opens a Dialog form
   - Each card is clickable to open edit dialog
   - Edit dialog includes delete button with confirmation
   - Active/inactive toggle (Switch) in the form
   - Fields: name, description, category, default price, tax rate, active toggle
   - Zod validation for required fields and numeric constraints
   - Empty state when no services exist

## Database
No schema changes needed -- `services_catalog` table already has all required columns (name, description, default_price, tax_rate, category, is_active, user_id). RLS policy already in place.

## Files

| File | Action |
|------|--------|
| `src/hooks/useServices.ts` | Create -- CRUD hooks |
| `src/pages/Services.tsx` | Rewrite -- real data, dialog form, filters |

