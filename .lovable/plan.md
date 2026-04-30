# Fix: KPI value overlapping the icon on the home dashboard

## Root cause

In `src/pages/Index.tsx`, each KPI card (Revenue / Outstanding / Overdue / Active Quotes) renders:

```text
[ text column (label, big value, sub) ]              [ icon box ]
^ flex-1, min-w-0                                    ^ shrink-0
```

The container is `flex items-start justify-between` with **no `gap`** between the two columns, and the big value `<p class="text-2xl font-display font-bold">` has **no `truncate`**. When the value is long (e.g. `$24,609.50`, `$21,039.50`), the text renders its full intrinsic width and visually slides under the icon — exactly what the screenshot shows. `justify-between` does not protect against this; it only positions items, it doesn't constrain widths.

The same pattern (`flex items-start justify-between` with an icon and unbounded numeric text) is the recipe for overlap on every breakpoint where the card is narrow — phones, the 2-column grid on small tablets, and the 4-column grid on cramped laptop widths (which is what the user's 1106px viewport hits).

## The fix

Edit only the KPI card block in `src/pages/Index.tsx` (around lines 142–157). Two small, surgical changes:

1. **Add a real gap** between the text column and the icon: `gap-3` on the inner flex row. This guarantees the icon can never sit flush against the value.

2. **Truncate the value text and let the column actually shrink.** Apply `truncate` to the value `<p>`, and keep `min-w-0` on the column (already there). For the value specifically, also add `leading-tight` so the truncated text doesn't get clipped vertically. Use a slightly smaller responsive size to give more room: keep `text-xl md:text-2xl`, but add `tabular-nums` so digits are uniform.

3. **Add a tooltip-style `title` attribute** on the value so the full number is still discoverable on hover/long-press if it ever gets truncated.

Result: on any viewport, the icon stays in its column, the value either fits or truncates with an ellipsis — never overlaps.

### Code change (KPI block only)

```tsx
<CardContent className="p-4 md:p-5">
  <div className="flex items-start justify-between gap-3">
    <div className="space-y-1 min-w-0 flex-1">
      <p className="text-[10px] md:text-xs text-muted-foreground font-medium uppercase tracking-wide truncate">
        {kpi.label}
      </p>
      <p
        className="text-xl md:text-2xl font-display font-bold truncate leading-tight tabular-nums"
        title={kpi.value}
      >
        {kpi.value}
      </p>
      {kpi.sub && (
        <p className="text-[10px] md:text-xs text-muted-foreground truncate">{kpi.sub}</p>
      )}
    </div>
    <div className={`h-8 w-8 md:h-10 md:w-10 rounded-xl bg-secondary flex items-center justify-center shrink-0 ${kpi.color}`}>
      <kpi.icon className="h-4 w-4 md:h-5 md:w-5" />
    </div>
  </div>
</CardContent>
```

## Defensive sweep so we don't revisit this

While in the file, audit the **two other** `flex … justify-between` rows on this page for the same overlap risk:

- **Greeting + Tip row** (already has `min-w-0` and `break-words` from the previous fix — leave as-is).
- **Recent Activity rows** (lines ~232–244): the right-side `Badge + date` column is `shrink-0`, the middle `flex-1 min-w-0` already truncates. No change needed.
- **Quick Actions buttons** (lines ~118–133): inner `<div class="min-w-0">` already truncates the label. No change needed.

So the only edit is the KPI card block.

## QA after the fix

- 1106 × 626 (current desktop preview): `$24,609.50` and `$21,039.50` no longer touch the icon; gap is visible.
- 390 × 844 (mobile, 2-col grid): values fit or truncate cleanly; icons stay right-aligned.
- 1920 × 1080 (full desktop, 4-col grid): unchanged appearance, just with the new gap.
- Inflate a value to something absurd (e.g. `$1,234,567,890`): it truncates with `…` instead of crawling under the icon.
