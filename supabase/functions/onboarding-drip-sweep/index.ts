// Onboarding email drip sweep — runs hourly via pg_cron.
// Sends Day 2 and Day 7 emails to users who haven't received them yet.
// Skips users who already created quotes (Day 2) or connected Stripe (Day 7).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface DripStep {
  kind: string;
  template: string;
  minAgeHours: number;
  maxAgeHours: number;
  shouldSkip?: (admin: any, userId: string, teamId: string | null) => Promise<boolean>;
}

const STEPS: DripStep[] = [
  {
    kind: "day-2",
    template: "onboarding-day-2",
    minAgeHours: 36,
    maxAgeHours: 96,
    shouldSkip: async (admin, _userId, teamId) => {
      if (!teamId) return false;
      const { count } = await admin
        .from("quotes")
        .select("id", { count: "exact", head: true })
        .eq("team_id", teamId);
      return (count || 0) > 0;
    },
  },
  {
    kind: "day-7",
    template: "onboarding-day-7",
    minAgeHours: 156,
    maxAgeHours: 240,
    shouldSkip: async (admin, _userId, teamId) => {
      if (!teamId) return false;
      const { count } = await admin
        .from("connected_accounts")
        .select("id", { count: "exact", head: true })
        .eq("team_id", teamId);
      return (count || 0) > 0;
    },
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Cron-only endpoint — require the service-role key in the Authorization header.
  // Constant-time comparison prevents timing attacks.
  {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const expected = SUPABASE_SERVICE_ROLE_KEY;
    let ok = token.length > 0 && token.length === expected.length;
    if (ok) {
      let diff = 0;
      for (let i = 0; i < expected.length; i++) diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
      ok = diff === 0;
    }
    if (!ok) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  try {
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const now = Date.now();

    const stats: Record<string, { sent: number; skipped: number; errors: number }> = {};

    for (const step of STEPS) {
      stats[step.kind] = { sent: 0, skipped: 0, errors: 0 };
      const minDate = new Date(now - step.maxAgeHours * 3600_000).toISOString();
      const maxDate = new Date(now - step.minAgeHours * 3600_000).toISOString();

      // Find candidates: profiles created in the window, no log entry yet
      const { data: profiles } = await admin
        .from("profiles")
        .select("user_id, display_name, created_at")
        .gte("created_at", minDate)
        .lte("created_at", maxDate)
        .limit(200);

      if (!profiles?.length) continue;

      for (const p of profiles) {
        // Already sent?
        const { data: existing } = await admin
          .from("onboarding_email_log")
          .select("id")
          .eq("user_id", p.user_id)
          .eq("email_kind", step.kind)
          .maybeSingle();
        if (existing) {
          stats[step.kind].skipped++;
          continue;
        }

        // Get user email + team
        const { data: { user } } = await admin.auth.admin.getUserById(p.user_id);
        const email = user?.email;
        if (!email) {
          stats[step.kind].skipped++;
          continue;
        }

        const { data: tm } = await admin
          .from("team_members")
          .select("team_id")
          .eq("user_id", p.user_id)
          .maybeSingle();
        const teamId = tm?.team_id || null;

        // Skip rule (e.g. already created a quote)
        if (step.shouldSkip && (await step.shouldSkip(admin, p.user_id, teamId))) {
          // Log as skipped so we never re-evaluate
          await admin.from("onboarding_email_log").insert({
            user_id: p.user_id,
            email_kind: step.kind,
          });
          stats[step.kind].skipped++;
          continue;
        }

        // Suppression check
        const { data: suppressed } = await admin
          .from("suppressed_emails")
          .select("id")
          .eq("email", email.toLowerCase())
          .maybeSingle();
        if (suppressed) {
          await admin.from("onboarding_email_log").insert({
            user_id: p.user_id,
            email_kind: step.kind,
          });
          stats[step.kind].skipped++;
          continue;
        }

        const firstName = (p.display_name || "").split(" ")[0] || "";

        // Send via send-transactional-email (use service-role JWT)
        const sendResp = await fetch(
          `${SUPABASE_URL}/functions/v1/send-transactional-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              apikey: SUPABASE_SERVICE_ROLE_KEY,
            },
            body: JSON.stringify({
              templateName: step.template,
              recipientEmail: email,
              templateData: { firstName },
              idempotencyKey: `onboarding-${step.kind}-${p.user_id}`,
            }),
          },
        );

        if (sendResp.ok) {
          await admin.from("onboarding_email_log").insert({
            user_id: p.user_id,
            email_kind: step.kind,
          });
          stats[step.kind].sent++;
        } else {
          console.error(`Failed to send ${step.kind} to ${email}:`, await sendResp.text());
          stats[step.kind].errors++;
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, stats }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("onboarding-drip-sweep error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
