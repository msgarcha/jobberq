import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTeam } from "@/hooks/useTeam";
import { useToast } from "@/hooks/use-toast";

export type PricingForm = {
  id: string;
  team_id: string;
  user_id: string;
  slug: string;
  title: string;
  description: string | null;
  is_published: boolean;
  primary_color: string;
  logo_url: string | null;
  success_message: string;
  require_address: boolean;
  require_phone: boolean;
  created_at: string;
  updated_at: string;
};

export type PricingFormService = {
  id: string;
  form_id: string;
  team_id: string;
  service_id: string | null;
  display_name: string;
  base_price: number;
  unit_label: string | null;
  min_qty: number;
  max_qty: number;
  tax_rate: number | null;
  sort_order: number;
};

export type PricingFormQuestion = {
  id: string;
  form_id: string;
  team_id: string;
  label: string;
  help_text: string | null;
  kind: "text" | "number" | "select" | "multiselect" | "yesno";
  required: boolean;
  options: Array<{ label: string; value: string; price_delta?: number; price_kind?: "flat" | "percent" | "per_unit" }>;
  applies_to_service_ids: string[];
  sort_order: number;
};

function randomSlug() {
  return Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6);
}

export function usePricingForms() {
  const { user } = useAuth();
  const { data: team } = useTeam();
  return useQuery({
    queryKey: ["pricing-forms", team?.team_id],
    enabled: !!user && !!team?.team_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pricing_forms")
        .select("*")
        .eq("team_id", team!.team_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PricingForm[];
    },
  });
}

export function usePricingForm(id: string | undefined) {
  return useQuery({
    queryKey: ["pricing-form", id],
    enabled: !!id,
    queryFn: async () => {
      const [form, services, questions] = await Promise.all([
        supabase.from("pricing_forms").select("*").eq("id", id!).maybeSingle(),
        supabase.from("pricing_form_services").select("*").eq("form_id", id!).order("sort_order"),
        supabase.from("pricing_form_questions").select("*").eq("form_id", id!).order("sort_order"),
      ]);
      if (form.error) throw form.error;
      if (!form.data) throw new Error("Form not found");
      return {
        form: form.data as PricingForm,
        services: (services.data || []) as PricingFormService[],
        questions: (questions.data || []) as PricingFormQuestion[],
      };
    },
  });
}

export function useCreatePricingForm() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: team } = useTeam();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: { title: string }) => {
      if (!user || !team?.team_id) throw new Error("No team");
      const { data, error } = await supabase
        .from("pricing_forms")
        .insert({
          team_id: team.team_id,
          user_id: user.id,
          slug: randomSlug(),
          title: input.title || "Instant Quote",
        })
        .select("*")
        .single();
      if (error) throw error;
      return data as PricingForm;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pricing-forms"] });
      toast({ title: "Form created" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useUpdatePricingForm() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<PricingForm> }) => {
      const { error } = await supabase.from("pricing_forms").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["pricing-form", v.id] });
      qc.invalidateQueries({ queryKey: ["pricing-forms"] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useDeletePricingForm() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pricing_forms").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pricing-forms"] });
      toast({ title: "Form deleted" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useUpsertFormService() {
  const qc = useQueryClient();
  const { data: team } = useTeam();
  return useMutation({
    mutationFn: async (input: Partial<PricingFormService> & { form_id: string }) => {
      if (input.id) {
        const { id, ...patch } = input as any;
        const { error } = await supabase.from("pricing_form_services").update(patch).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("pricing_form_services").insert({
          team_id: team!.team_id,
          form_id: input.form_id,
          display_name: input.display_name || "Service",
          base_price: input.base_price ?? 0,
          unit_label: input.unit_label || null,
          min_qty: input.min_qty ?? 1,
          max_qty: input.max_qty ?? 1,
          tax_rate: input.tax_rate ?? null,
          service_id: input.service_id || null,
          sort_order: input.sort_order ?? 0,
        });
        if (error) throw error;
      }
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["pricing-form", v.form_id] }),
  });
}

export function useDeleteFormService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; form_id: string }) => {
      const { error } = await supabase.from("pricing_form_services").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["pricing-form", v.form_id] }),
  });
}

export function useUpsertFormQuestion() {
  const qc = useQueryClient();
  const { data: team } = useTeam();
  return useMutation({
    mutationFn: async (input: Partial<PricingFormQuestion> & { form_id: string }) => {
      if (input.id) {
        const { id, ...patch } = input as any;
        const { error } = await supabase.from("pricing_form_questions").update(patch).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("pricing_form_questions").insert({
          team_id: team!.team_id,
          form_id: input.form_id,
          label: input.label || "Question",
          help_text: input.help_text || null,
          kind: (input.kind || "text") as any,
          required: input.required ?? false,
          options: (input.options || []) as any,
          applies_to_service_ids: input.applies_to_service_ids || [],
          sort_order: input.sort_order ?? 0,
        });
        if (error) throw error;
      }
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["pricing-form", v.form_id] }),
  });
}

export function useDeleteFormQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; form_id: string }) => {
      const { error } = await supabase.from("pricing_form_questions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["pricing-form", v.form_id] }),
  });
}

export function usePricingFormSubmissions() {
  const { data: team } = useTeam();
  return useQuery({
    queryKey: ["pricing-form-submissions", team?.team_id],
    enabled: !!team?.team_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pricing_form_submissions")
        .select("*")
        .eq("team_id", team!.team_id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });
}
