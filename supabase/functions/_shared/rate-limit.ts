// Per-user AI rate limiting helper.
// Uses a service-role client to atomically increment counters via RPC.
// Note: This is an ad-hoc table-based limiter (no native primitive yet) — simple but effective.

export type Tier = "trial" | "paid" | "expired" | "revoked" | "super_admin";

interface Caps {
  perMinute: number;
  perDay: number;
}

const CAPS: Record<Exclude<Tier, "expired" | "revoked" | "super_admin">, Caps> = {
  trial: { perMinute: 5, perDay: 50 },
  paid: { perMinute: 30, perDay: 500 },
};

export interface QuotaResult {
  ok: boolean;
  reason?: "minute" | "day" | "expired" | "revoked";
  retryAfterSec?: number;
  remaining?: { minute: number; day: number };
}

/**
 * Resolve the user's tier:
 *  - revoked   if profiles.access_revoked
 *  - super_admin if profiles.is_super_admin
 *  - paid      if they have an active Stripe subscription (caller passes hasActiveSub)
 *  - trial     if trial_ends_at is still in the future
 *  - expired   trial ended, no subscription
 */
export async function resolveTier(
  adminClient: any,
  userId: string,
  hasActiveSub = false,
): Promise<Tier> {
  const { data: prof } = await adminClient
    .from("profiles")
    .select("is_super_admin, trial_ends_at, access_revoked")
    .eq("user_id", userId)
    .maybeSingle();
  if (prof?.access_revoked) return "revoked";
  if (prof?.is_super_admin) return "super_admin";
  if (hasActiveSub) return "paid";
  if (prof?.trial_ends_at && new Date(prof.trial_ends_at).getTime() > Date.now()) {
    return "trial";
  }
  return "expired";
}

/**
 * Atomically increment per-minute and per-day counters for (userId, fnName)
 * and reject if either cap is exceeded. Also rejects revoked / expired-trial users.
 */
export async function enforceAiQuota(
  adminClient: any,
  userId: string,
  fnName: string,
  tier: Tier,
): Promise<QuotaResult> {
  if (tier === "super_admin") return { ok: true };
  if (tier === "revoked") return { ok: false, reason: "revoked" };
  if (tier === "expired") return { ok: false, reason: "expired" };

  const caps = CAPS[tier];
  const now = new Date();
  const minuteWindow = new Date(Math.floor(now.getTime() / 60_000) * 60_000).toISOString();
  const dayWindow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();

  // Increment minute counter
  const { data: minCount, error: minErr } = await adminClient.rpc("increment_ai_usage", {
    _user_id: userId,
    _function_name: fnName,
    _window_kind: "minute",
    _window_start: minuteWindow,
  });
  if (minErr) {
    console.error("rate-limit minute rpc error:", minErr);
    return { ok: true }; // fail-open on infra error
  }

  if ((minCount as number) > caps.perMinute) {
    const secsLeft = 60 - Math.floor((now.getTime() % 60_000) / 1000);
    return { ok: false, reason: "minute", retryAfterSec: Math.max(secsLeft, 1) };
  }

  // Increment day counter
  const { data: dayCount, error: dayErr } = await adminClient.rpc("increment_ai_usage", {
    _user_id: userId,
    _function_name: fnName,
    _window_kind: "day",
    _window_start: dayWindow,
  });
  if (dayErr) {
    console.error("rate-limit day rpc error:", dayErr);
    return { ok: true };
  }

  if ((dayCount as number) > caps.perDay) {
    // Seconds until next UTC midnight
    const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const secsLeft = Math.max(Math.floor((tomorrow.getTime() - now.getTime()) / 1000), 1);
    return { ok: false, reason: "day", retryAfterSec: secsLeft };
  }

  return {
    ok: true,
    remaining: {
      minute: Math.max(caps.perMinute - (minCount as number), 0),
      day: Math.max(caps.perDay - (dayCount as number), 0),
    },
  };
}

export function quotaResponse(result: QuotaResult, corsHeaders: Record<string, string>) {
  let message: string;
  let status = 429;
  let upgrade_required = false;
  switch (result.reason) {
    case "minute":
      message = "Too many AI requests right now — please wait a minute and try again.";
      break;
    case "day":
      message = "You've hit your daily AI limit. Upgrade to keep using Linq, or try again tomorrow.";
      upgrade_required = true;
      break;
    case "expired":
      message = "Your free trial has ended. Upgrade to continue using Linq.";
      upgrade_required = true;
      status = 402;
      break;
    case "revoked":
      message = "Your account access has been revoked. Please contact support.";
      status = 403;
      break;
    default:
      message = "AI request blocked.";
  }
  return new Response(
    JSON.stringify({
      error: message,
      reason: result.reason,
      retry_after: result.retryAfterSec,
      upgrade_required,
    }),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        ...(result.retryAfterSec ? { "Retry-After": String(result.retryAfterSec) } : {}),
      },
    },
  );
}
