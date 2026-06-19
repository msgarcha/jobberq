I found the account `info@garchadesignbuild.ca` has a valid trial date in the backend (`trial_ends_at: Oct 20, 2027`) and no Apple entitlement yet. The likely frontend issue is that Settings currently shows native IAP cards only when `Capacitor.isNativePlatform()` returns true; in browser/published web it shows Stripe cards, and the native card component can still render disabled/loading if RevenueCat products are unavailable.

Plan:

1. Make Billing cards always visible
- Refactor the Billing tab so the three plan cards are rendered from one shared list for Starter, Pro, and Business.
- On iOS native, buttons use RevenueCat/App Store purchases.
- On web/browser, buttons use the existing Stripe checkout.
- The cards will appear regardless of trial state, subscription state, or RevenueCat loading state.

2. Show clear trial/subscription state for this user
- Keep the current plan status card at the top.
- Show `Free Trial` and `Trial ends Oct 20, 2027` for this account when no paid subscription exists.
- Only show `Trial expired` if the backend says the trial is actually expired.

3. Prevent hidden IAP failure states
- If RevenueCat offerings are not loaded or App Store products are missing, still show all three cards and features.
- The native subscribe button will show a clear unavailable/loading state instead of removing the cards.

4. Verify the backend response path
- Test `check-subscription` for the logged-in session and confirm it returns the expected trial fields.
- Confirm no RevenueCat webhook events exist yet for this account, which explains why it has no Apple subscription record.

5. Final verification steps
- Verify Settings → Billing renders all three cards in the Lovable preview.
- For iOS/TestFlight, you will still need to pull the latest code and run `npx cap sync ios`, then build a new TestFlight version; old TestFlight builds will not show these UI fixes.