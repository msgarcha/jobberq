## Replace legal docs with exact PDF text

Use the uploaded PDF text verbatim for Terms of Service, Privacy Policy, and the new Data Processing Addendum. Omit all address placeholders ("[Insert registered office mailing address, city, postal code]") per user instruction.

### Key content changes vs current docs
- **Dates**: Last updated May 22, 2026 · Version 2026-05-22.
- **No Quiresoft application/transaction fee** (replaces previous "10% platform fee" text). Only Stripe processing fees apply.
- New sections added to Terms: Force Majeure (17), Security & Breach Notification (16), expanded Indemnification with mutual obligations, expanded AI section disclosing Google/OpenAI via Lovable AI Gateway and no-training commitment.
- Privacy adds: Quebec Law 25 references, CASL section (14), Automated Decision-Making (11), 90-day deletion retention, sub-processor notice.
- **New page**: Data Processing Addendum (Part C) — 8 sections.

### Files to update

1. **`src/pages/Terms.tsx`** — rewrite section list and JSX body to match the PDF's 21 sections verbatim. Remove "10% fee" language. Update lastUpdated/version constants. Contact section: list emails only (legal@, support@), no mailing address line.

2. **`src/pages/Privacy.tsx`** — rewrite to 16 sections matching PDF verbatim (adds Automated Decision-Making, CASL, expanded security/breach). Update dates. Contact section: emails only.

3. **`src/pages/Dpa.tsx`** (new) — Part C Data Processing Addendum, 8 sections, using existing `LegalLayout`.

4. **`src/App.tsx`** — add route `/dpa` → `Dpa` page (lazy import alongside Terms/Privacy).

5. **`src/components/landing/LandingFooter.tsx`** — add "Data Processing Addendum" link next to Terms/Privacy.

6. **`public/terms.html`** — regenerate static HTML mirror with exact new text (no address).

7. **`public/privacy.html`** — regenerate static HTML mirror with exact new text (no address).

8. **`public/dpa.html`** (new) — static HTML mirror of the DPA.

9. **`public/sitemap.xml`** — add `/dpa` and `/dpa.html` entries.

### Out of scope
- No changes to signup consent checkbox (already implemented).
- No database/schema changes.
- No address fields anywhere (user explicitly said "Do not add any address").
- Section numbering inside Privacy "Sharing" references "Section 13" for cookies (per PDF) — kept as-is even though older copy said Section 12.

### Verification
After build, `curl https://quicklinq.app/terms.html | head` to confirm static mirror serves full text; spot-check React routes /terms, /privacy, /dpa render with new headings.
