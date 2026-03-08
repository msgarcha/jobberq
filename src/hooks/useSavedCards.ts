import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function useSavedCards(clientId: string | undefined | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["saved-cards", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_saved_cards")
        .select("*")
        .eq("client_id", clientId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!clientId,
  });
}

export function useSaveCard() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user, team } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      client_id: string;
      stripe_customer_id: string;
      stripe_payment_method_id: string;
      card_brand: string;
      card_last4: string;
      card_exp_month: number;
      card_exp_year: number;
    }) => {
      // Set all other cards as non-default
      await supabase
        .from("client_saved_cards")
        .update({ is_default: false })
        .eq("client_id", data.client_id);

      const { data: result, error } = await supabase
        .from("client_saved_cards")
        .insert({
          ...data,
          user_id: user!.id,
          team_id: team.teamId,
          is_default: true,
        })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["saved-cards", vars.client_id] });
      toast({ title: "Card saved on file" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeleteSavedCard() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, clientId }: { id: string; clientId: string }) => {
      const { error } = await supabase
        .from("client_saved_cards")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return clientId;
    },
    onSuccess: (clientId) => {
      qc.invalidateQueries({ queryKey: ["saved-cards", clientId] });
      toast({ title: "Card removed" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}
