# QuickLinq — iOS App Store Submission Playbook

Everything you need to take QuickLinq from this codebase to a **live, review‑passed** app on the Apple App Store. Follow it top to bottom.

---

## 0. What's already done for you

- ✅ Capacitor updated to the latest **8.4.0** core (iOS/Android/CLI) + latest plugins.
- ✅ `capacitor.config.ts` is in **production mode** (no live‑reload `server` block).
- ✅ Bundle ID preset: `app.quicklinq`, App name: `QuickLinq`.
- ✅ Splash screen + status bar branded (dark teal `#1a3d44`, cream `#FAF7F2`).
- ✅ Push notifications, camera, haptics plugins wired.

---

## 1. Accounts & tools you need first

| Requirement | Notes |
|---|---|
| **Apple Developer Program** | $99/year — enroll at [developer.apple.com](https://developer.apple.com/programs/) (1–2 days to approve). |
| **A Mac with Xcode** (latest) | Required to build/archive. No Mac = use a Mac‑in‑cloud service (MacStadium, etc.). |
| **CocoaPods** | `sudo gem install cocoapods` |
| **Node 18+** | For the web build. |
| A **real iPhone** | Push notifications + camera only test on device, not simulator. |

---

## 2. Build the native project

The `ios/` native project is **committed to this repo** (Capacitor 8 + Swift Package Manager).
You do **not** run `npx cap add ios` — open **`ios/App/App.xcodeproj`** (there is no
`App.xcworkspace` with SPM).

After **Export to GitHub** from Lovable and `git clone` locally:

```sh
npm install          # SPM packages resolve from node_modules — this must run first
npm run build
npx cap sync ios     # copies dist/ + regenerates Package.swift
npx cap open ios     # opens ios/App/App.xcodeproj
```

> Re-run `npm run build && npx cap sync ios` every time you pull new web changes.
>
> **"Missing package product 'Capacitor…'"** = Xcode hasn't resolved the Swift packages.
> Run `npm install` → `npx cap sync ios` → in Xcode **File → Packages → Reset Package
> Caches**, then build. Do not delete the committed `ios/` folder.

> ⚠️ **Never run `npm audit fix --force`.** It upgrades Vite 5 → 8 and Vitest 3 → 4
> (incompatible) and breaks `npm run build`. The remaining audit warnings are dev-only
> tooling (`esbuild`/`vite`/`vitest`/`lovable-tagger`), affect only a local dev server,
> are **not** in the shipped app, and are **irrelevant** to App Store review. If you
> already forced an upgrade and the build broke:
> `git checkout -- package.json package-lock.json && rm -rf node_modules && npm install`.

---


## 3. Critical review blockers — fix these BEFORE submitting

These are the top reasons Apple rejects apps like QuickLinq. Handle each one.

### 3.1 In‑app purchases vs. external payments (Guideline 3.1.1) — **most important**
- **Client invoice/quote payments via Stripe** = payment for *real‑world services*. This is **allowed** outside Apple IAP. ✅ Keep as is.
- **Your own QuickLinq subscription** (plan upgrades / trial → paid) sold *inside the iOS app* = Apple **requires** StoreKit In‑App Purchase, OR you must remove purchasing from iOS.
  - **Easiest path to pass:** On iOS, **hide all "Upgrade / Subscribe / Enter card for QuickLinq plan" UI**. Let users sign in and use the account they already paid for on the web. (Detect native with `isNative()` from `src/lib/native/platform.ts` and conditionally hide upgrade CTAs.)
  - Do **not** add a link that sends users to your website to pay — that also gets rejected. Just remove the purchase entry points on iOS.

### 3.2 Sign in with Apple (Guideline 4.8)
You offer **Google** sign‑in. If you keep any third‑party login, Apple generally requires **Sign in with Apple** as an option too. Either:
- Add Sign in with Apple, **or**
- On iOS, show only **email/password** login (hide Google) to sidestep 4.8.

### 3.3 In‑app account deletion (Guideline 5.1.1(v)) — **mandatory**
Any app with account creation must let users **delete their account from inside the app** (not just deactivate). Add a "Delete my account" action in Settings that removes the user + data. This is checked on almost every review.

### 3.4 Permission usage strings (Info.plist)
Add clear purpose strings in Xcode → Info, or your build will crash/reject:
```
NSCameraUsageDescription        = "QuickLinq uses your camera to attach photos to jobs and quotes."
NSPhotoLibraryUsageDescription  = "QuickLinq lets you attach photos from your library to jobs and quotes."
NSPhotoLibraryAddUsageDescription = "QuickLinq saves invoice and quote PDFs to your photos."
```
Push notifications need the **Push Notifications** + **Background Modes → Remote notifications** capabilities added in Xcode → Signing & Capabilities.

### 3.5 Reviewer demo account
Apple's reviewer must reach **all** functionality. In App Store Connect → App Review Information, provide a **working demo login** (email + password) with sample clients/quotes/invoices already populated, plus notes explaining the Stripe payment flow.

---

## 4. Xcode configuration checklist

1. **Signing & Capabilities** → select your Team; bundle ID `app.quicklinq`.
2. Add capabilities: **Push Notifications**, **Background Modes** (Remote notifications), **Sign in with Apple** (if used).
3. **App Icon**: drop a full icon set including **1024×1024** marketing icon (no transparency, no rounded corners — Apple rounds it).
4. **Launch Screen**: use the branded teal splash.
5. **General** → Version `1.0.0`, Build `1`. Deployment target iOS 14+.
6. Confirm the `server` block in `capacitor.config.ts` is **commented out** (it is).
7. Run on Simulator → then a real iPhone.

---

## 5. Create the app in App Store Connect

[appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **Apps → +**:

- **Platform:** iOS
- **Name:** `QuickLinq` (must be unique on the store — have a backup like `QuickLinq — Quotes & Invoices`)
- **Primary language:** English (U.S.)
- **Bundle ID:** `app.quicklinq`
- **SKU:** `quicklinq-ios-001`
- **Primary category:** Business · **Secondary:** Productivity

---

## 6. Branding & store listing copy (ready to paste)

### App Name (30 char max)
```
QuickLinq
```
Backup if taken:
```
QuickLinq: Quotes & Invoices
```

### Subtitle (30 char max)
```
Quotes, Invoices & Payments
```

### Promotional Text (170 char, editable anytime)
```
Send professional quotes, win the job, and get paid faster — all from your phone. Built for service businesses with no per-user fees.
```

### Description (4000 char)
```
QuickLinq is the all-in-one app for service businesses — send quotes, manage jobs, invoice clients, and collect payments from anywhere.

Stop losing jobs to slow paperwork. Create a polished quote in seconds, send it by text or email, and let clients approve and pay with a tap. When the work's done, turn the quote into an invoice and get paid by card — no chasing.

WHY SERVICE PROS CHOOSE QUICKLINQ

• Send Quotes in Seconds — Professional, branded quotes your clients can approve online.
• Win More Jobs — Automatic follow-up reminders keep your quotes top of mind.
• Get Paid Faster — Accept card payments and deposits directly on the invoice.
• Manage the Whole Pipeline — Track every lead, job, and invoice in one place.
• No Per-User Fees — Add your whole crew without your bill climbing.
• Smart Scheduling — Plan jobs and reduce drive time.
• One-Click Reviews — Collect Google reviews automatically after jobs.
• Works on the Go — Built for the field, right from your iPhone.

PERFECT FOR
Contractors, cleaners, landscapers, electricians, plumbers, HVAC, handymen, detailers, and any service business that quotes and invoices clients.

GET STARTED FREE
Create your account, add your branding, and send your first quote today.

Payments are processed securely by Stripe. Card details are never stored on your device.

Questions? Visit https://quicklinq.app
```

### Keywords (100 char, comma‑separated, no spaces)
```
invoice,quote,estimate,contractor,invoicing,billing,payments,jobs,scheduling,small business,crm
```

### Support URL
```
https://quicklinq.app
```
### Marketing URL
```
https://quicklinq.app
```
### Privacy Policy URL (**mandatory**)
```
https://quicklinq.app/privacy
```

### What's New (version notes)
```
First release of QuickLinq — send quotes, manage jobs, invoice clients, and get paid from your phone.
```

---

## 7. Screenshots (required)

Required size: **6.7" iPhone — 1290 × 2796 px** (at least 3, up to 10). One set covers all modern iPhones.

Suggested 5 screens with captions:
1. **Send quotes in seconds** — quote builder screen.
2. **Win the job** — quote approved / pipeline view.
3. **Get paid faster** — invoice with "Pay now".
4. **Manage everything** — dashboard / jobs list.
5. **Collect 5-star reviews** — reviews screen.

Tips: use real-looking sample data, add a short caption bar at top, keep brand teal/cream colors. Tools: Xcode simulator screenshots, or a mockup tool like Screenshot Studio / Figma.

---

## 8. App Privacy ("nutrition label")

In App Store Connect → App Privacy, declare what you collect:

| Data | Used for | Linked to user |
|---|---|---|
| Email, Name | App functionality (account) | Yes |
| Phone (clients) | App functionality | Yes |
| Payment info | Handled by **Stripe (third party)** — you don't store card numbers | Yes |
| Photos | App functionality (job/quote attachments) | Yes |
| Device ID / Push token | Notifications | Yes |
| Usage / diagnostics | Analytics (if enabled) | Optional |

Mark tracking = **No** unless you run cross‑app ad tracking.

---

## 9. Build, archive & upload

In Xcode:
1. Select **Any iOS Device (arm64)** as the target.
2. **Product → Archive**.
3. When the Organizer opens → **Distribute App → App Store Connect → Upload**.
4. Answer **Export Compliance**: QuickLinq uses only standard HTTPS encryption → typically "Yes, uses encryption" → "exempt" (standard encryption). 
5. Wait ~15–30 min for the build to finish processing in App Store Connect.

---

## 10. Submit for review

1. In your app version, attach the processed **Build**.
2. Fill **App Review Information**: demo account login, contact phone/email, and **notes**:
   ```
   QuickLinq is a B2B tool for service businesses. Client invoice/quote payments are
   for real-world services processed via Stripe (Guideline 3.1.1 — physical services,
   IAP not applicable). No QuickLinq subscription is sold inside the iOS app.
   Demo login: reviewer@quicklinq.app / <password>. Sample quotes and invoices are
   pre-loaded. Tap a quote → Send/Approve; tap an invoice → Pay (use Stripe test card
   4242 4242 4242 4242, any future date, any CVC).
   ```
3. Set pricing (Free) and availability (all territories or pick).
4. **Add for Review → Submit**.

Review usually takes **24–48 hours**. If rejected, Apple cites the exact guideline in Resolution Center — fix and resubmit (no need to re‑archive unless code changed).

---

## 11. Pre‑submit final checklist

- [ ] iOS subscription/upgrade purchase UI hidden on native (3.1.1)
- [ ] Sign in with Apple added, OR Google hidden on iOS (4.8)
- [ ] In‑app **account deletion** works (5.1.1)
- [ ] Info.plist permission strings present (camera/photos)
- [ ] Push + Background Modes capabilities enabled
- [ ] 1024×1024 icon + 6.7" screenshots uploaded
- [ ] Privacy Policy URL live and accurate
- [ ] App Privacy questionnaire completed
- [ ] Demo reviewer account + notes provided
- [ ] `server` block commented out in capacitor.config.ts
- [ ] Version 1.0.0 / Build 1, tested on a real iPhone

Ship it 🚀
```
git pull → npm install → npm run build → npx cap sync ios → Archive
```
