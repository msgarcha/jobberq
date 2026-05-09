import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Send, Sparkles, FileText, Receipt, Loader2, ArrowRight, X, Volume2, VolumeX } from "lucide-react";
import { useLinqAssistant, type CreatedDoc } from "@/hooks/useLinqAssistant";
import { isVoiceSupported, startVoiceCapture, cancelSpeech, isSpeechSynthesisSupported, speak } from "@/lib/ai/voice";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { haptic } from "@/lib/native/haptics";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { VoiceOrb } from "./VoiceOrb";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EXAMPLES = [
  "When did I last invoice Mark Henderson?",
  "What invoices are overdue?",
  "Quote Mark Henderson 10k for bathroom reno",
];

export function AssistantSheet({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const {
    messages,
    isLoading,
    send,
    reset,
    latestDocs,
    status,
    speakReplies,
    setSpeakReplies,
    setSpeechBoundaryHandler,
  } = useLinqAssistant();
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [interim, setInterim] = useState("");
  const [pulseKey, setPulseKey] = useState(0);
  const [firstName, setFirstName] = useState<string>("");
  const voiceRef = useRef<{ stop: () => void } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const greetedRef = useRef(false);
  const voiceSupported = isVoiceSupported();
  const ttsSupported = isSpeechSynthesisSupported();

  // Fetch display name once for personalized greeting
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        const raw = (data?.display_name || user.email?.split("@")[0] || "").trim();
        setFirstName(raw.split(/\s+/)[0] || "");
      });
  }, [user]);

  // Wire orb pulse to TTS word boundaries
  useEffect(() => {
    setSpeechBoundaryHandler(() => setPulseKey((k) => k + 1));
    return () => setSpeechBoundaryHandler(null);
  }, [setSpeechBoundaryHandler]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (voiceMode) endVoiceCall();
        else onOpenChange(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onOpenChange, voiceMode]);

  useEffect(() => {
    if (open) {
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
    }
  }, [messages, open, latestDocs]);

  useEffect(() => {
    if (!open) {
      voiceRef.current?.stop();
      voiceRef.current = null;
      setListening(false);
      setVoiceMode(false);
      setInterim("");
      greetedRef.current = false;
      cancelSpeech();
    }
  }, [open]);

  // Stop voice + TTS when the page goes to background (iOS Safari kills audio on backgrounding)
  useEffect(() => {
    if (!open) return;
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        voiceRef.current?.stop();
        voiceRef.current = null;
        setListening(false);
        cancelSpeech();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [open]);

  const startListening = useCallback((mode: "dictate" | "chat") => {
    if (!voiceSupported) {
      toast({ title: "Voice not supported", description: "Try Chrome or Safari." });
      return;
    }
    cancelSpeech();
    setListening(true);
    setInterim("");
    voiceRef.current = startVoiceCapture(
      (text) => {
        if (mode === "chat") setInterim(text);
        else setInput(text);
      },
      async () => {
        setListening(false);
        if (mode === "chat") {
          setInterim((curr) => {
            const trimmed = curr.trim();
            if (trimmed && !isLoading) send(trimmed);
            return "";
          });
        }
      },
      (err) => {
        toast({ title: "Voice error", description: err, variant: "destructive" });
        setListening(false);
      },
      mode === "chat" ? { silenceTimeoutMs: 1400 } : {}
    );
  }, [voiceSupported, toast, isLoading, send]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    voiceRef.current?.stop();
    setListening(false);
    await send(text);
  };

  // Voice-chat loop
  useEffect(() => {
    if (!open || !voiceMode) return;
    if (status === "idle" && !listening && !isLoading) {
      const t = setTimeout(() => startListening("chat"), 300);
      return () => clearTimeout(t);
    }
  }, [open, voiceMode, status, listening, isLoading, startListening]);

  const startVoiceCall = () => {
    if (!voiceSupported) {
      toast({ title: "Voice not supported", description: "Try Chrome or Safari, or update the app." });
      return;
    }
    // First-time hint so the OS permission prompt feels expected
    try {
      const KEY = "linq.voice.permHinted";
      if (!localStorage.getItem(KEY)) {
        toast({ title: "Linq needs your mic", description: "Allow microphone access so we can chat." });
        localStorage.setItem(KEY, "1");
      }
    } catch { /* ignore */ }
    setVoiceMode(true);
    if (!speakReplies) setSpeakReplies(true);
    // Personalized greeting on first call
    if (!greetedRef.current && ttsSupported) {
      greetedRef.current = true;
      const name = firstName || "there";
      const greeting = messages.length === 0
        ? `Hey ${name}, Linq here. What are we working on?`
        : `Hey ${name}, I'm back. What's next?`;
      speak(greeting, {
        onBoundary: () => setPulseKey((k) => k + 1),
        onEnd: () => startListening("chat"),
      });
    } else {
      startListening("chat");
    }
  };

  const endVoiceCall = () => {
    setVoiceMode(false);
    voiceRef.current?.stop();
    voiceRef.current = null;
    setListening(false);
    setInterim("");
    cancelSpeech();
  };

  const toggleMicMute = () => {
    if (listening) {
      voiceRef.current?.stop();
      voiceRef.current = null;
      setListening(false);
    } else {
      startListening("chat");
    }
  };

  const openDoc = (doc: CreatedDoc) => {
    onOpenChange(false);
    if (doc.type === "quote") navigate(`/quotes/${doc.id}/edit`);
    else if (doc.type === "invoice") navigate(`/invoices/${doc.id}/edit`);
  };

  const lastReply = [...messages].reverse().find((m) => m.role === "assistant")?.content;

  if (!open) return null;

  const orbState =
    status === "thinking" ? "thinking" :
    status === "speaking" ? "speaking" :
    listening ? "listening" :
    "idle";

  return (
    <div
      className={cn(
        "fixed z-50 bg-background border shadow-2xl flex flex-col overflow-hidden",
        "inset-x-0 bottom-0 h-[85vh] rounded-t-3xl",
        "md:inset-x-auto md:bottom-4 md:right-4 md:w-[400px] md:h-[min(620px,80vh)] md:rounded-2xl md:border-border",
        "animate-in slide-in-from-bottom-4 fade-in duration-200"
      )}
      role="dialog"
      aria-label="Linq Assistant"
    >
      <div className="px-5 py-4 border-b shrink-0 flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <span className="font-semibold text-base">Linq Assistant</span>
          <span className="text-xs font-normal text-muted-foreground ml-1 truncate hidden sm:inline">
            {voiceMode ? "voice mode · always review drafts" : "drafts only · always review"}
          </span>
        </div>
        {ttsSupported && !voiceMode && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => {
              const next = !speakReplies;
              setSpeakReplies(next);
              if (!next) cancelSpeech();
            }}
            className="h-8 w-8 shrink-0"
            aria-label={speakReplies ? "Mute spoken replies" : "Unmute spoken replies"}
            title={speakReplies ? "Mute voice" : "Unmute voice"}
          >
            {speakReplies ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
          </Button>
        )}
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => onOpenChange(false)}
          className="h-8 w-8 shrink-0"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 relative flex flex-col min-h-0">
        {voiceMode && (
          <VoiceOrb
            state={orbState}
            transcript={interim}
            reply={lastReply}
            micMuted={!listening && status === "idle"}
            speakerMuted={!speakReplies}
            onToggleMic={toggleMicMute}
            onToggleSpeaker={() => {
              const next = !speakReplies;
              setSpeakReplies(next);
              if (!next) cancelSpeech();
            }}
            onEndCall={endVoiceCall}
            pulseKey={pulseKey}
          />
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground text-center">
                Tell me what you need — I'll draft it for you to review.
              </p>
              <div className="space-y-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setInput(ex)}
                    className="w-full text-left text-sm rounded-xl bg-secondary/60 px-4 py-3 hover:bg-secondary transition-colors flex items-center gap-2"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate">{ex}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-secondary text-foreground rounded-bl-md"
                )}
              >
                {m.content}
              </div>
            </div>
          ))}

          {!isLoading &&
            latestDocs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => openDoc(doc)}
                className="w-full rounded-2xl border-2 border-primary/30 bg-primary/5 p-4 text-left hover:bg-primary/10 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                    {doc.type === "quote" ? <FileText className="h-5 w-5" /> : <Receipt className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">
                      Draft {doc.type} {doc.number}
                    </p>
                    {doc.total != null && (
                      <p className="text-xs text-muted-foreground">
                        ${Number(doc.total).toLocaleString()} · tap to review & send
                      </p>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))}

          {isLoading && !voiceMode && (
            <div className="flex justify-start">
              <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Linq is thinking…</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {!voiceMode && (
        <div className="border-t p-3 shrink-0 safe-area-bottom bg-background">
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask Linq to draft something…"
              className="min-h-[44px] max-h-[120px] resize-none rounded-2xl"
              rows={1}
              disabled={isLoading}
            />
            {input.trim() ? (
              <Button
                type="button"
                size="icon"
                onClick={handleSend}
                className="h-11 w-11 rounded-full shrink-0"
                disabled={isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            ) : (
              <button
                type="button"
                onClick={startVoiceCall}
                disabled={isLoading || !voiceSupported}
                className={cn(
                  "relative h-11 w-11 rounded-full shrink-0 flex items-center justify-center",
                  "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/30",
                  "hover:shadow-primary/50 hover:scale-105 active:scale-95 transition-all",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                aria-label="Start voice chat with Linq"
                title="Tap to talk to Linq"
              >
                <span className="absolute inset-0 rounded-full bg-primary/40 animate-pulse-ring pointer-events-none" />
                <Mic className="h-5 w-5 relative z-10" />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between mt-2 px-1">
            <span className="text-[11px] text-muted-foreground">
              {voiceSupported ? "Tap mic to start a voice call" : ""}
            </span>
            {messages.length > 0 && (
              <button
                onClick={reset}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear conversation
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
