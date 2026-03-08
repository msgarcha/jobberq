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
      // Use the security definer function to accept the invite
      const { data, error } = await supabase.rpc("accept_team_invitation", {
        _token: token!,
        _user_id: user!.id,
      });

      if (error) throw error;

      const result = data as any;
      if (result?.error) {
        setStatus("error");
        setMessage(result.error);
        return;
      }

      setStatus("success");
      setMessage(result.message || "You've joined the team!");
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
              <Button
                onClick={() => navigate(`/login?redirect=${encodeURIComponent(`/accept-invite?token=${token}`)}`)}
                className="w-full"
              >
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
