# Welcome to your Lovable project

## Building QuickLinq for iOS (App Store)

This project is wrapped with [Capacitor](https://capacitorjs.com) so the same web app can ship as a native iOS binary.

### Requirements (Mac only)
- macOS with the latest **Xcode** installed
- **Apple Developer Program** membership ($99/year)
- Node.js 18+

> The native iOS project lives in `ios/` and is **committed to this repo**. You do NOT
> run `npx cap add ios` — it already exists. Capacitor 8 uses **Swift Package Manager**
> (no CocoaPods/`App.xcworkspace`); always open **`ios/App/App.xcodeproj`**.

### One-time setup
After exporting this project to your own GitHub repo and `git pull`-ing it locally:

```sh
npm install            # restores node_modules (the SPM packages point here)
npm run build          # produces dist/
npx cap sync ios       # copies dist/ + regenerates ios/App/CapApp-SPM/Package.swift
npx cap open ios       # opens ios/App/App.xcodeproj in Xcode
```

This opens the project in Xcode. In Xcode:

1. **Signing & Capabilities** → select your Apple Developer Team
2. Bundle identifier is preset to `app.quicklinq`
3. Click **+ Capability** and add:
   - **Push Notifications**
   - **Background Modes** → check *Remote notifications*
4. Drop in your App Icon set (1024×1024 marketing icon required) and Launch Screen
5. Set Version `1.0.0`, Build `1`
6. Run on a Simulator first, then on a real iPhone (push notifications only work on a real device)

> **"Missing package product 'CapacitorCamera'…"?** That means Xcode couldn't resolve the
> Swift packages. Fix order: (1) run `npm install` so `node_modules` exists, (2) run
> `npx cap sync ios`, (3) in Xcode **File → Packages → Reset Package Caches**, then build.
> Never delete the committed `ios/` folder to "fix" it — that's what caused the drift.

### Updating after code changes
Whenever you pull new web changes from Lovable:

```sh
git pull
npm install
npm run build
npx cap sync ios
```

Then re-archive in Xcode and upload to App Store Connect.

### ⚠️ Dependency & `npm audit` policy — READ THIS

**Do NOT run `npm audit fix --force` on this project. It will break your build.**

This project is intentionally pinned to **Vite 5** and **Vitest 3** (see `package.json`).
`npm audit fix --force` upgrades them to **Vite 8 / Vitest 4**, which are incompatible
with the toolchain and cause `npm run build` to fail.

The audit warnings that remain are all in **dev-only build tooling**
(`esbuild`, `vite`, `vitest`, `lovable-tagger`). Read the advisories: they only affect a
**local development server**. They are:

- never installed or run in production,
- **not** part of the shipped iOS app (it bundles the static `dist/` output only),
- **irrelevant** to Apple — App Store review does not run `npm audit`.

There is no Vite-5-compatible patched `esbuild`, so a "0 vulnerabilities" result is not
achievable without breaking the build. These warnings are expected and safe to ignore.

**To inspect (read-only):**
```sh
npm audit          # informational only — never use --fix --force
```

**If you already ran `npm audit fix --force` and the build broke**, restore the pinned
versions:
```sh
git checkout -- package.json package-lock.json
rm -rf node_modules
npm install
npm run build
```


### Submitting to the App Store
1. Create the app record at [appstoreconnect.apple.com](https://appstoreconnect.apple.com) with bundle ID `app.quicklinq`
2. Fill in description, keywords, support URL, **Privacy Policy URL** (mandatory), category Business
3. Add screenshots (6.7" iPhone, 1290×2796, required)
4. Complete the **App Privacy** questionnaire — declare:
   - Email/name (auth), Payment info (handled by Stripe — third party), Photos (camera), Device ID (push token)
5. In Xcode: **Product → Archive → Distribute App → App Store Connect → Upload**
6. Back in App Store Connect: attach the build, answer Export Compliance, submit for review

### Dev mode (live reload from Lovable)
Edit `capacitor.config.ts` and uncomment the `server` block to point the iOS app at the Lovable sandbox URL. Run `npx cap sync ios` again. **Comment it back out before archiving for the App Store** — Apple requires bundled assets.

---



## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
