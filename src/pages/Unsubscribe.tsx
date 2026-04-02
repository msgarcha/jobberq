import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, MailX } from "lucide-react";

type Status = "loading" | "valid" | "already" | "invalid" | "confirming" | "done" | "error";

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    // Validate token via GET
    const validate = async () => {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${token}`;
        const res = await fetch(url, {
          headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        });
        const data = await res.json();
        if (res.ok && data.valid === true) {
          setStatus("valid");
        } else if (data.reason === "already_unsubscribed") {
          setStatus("already");
        } else {
          setStatus("invalid");
        }
      } catch {
        setStatus("invalid");
      }
    };
    validate();
  }, [token]);

  const handleConfirm = async () => {
    setStatus("confirming");
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      if (data?.success) {
        setStatus("done");
      } else if (data?.reason === "already_unsubscribed") {
        setStatus("already");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          {status === "loading" && (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Verifying…</p>
            </>
          )}

          {status === "valid" && (
            <>
              <MailX className="h-10 w-10 text-primary mx-auto" />
              <h1 className="text-xl font-semibold">Unsubscribe</h1>
              <p className="text-muted-foreground text-sm">
                Click below to unsubscribe from future emails.
              </p>
              <Button onClick={handleConfirm} className="w-full">
                Confirm Unsubscribe
              </Button>
            </>
          )}

          {status === "confirming" && (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Processing…</p>
            </>
          )}

          {status === "done" && (
            <>
              <CheckCircle2 className="h-10 w-10 text-primary mx-auto" />
              <h1 className="text-xl font-semibold">Unsubscribed</h1>
              <p className="text-muted-foreground text-sm">
                You've been successfully unsubscribed and will no longer receive these emails.
              </p>
            </>
          )}

          {status === "already" && (
            <>
              <CheckCircle2 className="h-10 w-10 text-muted-foreground mx-auto" />
              <h1 className="text-xl font-semibold">Already Unsubscribed</h1>
              <p className="text-muted-foreground text-sm">
                This email address has already been unsubscribed.
              </p>
            </>
          )}

          {(status === "invalid" || status === "error") && (
            <>
              <XCircle className="h-10 w-10 text-destructive mx-auto" />
              <h1 className="text-xl font-semibold">
                {status === "invalid" ? "Invalid Link" : "Something Went Wrong"}
              </h1>
              <p className="text-muted-foreground text-sm">
                {status === "invalid"
                  ? "This unsubscribe link is invalid or has expired."
                  : "We couldn't process your request. Please try again."}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
