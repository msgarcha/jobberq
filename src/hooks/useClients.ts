import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Client = Tables<"clients">;
export type ClientInsert = TablesInsert<"clients">;
export type ClientUpdate = TablesUpdate<"clients">;

export function useClients(filters?: {
  search?: string;
  status?: string;
}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["clients", filters],
    queryFn: async () => {
      let query = supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status as "lead" | "active" | "archived");
      }

      if (filters?.search) {
        const s = `%${filters.search}%`;
        query = query.or(
          `first_name.ilike.${s},last_name.ilike.${s},company_name.ilike.${s},email.ilike.${s},phone.ilike.${s}`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Client[];
    },
    enabled: !!user,
  });
}

export function useClient(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as Client | null;
    },
    enabled: !!user && !!id,
  });
}

export function useClientProperties(clientId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["client-properties", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("client_id", clientId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!clientId,
  });
}

export function useClientQuotes(clientId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["client-quotes", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .eq("client_id", clientId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!clientId,
  });
}

export function useClientInvoices(clientId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["client-invoices", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("client_id", clientId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!clientId,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const { team } = useAuth();

  return useMutation({
    mutationFn: async (data: Omit<ClientInsert, "user_id">) => {
      const { data: result, error } = await supabase
        .from("clients")
        .insert({ ...data, user_id: user!.id, team_id: team.teamId } as any)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({ title: "Client created" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: ClientUpdate & { id: string }) => {
      const { data: result, error } = await supabase
        .from("clients")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client", data.id] });
      toast({ title: "Client updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { client_id: string; name: string; address_line1?: string; address_line2?: string; city?: string; state?: string; zip?: string; notes?: string }) => {
      const { data: result, error } = await supabase
        .from("properties")
        .insert({ ...data, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["client-properties", data.client_id] });
      toast({ title: "Property added" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}
