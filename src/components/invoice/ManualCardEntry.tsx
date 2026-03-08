import { useState } from "react";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useRecordPayment } from "@/hooks/useInvoices";
import { useSaveCard } from "@/hooks/useSavedCards";
import { Loader2, CreditCard, Lock } from "lucide-react";
import { toast } from "sonner";

interface ManualCardEntryProps {
  invoiceId: string;
  clientId: string | null;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

function CardForm({ invoiceId, clientId, amount, onSuccess, onCancel }: ManualCardEntryProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [saveCard, setSaveCard] = useState(false);
  const recordPayment = useRecordPayment();
  const saveCardMutation = useSaveCard();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    try {
      // Create payment intent
      const { data, error } = await supabase.functions.invoke("create-payment-intent", {
        body: { invoice_id: invoiceId, amount, save_card: saveCard, client_id: clientId },
      });
      if (error) throw new Error(error.message);

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error("Card element not found");

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        data.client_secret,
        { payment_method: { card: cardElement } }
      );

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (paymentIntent?.status === "succeeded") {
        // Record payment
        await recordPayment.mutateAsync({
          invoice_id: invoiceId,
          amount,
          payment_method: "credit_card",
          stripe_payment_id: paymentIntent.id,
          notes: "Paid via card",
        });

        // Save card if requested
        if (saveCard && clientId && paymentIntent.payment_method && data.customer_id) {
          try {
            const pmId = typeof paymentIntent.payment_method === "string"
              ? paymentIntent.payment_method
              : paymentIntent.payment_method.id;
            
            // We'll save with basic info - the edge function can fetch full details if needed
            await saveCardMutation.mutateAsync({
              client_id: clientId,
              stripe_customer_id: data.customer_id,
              stripe_payment_method_id: pmId,
              card_brand: "card",
              card_last4: "****",
              card_exp_month: 0,
              card_exp_year: 0,
            });
          } catch {
            // Non-critical, card save failed but payment succeeded
          }
        }

        toast.success("Payment successful!");
        onSuccess();
      }
    } catch (err: any) {
      toast.error(err.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <CreditCard className="h-4 w-4 text-primary" />
          Card Details
        </div>
        <div className="rounded-lg border border-input bg-background p-3.5">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "hsl(200, 30%, 14%)",
                  fontFamily: "'DM Sans', sans-serif",
                  "::placeholder": { color: "hsl(200, 10%, 46%)" },
                },
                invalid: { color: "hsl(0, 65%, 51%)" },
              },
            }}
          />
        </div>
      </div>

      {clientId && (
        <div className="flex items-center gap-2.5">
          <Checkbox
            id="save-card"
            checked={saveCard}
            onCheckedChange={(c) => setSaveCard(c === true)}
          />
          <Label htmlFor="save-card" className="text-sm text-muted-foreground cursor-pointer">
            Save card on file for future payments
          </Label>
        </div>
      )}

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" />
        Payments are securely processed by Stripe
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 gap-1.5 bg-primary hover:bg-primary/90"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Processing…
            </>
          ) : (
            `Pay $${amount.toFixed(2)}`
          )}
        </Button>
      </div>
    </form>
  );
}

export function ManualCardEntry(props: ManualCardEntryProps) {
  const stripePromise = getStripe();

  if (!stripePromise) {
    return (
      <div className="text-center py-6 space-y-2">
        <p className="text-sm text-muted-foreground">
          Stripe is not configured. Please add your Stripe publishable key.
        </p>
        <Button variant="outline" size="sm" onClick={props.onCancel}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <CardForm {...props} />
    </Elements>
  );
}
