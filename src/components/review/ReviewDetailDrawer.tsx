import { useState } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Copy, Send, ExternalLink, AlertTriangle, CheckCircle, Clock, Mail, Phone, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useResendReviewRequest, useDeleteReviewRequest } from "@/hooks/useReviews";
import { format } from "date-fns";
import { buildReviewUrl } from "@/lib/reviewLinks";

interface ReviewDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: any | null;
}

export function ReviewDetailDrawer({ open, onOpenChange, review }: ReviewDetailDrawerProps) {
  const { toast } = useToast();
  const resend = useResendReviewRequest();
  const del = useDeleteReviewRequest();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!review) return null;

  const client = review.clients;
  const clientName = client ? `${client.first_name} ${client.last_name}` : "Unknown";
  const reviewUrl = buildReviewUrl(review.short_token, review.token);

  const isCompleted = review.status === "completed";
  const isPositive = isCompleted && (review.rating ?? 0) >= 4;
  const isNegative = isCompleted && (review.rating ?? 0) <= 3;
  const isPending = review.status === "pending";

  const copyLink = () => {
    navigator.clipboard.writeText(reviewUrl);
    toast({ title: "Review link copied!" });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display flex items-center gap-2">
            <Star className="h-5 w-5 text-[hsl(36,80%,50%)]" />
            Review Details
          </SheetTitle>
          <SheetDescription>
            Submitted {review.submitted_at ? format(new Date(review.submitted_at), "MMM d, yyyy 'at' h:mm a") : "—"}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 mt-6">
          {/* Status banner */}
          {isNegative && (
            <div className="rounded-xl bg-status-warning/10 border border-status-warning/30 p-3 flex gap-2">
              <AlertTriangle className="h-5 w-5 text-status-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Private feedback — not sent to Google</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Reach out personally to fix the issue before they post publicly.
                </p>
              </div>
            </div>
          )}
          {isPositive && (
            <div className="rounded-xl bg-status-success/10 border border-status-success/30 p-3 flex gap-2">
              <CheckCircle className="h-5 w-5 text-status-success shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">
                  {review.redirected_to_google ? "Sent to Google" : "Positive review"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {review.posted_to_google_confirmed_at
                    ? `Customer confirmed they posted on ${format(new Date(review.posted_to_google_confirmed_at), "MMM d")}`
                    : review.redirected_to_google
                    ? "We showed them the Google review button. Posting is up to them."
                    : "Set your Google Review URL in Settings to redirect 5★ reviews to Google."}
                </p>
              </div>
            </div>
          )}
          {isPending && (
            <div className="rounded-xl bg-status-warning/10 border border-status-warning/30 p-3 flex gap-2">
              <Clock className="h-5 w-5 text-status-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Waiting on response</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sent {format(new Date(review.created_at), "MMM d")}. Expires {format(new Date(review.expires_at), "MMM d, yyyy")}.
                </p>
              </div>
            </div>
          )}

          {/* Client */}
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Client</p>
            <p className="font-medium text-base">{clientName}</p>
            {client?.email && (
              <a href={`mailto:${client.email}`} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5">
                <Mail className="h-3 w-3" /> {client.email}
              </a>
            )}
            {client?.phone && (
              <a href={`tel:${client.phone}`} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5">
                <Phone className="h-3 w-3" /> {client.phone}
              </a>
            )}
            {review.jobs?.job_number && (
              <Badge variant="outline" className="text-[10px]">{review.jobs.job_number} · {review.jobs.title}</Badge>
            )}
          </div>

          {/* Rating */}
          {isCompleted && (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Rating</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-7 w-7 ${
                      s <= (review.rating || 0)
                        ? "fill-[hsl(36,80%,50%)] text-[hsl(36,80%,50%)]"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Feedback */}
          {review.feedback && (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Feedback</p>
              <div className="rounded-xl bg-secondary p-3">
                <p className="text-sm italic">"{review.feedback}"</p>
              </div>
            </div>
          )}

          {isCompleted && !review.feedback && (
            <p className="text-sm text-muted-foreground italic">No written feedback was provided.</p>
          )}

          {/* Link */}
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Review link</p>
            <div className="flex gap-2">
              <code className="flex-1 text-xs bg-secondary p-2 rounded-lg truncate">{reviewUrl}</code>
              <Button variant="outline" size="sm" onClick={copyLink} className="shrink-0 gap-1">
                <Copy className="h-3.5 w-3.5" /> Copy
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-2">
            {isPending && (
              <Button
                onClick={() => resend.mutate(review.id)}
                disabled={resend.isPending}
                className="gap-1.5"
              >
                <Send className="h-4 w-4" />
                {resend.isPending ? "Sending…" : "Resend reminder email"}
              </Button>
            )}
            {isPositive && !review.posted_to_google_confirmed_at && review.redirected_to_google && (
              <Button
                variant="outline"
                onClick={() => resend.mutate(review.id)}
                disabled={resend.isPending}
                className="gap-1.5"
              >
                <ExternalLink className="h-4 w-4" />
                Send Google reminder
              </Button>
            )}
            {isNegative && client?.phone && (
              <Button asChild className="gap-1.5">
                <a href={`tel:${client.phone}`}>
                  <Phone className="h-4 w-4" /> Call client now
                </a>
              </Button>
            )}
            {isNegative && client?.email && (
              <Button variant="outline" asChild className="gap-1.5">
                <a href={`mailto:${client.email}?subject=Following up on your feedback`}>
                  <Mail className="h-4 w-4" /> Email client
                </a>
              </Button>
            )}

            {/* Delete / Cancel */}
            <Button
              variant="ghost"
              onClick={() => setConfirmDelete(true)}
              className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 mt-1"
            >
              <Trash2 className="h-4 w-4" />
              {isPending ? "Cancel & delete request" : "Remove from history"}
            </Button>
          </div>
        </div>
      </SheetContent>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isPending ? "Cancel this review request?" : "Delete this review?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isPending
                ? "The link will stop working immediately. You can always send a new request."
                : "This will permanently remove this review from your history. This cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await del.mutateAsync(review.id);
                setConfirmDelete(false);
                onOpenChange(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
