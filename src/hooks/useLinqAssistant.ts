import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { speak, cancelSpeech, isSpeechSynthesisSupported } from "@/lib/ai/voice";

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

export type AssistantStatus = "idle" | "listening" | "thinking" | "speaking";

export function useLinqAssistant() {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestDocs, setLatestDocs] = useState<CreatedDoc[]>([]);
  const [status, setStatus] = useState<AssistantStatus>("idle");
  const [speakReplies, setSpeakReplies] = useState<boolean>(() => isSpeechSynthesisSupported());
  const speakRepliesRef = useRef(speakReplies);
  useEffect(() => { speakRepliesRef.current = speakReplies; }, [speakReplies]);

  const send = useCallback(async (text: string): Promise<SendResult | null> => {
    if (!text.trim()) return null;
    setError(null);
    setIsLoading(true);
    setStatus("thinking");
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
        setStatus("idle");
        return null;
      }

      const reply = data?.reply || "Done.";
      const createdDocs = data?.createdDocs || [];
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
      setLatestDocs(createdDocs);

      if (speakRepliesRef.current && reply) {
        setStatus("speaking");
        speak(reply, { onEnd: () => setStatus("idle") });
      } else {
        setStatus("idle");
      }
      return { reply, createdDocs };
    } catch (e: any) {
      const msg = e?.message || "Network error";
      setError(msg);
      setMessages((m) => [...m, { role: "assistant", content: msg }]);
      setStatus("idle");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const reset = useCallback(() => {
    cancelSpeech();
    setMessages([]);
    setError(null);
    setLatestDocs([]);
    setStatus("idle");
  }, []);

  return {
    messages,
    isLoading,
    error,
    latestDocs,
    status,
    setStatus,
    speakReplies,
    setSpeakReplies,
    send,
    reset,
  };
}
