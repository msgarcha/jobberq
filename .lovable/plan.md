

# UI/UX Overhaul -- Jobber-Inspired Design

## Analysis of Jobber Screenshots vs Current State

The Jobber screenshots show a warm, approachable design with:
- **Warm color palette**: Cream/beige backgrounds (`#F5F0E8` tones), dark teal/navy text (`#1B3A4B`), muted sage accents
- **Personalized dashboard**: "Good morning, Manpreet" greeting with map, today's schedule card, and to-do list
- **Activity feed**: Recently active items mixing clients, invoices, jobs with type icons and status badges
- **Clean list items**: Each row has an icon (client/invoice/job), bold name, date/address metadata, and right-aligned status
- **Bottom tab bar** (mobile): Home, Schedule, Search, More
- **Floating action button** (+) for quick create with expandable menu (Request, Task, Invoice, Quote, Job, Client)
- **Soft card styling**: Rounded corners, subtle shadows, cream-tinted card backgrounds
- **Settings/More menu**: Clean list with icons, grouped by section with separators

Current UI is a standard dark-sidebar SaaS template with blue accents -- functional but generic.

## Plan

### 1. Color System Overhaul (`index.css`, `tailwind.config.ts`)
Replace the cold blue/slate palette with Jobber's warm palette:
- Background: warm off-white (`#F7F5F0`)
- Cards: white with subtle warm border
- Primary: dark teal (`#1B4D5C`)
- Accent: warm amber/gold for highlights
- Sidebar: dark navy-teal (`#0D2B36`) 
- Status badges: muted green (paid), warm amber (pending), soft red (overdue)
- Softer, rounder feel: increase border-radius, lighter shadows

### 2. Dashboard Redesign (`Index.tsx`)
- Add personalized greeting "Good morning, [Name]" using profile data from AuthContext
- Replace rigid KPI grid with a more organic layout:
  - Today's schedule summary card (shows visits for today or "No visits scheduled today")
  - To-do section (approved quotes to convert, overdue invoices to follow up)
  - Recently active feed mixing clients, quotes, invoices with type-specific icons
- Keep revenue KPI cards but style them with warm backgrounds
- Add "View all" links on each section

### 3. Sidebar Refresh (`AppSidebar.tsx`)
- Update colors to match warm dark teal
- Add user avatar and name at bottom with logout
- Refine active state styling to match Jobber's subtle highlight
- Add a collapsible "More" section for Settings, Reports, Services

### 4. Top Bar Polish (`TopBar.tsx`)
- Cleaner search bar with warm styling
- User avatar showing initials from profile
- Notification bell with count badge
- Quick-create dropdown styled with icons matching Jobber's FAB menu (Client, Quote, Invoice, Job)

### 5. List Pages Refinement (Clients, Quotes, Invoices, Jobs, Services)
- Replace plain tables with card-based list items on mobile, table on desktop
- Each row: type icon, bold name, metadata line (date, address, amount), right-aligned status badge
- Warmer hover states and transitions
- Filter chips row (like Jobber's "Clients | Requests | Quotes" pill buttons)
- Empty states with illustrations

### 6. Login Page (`Login.tsx`)
- Warm background with centered card
- ServicePro branding with teal/gold accents
- Cleaner form styling

### 7. Schedule Page (`Schedule.tsx`)
- Day/List/Map tab switcher (matching Jobber screenshot)
- Week day pills showing S M T W T F S with date numbers
- Timeline view with hour markers
- Placeholder for actual scheduling functionality

### 8. Settings Page (`Settings.tsx`)
- Jobber-style list menu layout (Profile, Company details, Preferences, etc.)
- Clean icon + label rows with chevron indicators
- Grouped sections with separators

### 9. Global Polish
- Smoother animations (spring-based fade-ins)
- Consistent 8px spacing grid
- Typography: slightly larger body text, bolder headings
- Mobile-responsive: stack to single column, larger touch targets
- Add subtle micro-interactions on hover/click

## Files to Create/Edit

| File | Action |
|------|--------|
| `src/index.css` | New warm color variables |
| `tailwind.config.ts` | Updated color tokens |
| `src/pages/Index.tsx` | Full dashboard redesign with greeting + activity feed |
| `src/components/layout/AppSidebar.tsx` | Warm teal styling, user info, logout |
| `src/components/layout/TopBar.tsx` | Polish search, avatar, create menu with icons |
| `src/pages/Clients.tsx` | Card-based list with icons and filter chips |
| `src/pages/Quotes.tsx` | Same treatment |
| `src/pages/Invoices.tsx` | Same treatment |
| `src/pages/Jobs.tsx` | Same treatment |
| `src/pages/Services.tsx` | Same treatment |
| `src/pages/Schedule.tsx` | Day/List/Map tabs, week strip, timeline |
| `src/pages/Settings.tsx` | Jobber-style menu list |
| `src/pages/Login.tsx` | Warm branding refresh |
| `src/pages/Reports.tsx` | Better empty state |
| `src/contexts/AuthContext.tsx` | Expose user display name for greeting |

## Technical Notes
- No database changes needed -- this is purely frontend
- Will use existing shadcn components, just restyled via CSS variables
- AuthContext already has session/user; will read `user_metadata.display_name` for greeting
- All pages keep their existing routing and mock data structure

