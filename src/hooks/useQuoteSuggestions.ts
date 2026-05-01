import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

export interface AISuggestion {
  key: string;
  description: string;
  suggested_price: number;
  reason: string;
  confidence: number;
}

interface Args {
  docType: "quote" | "invoice";
  title: string;
  lineItems: { description: string; unit_price: number }[];
  enabled: boolean;
}

export function useQuoteSuggestions({ docType, title, lineItems, enabled }: Args) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Debounce on a stable signature
  const signature = JSON.stringify({
    title,
    items: lineItems.map((li) => ({ d: li.description, p: li.unit_price })),
  });
  const debounced = useDebouncedValue(signature, 1500);

  useEffect(() => {
    if (!enabled || lineItems.length === 0) {
      setSuggestions([]);
      return;
    }
    // Skip very small quotes
    const total = lineItems.reduce((s, li) => s + (li.unit_price || 0), 0);
    if (lineItems.length === 1 && total < 200) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    supabase.functions
      .invoke("quote-suggestions", {
        body: { doc_type: docType, title, line_items: lineItems },
      })
      .then(({ data }) => {
        if (cancelled) return;
        const list = (data?.suggestions || []) as AISuggestion[];
        setSuggestions(list.filter((s) => !dismissed.has(s.key)));
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, docType, enabled]);

  const dismissSuggestion = async (key: string) => {
    setDismissed((s) => new Set(s).add(key));
    setSuggestions((curr) => curr.filter((c) => c.key !== key));
    // Persist team-level dismissal
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: tm } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!tm?.team_id) return;
    const dismissedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await supabase
      .from("ai_dismissed_suggestions")
      .upsert(
        { team_id: tm.team_id, suggestion_key: key, dismissed_until: dismissedUntil, dismiss_count: 1 },
        { onConflict: "team_id,suggestion_key" }
      );
  };

  return { suggestions, loading, dismissSuggestion };
}
