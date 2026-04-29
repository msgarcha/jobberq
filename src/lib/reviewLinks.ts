// Branded base URL for client-facing review links.
// Always uses the QuickLinq custom domain — never the lovable preview URL.
export const PUBLIC_REVIEW_BASE = "https://quicklinq.ca";

export function buildReviewUrl(shortToken: string | null | undefined, fallbackToken?: string | null): string {
  const t = shortToken || fallbackToken || "";
  // /r/ is the short branded path; /review/ remains supported for legacy links
  return `${PUBLIC_REVIEW_BASE}/r/${t}`;
}
