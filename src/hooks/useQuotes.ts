import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Quote = Tables<"quotes">;
export type QuoteInsert = TablesInsert<"quotes">;
export type QuoteUpdate = TablesUpdate<"quotes">;
export type QuoteLineItem = Tables<"quote_line_items">;
export type QuoteLineItemInsert = TablesInsert<"quote_line_items">;

export function useQuotes(filters?: { search?: string; status?: string }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["quotes", filters],
    queryFn: async () => {
      let query = supabase
        .from("quotes")
        .select("*, clients(first_name, last_name, company_name)")
        .order("created_at", { ascending: false });

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status as any);
      }

      if (filters?.search) {
        const s = `%${filters.search}%`;
        query = query.or(`quote_number.ilike.${s},title.ilike.${s}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useQuote(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["quote", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*, clients(first_name, last_name, company_name, email, phone)")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
  });
}

export function useQuoteLineItems(quoteId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["quote-line-items", quoteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quote_line_items")
        .select("*, services_catalog(name)")
        .eq("quote_id", quoteId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!quoteId,
  });
}

export function useCreateQuote() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user, team } = useAuth();

  return useMutation({
    mutationFn: async (data: Omit<QuoteInsert, "user_id">) => {
      const { data: result, error } = await supabase
        .from("quotes")
        .insert({ ...data, user_id: user!.id, team_id: team.teamId } as any)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotes"] });
      toast({ title: "Quote created" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateQuote() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: QuoteUpdate & { id: string }) => {
      const { data: result, error } = await supabase
        .from("quotes")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["quotes"] });
      qc.invalidateQueries({ queryKey: ["quote", data.id] });
      toast({ title: "Quote updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeleteQuote() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      // Delete line items first
      await supabase.from("quote_line_items").delete().eq("quote_id", id);
      const { error } = await supabase.from("quotes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotes"] });
      toast({ title: "Quote deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useSaveQuoteLineItems() {
  const qc = useQueryClient();
  const { user, team } = useAuth();

  return useMutation({
    mutationFn: async ({ quoteId, items }: { quoteId: string; items: Omit<QuoteLineItemInsert, "user_id" | "quote_id">[] }) => {
      // Delete existing
      await supabase.from("quote_line_items").delete().eq("quote_id", quoteId);
      
      if (items.length === 0) return [];

      const toInsert = items.map((item, i) => ({
        ...item,
        quote_id: quoteId,
        user_id: user!.id,
        team_id: team.teamId,
        sort_order: i,
      }));

      const { data, error } = await supabase
        .from("quote_line_items")
        .insert(toInsert)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { quoteId }) => {
      qc.invalidateQueries({ queryKey: ["quote-line-items", quoteId] });
    },
  });
}

export function useNextQuoteNumber() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["next-quote-number"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_settings")
        .select("quote_prefix, next_quote_number")
        .maybeSingle();
      if (error) throw error;
      const prefix = data?.quote_prefix || "Q-";
      const num = data?.next_quote_number || 1001;
      return { prefix, number: num, formatted: `${prefix}${num}` };
    },
    enabled: !!user,
  });
}

export function useIncrementQuoteNumber() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const { data: settings } = await supabase
        .from("company_settings")
        .select("id, next_quote_number")
        .maybeSingle();

      if (settings) {
        await supabase
          .from("company_settings")
          .update({ next_quote_number: (settings.next_quote_number || 1001) + 1 })
          .eq("id", settings.id);
      }
    },
  });
}
