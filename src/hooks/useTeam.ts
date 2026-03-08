import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function useTeam() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["team"],
    queryFn: async () => {
      // Get user's team membership
      const { data: membership, error: memErr } = await supabase
        .from("team_members")
        .select("team_id, role, teams(id, name, owner_id)")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (memErr) throw memErr;
      return membership;
    },
    enabled: !!user,
  });
}

export function useTeamMembers(teamId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["team-members", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*, profiles(display_name, avatar_url)")
        .eq("team_id", teamId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!teamId,
  });
}

export function useTeamInvitations(teamId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["team-invitations", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_invitations")
        .select("*")
        .eq("team_id", teamId!)
        .is("accepted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!teamId,
  });
}

export function useSendInvite() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ teamId, email, role }: { teamId: string; email: string; role: string }) => {
      const { data, error } = await supabase.functions.invoke("send-team-invite", {
        body: { teamId, email, role },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["team-invitations", vars.teamId] });
      toast({ title: "Invitation sent" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateMemberRole() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ memberId, role, teamId }: { memberId: string; role: string; teamId: string }) => {
      const { error } = await supabase
        .from("team_members")
        .update({ role: role as any })
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["team-members", vars.teamId] });
      toast({ title: "Role updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ memberId, teamId }: { memberId: string; teamId: string }) => {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["team-members", vars.teamId] });
      toast({ title: "Member removed" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useCancelInvitation() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ invitationId, teamId }: { invitationId: string; teamId: string }) => {
      const { error } = await supabase
        .from("team_invitations")
        .delete()
        .eq("id", invitationId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["team-invitations", vars.teamId] });
      toast({ title: "Invitation cancelled" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}
