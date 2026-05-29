import type { SupabaseClient } from "npm:@supabase/supabase-js@2.57.2";
import { appUrl, clientDisplayName, formatCurrency, notifyOwner } from "./notify-owner.ts";

interface FinalizeOnlinePaymentArgs {
  invoiceId: string;
  paymentIntentId: string;
  amount: number;
  userId?: string | null;
  referenceNumber?: string | null;
  notes?: string | null;
}

interface InvoiceWithClient {
  id: string;
  team_id: string;
  user_id: string;
  invoice_number: string;
  total: number;
  amount_paid: number;
  balance_due: number;
  status: string;
  paid_at: string | null;
  receipt_pdf_url?: string | null;
  clients?: {
    first_name?: string | null;
    last_name?: string | null;
    company_name?: string | null;
    email?: string | null;
  } | null;
}

async function sendClientReceipt(admin: SupabaseClient, invoice: InvoiceWithClient, paymentIntentId: string, amount: number) {
  try {
    const client = invoice.clients;
    const email = client?.email;
    if (!email) {
      console.log(`[receipt] no client email for invoice ${invoice.id}, skipping`);
      return;
    }

    let receiptUrl = invoice.receipt_pdf_url || "";
    try {
      const { data: pdfRes, error: pdfErr } = await admin.functions.invoke("generate-invoice-pdf", {
        body: { invoice_id: invoice.id },
      });
      if (pdfErr) console.error("[receipt] PDF generation error:", pdfErr);
      else receiptUrl = pdfRes?.url || receiptUrl;
    } catch (e) {
      console.error("[receipt] PDF invoke failed:", e);
    }

    const { data: company } = await admin
      .from("company_settings")
      .select("company_name")
      .eq("team_id", invoice.team_id)
      .maybeSingle();

    const cName = clientDisplayName(client);
    const paymentDate = new Date(invoice.paid_at || new Date().toISOString()).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    const { error: invokeErr } = await admin.functions.invoke("send-transactional-email", {
      body: {
        templateName: "payment-receipt",
        recipientEmail: email,
        idempotencyKey: `receipt-${paymentIntentId}`,
        templateData: {
          companyName: company?.company_name || "",
          clientName: client?.first_name || cName,
          invoiceNumber: invoice.invoice_number,
          amount: formatCurrency(amount),
          paymentDate,
          receiptUrl,
          invoiceUrl: `https://quicklinq.app/pay/${invoice.id}`,
        },
      },
    });
    if (invokeErr) console.error("[receipt] email invoke error:", invokeErr);
    else console.log(`[receipt] sent to client for invoice ${invoice.id}`);
  } catch (e) {
    console.error("[receipt] sendClientReceipt failed:", e);
  }
}

export async function finalizeOnlineInvoicePayment(
  admin: SupabaseClient,
  args: FinalizeOnlinePaymentArgs,
) {
  const { invoiceId, paymentIntentId, amount, referenceNumber, notes } = args;

  const { data: invoice, error: invoiceError } = await admin
    .from("invoices")
    .select("id, team_id, user_id, invoice_number, total, amount_paid, balance_due, status, paid_at, receipt_pdf_url, clients(first_name, last_name, company_name, email)")
    .eq("id", invoiceId)
    .single();

  if (invoiceError || !invoice) {
    throw new Error("Invoice not found");
  }

  const normalizedAmount = Number(amount);
  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    throw new Error("Invalid payment amount");
  }

  const actingUserId = args.userId || invoice.user_id;

  const { data: existingPayment } = await admin
    .from("payments")
    .select("id")
    .eq("stripe_payment_id", paymentIntentId)
    .maybeSingle();

  let insertedPayment = false;
  if (!existingPayment) {
    const { error: paymentError } = await admin.from("payments").insert({
      invoice_id: invoiceId,
      user_id: actingUserId,
      team_id: invoice.team_id,
      amount: normalizedAmount,
      payment_method: "stripe",
      reference_number: referenceNumber || null,
      stripe_payment_id: paymentIntentId,
      notes: notes || "Paid online via Stripe",
    });

    if (paymentError) {
      throw new Error(paymentError.message || "Failed to record payment");
    }

    insertedPayment = true;
  }

  const { data: paymentRows, error: paymentRowsError } = await admin
    .from("payments")
    .select("amount")
    .eq("invoice_id", invoiceId);

  if (paymentRowsError) {
    throw new Error(paymentRowsError.message || "Failed to load payments");
  }

  const reconciledAmountPaid = (paymentRows || []).reduce((sum, row: any) => sum + Number(row.amount || 0), 0);
  const newBalance = Math.max(0, Number(invoice.total) - reconciledAmountPaid);
  const isPaid = newBalance <= 0;
  const paidAt = isPaid ? (invoice.paid_at || new Date().toISOString()) : null;

  const updates: Record<string, unknown> = {
    amount_paid: reconciledAmountPaid,
    balance_due: newBalance,
  };

  if (isPaid) {
    updates.status = "paid";
    updates.paid_at = paidAt;
  }

  const { error: updateError } = await admin.from("invoices").update(updates).eq("id", invoiceId);
  if (updateError) {
    throw new Error(updateError.message || "Failed to update invoice totals");
  }

  const updatedInvoice: InvoiceWithClient = {
    ...invoice,
    amount_paid: reconciledAmountPaid,
    balance_due: newBalance,
    status: isPaid ? "paid" : invoice.status,
    paid_at: paidAt,
  };

  if (insertedPayment) {
    const cName = clientDisplayName(invoice.clients);
    const amountLabel = formatCurrency(normalizedAmount);
    const event = isPaid ? "invoice_paid" : "deposit_paid";

    await notifyOwner({
      teamId: invoice.team_id,
      event,
      title: isPaid
        ? `${cName} paid invoice ${invoice.invoice_number} in full`
        : `${cName} made an online payment on ${invoice.invoice_number}`,
      body: `${amountLabel} received via Stripe`,
      link: `/invoices/${invoice.id}`,
      entityType: "invoice",
      entityId: invoice.id,
      idempotencySuffix: paymentIntentId,
      templateData: {
        kind: isPaid ? "full" : "deposit",
        clientName: cName,
        invoiceNumber: invoice.invoice_number,
        amount: amountLabel,
        invoiceUrl: appUrl(`/invoices/${invoice.id}`),
      },
    });

    if (isPaid) {
      await sendClientReceipt(admin, updatedInvoice, paymentIntentId, normalizedAmount);
    }
  }

  return {
    invoiceId,
    paymentIntentId,
    insertedPayment,
    isPaid,
    amountPaid: reconciledAmountPaid,
    balanceDue: newBalance,
  };
}