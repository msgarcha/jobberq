import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTeam } from "./useTeam";
import { toast } from "@/hooks/use-toast";

export type LeadStatus = "new" | "quoted" | "won" | "lost";

export interface LeadRow {
  id: string;
  team_id: string;
  form_id: string;
  slug: string;
  status: LeadStatus;
  created_at: string;
  contact: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string | null;
    address_line1?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
  };
  selected_services: any;
  answers: any;
  computed_subtotal: number;
  computed_tax: number;
  computed_total: number;
  client_id: string | null;
  quote_id: string | null;
  form?: { title: string | null } | null;
  quote?: { id: string; quote_number: string; status: string; total: number } | null;
  client?: { id: string; first_name: string; last_name: string; email: string | null; phone: string | null } | null;
}

export function useLeads(status?: LeadStatus | "all") {
  const { teamId } = useTeam();
  return useQuery({
    queryKey: ["leads", teamId, status ?? "all"],
    enabled: !!teamId,
    queryFn: async () => {
      let q = supabase
        .from("pricing_form_submissions")
        .select(
          "*, form:pricing_forms(title), quote:quotes(id, quote_number, status, total), client:clients(id, first_name, last_name, email, phone)"
        )
        .eq("team_id", teamId!)
        .order("created_at", { ascending: false })
        .limit(500);
      if (status && status !== "all") q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as LeadRow[];
    },
  });
}

export function useLead(id: string | undefined) {
  return useQuery({
    queryKey: ["lead", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pricing_form_submissions")
        .select(
          "*, form:pricing_forms(title, primary_color), quote:quotes(id, quote_number, status, total), client:clients(id, first_name, last_name, email, phone, address_line1, city, state, zip)"
        )
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as LeadRow | null;
    },
  });
}

export function useLeadCounts() {
  const { teamId } = useTeam();
  return useQuery({
    queryKey: ["lead-counts", teamId],
    enabled: !!teamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pricing_form_submissions")
        .select("status")
        .eq("team_id", teamId!);
      if (error) throw error;
      const counts: Record<string, number> = { new: 0, quoted: 0, won: 0, lost: 0, all: 0 };
      (data || []).forEach((r: any) => {
        counts.all += 1;
        if (counts[r.status] != null) counts[r.status] += 1;
      });
      return counts;
    },
  });
}

export function useUpdateLeadStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: LeadStatus }) => {
      const { error } = await supabase
        .from("pricing_form_submissions")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead-counts"] });
      qc.invalidateQueries({ queryKey: ["lead"] });
      toast({ title: "Lead updated" });
    },
    onError: (e: any) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });
}
