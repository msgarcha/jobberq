import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CreatedDoc {
  type: "quote" | "invoice" | "client" | "job";
  id: string;
  number?: string;
  total?: number;
}

interface SendResult {
  reply: string;
  createdDocs: CreatedDoc[];
}

export function useLinqAssistant() {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestDocs, setLatestDocs] = useState<CreatedDoc[]>([]);

  const send = useCallback(async (text: string): Promise<SendResult | null> => {
    if (!text.trim()) return null;
    setError(null);
    setIsLoading(true);
    setLatestDocs([]);

    const userMsg: AssistantMessage = { role: "user", content: text.trim() };
    const next = [...messages, userMsg];
    setMessages(next);

    try {
      const { data, error: invokeErr } = await supabase.functions.invoke("linq-assistant", {
        body: { messages: next },
      });

      if (invokeErr) {
        let errMsg = invokeErr.message;
        let upgradeRequired = false;
        const ctxBody = (invokeErr as any)?.context?.body;
        if (ctxBody) {
          try {
            const parsed = typeof ctxBody === "string" ? JSON.parse(ctxBody) : ctxBody;
            errMsg = parsed.error || errMsg;
            upgradeRequired = !!parsed.upgrade_required;
          } catch { /* ignore */ }
        }
        setError(errMsg || "Linq couldn't respond");
        const display = upgradeRequired
          ? `${errMsg} Upgrade in Settings → Subscription to keep going.`
          : errMsg || "Something went wrong.";
        setMessages((m) => [...m, { role: "assistant", content: display }]);
        return null;
      }

      const reply = data?.reply || "Done.";
      const createdDocs = data?.createdDocs || [];
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
      setLatestDocs(createdDocs);
      return { reply, createdDocs };
    } catch (e: any) {
      const msg = e?.message || "Network error";
      setError(msg);
      setMessages((m) => [...m, { role: "assistant", content: msg }]);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const reset = useCallback(() => {
    setMessages([]);
    setError(null);
    setLatestDocs([]);
  }, []);

  return { messages, isLoading, error, latestDocs, send, reset };
}
