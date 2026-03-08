import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function useReviewRequests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["review-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("review_requests")
        .select("*, clients(first_name, last_name, email, company_name), jobs(title, job_number)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateReviewRequest() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user, team } = useAuth();

  return useMutation({
    mutationFn: async (data: { client_id: string; job_id?: string }) => {
      const { data: result, error } = await supabase
        .from("review_requests")
        .insert({
          client_id: data.client_id,
          job_id: data.job_id || null,
          user_id: user!.id,
          team_id: team.teamId,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["review-requests"] });
      toast({ title: "Review request created" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useReviewStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["review-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("review_requests")
        .select("status, rating, redirected_to_google");
      if (error) throw error;

      const total = data.length;
      const completed = data.filter((r) => r.status === "completed").length;
      const pending = data.filter((r) => r.status === "pending").length;
      const redirected = data.filter((r) => r.redirected_to_google).length;
      const avgRating =
        completed > 0
          ? data
              .filter((r) => r.rating)
              .reduce((sum, r) => sum + (r.rating || 0), 0) / completed
          : 0;

      return { total, completed, pending, redirected, avgRating };
    },
    enabled: !!user,
  });
}
