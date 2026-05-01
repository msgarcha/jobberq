import { Sparkles, Plus, X } from "lucide-react";
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
  const { suggestions, dismissSuggestion } = useQuoteSuggestions({
    docType,
    title,
    lineItems,
    enabled,
  });

  if (suggestions.length === 0) return null;

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2 animate-fade-in">
      <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
        <Sparkles className="h-3.5 w-3.5" />
        Linq suggests
      </div>
      <div className="space-y-1.5">
        {suggestions.map((s) => (
          <div key={s.key} className="flex items-center gap-2 bg-background rounded-lg p-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{s.description}</p>
              <p className="text-xs text-muted-foreground truncate">
                ${s.suggested_price.toLocaleString()} · {s.reason}
              </p>
            </div>
            <Button size="sm" variant="outline" className="h-8 gap-1 shrink-0" onClick={() => onAdd(s)}>
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0"
              onClick={() => dismissSuggestion(s.key)}
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
