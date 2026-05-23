# Quick win: Crawlable static legal pages

## Problem

`/terms` and `/privacy` are React routes — fetchers that don't execute JS (LinkedIn, Slack, Facebook OG previewer, ChatGPT, plain `curl`, generic legal/compliance scrapers) see only the empty SPA shell. Lovable's verified-crawler prerendering covers Googlebot/Bingbot but not these.

## Fix

Ship a static HTML mirror of each legal document under `public/`, served as plain HTML with no JS dependency. The React routes stay as-is for the styled in-app experience.

## Changes

### 1. New static files

- `public/terms.html` — full Terms of Service text, mirrors `src/pages/Terms.tsx` content verbatim (all 19 sections, headings, lists, Stripe links, 10% fee, BC governing law, contact emails). Self-contained: inline `<style>` block with system fonts + minimal typography, no external CSS, no JS. Includes proper `<title>`, `<meta name="description">`, `<link rel="canonical" href="https://quicklinq.app/terms">`, OG tags, and corporate attribution footer.
- `public/privacy.html` — same treatment for Privacy Policy (all 14 sections), canonical `https://quicklinq.app/privacy`.

Both files cross-link to each other and to `https://quicklinq.app/` home.

### 2. React pages add a "plain HTML version" link

In `src/components/legal/LegalLayout.tsx`, add a small link in the header area: "View plain-text version" → opens `/terms.html` or `/privacy.html` (path derived from the existing `path` prop by appending `.html`). Opens in a new tab.

### 3. Sitemap

Add `/terms.html` and `/privacy.html` as additional `<url>` entries in `public/sitemap.xml` alongside the existing `/terms` and `/privacy` so both surfaces are discoverable.

### 4. Nothing else changes

- React routes `/terms` and `/privacy` keep working unchanged for in-app navigation and Googlebot (via Lovable prerendering).
- Signup consent flow, footer links, database schema — untouched.
- No new dependencies, no router changes, no SSR migration.

## How crawlers benefit

- `curl https://quicklinq.app/terms.html` returns full document text immediately — no JS required.
- LinkedIn / Slack / Facebook OG scrapers reading `/terms.html` get accurate title + description.
- Legal/compliance bots that auto-archive ToS pages (e.g. ToSDR, regulator scrapers) can index the full text.
- Humans linking to either URL get a readable, branded plain-HTML doc.

## Out of scope

- TanStack Start / SSR migration (separate large project).
- Per-route OG images.
- Versioned historical archive of past Terms versions.
