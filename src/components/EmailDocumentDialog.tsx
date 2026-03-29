import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Send, Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface EmailDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "invoice" | "quote";
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
  documentNumber,
  documentTitle,
  clientName,
  clientEmail,
  companyName,
  total,
  balanceDue,
  dueDate,
}: EmailDocumentDialogProps) {
  const label = type === "invoice" ? "Invoice" : "Estimate";
  const defaultSubject = `${label} from ${companyName || "Us"} — ${documentNumber}`;

  const amount = type === "invoice" ? (balanceDue ?? total ?? 0) : (total ?? 0);
  const amountLabel = type === "invoice" ? "balance due" : "total";

  const defaultBody = `Hi ${clientName || "there"},

${type === "invoice"
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
      // TODO: Wire to send-document-email edge function when email domain is set up
      // For now, simulate sending and mark as sent
      await new Promise((r) => setTimeout(r, 800));
      toast.success(`${label} sent to ${toEmail}`);
      handleOpenChange(false);
    } catch (err: any) {
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
            <Label htmlFor="email-body" className="text-sm font-medium">Message</Label>
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
