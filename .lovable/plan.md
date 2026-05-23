# Move logged-in app to `secure.quicklinq.app`

Goal: After login, the browser URL should be on `secure.quicklinq.app` (the authenticated app), while `quicklinq.app` / `www.quicklinq.app` remain the marketing/landing site. Nothing should break for existing users.

## How it will work

Lovable hosting serves the same built app under every custom domain attached to the project. So `secure.quicklinq.app` will serve the same React app — we just use the **hostname** to decide what to render and where to redirect.

```text
quicklinq.app / www.quicklinq.app   → public routes only (/, /landing, /login, /signup, /privacy, /terms, /dpa, /reset-password)
secure.quicklinq.app                → authenticated app routes (/dashboard, /projects, /clients, etc.)
```

## Steps

### 1. Add the subdomain in Lovable
- Project Settings → Domains → Connect Domain → enter `secure.quicklinq.app`.
- Add DNS at the registrar (one A record `secure → 185.158.133.1`, plus the `_lovable` TXT verification record Lovable shows).
- Wait for status to become Active (SSL auto-provisions).
- Keep `quicklinq.app` as the Primary domain. Do not change anything about the existing domains.

### 2. Post-login redirect
In the login success handler (and signup-confirmed handler), after `supabase.auth.signInWithPassword` resolves successfully:
- If `window.location.hostname !== 'secure.quicklinq.app'` AND we're on a production quicklinq host, do a full-page redirect:
  `window.location.replace('https://secure.quicklinq.app' + intendedPath)`
- On `localhost` and `*.lovable.app` preview hosts, skip the redirect (keep current behavior so dev/preview keeps working).

### 3. Post-logout redirect
In the sign-out handler:
- If on `secure.quicklinq.app`, redirect to `https://quicklinq.app/` after `supabase.auth.signOut()`.
- Preview/localhost: stay where you are.

### 4. Guard the routes per hostname (defense in depth)
A small `HostnameGuard` wrapper (or logic inside the existing `ProtectedRoute` / `PublicRoute`) that runs once on mount:
- On `quicklinq.app` / `www.quicklinq.app`: if the user lands on an authenticated route while logged in, redirect to `https://secure.quicklinq.app{pathname}`.
- On `secure.quicklinq.app`: if the user is on a public-only route (`/landing`), redirect to `/dashboard`; if not logged in on a protected route, send them to `https://quicklinq.app/login`.
- Preview/localhost: bypass entirely.

### 5. Supabase auth config
- Add `https://secure.quicklinq.app` (and `https://secure.quicklinq.app/reset-password`) to the Site URL / Redirect URLs allow-list in Lovable Cloud auth settings so magic links, OAuth callbacks, and password-reset emails work on the new host.
- Update the `emailRedirectTo` and `resetPasswordForEmail` redirect to point at `https://secure.quicklinq.app` when the user is signing up/resetting from production.

### 6. Cookies / session
- Supabase stores its session in `localStorage`, which is **per-origin**. Moving from `quicklinq.app` to `secure.quicklinq.app` is a different origin, so the session does NOT auto-transfer.
- That's fine for the login flow (the user authenticates after the redirect lands on `secure.quicklinq.app`) — we just need to make sure `signInWithPassword` runs on `secure.quicklinq.app`, not on the marketing host. Two options:
  - **A (simpler, recommended):** Keep `/login` only on `secure.quicklinq.app`. The marketing site's "Log in" button links to `https://secure.quicklinq.app/login`. The login form runs on `secure`, creates the session on `secure`, then routes to `/dashboard`. No cross-origin session needed.
  - **B:** Allow login on both, then redirect — requires an extra round-trip and a short-lived token; more complexity, no real upside.

Plan goes with **option A**.

### 7. SEO / canonicals
- Add `noindex` meta on `secure.quicklinq.app` (the app shell shouldn't be indexed).
- Keep the existing canonical tags on the marketing pages pointing at `https://quicklinq.app/...`.
- Sitemap stays on `quicklinq.app` and does not list `secure.*`.

## What does NOT change
- Existing routes, components, Supabase project, RLS, edge functions, Stripe, PWA manifest scope, Capacitor iOS shell — all untouched.
- `quicklinq.ca` and `www.quicklinq.app` keep redirecting/serving as today.

## Rollout order (safe)
1. Add `secure.quicklinq.app` in Lovable + DNS. Wait for Active.
2. Update Supabase redirect URL allow-list.
3. Ship the code changes (login redirect, logout redirect, hostname guard, marketing "Log in" link → `secure.*`).
4. Publish. Verify on prod: marketing on `quicklinq.app`, login lands on `secure.quicklinq.app/dashboard`.
5. Roll back is a one-line revert of the redirect — DNS can stay.

## Open questions
1. Confirm: marketing pages = `/`, `/landing`, `/login`, `/signup`, `/privacy`, `/terms`, `/dpa`, `/reset-password`. Everything else = authenticated app on `secure.*`. Correct?
2. Should the iOS Capacitor app also point at `secure.quicklinq.app` for its webview/deep links? (Recommend yes.)
