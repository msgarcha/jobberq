import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Star, X, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  useReviewSuggestions,
  useDismissReviewSuggestion,
  useMarkReviewSuggestionSent,
} from "@/hooks/useReviewSuggestions";

/**
 * Linq-curated inbox of paid invoices that look ripe for a review request.
 * Renders nothing when there are no pending suggestions.
 */
export function ReviewSuggestionsCard() {
  const navigate = useNavigate();
  const { data: suggestions, isLoading } = useReviewSuggestions();
  const dismiss = useDismissReviewSuggestion();
  const markSent = useMarkReviewSuggestionSent();

  if (isLoading || !suggestions || suggestions.length === 0) return null;

  return (
    <Card className="shadow-warm border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-display font-semibold flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Sparkles className="h-4 w-4" />
          </div>
          Linq found {suggestions.length} review {suggestions.length === 1 ? "opportunity" : "opportunities"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {suggestions.slice(0, 5).map((s) => {
          const name = s.client ? `${s.client.first_name} ${s.client.last_name}`.trim() : "Client";
          return (
            <div
              key={s.id}
              className="flex items-center gap-3 rounded-xl border bg-card p-3"
            >
              <div className="h-9 w-9 rounded-lg bg-yellow-500/10 text-yellow-600 flex items-center justify-center shrink-0">
                <Star className="h-4 w-4 fill-current" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  Paid {s.invoice?.invoice_number} · ${Number(s.invoice?.total || 0).toLocaleString()}
                </p>
              </div>
              <Button
                size="sm"
                variant="default"
                className="h-8 gap-1 shrink-0"
                onClick={() => {
                  markSent.mutate(s.id);
                  navigate(`/reviews?client=${s.client_id}`);
                }}
              >
                <Send className="h-3.5 w-3.5" />
                Request
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0"
                onClick={() => dismiss.mutate(s.id)}
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
