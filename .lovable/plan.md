

## Add "Create New Service" Option Inside Line Item Service Dropdown

### Problem
The service selector dropdown in the Line Items editor shows nothing because there are no services in the catalog yet. There's no way to add a service inline — the user must navigate away to `/services` first.

### Solution
Add a sticky "+ Add New Service" option at the bottom of each service `<SelectContent>`. Clicking it opens a small dialog/sheet to create a service (name, price, tax rate) without leaving the invoice/quote form. After creation, auto-select the new service in that line item row.

### Changes

**File: `src/components/LineItemsEditor.tsx`**
1. Add a `useState` for showing a "New Service" dialog and tracking which row triggered it
2. Add a simple inline dialog (`Dialog` from shadcn) with fields: Name, Default Price, Tax Rate
3. On save, call `useCreateService`, then auto-select the newly created service on the triggering row
4. In both mobile and desktop `<SelectContent>`, add a styled "+ Add New Service" button below the service list items (using a `div` after the items, triggered via `onValueChange` with a special sentinel value like `__new__`)

**No other files need changes** — the `useCreateService` hook already exists and handles team_id assignment.

### UX Flow
1. User clicks service dropdown → sees existing services (if any) + "+ Add New Service" at bottom
2. Clicking "+ Add New Service" opens a compact dialog with Name, Price, Tax Rate fields
3. On save, the new service is created, the dropdown auto-selects it, and description/price/tax populate the row

