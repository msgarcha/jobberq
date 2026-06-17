# Fix App Store 3.1.1: Read-only subscription on iOS (Jobber model)

## Goal
On native iOS, remove every way to **buy or start** a subscription and every **link/CTA pointing users to the web to purchase**. Keep a purely informational, read-only subscription status (exactly like the Jobber screenshot you sent). Web keeps full Stripe checkout — nothing changes there.

This is a frontend-only change (plus one memory update). No backend, no IAP, no new dependencies.

## Why the app was rejected
The current iOS billing screen and the "trial expired" screen still say *"sign in to QuickLinq at quicklinq.app from your web browser to choose a plan."* That names a domain and a purchase call-to-action, which Apple reads as accessing/steering to paid content bought outside IAP. The fix is to strip the purchase CTA and the domain, leaving only neutral status text.

## Changes

### 1. `src/pages/Settings.tsx` — Billing tab (native only)
- Replace the native info card (the "Manage your plan on the web / sign in to QuickLinq at quicklinq.app…" card) with a **read-only Jobber-style card**:
  - Heading: "You subscribed through QuickLinq's online platform" (for active subscribers) or a neutral trial/expired message otherwise.
  - Body: "To manage your subscription, log into your account from a web browser." — **no domain/URL, no "start/change subscription" wording, no link/button.**
  - Read-only detail rows when subscribed: **Plan** (tier name) and **Next payment** (`subscription.subscriptionEnd`).
- The plan pricing grid + checkout buttons remain rendered **only on web** (already gated by `isNative()`), so no purchase UI shows on iOS.
- The "Manage Subscription" (Stripe portal) button is already hidden on native — leave as is.
- In the "Current Plan Status" card, reword the `trialExpired` line so it does **not** say "Choose a plan below" on native (there are no plans below on iOS). Use neutral copy like "Your trial has ended."

### 2. `src/pages/TrialExpired.tsx` — native copy
- Change the native message from *"…sign in to QuickLinq at quicklinq.app from your web browser to choose a plan."* to neutral, URL-free, CTA-free text, e.g.: "Your free trial has ended. To continue using QuickLinq, log into your account from a web browser." 
- Native already shows no "Choose a plan" button — keep only "Sign out".

### 3. `mem://features/ios-app-store-compliance` — correct the record
The memory currently claims subscriptions are sold via **RevenueCat IAP** on native — that code does not exist and is not the chosen direction. Rewrite it to state the actual model:
- **No In-App Purchase.** Subscriptions are purchased and managed **on the web (Stripe) only**.
- On native iOS, all subscription surfaces (Settings → Billing, TrialExpired) are **read-only**: status/plan/next-payment only, with **no purchase buttons, no pricing, no plan-selection, and no external purchase CTA or domain/URL** (this is what caused the 3.1.1 rejection).
- This mirrors Jobber's approach.

## What stays the same
- Web Stripe checkout, customer portal, pricing cards, trial flow — fully unchanged.
- Client invoice/quote payments via Stripe Connect (real-world services) — unchanged on all platforms.
- Trial gating logic in `ProtectedRoute` — unchanged; expired native users still land on the read-only TrialExpired screen.

## Verification
- Build passes; confirm `Settings.tsx` and `TrialExpired.tsx` render correctly.
- Simulate native (`isNative()` true) to confirm: no pricing, no Subscribe/Switch/Start buttons, no "quicklinq.app" string, no purchase CTA anywhere in the subscription UI.
- Confirm web still shows pricing + checkout.

---

## Reply to send Apple in App Store Connect
> Thank you for the review. This app is a multiplatform business service. Subscriptions are not sold or accessed through the app on iOS. We have removed all subscription purchase options and any references or links to purchasing a subscription outside the app. The subscription section on iOS is now read-only and only displays the current plan status for customers who already subscribed on our website; it contains no purchase calls-to-action, pricing, or external links. New customers subscribe on our website, then sign in to the app to use it (the same model as comparable business apps such as Jobber). Please re-review under Guideline 3.1.3(b) for multiplatform services.

(I'll also note: in App Store Connect → App Review Information, you can add this same explanation so future reviews go smoothly.)

## Other likely future-rejection risks to address (FYI — not part of this change unless you want them)
1. **Screenshot dimensions** (from your earlier note) — must be exact supported sizes incl. 13" iPad if you list iPad.
2. **Account deletion (5.1.1(v))** — confirm the in-app delete-account flow (Settings → Company) is present and works; Apple requires it for any app with accounts.
3. **Sign in with Apple (4.8)** — only required if you offer a third-party login (Google/Facebook). You currently offer email/password only, so it's correctly not required. Don't add Google login without also adding Apple.
4. **Privacy: data collection & "Privacy Nutrition Label"** must match what the app actually collects; include a privacy policy URL (you have /privacy).
5. **Demo account** — provide working test credentials in App Review Information so reviewers can log in past the trial gate.
6. **Permission usage strings** — ensure camera/push/location `Info.plist` purpose strings are descriptive (you use camera + push).
7. **Anti-steering** — keep all subscription copy on iOS free of pricing, external URLs, and purchase CTAs (this plan enforces that).
