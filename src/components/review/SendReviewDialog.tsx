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
import { Copy, Send, Star, ExternalLink } from "lucide-react";
import { useCreateReviewRequest } from "@/hooks/useReviews";
import { useToast } from "@/hooks/use-toast";

interface SendReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId?: string;
  jobId?: string;
  clientName?: string;
}

export function SendReviewDialog({
  open,
  onOpenChange,
  clientId: presetClientId,
  jobId,
  clientName,
}: SendReviewDialogProps) {
  const [selectedClientId, setSelectedClientId] = useState(presetClientId || "");
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const createReview = useCreateReviewRequest();
  const { toast } = useToast();

  const clientIdToUse = presetClientId || selectedClientId;

  const handleCreate = async () => {
    if (!clientIdToUse) return;
    const result = await createReview.mutateAsync({
      client_id: clientIdToUse,
      job_id: jobId,
    });
    setCreatedToken((result as any).token);
  };

  const reviewUrl = createdToken
    ? `${window.location.origin}/review/${createdToken}`
    : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(reviewUrl);
    toast({ title: "Review link copied to clipboard!" });
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setCreatedToken(null);
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
            Send your client a branded review link. Great reviews get redirected to Google.
          </DialogDescription>
        </DialogHeader>

        {!createdToken ? (
          <div className="space-y-4 pt-2">
            {!presetClientId && (
              <div className="space-y-1.5">
                <Label>Client</Label>
                <ClientSelector
                  value={selectedClientId}
                  onChange={setSelectedClientId}
                />
              </div>
            )}
            {clientName && (
              <p className="text-sm">
                Sending review request to <span className="font-medium">{clientName}</span>
              </p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!clientIdToUse || createReview.isPending}
                className="gap-1.5"
              >
                <Send className="h-4 w-4" />
                {createReview.isPending ? "Creating…" : "Create Link"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="rounded-xl bg-secondary p-4 space-y-3">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Review Link</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-background p-2 rounded-lg border truncate">
                  {reviewUrl}
                </code>
                <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1 shrink-0">
                  <Copy className="h-3.5 w-3.5" /> Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this link with your client via email, text, or any messaging app.
              </p>
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
