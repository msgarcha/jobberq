import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { isNative } from './platform';

/**
 * Initializes native chrome so the app feels like a real native app instead of
 * a webpage. No-ops on web (browser preview / PWA are unaffected).
 *
 * - Status bar overlays the web view so content draws edge-to-edge and CSS
 *   `env(safe-area-inset-*)` values resolve correctly (no double safe-area gap).
 * - Status bar uses dark icons/text, which are legible on the light cream top bar.
 * - The splash screen is hidden once the web layer is ready.
 */
export async function initNative() {
  if (!isNative()) return;

  try {
    // Draw under the status bar; the TopBar's `safe-area-top` padding handles spacing.
    await StatusBar.setOverlaysWebView({ overlay: true });
    // Style.Light => dark status bar content (legible on the light top bar).
    await StatusBar.setStyle({ style: Style.Light });
  } catch (err) {
    console.warn('StatusBar init failed', err);
  }

  try {
    await SplashScreen.hide();
  } catch (err) {
    console.warn('SplashScreen hide failed', err);
  }
}
