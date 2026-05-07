// Per-user AI rate limiting helper.
// Uses a service-role client to atomically increment counters via RPC.
// Note: This is an ad-hoc table-based limiter (no native primitive yet) — simple but effective.

export type Tier = "trial" | "paid" | "super_admin";

interface Caps {
  perMinute: number;
  perDay: number;
}

const CAPS: Record<Tier, Caps> = {
  trial: { perMinute: 5, perDay: 50 },
  paid: { perMinute: 30, perDay: 500 },
  super_admin: { perMinute: 1_000_000, perDay: 1_000_000 },
};

export interface QuotaResult {
  ok: boolean;
  reason?: "minute" | "day";
  retryAfterSec?: number;
  remaining?: { minute: number; day: number };
}

/**
 * Resolve the user's tier:
 *  - super_admin if profiles.is_super_admin
 *  - trial if trial_ends_at is still in the future
 *  - else paid (they retained access past trial)
 */
export async function resolveTier(adminClient: any, userId: string): Promise<Tier> {
  const { data: prof } = await adminClient
    .from("profiles")
    .select("is_super_admin, trial_ends_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (prof?.is_super_admin) return "super_admin";
  if (prof?.trial_ends_at && new Date(prof.trial_ends_at).getTime() > Date.now()) {
    return "trial";
  }
  return "paid";
}

/**
 * Atomically increment per-minute and per-day counters for (userId, fnName)
 * and reject if either cap is exceeded.
 */
export async function enforceAiQuota(
  adminClient: any,
  userId: string,
  fnName: string,
  tier: Tier,
): Promise<QuotaResult> {
  if (tier === "super_admin") return { ok: true };

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
  const isMinute = result.reason === "minute";
  const message = isMinute
    ? "Too many AI requests right now — please wait a minute and try again."
    : "You've hit your daily AI limit. Upgrade to keep using Linq, or try again tomorrow.";
  return new Response(
    JSON.stringify({
      error: message,
      reason: result.reason,
      retry_after: result.retryAfterSec,
      upgrade_required: result.reason === "day",
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfterSec ?? 60),
      },
    },
  );
}
