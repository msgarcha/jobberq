import { Capacitor } from '@capacitor/core';

export const isNative = () => Capacitor.isNativePlatform();
export const getPlatform = (): 'ios' | 'android' | 'web' => {
  const p = Capacitor.getPlatform();
  if (p === 'ios' || p === 'android') return p;
  return 'web';
};

/**
 * The public, client-facing web origin. On the web this is the current origin;
 * inside the native app `window.location.origin` is `capacitor://localhost`,
 * which is not reachable by clients — so we fall back to the production URL.
 *
 * Use this for any shareable/public link (quote view, invoice pay, pricing forms).
 */
export const PUBLIC_APP_URL = 'https://quicklinq.app';

export function getPublicAppUrl(): string {
  if (isNative()) return PUBLIC_APP_URL;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return PUBLIC_APP_URL;
}
