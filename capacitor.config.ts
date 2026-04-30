import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor configuration for QuickLinq iOS/Android.
 *
 * Production / App Store mode: web assets are bundled (no `server.url`).
 *
 * To switch to LIVE-RELOAD from the Lovable sandbox during development,
 * temporarily uncomment the `server` block below, then run `npx cap sync`.
 * Remember to remove it again before archiving for the App Store.
 */
const config: CapacitorConfig = {
  appId: 'app.quicklinq.ios',
  appName: 'QuickLinq',
  webDir: 'dist',

  // server: {
  //   url: 'https://9d83c575-7797-4208-8ec1-a10d7acf104d.lovableproject.com?forceHideBadge=true',
  //   cleartext: true,
  // },

  ios: {
    contentInset: 'always',
    backgroundColor: '#FAF7F2', // brand cream
  },
  android: {
    backgroundColor: '#FAF7F2',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#1a3d44', // brand dark teal
      showSpinner: false,
      androidSplashResourceName: 'splash',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1a3d44',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
