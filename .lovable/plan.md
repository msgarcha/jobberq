# Native App UI Overhaul Plan

Goal: make QuickLinq feel like a polished native app (on par with Jobber), fixing cut-off buttons, cramped headers, the popup "Add Service" form, missing per-client create flow, and oversized scheduling fields.

## 1. Shared, mobile-safe page header (fixes #1, #4, #6)

Root cause: every page packs the title, description, and action button into one horizontal `flex justify-between` row, so on phones the button gets squeezed or clipped.

Create a reusable `src/components/layout/PageHeader.tsx`:
- Title + description block on top; actions below it on mobile, inline-right on `sm:`+ screens.
- Actions wrap instead of overflowing horizontally.
- Title uses `text-xl sm:text-2xl` with proper line-height so multi-line titles (e.g. "House Design and Architecture") don't collide with badges/buttons.

Apply it to: `Jobs`, `Clients`, `Services`, `Reviews`, `Schedule`, `Reports`, `Pipeline`, `Projects` (list pages) and the detail headers in `JobDetail` and `ClientDetail`.

Detail-page header specifics:
- `JobDetail`: title + status badge stack cleanly; `Edit`/`Delete` move to a wrapping action row beneath the title (no horizontal clipping like the screenshot).
- `ClientDetail`: see section 3.

## 2. Add/Edit Service becomes a full screen (fixes #2, #3)

Replace the `Dialog` in `Services.tsx` with a dedicated route, mirroring `ClientForm`/`JobForm`.

- New page `src/pages/ServiceForm.tsx`:
  - Back-arrow header ("New Service" / "Edit Service") via `PageHeader`.
  - Cards: Details (name, description, category), Pricing (default price, tax rate), and an "Active" toggle card.
  - Footer actions (Cancel / Create Service / Save). Delete action on edit.
  - Reuses the existing zod schema and `useCreateService`/`useUpdateService`/`useDeleteService`.
- Routes in `App.tsx`: `/services/new` and `/services/:id/edit`.
- `Services.tsx` list: tapping a service → `/services/:id/edit`; "Add Service" → `/services/new`. Remove the dialog + alert-dialog code (delete confirm moves into `ServiceForm`).
- Add "New Service" to the FAB quick-actions (`MobileBottomNav`) so it's reachable like quotes/invoices/jobs.

### Linq Recommended Services (fixes #3)
On the **New Service** screen, add a "Linq Recommended" section at the top:
- Shows AI-suggested services as tappable cards (name + price). Tapping one prefills the form fields (name/description/price/category) so the user can tweak and save — or a quick "Add" that creates it directly.
- Backend: add a `mode: "suggest"` branch to the existing `generate-starter-services` edge function (or a thin new `suggest-services` function) that returns suggestions **without** inserting and **without** the "skip if services exist" guard. It derives the trade from company settings (fallback: a generic prompt). Reuses existing AI-quota handling.
- Suggestions hidden on the Edit screen.

## 3. Per-client Create flow + header fix (fixes #6, Jobber parity)

`ClientDetail` header currently crams Archive + Request Review + Edit, which clip on mobile.

- Use `PageHeader`: name + status badge stack; secondary actions (Archive/Restore, Request Review, Edit) collapse into an overflow "⋯" menu (`DropdownMenu`) on mobile, stay inline on desktop.
- Add a prominent primary **"+ Create"** button (full-width on mobile, like Jobber) that opens a menu with:
  - New Quote → `/quotes/new?client=<id>`
  - New Invoice → `/invoices/new?client=<id>`
  - New Job → `/jobs/new?client=<id>`
- Wire client prefill: `QuoteForm`, `InvoiceForm`, `JobForm` read a `client` query param (via `useSearchParams`) and preselect the client on new-record load. (All three already hold `clientId` state and use `ClientSelector`.)

## 4. Job scheduling fields + form spacing (fixes #5)

In `JobForm.tsx` the `datetime-local` inputs render full-width native pickers that look oversized and flush to the edge versus other fields.

- Constrain/normalize input styling so Start/End match the Address/Title inputs (consistent height, radius, padding, and centered native value via `text-left`); ensure the grid has the same horizontal padding as other cards (no edge bleed).
- Audit all form `Input`/`Textarea` on mobile for consistent `rounded-lg`, height, and that the page `main` padding (`px-4`) is respected (the screenshot shows scheduling card content touching the screen edge — fix by aligning card/grid padding).

## 5. General native polish pass

- Verify FAB overlay and bottom-nav safe-area spacing don't cover footer action buttons on forms (add bottom padding where needed).
- Ensure list/detail headers, filter chips, and tab bars use consistent spacing tokens so screens feel cohesive.

---

## Technical notes
- New file: `src/components/layout/PageHeader.tsx`, `src/pages/ServiceForm.tsx`.
- Edits: `App.tsx` (routes), `Services.tsx`, `ClientDetail.tsx`, `JobDetail.tsx`, `JobForm.tsx`, `QuoteForm.tsx`, `InvoiceForm.tsx`, `Jobs.tsx`, `Clients.tsx`, `Reviews.tsx`, `MobileBottomNav.tsx`, plus minor header swaps on other list pages.
- Edge function: extend `supabase/functions/generate-starter-services` with a non-inserting "suggest" mode (or add `suggest-services`).
- No schema changes. All work is frontend + one edge-function enhancement.

## Verification
- Build passes.
- On mobile viewport (402px): no clipped buttons on Jobs/JobDetail/ClientDetail/Reviews/Services; Add Service opens as a full screen with recommendations; client "+ Create" routes prefill the client; scheduling fields align with other inputs.
- Screenshots of the affected screens after changes.

## One assumption to confirm (not blocking)
"Linq recommended services like on desktop" — there is no existing desktop Services-recommendation UI; the only AI starter-services logic is in onboarding. I'll build the recommendation section described in section 2. If you instead meant a different existing screen, tell me and I'll match it.