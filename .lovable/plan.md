# Fix: Mobile keyboard dismisses after every keystroke

## Why it's happening
In `src/pages/ReviewForm.tsx`, two helper components — `PageShell` and `Brand` — are defined **inside** the `ReviewForm` function body (lines ~126 and ~139). 

Every time React state changes (e.g. typing into the feedback textarea calls `setFeedback`), the `ReviewForm` component re-renders. That re-render creates **brand-new function references** for `PageShell` and `Brand`. React sees a different component type in the tree and unmounts the old subtree entirely, then mounts a fresh one. The `<Textarea>` is thrown away and recreated each keystroke — which on mobile causes the OS keyboard to dismiss because the focused element no longer exists.

This is a well-known React anti-pattern ("nested component definitions"). It also hurts performance.

## The fix
Move `PageShell` and `Brand` **outside** the `ReviewForm` component so their identities are stable across renders. `Brand` needs `companyName` and `logoUrl`, so we'll pass those in as props.

### Changes to `src/pages/ReviewForm.tsx`

1. **Lift `PageShell` to module scope** — it only uses `children`, so it becomes a pure presentational component above `ReviewForm`.

2. **Lift `Brand` to module scope** — accept `companyName` and `logoUrl` as props instead of closing over them.

3. **Update call sites** — `<Brand />` becomes `<Brand companyName={companyName} logoUrl={logoUrl} />` in the three places it's used (error state, after-submission header, main rating form).

4. **No other logic changes.** All state, handlers, and the AI-drafted Google review flow stay exactly as they are.

## Result
- Typing in the rating-form textarea no longer remounts the input → mobile keyboard stays open across keystrokes.
- Same fix protects the editable "Suggested review" textarea on the post-submission screen.
- Slight perf win since the shell isn't rebuilt every render.

## QA after the fix
- Open the review link on a phone, tap a star, start typing in the feedback box → keyboard remains visible the entire time.
- Submit a 5-star review, tap "Edit" on the suggested review, type → keyboard stays.
- Confirm "Copy & Open Google" still fires within the same user gesture (unchanged code path).
