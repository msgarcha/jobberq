// Hostname-based routing helpers for the secure.quicklinq.app split.
//
// Production marketing site lives on quicklinq.app / www.quicklinq.app / quicklinq.ca.
// The authenticated app lives on secure.quicklinq.app.
//
// Preview hosts (*.lovable.app), Capacitor (capacitor://, file://) and localhost
// are explicitly excluded so dev / preview / native shells keep working unchanged.

export const PROD_APP_HOST = 'secure.quicklinq.app';
export const PROD_MARKETING_HOSTS = [
  'quicklinq.app',
  'www.quicklinq.app',
  'quicklinq.ca',
  'www.quicklinq.ca',
] as const;

function currentHost(): string {
  if (typeof window === 'undefined') return '';
  return window.location.hostname;
}

function currentProtocol(): string {
  if (typeof window === 'undefined') return 'https:';
  // capacitor:// / file:// → treat as native, don't redirect
  const p = window.location.protocol;
  return p === 'http:' || p === 'https:' ? p : 'https:';
}

/** True when running on one of the production marketing hostnames. */
export function isProdMarketingHost(): boolean {
  return (PROD_MARKETING_HOSTS as readonly string[]).includes(currentHost());
}

/** True when running on the production authenticated-app hostname. */
export function isProdAppHost(): boolean {
  return currentHost() === PROD_APP_HOST;
}

/** True when we're on any production quicklinq host (marketing or app). */
export function isProdHost(): boolean {
  return isProdMarketingHost() || isProdAppHost();
}

/** Origin (scheme + host) for the authenticated app on production. */
export function getAppOrigin(): string {
  return `${currentProtocol()}//${PROD_APP_HOST}`;
}

/** Origin (scheme + host) for the marketing site on production. */
export function getMarketingOrigin(): string {
  return `${currentProtocol()}//${PROD_MARKETING_HOSTS[0]}`;
}

/**
 * Returns the origin that auth flows (signup confirmation, password reset)
 * should send the user back to. On prod marketing or prod app hosts that's
 * always the secure subdomain. Everywhere else (preview, localhost, native)
 * we use the current origin so dev/preview keep working.
 */
export function getAuthRedirectOrigin(): string {
  if (typeof window === 'undefined') return '';
  if (isProdHost()) return getAppOrigin();
  return window.location.origin;
}
