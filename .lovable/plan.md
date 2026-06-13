# Fix the broken local install + silence the harmless audit noise

## What actually happened

Two different things — only one needs fixing in code.

### 1. The "14 vulnerabilities" are harmless dev-only tooling (no action needed for security)
Every one of the high/moderate advisories (`minimatch`, `tar`, `replace`, `xcode`, `uuid`) comes from a single chain:

```text
@capacitor/assets  →  @trapezedev/project  →  replace/minimatch, tar, xcode/uuid
```

`@capacitor/assets` is a **devDependency** used only on your machine / in CI to turn `assets/icon.png` + `assets/splash.png` into the native icon set. It is **never bundled into the iOS app**, never runs at runtime, and Apple does not scan npm devDependencies. These advisories have "No fix available" because the maintainers haven't updated them yet — they are not a risk to your app or your App Store review.

**Do not run `npm audit fix --force` again** — that is what broke your install.

### 2. `npm audit fix --force` broke your local dependencies (this is the real problem)
It upgraded, against this project's requirements:
- `vite` 5 → **8** (Lovable requires vite 5)
- `vitest` 3 → **4**
- `lovable-tagger` 1.1.13 → **1.0.20**

These majors are incompatible and will break the web build (and therefore the Capacitor iOS build). The Lovable project itself is still correct (vite `^5.4.19`, vitest `^3.2.4`, lovable-tagger `^1.1.13`) — only your local copy is mutated.

## The fix (in the Lovable project)

To keep your `npm audit` permanently clean and remove the temptation to "fix" it, stop tracking `@capacitor/assets` as a dependency and instead run it on demand via `npx` (it still works exactly the same, just isn't part of your lockfile/audit):

- **`package.json`** — remove the `"@capacitor/assets": "^3.0.5"` devDependency line.
- **`ci_scripts/ci_post_clone.sh`** — change the generation step to fetch the tool on demand:
  ```sh
  echo "▸ Generating app icons + splash from assets/"
  npx --yes @capacitor/assets generate --ios
  ```

After this, a fresh `npm install` + `npm audit` on the project will no longer list those 8 vulnerabilities, because the vulnerable tree is no longer a project dependency — yet icons/splash still generate during the build.

## What you do on your Mac (recovery steps)

Your local repo currently has the broken vite 8 install. Reset it back to the project's correct versions:

```bash
cd jobberq
git pull                       # pulls the package.json fix above
git checkout -- package.json package-lock.json   # discard any local audit-fix edits if pull complains
rm -rf node_modules package-lock.json
npm install                    # clean install at vite 5 / vitest 3
```

Then build the app as usual — **do not run `npm audit fix`**:

```bash
npx cap sync ios
npx --yes @capacitor/assets generate --ios
```

Open Xcode, bump the build number, and archive.

## Files changed
- `package.json` — remove `@capacitor/assets` devDependency
- `ci_scripts/ci_post_clone.sh` — generate icons/splash via `npx --yes @capacitor/assets`
