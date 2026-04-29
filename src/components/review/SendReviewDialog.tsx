import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ClientSelector } from "@/components/ClientSelector";
import { Copy, Send, Star, Mail, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useCreateReviewRequest } from "@/hooks/useReviews";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { buildReviewUrl } from "@/lib/reviewLinks";

interface SendReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId?: string;
  jobId?: string;
  clientName?: string;
}

interface SentResult {
  reviewUrl: string;
  emailedTo: string | null;
  emailError?: string;
}

export function SendReviewDialog({
  open,
  onOpenChange,
  clientId: presetClientId,
  jobId,
  clientName,
}: SendReviewDialogProps) {
  const [selectedClientId, setSelectedClientId] = useState(presetClientId || "");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<SentResult | null>(null);
  const createReview = useCreateReviewRequest();
  const { toast } = useToast();

  const clientIdToUse = presetClientId || selectedClientId;

  const handleSend = async () => {
    if (!clientIdToUse) return;
    setSending(true);
    try {
      // 1. Create the review request
      const created: any = await createReview.mutateAsync({
        client_id: clientIdToUse,
        job_id: jobId,
      });

      const shortToken = created.short_token || created.token;
      const reviewUrl = buildReviewUrl(created.short_token, created.token);

      // 2. Look up client email + company name for the email send
      const [{ data: client }, { data: settings }] = await Promise.all([
        supabase
          .from("clients")
          .select("first_name, email")
          .eq("id", clientIdToUse)
          .maybeSingle(),
        supabase
          .from("company_settings")
          .select("company_name")
          .eq("team_id", created.team_id)
          .maybeSingle(),
      ]);

      // 3. If no email on file, skip send and let owner copy the link
      if (!client?.email) {
        setResult({ reviewUrl, emailedTo: null });
        toast({
          title: "Link created",
          description: "Client has no email on file — copy the link to share.",
        });
        return;
      }

      // 4. Send branded email automatically
      let emailError: string | undefined;
      try {
        const { error: sendErr } = await supabase.functions.invoke(
          "send-transactional-email",
          {
            body: {
              templateName: "review-request",
              recipientEmail: client.email,
              idempotencyKey: `review-req-${created.id}`,
              templateData: {
                clientName: client.first_name,
                companyName: settings?.company_name || "us",
                reviewUrl,
                isReminder: false,
              },
            },
          }
        );
        if (sendErr) emailError = sendErr.message;
      } catch (e) {
        emailError = (e as Error).message;
      }

      setResult({
        reviewUrl,
        emailedTo: emailError ? null : client.email,
        emailError,
      });

      if (emailError) {
        toast({
          title: "Link created, email failed",
          description: "Copy the link below and share it manually.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Review request sent",
          description: `Email delivered to ${client.email}`,
        });
      }
    } catch (e) {
      toast({
        title: "Could not send",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.reviewUrl);
    toast({ title: "Link copied to clipboard!" });
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setResult(null);
      setSelectedClientId("");
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Star className="h-5 w-5 text-[hsl(36,80%,50%)]" />
            Request a Review
          </DialogTitle>
          <DialogDescription>
            We'll email your client a branded review link. Great reviews get redirected to Google.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4 pt-2">
            {!presetClientId && (
              <div className="space-y-1.5">
                <Label>Client</Label>
                <ClientSelector
                  value={selectedClientId}
                  onChange={setSelectedClientId}
                />
                <p className="text-xs text-muted-foreground">
                  Client must have an email on file to receive the request automatically.
                </p>
              </div>
            )}
            {clientName && (
              <p className="text-sm">
                Sending review request to <span className="font-medium">{clientName}</span>
              </p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => handleClose(false)} disabled={sending}>
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={!clientIdToUse || sending}
                className="gap-1.5"
              >
                <Send className="h-4 w-4" />
                {sending ? "Sending…" : "Send Review Request"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {result.emailedTo ? (
              <div className="rounded-xl bg-status-success/10 border border-status-success/30 p-4 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-status-success shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Email sent</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {result.emailedTo}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-status-warning/10 border border-status-warning/30 p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-status-warning shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {result.emailError ? "Email could not be delivered" : "Client has no email on file"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Copy the link below and share it via text or messaging app.
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-xl bg-secondary p-3 space-y-2">
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                {result.emailedTo ? "Or share manually" : "Review link"}
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-background p-2 rounded-lg border truncate">
                  {result.reviewUrl}
                </code>
                <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1 shrink-0">
                  <Copy className="h-3.5 w-3.5" /> Copy
                </Button>
              </div>
            </div>

            <Button className="w-full" onClick={() => handleClose(false)}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
