## Goal
Make the Linq Assistant feel like a compact corner chat widget (think Intercom/ChatGPT-style floating window) on desktop, instead of taking up the whole bottom half of the screen. Keep the mobile experience friendly.

## Changes (frontend only, single file)

**File:** `src/components/ai/AssistantSheet.tsx`

Replace the shadcn `Sheet` (which dims the page and pins to the bottom edge) with a fixed-position floating panel:

- On desktop (`md+`): a card pinned to the bottom-right corner, ~`width 400px`, `height min(620px, 80vh)`, with rounded corners, border, and `shadow-2xl`. No backdrop overlay so the dashboard stays visible and interactive behind it.
- On mobile (`<md`): keep current behavior — slide up from the bottom, full width, ~`85vh` height, rounded top corners. Backdrop optional/light.
- Keep the existing header, message list, suggestion chips, doc cards, loader, and input footer — only the outer container/sizing changes.
- Preserve open/close animation (simple `data-[state=open]` slide+fade via Tailwind, or a small framer-motion-free CSS transition).
- Close on `Escape` key and on clicking an explicit close button in the header (already exists via `onOpenChange`).

## Technical notes
- Drop `Sheet`/`SheetContent` import; use a plain `<div>` portal-free overlay with `fixed bottom-4 right-4 z-50` on desktop and `fixed inset-x-0 bottom-0` on mobile.
- Tailwind classes: `md:w-[400px] md:h-[min(620px,80vh)] md:bottom-4 md:right-4 md:rounded-2xl w-full h-[85vh] rounded-t-3xl bottom-0 inset-x-0 md:inset-x-auto`.
- Use `bg-background border shadow-2xl flex flex-col overflow-hidden`.
- No changes to `useLinqAssistant`, `LinqLauncher`, voice input, or send logic.

## Out of scope
- No backend, hook, or routing changes.
- No changes to the launcher button placement.
