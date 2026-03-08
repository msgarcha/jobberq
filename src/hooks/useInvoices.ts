import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Invoice = Tables<"invoices">;
export type InvoiceInsert = TablesInsert<"invoices">;
export type InvoiceUpdate = TablesUpdate<"invoices">;
export type InvoiceLineItem = Tables<"invoice_line_items">;
export type InvoiceLineItemInsert = TablesInsert<"invoice_line_items">;
export type Payment = Tables<"payments">;
export type PaymentInsert = TablesInsert<"payments">;

export function useInvoices(filters?: { search?: string; status?: string }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["invoices", filters],
    queryFn: async () => {
      let query = supabase
        .from("invoices")
        .select("*, clients(first_name, last_name, company_name)")
        .order("created_at", { ascending: false });

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status as any);
      }

      if (filters?.search) {
        const s = `%${filters.search}%`;
        query = query.or(`invoice_number.ilike.${s},title.ilike.${s}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useInvoice(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, clients(first_name, last_name, company_name, email, phone)")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
  });
}

export function useInvoiceLineItems(invoiceId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["invoice-line-items", invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoice_line_items")
        .select("*, services_catalog(name)")
        .eq("invoice_id", invoiceId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!invoiceId,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user, team } = useAuth();

  return useMutation({
    mutationFn: async (data: Omit<InvoiceInsert, "user_id">) => {
      const { data: result, error } = await supabase
        .from("invoices")
        .insert({ ...data, user_id: user!.id, team_id: team.teamId } as any)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast({ title: "Invoice created" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateInvoice() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: InvoiceUpdate & { id: string }) => {
      const { data: result, error } = await supabase
        .from("invoices")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["invoice", data.id] });
      toast({ title: "Invoice updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("invoice_line_items").delete().eq("invoice_id", id);
      await supabase.from("payments").delete().eq("invoice_id", id);
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast({ title: "Invoice deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useSaveInvoiceLineItems() {
  const qc = useQueryClient();
  const { user, team } = useAuth();

  return useMutation({
    mutationFn: async ({ invoiceId, items }: { invoiceId: string; items: Omit<InvoiceLineItemInsert, "user_id" | "invoice_id">[] }) => {
      await supabase.from("invoice_line_items").delete().eq("invoice_id", invoiceId);
      
      if (items.length === 0) return [];

      const toInsert = items.map((item, i) => ({
        ...item,
        invoice_id: invoiceId,
        user_id: user!.id,
        team_id: team.teamId,
        sort_order: i,
      }));

      const { data, error } = await supabase
        .from("invoice_line_items")
        .insert(toInsert)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { invoiceId }) => {
      qc.invalidateQueries({ queryKey: ["invoice-line-items", invoiceId] });
    },
  });
}

export function usePayments(invoiceId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["payments", invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("invoice_id", invoiceId!)
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return data as Payment[];
    },
    enabled: !!user && !!invoiceId,
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user, team } = useAuth();

  return useMutation({
    mutationFn: async (data: Omit<PaymentInsert, "user_id">) => {
      // Insert payment
      const { data: payment, error } = await supabase
        .from("payments")
        .insert({ ...data, user_id: user!.id, team_id: team.teamId } as any)
        .select()
        .single();
      if (error) throw error;

      // Update invoice totals
      const { data: invoice } = await supabase
        .from("invoices")
        .select("amount_paid, total")
        .eq("id", data.invoice_id)
        .single();

      if (invoice) {
        const newAmountPaid = Number(invoice.amount_paid) + Number(data.amount);
        const newBalance = Number(invoice.total) - newAmountPaid;
        const updates: any = {
          amount_paid: newAmountPaid,
          balance_due: Math.max(0, newBalance),
        };
        if (newBalance <= 0) {
          updates.status = "paid";
          updates.paid_at = new Date().toISOString();
        }
        await supabase.from("invoices").update(updates).eq("id", data.invoice_id);
      }

      return payment;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["payments", vars.invoice_id] });
      qc.invalidateQueries({ queryKey: ["invoice", vars.invoice_id] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast({ title: "Payment recorded" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useNextInvoiceNumber() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["next-invoice-number"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_settings")
        .select("invoice_prefix, next_invoice_number")
        .maybeSingle();
      if (error) throw error;
      const prefix = data?.invoice_prefix || "INV-";
      const num = data?.next_invoice_number || 1001;
      return { prefix, number: num, formatted: `${prefix}${num}` };
    },
    enabled: !!user,
  });
}

export function useIncrementInvoiceNumber() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const { data: settings } = await supabase
        .from("company_settings")
        .select("id, next_invoice_number")
        .maybeSingle();

      if (settings) {
        await supabase
          .from("company_settings")
          .update({ next_invoice_number: (settings.next_invoice_number || 1001) + 1 })
          .eq("id", settings.id);
      }
    },
  });
}

export function useDuplicateInvoice() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user, team } = useAuth();

  return useMutation({
    mutationFn: async (sourceInvoiceId: string) => {
      // Get next number
      const { data: settings } = await supabase
        .from("company_settings")
        .select("invoice_prefix, next_invoice_number, id")
        .maybeSingle();

      const prefix = settings?.invoice_prefix || "INV-";
      const num = settings?.next_invoice_number || 1001;
      const newNumber = `${prefix}${num}`;

      // Get source invoice
      const { data: source, error: srcErr } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", sourceInvoiceId)
        .single();
      if (srcErr || !source) throw srcErr || new Error("Invoice not found");

      // Create duplicate
      const { data: newInvoice, error: insErr } = await supabase
        .from("invoices")
        .insert({
          user_id: user!.id,
          invoice_number: newNumber,
          client_id: source.client_id,
          title: source.title ? `${source.title} (copy)` : null,
          payment_terms: source.payment_terms,
          client_notes: source.client_notes,
          internal_notes: source.internal_notes,
          subtotal: source.subtotal,
          tax_amount: source.tax_amount,
          discount_amount: source.discount_amount,
          total: source.total,
          balance_due: source.total,
          status: "draft" as const,
          is_recurring: false,
        })
        .select()
        .single();
      if (insErr) throw insErr;

      // Copy line items
      const { data: lineItems } = await supabase
        .from("invoice_line_items")
        .select("*")
        .eq("invoice_id", sourceInvoiceId)
        .order("sort_order");

      if (lineItems && lineItems.length > 0) {
        const newItems = lineItems.map((li, i) => ({
          invoice_id: newInvoice.id,
          user_id: user!.id,
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

      // Increment number
      if (settings) {
        await supabase
          .from("company_settings")
          .update({ next_invoice_number: num + 1 })
          .eq("id", settings.id);
      }

      return newInvoice;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["next-invoice-number"] });
      toast({ title: "Invoice duplicated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useDashboardStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Revenue MTD (paid invoices this month)
      const { data: paidThisMonth } = await supabase
        .from("invoices")
        .select("total")
        .eq("status", "paid" as any)
        .gte("paid_at", monthStart);

      const revenueMTD = (paidThisMonth || []).reduce((sum, inv) => sum + Number(inv.total), 0);

      // Outstanding (unpaid invoices)
      const { data: unpaid } = await supabase
        .from("invoices")
        .select("balance_due")
        .neq("status", "paid" as any)
        .neq("status", "draft" as any);

      const outstanding = (unpaid || []).reduce((sum, inv) => sum + Number(inv.balance_due), 0);
      const unpaidCount = unpaid?.length || 0;

      // Overdue
      const today = now.toISOString().split("T")[0];
      const { data: overdue } = await supabase
        .from("invoices")
        .select("balance_due")
        .eq("status", "overdue" as any);

      const overdueTotal = (overdue || []).reduce((sum, inv) => sum + Number(inv.balance_due), 0);
      const overdueCount = overdue?.length || 0;

      // Active quotes
      const { data: activeQuotes } = await supabase
        .from("quotes")
        .select("total")
        .in("status", ["draft", "sent"] as any);

      const quotesValue = (activeQuotes || []).reduce((sum, q) => sum + Number(q.total), 0);
      const quotesCount = activeQuotes?.length || 0;

      return { revenueMTD, outstanding, unpaidCount, overdueTotal, overdueCount, quotesValue, quotesCount };
    },
    enabled: !!user,
  });
}

export function useRecentActivity() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["recent-activity"],
    queryFn: async () => {
      const { data: recentInvoices } = await supabase
        .from("invoices")
        .select("id, invoice_number, status, total, updated_at, clients(first_name, last_name)")
        .order("updated_at", { ascending: false })
        .limit(10);

      return (recentInvoices || []).map((inv: any) => ({
        id: inv.id,
        type: "invoice" as const,
        text: `Invoice ${inv.invoice_number} ${inv.status}`,
        detail: inv.clients ? `${inv.clients.first_name} ${inv.clients.last_name} · $${Number(inv.total).toLocaleString()}` : `$${Number(inv.total).toLocaleString()}`,
        status: inv.status,
        time: inv.updated_at,
      }));
    },
    enabled: !!user,
  });
}
