import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Get all recurring invoices that are sent/paid (templates)
    const { data: recurring, error: fetchErr } = await supabase
      .from("invoices")
      .select("*")
      .eq("is_recurring", true)
      .not("recurring_frequency", "is", null)
      .not("recurring_start", "is", null);

    if (fetchErr) throw fetchErr;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let created = 0;

    for (const inv of recurring || []) {
      // Check if recurring_end has passed
      if (inv.recurring_end && new Date(inv.recurring_end) < today) continue;

      // Calculate next billing date based on frequency
      const lastCreated = new Date(inv.created_at);
      const freq = inv.recurring_frequency;
      let nextDate = new Date(inv.recurring_start);

      // Find next occurrence after last created
      while (nextDate <= lastCreated) {
        switch (freq) {
          case "weekly": nextDate.setDate(nextDate.getDate() + 7); break;
          case "biweekly": nextDate.setDate(nextDate.getDate() + 14); break;
          case "monthly": nextDate.setMonth(nextDate.getMonth() + 1); break;
          case "quarterly": nextDate.setMonth(nextDate.getMonth() + 3); break;
          case "yearly": nextDate.setFullYear(nextDate.getFullYear() + 1); break;
        }
      }

      if (nextDate > today) continue;

      // Get next invoice number
      const { data: settings } = await supabase
        .from("company_settings")
        .select("id, invoice_prefix, next_invoice_number")
        .eq("user_id", inv.user_id)
        .maybeSingle();

      const prefix = settings?.invoice_prefix || "INV-";
      const num = settings?.next_invoice_number || 1001;
      const newNumber = `${prefix}${num}`;

      // Create new invoice
      const { data: newInvoice, error: insErr } = await supabase
        .from("invoices")
        .insert({
          user_id: inv.user_id,
          invoice_number: newNumber,
          client_id: inv.client_id,
          title: inv.title,
          payment_terms: inv.payment_terms,
          client_notes: inv.client_notes,
          internal_notes: inv.internal_notes,
          subtotal: inv.subtotal,
          tax_amount: inv.tax_amount,
          discount_amount: inv.discount_amount,
          total: inv.total,
          balance_due: inv.total,
          status: "sent",
          is_recurring: false,
          sent_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insErr) {
        console.error(`Failed to create invoice for ${inv.id}:`, insErr);
        continue;
      }

      // Copy line items
      const { data: lineItems } = await supabase
        .from("invoice_line_items")
        .select("*")
        .eq("invoice_id", inv.id)
        .order("sort_order");

      if (lineItems && lineItems.length > 0) {
        const newItems = lineItems.map((li: any, i: number) => ({
          invoice_id: newInvoice.id,
          user_id: inv.user_id,
          description: li.description,
          quantity: li.quantity,
          unit_price: li.unit_price,
          tax_rate: li.tax_rate,
          discount_percent: li.discount_percent,
          line_total: li.line_total,
          service_id: li.service_id,
          sort_order: i,
        }));
        await supabase.from("invoice_line_items").insert(newItems);
      }

      // Increment invoice number
      if (settings) {
        await supabase
          .from("company_settings")
          .update({ next_invoice_number: num + 1 })
          .eq("id", settings.id);
      }

      created++;
    }

    return new Response(JSON.stringify({ success: true, created }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
