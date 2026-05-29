import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Send, Loader2, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface EmailDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "invoice" | "quote";
  mode?: "document" | "receipt";
  documentId: string;
  documentNumber: string;
  documentTitle?: string | null;
  clientName?: string;
  clientEmail?: string | null;
  companyName?: string | null;
  total?: number;
  balanceDue?: number;
  dueDate?: string | null;
}

export function EmailDocumentDialog({
  open,
  onOpenChange,
  type,
  mode = "document",
  documentId,
  documentNumber,
  documentTitle,
  clientName,
  clientEmail,
  companyName,
  total,
  balanceDue,
  dueDate,
}: EmailDocumentDialogProps) {
  const label = type === "invoice" ? (mode === "receipt" ? "Receipt" : "Invoice") : "Estimate";
  const defaultSubject = mode === "receipt"
    ? `Payment receipt from ${companyName || "Us"} — ${documentNumber}`
    : `${label} from ${companyName || "Us"} — ${documentNumber}`;

  const amount = type === "invoice" ? (balanceDue ?? total ?? 0) : (total ?? 0);
  const amountLabel = type === "invoice" ? "balance due" : "total";

  const defaultBody = `Hi ${clientName || "there"},

${type === "invoice" && mode === "receipt"
    ? `Thanks for your payment. Your receipt for ${documentNumber} is ready.

You can view this paid invoice online using the link below.`
    : type === "invoice"
    ? `Please find attached your invoice ${documentNumber}. The ${amountLabel} is $${amount.toFixed(2)}${dueDate ? `, due by ${new Date(dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : ""}.

You can view and pay this invoice online using the link below.`
    : `Please find attached your estimate ${documentNumber} for $${amount.toFixed(2)}.

You can view and approve this estimate online using the link below.`
}

Thank you for your business!

${companyName || ""}`.trim();

  const [toEmail, setToEmail] = useState(clientEmail || "");
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const [sendCopy, setSendCopy] = useState(false);
  const [sending, setSending] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const handlePersonalize = async (tone: "friendly" | "professional" | "brief") => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("personalize-document-email", {
        body: {
          type,
          clientName,
          companyName,
          documentNumber,
          documentTitle,
          total,
          balanceDue,
          dueDate,
          tone,
        },
      });
      if (error) {
        const ctxBody = (error as any)?.context?.body;
        let msg = error.message;
        if (ctxBody) {
          try { const p = typeof ctxBody === "string" ? JSON.parse(ctxBody) : ctxBody; msg = p.error || msg; } catch {}
        }
        toast.error(msg || "Linq couldn't write that. Try again.");
        return;
      }
      if (data?.body) setBody(data.body);
    } catch (e: any) {
      toast.error(e?.message || "Network error");
    } finally {
      setAiLoading(false);
    }
  };

  // Reset fields when dialog opens
  const handleOpenChange = (val: boolean) => {
    if (val) {
      setToEmail(clientEmail || "");
      setSubject(defaultSubject);
      setBody(defaultBody);
      setSendCopy(false);
    }
    onOpenChange(val);
  };

  const handleSend = async () => {
    if (!toEmail.trim()) {
      toast.error("Please enter a recipient email");
      return;
    }

    setSending(true);
    try {
      // Build CTA URL
      const origin = window.location.origin;
      const ctaUrl = type === "invoice"
        ? `${origin}/pay/${documentId}`
        : `${origin}/quote/view/${documentId}`;
      const ctaLabel = type === "invoice"
        ? mode === "receipt"
          ? "View Paid Invoice"
          : "View & Pay Invoice"
        : "View & Approve Estimate";

      const emailPayload = {
        templateName: "document-email",
        recipientEmail: toEmail.trim(),
        idempotencyKey: `${type}-email-${documentId}-${Date.now()}`,
        templateData: {
          companyName: companyName || "Our Company",
          clientName: clientName || "there",
          body,
          ctaUrl,
          ctaLabel,
          documentType: label,
          documentNumber,
          subject,
        },
      };

      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: emailPayload,
      });

      if (error) throw error;

      // Send a copy to the logged-in user if requested
      if (sendCopy) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email && user.email !== toEmail.trim()) {
          await supabase.functions.invoke("send-transactional-email", {
            body: {
              ...emailPayload,
              recipientEmail: user.email,
              idempotencyKey: `${type}-copy-${documentId}-${Date.now()}`,
            },
          }).catch(console.error);
        }
      }

      // Update document status to "sent"
       if (type === "invoice" && mode !== "receipt") {
        await supabase.from("invoices").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", documentId);
       } else if (type === "quote") {
        await supabase.from("quotes").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", documentId);
      }

      toast.success(`${label} sent to ${toEmail}`);
      handleOpenChange(false);
    } catch (err: any) {
      console.error("Email send error:", err);
      toast.error(err.message || "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Send {label}
          </DialogTitle>
          <DialogDescription>
            Send {documentNumber} to your client via email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* To field */}
          <div className="space-y-1.5">
            <Label htmlFor="email-to" className="text-sm font-medium">To</Label>
            <div className="relative">
              <Input
                id="email-to"
                type="email"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder="client@example.com"
              />
              {toEmail && (
                <button
                  type="button"
                  onClick={() => setToEmail("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <Label htmlFor="email-subject" className="text-sm font-medium">Subject</Label>
            <Input
              id="email-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="email-body" className="text-sm font-medium">Message</Label>
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-muted-foreground hidden sm:inline">Write with Linq:</span>
                <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 text-primary" disabled={aiLoading} onClick={() => handlePersonalize("friendly")}>
                  {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  Friendly
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 text-primary" disabled={aiLoading} onClick={() => handlePersonalize("professional")}>
                  Professional
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 text-primary" disabled={aiLoading} onClick={() => handlePersonalize("brief")}>
                  Brief
                </Button>
              </div>
            </div>
            <Textarea
              id="email-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className="text-sm resize-none"
            />
          </div>

          {/* Send copy */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="send-copy"
              checked={sendCopy}
              onCheckedChange={(checked) => setSendCopy(checked === true)}
            />
            <Label htmlFor="send-copy" className="text-sm text-muted-foreground cursor-pointer">
              Send me a copy
            </Label>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending} className="gap-1.5">
            {sending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
            ) : (
              <><Send className="h-4 w-4" /> Send Email</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
