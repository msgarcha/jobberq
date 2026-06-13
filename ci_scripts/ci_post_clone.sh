#!/bin/sh

# Xcode Cloud post-clone script for QuickLinq (Capacitor iOS).
#
# Xcode Cloud checks out a clean copy of the repo and then builds the iOS
# project at ios/App/App.xcodeproj. That native project loads bundled web
# assets from dist/, so we must install dependencies, build the web app, and
# sync Capacitor BEFORE Xcode archives the app.
#
# Xcode Cloud runs this script automatically after cloning, from the
# ci_scripts/ directory — so we move up to the repo root first.

set -e

echo "▸ Moving to repository root"
cd "$(dirname "$0")/.."

echo "▸ Installing Node.js (via Homebrew if missing)"
if ! command -v node >/dev/null 2>&1; then
  brew install node
fi
node --version
npm --version

echo "▸ Installing npm dependencies"
npm ci

echo "▸ Building the web app (dist/)"
npm run build

echo "▸ Syncing Capacitor iOS (copies dist/ + runs pod install)"
npx cap sync ios

echo "▸ Generating app icons + splash from assets/"
npx capacitor-assets generate --ios

echo "✓ ci_post_clone complete"
