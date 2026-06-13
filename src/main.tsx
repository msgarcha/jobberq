import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { initNative } from "./lib/native/bootstrap";

const SPLASH_MIN_MS = 1000;
const splashStart = Date.now();

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);

// Initialize native chrome (status bar overlay, keyboard, splash hide). No-op on web.
initNative();

/**
 * Fade out the branded loading splash once React has mounted, keeping it visible
 * for a minimum of SPLASH_MIN_MS so the hand-off from the native splash feels
 * smooth and the user always sees branding while initial data loads.
 */
function hideAppSplash() {
  const splash = document.getElementById("app-splash");
  if (!splash) return;
  const elapsed = Date.now() - splashStart;
  const wait = Math.max(0, SPLASH_MIN_MS - elapsed);
  window.setTimeout(() => {
    splash.classList.add("app-splash--hide");
    window.setTimeout(() => splash.remove(), 450);
  }, wait);
}

// Wait for the first paint of the React tree before starting the fade.
requestAnimationFrame(() => requestAnimationFrame(hideAppSplash));
