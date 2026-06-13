import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { isNative } from './platform';

/**
 * Initializes native chrome so the app feels like a real native app instead of
 * a webpage. No-ops on web (browser preview / PWA are unaffected).
 *
 * - Status bar overlays the web view so content draws edge-to-edge and CSS
 *   `env(safe-area-inset-*)` values resolve correctly (no double safe-area gap).
 * - Status bar uses dark icons/text, which are legible on the light cream top bar.
 * - The keyboard shrinks the web view (resize: native) so fixed headers/footers
 *   stay anchored instead of the page scrolling up under the status bar.
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
    // Resize the web view (not scroll the page) when the keyboard appears so the
    // fixed top bar and the Linq assistant sheet stay where they belong.
    await Keyboard.setResizeMode({ mode: KeyboardResize.Native });
    await Keyboard.setAccessoryBarVisible({ isVisible: true });

    // Expose the live keyboard height as a CSS variable so layouts can react.
    Keyboard.addListener('keyboardWillShow', (info) => {
      document.documentElement.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
      document.documentElement.classList.add('keyboard-open');
    });
    Keyboard.addListener('keyboardWillHide', () => {
      document.documentElement.style.setProperty('--keyboard-height', '0px');
      document.documentElement.classList.remove('keyboard-open');
    });
  } catch (err) {
    console.warn('Keyboard init failed', err);
  }

  try {
    await SplashScreen.hide();
  } catch (err) {
    console.warn('SplashScreen hide failed', err);
  }
}
