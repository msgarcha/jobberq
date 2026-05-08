import { Sparkles, Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuoteSuggestions, type AISuggestion } from "@/hooks/useQuoteSuggestions";

interface Props {
  docType: "quote" | "invoice";
  title: string;
  lineItems: { description: string; unit_price: number; tax_rate: number }[];
  onAdd: (s: AISuggestion) => void;
  enabled?: boolean;
}

export function SuggestionChip({ docType, title, lineItems, onAdd, enabled = true }: Props) {
  const { suggestions, loading, dismissSuggestion } = useQuoteSuggestions({
    docType,
    title,
    lineItems,
    enabled,
  });

  if (loading && suggestions.length === 0) {
    return (
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 flex items-center gap-2 text-sm text-primary animate-fade-in">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Linq is thinking<span className="animate-pulse">...</span></span>
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-3 space-y-2 animate-fade-in">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
        <Sparkles className="h-3.5 w-3.5" />
        Linq suggests
      </div>
      <div className="space-y-1.5">
        {suggestions.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => onAdd(s)}
            className="w-full flex items-center gap-2 bg-background hover:bg-primary/10 hover:border-primary/40 border border-transparent rounded-lg p-2.5 text-left transition-colors cursor-pointer group"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{s.description}</p>
              <p className="text-xs text-muted-foreground truncate">
                ${s.suggested_price.toLocaleString()} · {s.reason}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary opacity-80 group-hover:opacity-100 shrink-0">
              <Plus className="h-3.5 w-3.5" /> Add
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                dismissSuggestion(s.key);
              }}
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </button>
        ))}
      </div>
    </div>
  );
}
