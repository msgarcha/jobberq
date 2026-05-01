import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

// Sweeps recently-paid invoices and queues review suggestions for the team's
// dashboard inbox. Idempotent: skips invoices that already have a suggestion
// or an existing review_request.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Look back 30 days for paid invoices.
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: paidInvoices, error: invErr } = await supabase
      .from("invoices")
      .select("id, team_id, client_id, paid_at")
      .eq("status", "paid")
      .gte("paid_at", since)
      .not("client_id", "is", null)
      .limit(500);

    if (invErr) throw invErr;

    let queued = 0;
    let skipped = 0;

    for (const inv of paidInvoices ?? []) {
      // Already suggested?
      const { count: sCount } = await supabase
        .from("review_suggestions")
        .select("id", { count: "exact", head: true })
        .eq("invoice_id", inv.id);
      if ((sCount ?? 0) > 0) { skipped++; continue; }

      // Already has a review request sent?
      const { count: rCount } = await supabase
        .from("review_requests")
        .select("id", { count: "exact", head: true })
        .eq("client_id", inv.client_id);
      if ((rCount ?? 0) > 0) { skipped++; continue; }

      const { error: insErr } = await supabase.from("review_suggestions").insert({
        team_id: inv.team_id,
        client_id: inv.client_id,
        invoice_id: inv.id,
        status: "pending",
      });
      if (!insErr) queued++;
    }

    return new Response(
      JSON.stringify({ ok: true, scanned: paidInvoices?.length ?? 0, queued, skipped }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
