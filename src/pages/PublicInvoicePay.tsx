import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, CreditCard, Lock, CheckCircle2, AlertCircle } from "lucide-react";

interface InvoiceData {
  invoice: {
    id: string;
    invoice_number: string;
    title: string | null;
    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    total: number;
    balance_due: number;
    amount_paid: number;
    status: string;
    due_date: string | null;
    created_at: string;
    clients: {
      first_name: string;
      last_name: string;
      company_name: string | null;
      email: string | null;
    } | null;
  };
  line_items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    tax_rate: number;
    discount_percent: number;
  }>;
  company: {
    company_name: string | null;
    logo_url: string | null;
    email: string | null;
    phone: string | null;
    address_line1: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    stripe_charges_enabled: boolean;
  } | null;
}

function PaymentForm({ invoiceId, amount, onSuccess }: { invoiceId: string; amount: number; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/create-payment-intent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invoice_id: invoiceId, amount, public_pay: true }),
        }
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error("Card element not found");

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        data.client_secret,
        { payment_method: { card: cardElement } }
      );

      if (stripeError) throw new Error(stripeError.message);
      if (paymentIntent?.status === "succeeded") {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border border-input bg-background p-4">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#1a1a2e",
                fontFamily: "system-ui, sans-serif",
                "::placeholder": { color: "#9ca3af" },
              },
              invalid: { color: "#ef4444" },
            },
          }}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <Lock className="h-3 w-3" />
        Payments are securely processed by Stripe
      </div>

      <Button
        type="submit"
        disabled={!stripe || loading}
        className="w-full h-12 text-base gap-2"
        size="lg"
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
        ) : (
          <>
            <CreditCard className="h-5 w-5" />
            Pay ${amount.toFixed(2)} CAD
          </>
        )}
      </Button>
    </form>
  );
}

export default function PublicInvoicePay() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [data, setData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (!invoiceId) return;
    loadInvoice();
  }, [invoiceId]);

  const loadInvoice = async () => {
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/public-invoice`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invoice_id: invoiceId }),
        }
      );
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      setData(result);
    } catch (err: any) {
      setError(err.message || "Invoice not found");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-red-400 mb-3" />
            <h2 className="text-lg font-semibold mb-1">Invoice Not Found</h2>
            <p className="text-sm text-gray-500">{error || "This invoice could not be loaded."}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { invoice, line_items, company } = data;
  const isPaid = invoice.status === "paid" || paid;
  const balanceDue = Number(invoice.balance_due);

  if (isPaid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center space-y-3">
            <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
            <h2 className="text-2xl font-bold">Payment Received!</h2>
            <p className="text-gray-500">Thank you for your payment.</p>
            {company?.company_name && (
              <p className="text-sm text-gray-400">Paid to {company.company_name}</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const stripePromise = getStripe();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Company Header */}
        <div className="text-center space-y-2">
          {company?.logo_url && (
            <img src={company.logo_url} alt="" className="h-12 mx-auto object-contain" />
          )}
          {company?.company_name && (
            <h1 className="text-lg font-semibold text-gray-900">{company.company_name}</h1>
          )}
        </div>

        {/* Invoice Summary */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Invoice {invoice.invoice_number}</CardTitle>
              <Badge variant="secondary">{invoice.status}</Badge>
            </div>
            {invoice.title && <p className="text-sm text-gray-500">{invoice.title}</p>}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Line Items */}
            <div className="space-y-2">
              {line_items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 truncate">{item.description}</p>
                    <p className="text-xs text-gray-500">
                      {item.quantity} × ${Number(item.unit_price).toFixed(2)}
                    </p>
                  </div>
                  <span className="font-medium ml-4">${Number(item.line_total).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>${Number(invoice.subtotal).toFixed(2)}</span>
              </div>
              {Number(invoice.tax_amount) > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>Tax</span>
                  <span>${Number(invoice.tax_amount).toFixed(2)}</span>
                </div>
              )}
              {Number(invoice.discount_amount) > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>Discount</span>
                  <span>-${Number(invoice.discount_amount).toFixed(2)}</span>
                </div>
              )}
              {Number(invoice.amount_paid) > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>Paid</span>
                  <span>-${Number(invoice.amount_paid).toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg pt-1">
                <span>Amount Due</span>
                <span>${balanceDue.toFixed(2)} CAD</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment */}
        {balanceDue > 0 && company?.stripe_charges_enabled && stripePromise ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Pay Now
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Elements stripe={stripePromise}>
                <PaymentForm
                  invoiceId={invoice.id}
                  amount={balanceDue}
                  onSuccess={() => setPaid(true)}
                />
              </Elements>
            </CardContent>
          </Card>
        ) : balanceDue > 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-sm text-gray-500">
              Online payment is not available for this invoice. Please contact {company?.company_name || "the business"} directly.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
