import { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRecordPayment } from "@/hooks/useInvoices";
import { useSavedCards } from "@/hooks/useSavedCards";
import { ManualCardEntry } from "./ManualCardEntry";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  CreditCard,
  Banknote,
  FileText,
  ChevronRight,
  Pencil,
  Loader2,
  Wallet,
  CircleDollarSign,
} from "lucide-react";

type View = "main" | "manual-card" | "cash" | "cheque" | "other";

interface CollectPaymentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  clientId: string | null;
  balanceDue: number;
  invoiceNumber: string;
  onPaymentRecorded: () => void;
}

function CollectPaymentContent({
  invoiceId,
  clientId,
  balanceDue,
  invoiceNumber,
  onPaymentRecorded,
  onClose,
}: CollectPaymentSheetProps & { onClose: () => void }) {
  const [view, setView] = useState<View>("main");
  const [amount, setAmount] = useState(balanceDue);
  const [editingAmount, setEditingAmount] = useState(false);
  const [chargingCard, setChargingCard] = useState<string | null>(null);
  const recordPayment = useRecordPayment();
  const { data: savedCards } = useSavedCards(clientId);

  const handleRecordPayment = async (method: "cash" | "check" | "other") => {
    try {
      await recordPayment.mutateAsync({
        invoice_id: invoiceId,
        amount,
        payment_method: method,
      });
      onPaymentRecorded();
      onClose();
    } catch {
      // Error handled by hook
    }
  };

  const handleChargeCard = async (cardId: string) => {
    setChargingCard(cardId);
    try {
      const { data, error } = await supabase.functions.invoke("charge-saved-card", {
        body: { invoice_id: invoiceId, saved_card_id: cardId, amount },
      });
      if (error) throw new Error(error.message);
      if (data?.status === "succeeded") {
        toast.success("Payment successful!");
        onPaymentRecorded();
        onClose();
      } else {
        toast.error("Payment failed. Please try another method.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to charge card");
    } finally {
      setChargingCard(null);
    }
  };

  const handleStripeCheckout = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("create-invoice-checkout", {
        body: { invoice_id: invoiceId },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create checkout");
    }
  };

  if (view === "manual-card") {
    return (
      <div className="px-1">
        <ManualCardEntry
          invoiceId={invoiceId}
          clientId={clientId}
          amount={amount}
          onSuccess={() => {
            onPaymentRecorded();
            onClose();
          }}
          onCancel={() => setView("main")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Amount */}
      <div className="text-center pb-2">
        {editingAmount ? (
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-bold text-foreground">$</span>
            <Input
              type="number"
              min={0.01}
              step="0.01"
              max={balanceDue}
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-32 text-2xl font-bold text-center h-12"
              autoFocus
              onBlur={() => setEditingAmount(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingAmount(false)}
            />
          </div>
        ) : (
          <button
            onClick={() => setEditingAmount(true)}
            className="inline-flex items-center gap-2 group"
          >
            <span className="text-3xl font-bold text-foreground">
              ${amount.toFixed(2)}
            </span>
            <Pencil className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
        <p className="text-sm text-muted-foreground mt-1">
          Payment for {invoiceNumber}
        </p>
      </div>

      {/* Saved Cards */}
      {savedCards && savedCards.length > 0 && (
        <div className="space-y-2">
          {savedCards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleChargeCard(card.id)}
              disabled={!!chargingCard}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors text-left"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground capitalize">
                  {card.card_brand} •••• {card.card_last4}
                </p>
                <p className="text-xs text-muted-foreground">Card on file</p>
              </div>
              {chargingCard === card.id ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Pay with Stripe */}
      <Button
        onClick={handleStripeCheckout}
        className="w-full h-12 text-base gap-2 bg-primary hover:bg-primary/90"
        size="lg"
      >
        <Wallet className="h-5 w-5" />
        Pay with Stripe
      </Button>

      {/* Manual Card Entry */}
      <button
        onClick={() => setView("manual-card")}
        className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors text-left"
      >
        <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
          <CreditCard className="h-5 w-5 text-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Manual Card Entry</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* Divider */}
      <div className="relative py-1">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          or record payment
        </span>
      </div>

      {/* Cash */}
      <button
        onClick={() => handleRecordPayment("cash")}
        disabled={recordPayment.isPending}
        className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors text-left"
      >
        <div className="h-10 w-10 rounded-lg bg-status-success/10 flex items-center justify-center">
          <Banknote className="h-5 w-5 text-status-success" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Cash</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* Cheque */}
      <button
        onClick={() => handleRecordPayment("check")}
        disabled={recordPayment.isPending}
        className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors text-left"
      >
        <div className="h-10 w-10 rounded-lg bg-status-info/10 flex items-center justify-center">
          <FileText className="h-5 w-5 text-status-info" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Cheque</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* Other */}
      <button
        onClick={() => handleRecordPayment("other")}
        disabled={recordPayment.isPending}
        className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors text-left"
      >
        <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
          <CircleDollarSign className="h-5 w-5 text-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Other Payment Record</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}

export function CollectPaymentSheet(props: CollectPaymentSheetProps) {
  const isMobile = useIsMobile();

  const content = (
    <CollectPaymentContent {...props} onClose={() => props.onOpenChange(false)} />
  );

  if (isMobile) {
    return (
      <Drawer open={props.open} onOpenChange={props.onOpenChange}>
        <DrawerContent className="px-4 pb-8 max-h-[90vh] overflow-y-auto">
          <DrawerHeader className="px-0 pb-2">
            <DrawerTitle className="text-xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Collect Payment
            </DrawerTitle>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Collect Payment
          </DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
