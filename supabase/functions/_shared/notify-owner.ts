// Shared helper for sending owner notifications (in-app row + email).
// Used by edge functions when a client viewed/approved/paid a document.
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.57.2";

export type NotifyEvent =
  | "quote_viewed"
  | "quote_approved"
  | "invoice_viewed"
  | "deposit_paid"
  | "invoice_paid";

const PREF_COLUMN: Record<NotifyEvent, string> = {
  quote_viewed: "notify_on_quote_viewed",
  quote_approved: "notify_on_quote_approved",
  invoice_viewed: "notify_on_invoice_viewed",
  deposit_paid: "notify_on_deposit_paid",
  invoice_paid: "notify_on_invoice_paid",
};

const TEMPLATE_FOR: Record<NotifyEvent, string> = {
  quote_viewed: "quote-viewed",
  quote_approved: "quote-approved",
  invoice_viewed: "invoice-viewed",
  deposit_paid: "payment-received",
  invoice_paid: "payment-received",
};

export interface NotifyArgs {
  teamId: string;
  event: NotifyEvent;
  title: string;
  body?: string;
  link?: string;
  entityType?: string;
  entityId?: string;
  templateData?: Record<string, any>;
  // Stable per-event id used for email idempotency
  idempotencySuffix?: string;
}

function getAdmin(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

/**
 * Notify the team/business owner about a client action.
 * Best-effort: never throws — errors are logged so the calling flow keeps working.
 */
export async function notifyOwner(args: NotifyArgs): Promise<void> {
  const { teamId, event, title, body, link, entityType, entityId, templateData } = args;
  try {
    const admin = getAdmin();

    // 1. Load preferences
    const { data: settings } = await admin
      .from("company_settings")
      .select(`${PREF_COLUMN[event]}, notification_email`)
      .eq("team_id", teamId)
      .maybeSingle();

    // Default to ON if no settings row found
    const enabled = settings ? (settings as any)[PREF_COLUMN[event]] !== false : true;
    if (!enabled) {
      console.log(`[notifyOwner] ${event} disabled for team ${teamId}`);
      return;
    }

    // 2. Always insert the in-app notification row (RLS-bypassed via service role)
    await admin.from("notifications").insert({
      team_id: teamId,
      type: event,
      title,
      body: body ?? null,
      link: link ?? null,
      entity_type: entityType ?? null,
      entity_id: entityId ?? null,
    });

    // 3. Resolve recipient email
    let recipient = (settings as any)?.notification_email as string | null | undefined;
    if (!recipient) {
      const { data: team } = await admin
        .from("teams")
        .select("owner_id")
        .eq("id", teamId)
        .maybeSingle();
      if (team?.owner_id) {
        const { data: u } = await admin.auth.admin.getUserById(team.owner_id);
        recipient = u?.user?.email ?? null;
      }
    }
    if (!recipient) {
      console.warn(`[notifyOwner] no recipient email for team ${teamId}`);
      return;
    }

    // 4. Send transactional email
    const idemSuffix = args.idempotencySuffix ?? entityId ?? crypto.randomUUID();
    const { error: invokeErr } = await admin.functions.invoke("send-transactional-email", {
      body: {
        templateName: TEMPLATE_FOR[event],
        recipientEmail: recipient,
        idempotencyKey: `notify-${event}-${idemSuffix}`,
        templateData: templateData ?? {},
      },
    });
    if (invokeErr) {
      console.error(`[notifyOwner] email invoke error for ${event}:`, invokeErr);
    }
  } catch (err) {
    console.error(`[notifyOwner] unexpected error for ${event}:`, err);
  }
}

export function formatCurrency(amount: number | string | null | undefined, currency = "CAD"): string {
  const n = Number(amount ?? 0);
  if (!Number.isFinite(n)) return "";
  try {
    return new Intl.NumberFormat("en-CA", { style: "currency", currency }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

export function clientDisplayName(c: { first_name?: string | null; last_name?: string | null; company_name?: string | null } | null | undefined): string {
  if (!c) return "Your client";
  if (c.company_name) return c.company_name;
  const name = `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim();
  return name || "Your client";
}

const APP_BASE = "https://app.quicklinq.ca";
export const appUrl = (path: string) => `${APP_BASE}${path.startsWith("/") ? path : `/${path}`}`;
