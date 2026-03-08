import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";

export type CompanySettings = Tables<"company_settings">;
export type CompanySettingsUpdate = TablesUpdate<"company_settings">;

export function useCompanySettings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["company-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data as CompanySettings | null;
    },
    enabled: !!user,
  });
}

export function useUpsertCompanySettings() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: Partial<CompanySettingsUpdate>) => {
      // Check if settings exist
      const { data: existing } = await supabase
        .from("company_settings")
        .select("id")
        .maybeSingle();

      if (existing) {
        const { data: result, error } = await supabase
          .from("company_settings")
          .update(data)
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        return result;
      } else {
        const { data: result, error } = await supabase
          .from("company_settings")
          .insert({ ...data, user_id: user!.id } as any)
          .select()
          .single();
        if (error) throw error;
        return result;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company-settings"] });
      toast({ title: "Settings saved" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}
