import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ReviewSuggestionRow {
  id: string;
  invoice_id: string;
  client_id: string;
  status: string;
  created_at: string;
  client?: { first_name: string; last_name: string; email: string | null } | null;
  invoice?: { invoice_number: string; total: number } | null;
}

export function useReviewSuggestions() {
  return useQuery({
    queryKey: ["review-suggestions", "pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("review_suggestions")
        .select(`
          id, invoice_id, client_id, status, created_at,
          client:clients(first_name, last_name, email),
          invoice:invoices(invoice_number, total)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as unknown as ReviewSuggestionRow[];
    },
  });
}

export function useDismissReviewSuggestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("review_suggestions")
        .update({ status: "dismissed" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["review-suggestions"] }),
  });
}

export function useMarkReviewSuggestionSent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("review_suggestions")
        .update({ status: "sent" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["review-suggestions"] }),
  });
}
