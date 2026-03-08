import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "login_required">("loading");
  const [message, setMessage] = useState("");
  const [teamName, setTeamName] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      setStatus("error");
      setMessage("Invalid invite link.");
      return;
    }
    if (!user) {
      setStatus("login_required");
      return;
    }

    acceptInvite();
  }, [token, user, authLoading]);

  const acceptInvite = async () => {
    try {
      // Look up the invitation
      const { data: invitation, error } = await supabase
        .from("team_invitations")
        .select("*, teams(name)")
        .eq("token", token!)
        .is("accepted_at", null)
        .maybeSingle();

      if (error || !invitation) {
        setStatus("error");
        setMessage("This invite link is invalid or has already been used.");
        return;
      }

      if (new Date(invitation.expires_at) < new Date()) {
        setStatus("error");
        setMessage("This invite link has expired.");
        return;
      }

      setTeamName((invitation.teams as any)?.name || "the team");

      // Check if user is already a member
      const { data: existing } = await supabase
        .from("team_members")
        .select("id")
        .eq("team_id", invitation.team_id)
        .eq("user_id", user!.id)
        .maybeSingle();

      if (existing) {
        setStatus("success");
        setMessage("You're already a member of this team!");
        return;
      }

      // Remove user from their current team (if solo team) and join new team
      const { data: currentMembership } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (currentMembership) {
        // Check if current team has other members
        const { count } = await supabase
          .from("team_members")
          .select("*", { count: "exact", head: true })
          .eq("team_id", currentMembership.team_id);

        if (count === 1) {
          // Solo team, delete it
          await supabase.from("team_members").delete().eq("user_id", user!.id);
          await supabase.from("teams").delete().eq("id", currentMembership.team_id);
        } else {
          // Just remove from current team
          await supabase.from("team_members").delete().eq("user_id", user!.id).eq("team_id", currentMembership.team_id);
        }
      }

      // Join the new team
      const { error: joinErr } = await supabase
        .from("team_members")
        .insert({
          team_id: invitation.team_id,
          user_id: user!.id,
          role: invitation.role,
        });

      if (joinErr) throw joinErr;

      // Mark invitation as accepted
      await supabase
        .from("team_invitations")
        .update({ accepted_at: new Date().toISOString() })
        .eq("id", invitation.id);

      // Update data to new team
      await supabase
        .from("clients")
        .update({ team_id: invitation.team_id } as any)
        .eq("user_id", user!.id);

      setStatus("success");
      setMessage(`You've joined ${(invitation.teams as any)?.name || "the team"}!`);
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Failed to accept invitation.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-warm-md">
        <CardContent className="p-8 text-center space-y-4">
          {status === "loading" && (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Accepting invitation...</p>
            </>
          )}

          {status === "login_required" && (
            <>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold">You've been invited!</h2>
              <p className="text-muted-foreground text-sm">
                Sign in or create an account to join the team.
              </p>
              <Button onClick={() => navigate(`/login?redirect=/accept-invite?token=${token}`)} className="w-full">
                Sign In to Accept
              </Button>
            </>
          )}

          {status === "success" && (
            <>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold">Welcome to the team!</h2>
              <p className="text-muted-foreground text-sm">{message}</p>
              <Button onClick={() => { window.location.href = "/"; }} className="w-full">
                Go to Dashboard
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
              <h2 className="text-xl font-bold">Invitation Error</h2>
              <p className="text-muted-foreground text-sm">{message}</p>
              <Button variant="outline" onClick={() => navigate("/")} className="w-full">
                Go to Dashboard
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
