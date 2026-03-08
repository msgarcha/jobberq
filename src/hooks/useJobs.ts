import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Job = Tables<"jobs">;
export type JobInsert = TablesInsert<"jobs">;
export type JobUpdate = TablesUpdate<"jobs">;

export function useJobs(filters?: { search?: string; status?: string }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["jobs", filters],
    queryFn: async () => {
      let query = supabase
        .from("jobs")
        .select("*, clients(first_name, last_name, company_name)")
        .order("created_at", { ascending: false });

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status as any);
      }

      if (filters?.search) {
        const s = `%${filters.search}%`;
        query = query.or(`job_number.ilike.${s},title.ilike.${s}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useJobsByDate(date: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["jobs-by-date", date],
    queryFn: async () => {
      const dayStart = `${date}T00:00:00`;
      const dayEnd = `${date}T23:59:59`;

      const { data, error } = await supabase
        .from("jobs")
        .select("*, clients(first_name, last_name, company_name)")
        .gte("scheduled_start", dayStart)
        .lte("scheduled_start", dayEnd)
        .order("scheduled_start", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!date,
  });
}

export function useJob(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["job", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*, clients(first_name, last_name, company_name, email, phone)")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
  });
}

export function useCreateJob() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user, team } = useAuth();

  return useMutation({
    mutationFn: async (data: Omit<JobInsert, "user_id">) => {
      const { data: result, error } = await supabase
        .from("jobs")
        .insert({ ...data, user_id: user!.id, team_id: team.teamId } as any)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      toast({ title: "Job created" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateJob() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: JobUpdate & { id: string }) => {
      const { data: result, error } = await supabase
        .from("jobs")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["job", data.id] });
      qc.invalidateQueries({ queryKey: ["jobs-by-date"] });
      toast({ title: "Job updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeleteJob() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("jobs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      toast({ title: "Job deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useNextJobNumber() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["next-job-number"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_settings")
        .select("job_prefix, next_job_number")
        .maybeSingle();
      if (error) throw error;
      const prefix = (data as any)?.job_prefix || "J-";
      const num = (data as any)?.next_job_number || 1001;
      return { prefix, number: num, formatted: `${prefix}${num}` };
    },
    enabled: !!user,
  });
}

export function useIncrementJobNumber() {
  return useMutation({
    mutationFn: async () => {
      const { data: settings } = await supabase
        .from("company_settings")
        .select("id, next_job_number")
        .maybeSingle();

      if (settings) {
        await supabase
          .from("company_settings")
          .update({ next_job_number: ((settings as any).next_job_number || 1001) + 1 } as any)
          .eq("id", settings.id);
      }
    },
  });
}
