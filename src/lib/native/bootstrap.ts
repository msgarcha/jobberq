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
 *   stay anchored, and we disable the buggy native scroll-assist (which used to
 *   shove the focused field above the sticky header / under the status bar) and
 *   instead scroll the focused field to the centre of the scroll area ourselves.
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

    // Disable WebKit's automatic "scroll-assist". That native behaviour is what
    // pushes the focused input above the sticky header (and under the status
    // bar). We handle bringing the field into view ourselves below.
    try {
      await Keyboard.setScroll({ isDisabled: true });
    } catch {
      /* setScroll is iOS-only; ignore where unavailable */
    }

    // Expose the live keyboard height as a CSS variable so layouts can react.
    Keyboard.addListener('keyboardWillShow', (info) => {
      document.documentElement.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
      document.documentElement.classList.add('keyboard-open');
    });
    Keyboard.addListener('keyboardDidShow', () => {
      scrollActiveFieldIntoView();
    });
    Keyboard.addListener('keyboardWillHide', () => {
      document.documentElement.style.setProperty('--keyboard-height', '0px');
      document.documentElement.classList.remove('keyboard-open');
    });
  } catch (err) {
    console.warn('Keyboard init failed', err);
  }

  // Belt-and-braces: also react to focus directly (covers cases where the
  // keyboard is already open and the user moves between fields).
  document.addEventListener('focusin', (e) => {
    const t = e.target as HTMLElement | null;
    if (!t) return;
    if (t.matches('input, textarea, select, [contenteditable="true"]')) {
      // Wait for the keyboard animation / webview resize to settle.
      window.setTimeout(() => scrollFieldIntoView(t), 350);
    }
  });

  try {
    await SplashScreen.hide();
  } catch (err) {
    console.warn('SplashScreen hide failed', err);
  }
}

function scrollActiveFieldIntoView() {
  const el = document.activeElement as HTMLElement | null;
  if (el && el.matches('input, textarea, select, [contenteditable="true"]')) {
    scrollFieldIntoView(el);
  }
}

function scrollFieldIntoView(el: HTMLElement) {
  try {
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  } catch {
    el.scrollIntoView();
  }
}
