import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Service = Tables<"services_catalog">;
export type ServiceInsert = TablesInsert<"services_catalog">;
export type ServiceUpdate = TablesUpdate<"services_catalog">;

export function useServices(filters?: { search?: string; status?: string }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["services", filters],
    queryFn: async () => {
      let query = supabase
        .from("services_catalog")
        .select("*")
        .order("name", { ascending: true });

      if (filters?.status === "active") query = query.eq("is_active", true);
      if (filters?.status === "inactive") query = query.eq("is_active", false);

      if (filters?.search) {
        const s = `%${filters.search}%`;
        query = query.or(`name.ilike.${s},category.ilike.${s},description.ilike.${s}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Service[];
    },
    enabled: !!user,
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user, team } = useAuth();

  return useMutation({
    mutationFn: async (data: Omit<ServiceInsert, "user_id">) => {
      const { data: result, error } = await supabase
        .from("services_catalog")
        .insert({ ...data, user_id: user!.id, team_id: team.teamId } as any)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services"] });
      toast({ title: "Service created" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: ServiceUpdate & { id: string }) => {
      const { data: result, error } = await supabase
        .from("services_catalog")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services"] });
      toast({ title: "Service updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("services_catalog")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services"] });
      toast({ title: "Service deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}
