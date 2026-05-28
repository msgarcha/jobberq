import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function money(amount: number | string | null | undefined, currency = "CAD"): string {
  const n = Number(amount ?? 0);
  if (!Number.isFinite(n)) return "$0.00";
  try {
    return new Intl.NumberFormat("en-CA", { style: "currency", currency }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

function hexToRgb(hex: string | null | undefined, fallback: [number, number, number]): [number, number, number] {
  if (!hex) return fallback;
  const m = hex.replace("#", "").match(/^([0-9a-f]{6})$/i);
  if (!m) return fallback;
  const int = parseInt(m[1], 16);
  return [((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255];
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoice_id, force } = await req.json();
    if (!invoice_id) {
      return new Response(JSON.stringify({ error: "invoice_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Load invoice + client
    const { data: invoice, error: invErr } = await admin
      .from("invoices")
      .select(
        "id, invoice_number, title, subtotal, discount_amount, tax_amount, total, balance_due, amount_paid, status, due_date, created_at, paid_at, team_id, receipt_pdf_url, clients(first_name, last_name, company_name, email, phone, address_line1, city, state, zip)"
      )
      .eq("id", invoice_id)
      .single();

    if (invErr || !invoice) {
      return new Response(JSON.stringify({ error: "Invoice not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Reuse existing PDF unless forced
    if ((invoice as any).receipt_pdf_url && !force) {
      return new Response(JSON.stringify({ url: (invoice as any).receipt_pdf_url, cached: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: lineItems } = await admin
      .from("invoice_line_items")
      .select("description, quantity, unit_price, line_total, tax_rate, discount_percent")
      .eq("invoice_id", invoice_id)
      .order("sort_order", { ascending: true });

    const { data: company } = await admin
      .from("company_settings")
      .select("company_name, logo_url, email, phone, address_line1, city, state, zip, website, pdf_primary_color, pdf_accent_color")
      .eq("team_id", invoice.team_id)
      .maybeSingle();

    // ---- Build the PDF ----
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]); // A4 portrait
    const { width, height } = page.getSize();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const primary = hexToRgb((company as any)?.pdf_primary_color, [0.102, 0.18, 0.208]); // dark teal default
    const accent = hexToRgb((company as any)?.pdf_accent_color, [0.18, 0.55, 0.5]);
    const ink = rgb(0.13, 0.15, 0.17);
    const muted = rgb(0.45, 0.5, 0.53);
    const lineCol = rgb(0.88, 0.9, 0.92);

    const marginX = 48;
    let y = height - 56;

    const text = (
      s: string,
      x: number,
      yy: number,
      opts: { size?: number; bold?: boolean; color?: any } = {}
    ) => {
      page.drawText(s ?? "", {
        x,
        y: yy,
        size: opts.size ?? 10,
        font: opts.bold ? fontBold : font,
        color: opts.color ?? ink,
      });
    };

    const rightText = (
      s: string,
      xRight: number,
      yy: number,
      opts: { size?: number; bold?: boolean; color?: any } = {}
    ) => {
      const size = opts.size ?? 10;
      const f = opts.bold ? fontBold : font;
      const w = f.widthOfTextAtSize(s ?? "", size);
      page.drawText(s ?? "", { x: xRight - w, y: yy, size, font: f, color: opts.color ?? ink });
    };

    // Try to embed company logo (best effort)
    let logoDrawn = false;
    const logoUrl = (company as any)?.logo_url;
    if (logoUrl) {
      try {
        const resp = await fetch(logoUrl);
        if (resp.ok) {
          const bytes = new Uint8Array(await resp.arrayBuffer());
          const ct = resp.headers.get("content-type") || "";
          let img: any = null;
          if (ct.includes("png") || logoUrl.toLowerCase().endsWith(".png")) {
            img = await pdf.embedPng(bytes);
          } else if (ct.includes("jpeg") || ct.includes("jpg") || /\.jpe?g$/i.test(logoUrl)) {
            img = await pdf.embedJpg(bytes);
          }
          if (img) {
            const maxH = 44;
            const scale = Math.min(maxH / img.height, 160 / img.width);
            const w = img.width * scale;
            const h = img.height * scale;
            page.drawImage(img, { x: marginX, y: y - h + 10, width: w, height: h });
            logoDrawn = true;
          }
        }
      } catch (_e) {
        // ignore logo failures
      }
    }

    // Company name / header (left)
    if (!logoDrawn) {
      text((company as any)?.company_name || "Your Company", marginX, y, {
        size: 18,
        bold: true,
        color: rgb(primary[0], primary[1], primary[2]),
      });
    }

    // "RECEIPT" + PAID badge (right)
    rightText("RECEIPT", width - marginX, y + 4, { size: 22, bold: true, color: rgb(primary[0], primary[1], primary[2]) });

    y -= logoDrawn ? 18 : 22;

    // Company contact line under header
    const compContact = [
      (company as any)?.email,
      (company as any)?.phone,
      [(company as any)?.address_line1, [(company as any)?.city, (company as any)?.state, (company as any)?.zip].filter(Boolean).join(", ")]
        .filter(Boolean)
        .join(" · "),
    ]
      .filter(Boolean)
      .join("  •  ");
    if (logoDrawn && ((company as any)?.company_name)) {
      // keep company name as small label if logo present
    }
    if (compContact) {
      text(compContact, marginX, y - 6, { size: 9, color: muted });
    }

    // PAID badge box (right side)
    const badgeW = 86;
    const badgeH = 26;
    const badgeX = width - marginX - badgeW;
    const badgeY = y - 12;
    page.drawRectangle({
      x: badgeX,
      y: badgeY,
      width: badgeW,
      height: badgeH,
      color: rgb(accent[0], accent[1], accent[2]),
      borderColor: rgb(accent[0], accent[1], accent[2]),
      borderWidth: 1,
    });
    const paidLabel = "PAID";
    const plW = fontBold.widthOfTextAtSize(paidLabel, 14);
    page.drawText(paidLabel, {
      x: badgeX + (badgeW - plW) / 2,
      y: badgeY + 7,
      size: 14,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    y -= 44;

    // Divider
    page.drawLine({ start: { x: marginX, y }, end: { x: width - marginX, y }, color: lineCol, thickness: 1 });
    y -= 24;

    // Meta block (invoice number / dates) + Bill To
    const client = (invoice as any).clients;
    const clientName = client?.company_name || `${client?.first_name ?? ""} ${client?.last_name ?? ""}`.trim() || "Client";

    text("BILL TO", marginX, y, { size: 8, bold: true, color: muted });
    text(clientName, marginX, y - 14, { size: 11, bold: true });
    let cy = y - 28;
    const clientLines = [
      client?.email,
      client?.phone,
      client?.address_line1,
      [client?.city, client?.state, client?.zip].filter(Boolean).join(", "),
    ].filter(Boolean);
    for (const l of clientLines) {
      text(String(l), marginX, cy, { size: 9, color: muted });
      cy -= 12;
    }

    // Right meta
    const rx = width - marginX;
    text("Invoice", rx - 200, y, { size: 8, bold: true, color: muted });
    rightText(`#${invoice.invoice_number ?? ""}`, rx, y, { size: 10, bold: true });
    text("Payment date", rx - 200, y - 16, { size: 8, bold: true, color: muted });
    rightText(fmtDate((invoice as any).paid_at) || fmtDate(new Date().toISOString()), rx, y - 16, { size: 10 });
    text("Amount paid", rx - 200, y - 32, { size: 8, bold: true, color: muted });
    rightText(money(invoice.total), rx, y - 32, { size: 11, bold: true, color: rgb(accent[0], accent[1], accent[2]) });

    y = Math.min(cy, y - 44) - 18;

    // Line items table header
    const colDescX = marginX;
    const colQtyX = 360;
    const colPriceX = 450;
    const colTotalX = width - marginX;

    page.drawRectangle({
      x: marginX - 6,
      y: y - 4,
      width: width - marginX * 2 + 12,
      height: 20,
      color: rgb(primary[0], primary[1], primary[2]),
    });
    text("Description", colDescX, y + 2, { size: 9, bold: true, color: rgb(1, 1, 1) });
    rightText("Qty", colQtyX, y + 2, { size: 9, bold: true, color: rgb(1, 1, 1) });
    rightText("Price", colPriceX, y + 2, { size: 9, bold: true, color: rgb(1, 1, 1) });
    rightText("Amount", colTotalX, y + 2, { size: 9, bold: true, color: rgb(1, 1, 1) });
    y -= 24;

    const items = lineItems || [];
    for (const it of items) {
      if (y < 140) {
        // simple overflow guard — add a new page
        const np = pdf.addPage([595, 842]);
        y = np.getSize().height - 60;
      }
      const desc = String((it as any).description ?? "");
      // wrap description to ~60 chars
      const maxChars = 62;
      const lines: string[] = [];
      let remaining = desc;
      while (remaining.length > maxChars) {
        let cut = remaining.lastIndexOf(" ", maxChars);
        if (cut <= 0) cut = maxChars;
        lines.push(remaining.slice(0, cut));
        remaining = remaining.slice(cut).trim();
      }
      lines.push(remaining);

      text(lines[0] || "", colDescX, y, { size: 9 });
      rightText(String((it as any).quantity ?? ""), colQtyX, y, { size: 9 });
      rightText(money((it as any).unit_price), colPriceX, y, { size: 9 });
      rightText(money((it as any).line_total), colTotalX, y, { size: 9 });
      y -= 14;
      for (let i = 1; i < lines.length; i++) {
        text(lines[i], colDescX, y, { size: 9, color: muted });
        y -= 12;
      }
      page.drawLine({ start: { x: marginX, y: y + 4 }, end: { x: width - marginX, y: y + 4 }, color: lineCol, thickness: 0.5 });
      y -= 6;
    }

    y -= 8;

    // Totals
    const totalsLabelX = width - marginX - 180;
    const drawTotalRow = (label: string, value: string, opts: { bold?: boolean; color?: any; size?: number } = {}) => {
      text(label, totalsLabelX, y, { size: opts.size ?? 10, bold: opts.bold, color: opts.color ?? muted });
      rightText(value, width - marginX, y, { size: opts.size ?? 10, bold: opts.bold, color: opts.color ?? ink });
      y -= 16;
    };

    drawTotalRow("Subtotal", money(invoice.subtotal));
    if (Number(invoice.discount_amount) > 0) drawTotalRow("Discount", `-${money(invoice.discount_amount)}`);
    if (Number(invoice.tax_amount) > 0) drawTotalRow("Tax", money(invoice.tax_amount));
    page.drawLine({ start: { x: totalsLabelX, y: y + 6 }, end: { x: width - marginX, y: y + 6 }, color: lineCol, thickness: 1 });
    y -= 4;
    drawTotalRow("Total", money(invoice.total), { bold: true, size: 12 });
    drawTotalRow("Amount paid", money(invoice.total), { bold: true, color: rgb(accent[0], accent[1], accent[2]) });
    drawTotalRow("Balance due", money(0), { bold: true });

    // Footer
    text("Thank you for your business!", marginX, 70, { size: 10, bold: true, color: rgb(primary[0], primary[1], primary[2]) });
    const footerCompany = (company as any)?.company_name || "";
    if (footerCompany) text(footerCompany, marginX, 54, { size: 9, color: muted });
    text("Receipt generated by QuickLinq", marginX, 40, { size: 8, color: muted });

    const pdfBytes = await pdf.save();

    // Upload to storage (unguessable path)
    const path = `${invoice.team_id}/${invoice.id}-${crypto.randomUUID()}.pdf`;
    const { error: uploadErr } = await admin.storage
      .from("invoice-receipts")
      .upload(path, pdfBytes, { contentType: "application/pdf", upsert: true });

    if (uploadErr) {
      console.error("Failed to upload receipt PDF:", uploadErr);
      return new Response(JSON.stringify({ error: "Failed to store PDF" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: pub } = admin.storage.from("invoice-receipts").getPublicUrl(path);
    const url = pub.publicUrl;

    // Persist URL for reuse
    await admin.from("invoices").update({ receipt_pdf_url: url }).eq("id", invoice.id);

    return new Response(JSON.stringify({ url, cached: false }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-invoice-pdf error:", error);
    return new Response(JSON.stringify({ error: "An internal error occurred." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
