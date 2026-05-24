## What's actually happening

I reproduced the loop by visiting `https://secure.quicklinq.app/login` in a fresh browser. The platform itself responds with a redirect back to `https://quicklinq.app/login` (the request to `secure.*` is `net::ERR_ABORTED` and the URL flips to `quicklinq.app` before our React code can run). Then `Login.tsx` reads `isProdMarketingHost()` and sends the user back to `secure.*` — and the loop continues.

So this is **not** an app code bug. All four custom domains (`quicklinq.app`, `www.quicklinq.app`, `quicklinq.ca`, `secure.quicklinq.app`) are connected in Lovable, but `quicklinq.app` is set as the **Primary domain**, which makes Lovable 301-redirect every other custom domain to it. As long as that's true, the split cannot work — `secure.*` will always be sent to `quicklinq.app`.

## Fix (no code change required to start)

You need to flip the Primary-domain setting so `secure.quicklinq.app` serves on its own instead of being redirected.

**Where:** Project Settings → Project section → Domains.

There are two possible UI states:

1. If Lovable lets you mark `secure.quicklinq.app` as its own **Primary** independently of `quicklinq.app` (i.e. two co-primaries, each serving itself, neither redirecting to the other), do that. The split will work immediately after Publish.
2. If Lovable forces a single Primary across all custom domains in one project, the split as designed **cannot** work in one project — the platform will always force secondary domains to redirect to the primary. In that case the realistic options are:
   - Host the marketing site (`quicklinq.app`, `www.quicklinq.app`, `quicklinq.ca`) in a **separate Lovable project** that only serves the landing/legal pages, and keep this project on `secure.quicklinq.app` as its own Primary. This is the clean, production-grade split.
   - Or drop the split and let the app live on whatever domain the user came in on.

## What I'll do in code, depending on outcome

- **If option 1 works:** no code changes needed. The existing `src/lib/hosts.ts` / `Login.tsx` / `ProtectedRoute.tsx` / `AuthContext.tsx` logic is already correct and will start behaving as intended once the platform stops redirecting.
- **If option 2 (separate marketing project):** I'll trim this project so it serves only `secure.quicklinq.app` plus app routes (no `/landing`, `/features`, `/pricing`, etc., which would move to the marketing project). The host helpers stay; the marketing-host redirect becomes a no-op because this project no longer answers those hostnames.
- **If you choose to drop the split entirely later:** I'll remove the marketing→secure auto-redirect in `Login.tsx`, the secure→marketing redirect in `AuthContext.signOut`, and the defense-in-depth redirect in `ProtectedRoute.tsx`, and stop using `getAuthRedirectOrigin` (revert to `window.location.origin`).

## Action requested from you

1. Open Project Settings → Domains and check whether `secure.quicklinq.app` can be set so it does **not** auto-redirect to `quicklinq.app` (look for a "Primary" toggle / "Redirect to primary" option on each row).
2. Tell me which case you're in (1 or 2 above), and I'll either confirm we're done after Publish, or move the marketing pages into a separate project.

Until the platform setting is changed, no amount of React code can prevent the loop, because the redirect happens before our JS runs.
