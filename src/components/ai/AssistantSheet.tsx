import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, Send, Sparkles, FileText, Receipt, Loader2, ArrowRight } from "lucide-react";
import { useLinqAssistant, type CreatedDoc } from "@/hooks/useLinqAssistant";
import { isVoiceSupported, startVoiceCapture } from "@/lib/ai/voice";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EXAMPLES = [
  "Quote Mark Henderson 10k for bathroom reno",
  "Invoice Sarah for the window cleaning quote that was approved",
  "New client: Tom Wilson, 555-1234, lawn care",
];

export function AssistantSheet({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { messages, isLoading, send, reset, latestDocs } = useLinqAssistant();
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const voiceRef = useRef<{ stop: () => void } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const voiceSupported = isVoiceSupported();

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
    }
  }, [open]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    voiceRef.current?.stop();
    setListening(false);
    await send(text);
  };

  const handleMicToggle = () => {
    if (listening) {
      voiceRef.current?.stop();
      voiceRef.current = null;
      setListening(false);
      return;
    }
    if (!voiceSupported) {
      toast({ title: "Voice not supported", description: "Try Chrome or Safari." });
      return;
    }
    setListening(true);
    voiceRef.current = startVoiceCapture(
      (text) => setInput(text),
      () => setListening(false),
      (err) => {
        toast({ title: "Voice error", description: err, variant: "destructive" });
        setListening(false);
      }
    );
  };

  const openDoc = (doc: CreatedDoc) => {
    onOpenChange(false);
    if (doc.type === "quote") navigate(`/quotes/${doc.id}/edit`);
    else if (doc.type === "invoice") navigate(`/invoices/${doc.id}/edit`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] p-0 rounded-t-3xl flex flex-col">
        <SheetHeader className="px-5 py-4 border-b shrink-0">
          <SheetTitle className="flex items-center gap-2 text-base">
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
            Linq Assistant
            <span className="text-xs font-normal text-muted-foreground ml-1">drafts only · always review</span>
          </SheetTitle>
        </SheetHeader>

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

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Linq is thinking…</span>
              </div>
            </div>
          )}
        </div>

        <div className="border-t p-3 shrink-0 safe-area-bottom bg-background">
          <div className="flex items-end gap-2">
            <Button
              type="button"
              size="icon"
              variant={listening ? "destructive" : "outline"}
              onClick={handleMicToggle}
              className="h-11 w-11 rounded-full shrink-0"
              disabled={isLoading}
            >
              {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={listening ? "Listening…" : "Ask Linq to draft something…"}
              className="min-h-[44px] max-h-[120px] resize-none rounded-2xl"
              rows={1}
              disabled={isLoading}
            />
            <Button
              type="button"
              size="icon"
              onClick={handleSend}
              className="h-11 w-11 rounded-full shrink-0"
              disabled={!input.trim() || isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {messages.length > 0 && (
            <button
              onClick={reset}
              className="text-xs text-muted-foreground mt-2 mx-auto block hover:text-foreground transition-colors"
            >
              Clear conversation
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
