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
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: Omit<InvoiceInsert, "user_id">) => {
      const { data: result, error } = await supabase
        .from("invoices")
        .insert({ ...data, user_id: user!.id })
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
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ invoiceId, items }: { invoiceId: string; items: Omit<InvoiceLineItemInsert, "user_id" | "invoice_id">[] }) => {
      await supabase.from("invoice_line_items").delete().eq("invoice_id", invoiceId);
      
      if (items.length === 0) return [];

      const toInsert = items.map((item, i) => ({
        ...item,
        invoice_id: invoiceId,
        user_id: user!.id,
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
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: Omit<PaymentInsert, "user_id">) => {
      // Insert payment
      const { data: payment, error } = await supabase
        .from("payments")
        .insert({ ...data, user_id: user!.id })
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
