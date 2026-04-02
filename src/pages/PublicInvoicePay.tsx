import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, CreditCard, Lock, CheckCircle2, AlertCircle, FileText, Phone, Mail, Globe, Download } from "lucide-react";

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
    website?: string | null;
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
      <div className="rounded-lg border border-[hsl(40,15%,88%)] bg-white p-4">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#1a2a3a",
                fontFamily: "system-ui, sans-serif",
                "::placeholder": { color: "#9ca3af" },
              },
              invalid: { color: "#ef4444" },
            },
          }}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-[hsl(0,60%,52%)] bg-[hsl(0,60%,97%)] rounded-lg p-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex items-center gap-1.5 text-xs text-[hsl(200,10%,46%)]">
        <Lock className="h-3 w-3" />
        Payments are securely processed by Stripe
      </div>

      <Button
        type="submit"
        disabled={!stripe || loading}
        className="w-full h-12 text-base gap-2 bg-[hsl(192,60%,22%)] hover:bg-[hsl(192,60%,18%)] text-white"
        size="lg"
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
        ) : (
          <><CreditCard className="h-5 w-5" /> Pay ${amount.toFixed(2)} CAD</>
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
      <div className="min-h-screen bg-[hsl(40,23%,96%)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(200,10%,46%)]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[hsl(40,23%,96%)] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-[hsl(0,60%,52%)] mb-3" />
          <h2 className="text-lg font-semibold text-[hsl(200,30%,14%)] mb-1">Invoice Not Found</h2>
          <p className="text-sm text-[hsl(200,10%,46%)]">{error || "This invoice could not be loaded."}</p>
        </div>
      </div>
    );
  }

  const { invoice, line_items, company } = data;
  const isPaid = invoice.status === "paid" || paid;
  const balanceDue = Number(invoice.balance_due);

  const companyAddress = [company?.address_line1, company?.city, company?.state, company?.zip]
    .filter(Boolean)
    .join(", ");

  if (isPaid) {
    return (
      <div className="min-h-screen bg-[hsl(40,23%,96%)]">
        <div className="bg-[hsl(192,60%,22%)] text-white">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
            {company?.logo_url && (
              <img src={company.logo_url} alt="" className="h-10 w-10 object-contain rounded bg-white/10 p-1" />
            )}
            <span className="font-semibold text-lg">{company?.company_name || "Invoice"}</span>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center space-y-3">
            <CheckCircle2 className="h-16 w-16 mx-auto text-[hsl(152,52%,42%)]" />
            <h2 className="text-2xl font-bold text-[hsl(200,30%,14%)]">Payment Received!</h2>
            <p className="text-[hsl(200,10%,46%)]">Thank you for your payment.</p>
            {company?.company_name && (
              <p className="text-sm text-[hsl(200,10%,60%)]">Paid to {company.company_name}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const stripePromise = getStripe();

  return (
    <div className="min-h-screen bg-[hsl(40,23%,96%)] print-public-page">
      {/* Company Header Bar */}
      <div className="bg-[hsl(192,60%,22%)] text-white">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          {company?.logo_url && (
            <img src={company.logo_url} alt="" className="h-10 w-10 object-contain rounded bg-white/10 p-1" />
          )}
          <span className="font-semibold text-lg">{company?.company_name || "Invoice"}</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Main Invoice Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-[hsl(40,15%,88%)]">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-[hsl(192,60%,22%)]" />
                  <span className="text-sm font-medium text-[hsl(200,10%,46%)]">INVOICE</span>
                </div>
                <h1 className="text-xl font-bold text-[hsl(200,30%,14%)]">{invoice.invoice_number}</h1>
                {invoice.title && <p className="text-sm text-[hsl(200,10%,46%)] mt-0.5">{invoice.title}</p>}
              </div>
              <div className="text-right">
                <p className="text-xs text-[hsl(200,10%,46%)] mb-0.5">BALANCE DUE</p>
                <p className="text-3xl font-bold text-[hsl(200,30%,14%)]">
                  ${balanceDue.toFixed(2)}
                </p>
                <p className="text-xs text-[hsl(200,10%,46%)] mt-0.5">CAD</p>
              </div>
            </div>

            {/* Meta info */}
            <div className="flex gap-4 mt-3 text-xs text-[hsl(200,10%,46%)]">
              <span>Issued: {new Date(invoice.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              {invoice.due_date && (
                <span className="font-medium">Due: {new Date(invoice.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              )}
            </div>
          </div>

          {/* Line Items */}
          <div className="px-6 py-4">
            <div className="space-y-3">
              {line_items.map((item, i) => (
                <div key={i} className="flex justify-between items-start py-2 border-b border-[hsl(40,15%,93%)] last:border-0">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-sm font-medium text-[hsl(200,30%,14%)]">{item.description}</p>
                    <p className="text-xs text-[hsl(200,10%,46%)] mt-0.5">
                      {item.quantity} × ${Number(item.unit_price).toFixed(2)}
                      {Number(item.tax_rate) > 0 && ` · ${item.tax_rate}% tax`}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-[hsl(200,30%,14%)] shrink-0">
                    ${Number(item.line_total).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Totals */}
          <div className="px-6 py-4">
            <div className="flex justify-end">
              <div className="w-52 space-y-1.5 text-sm">
                <div className="flex justify-between text-[hsl(200,10%,46%)]">
                  <span>Subtotal</span>
                  <span>${Number(invoice.subtotal).toFixed(2)}</span>
                </div>
                {Number(invoice.tax_amount) > 0 && (
                  <div className="flex justify-between text-[hsl(200,10%,46%)]">
                    <span>Tax</span>
                    <span>${Number(invoice.tax_amount).toFixed(2)}</span>
                  </div>
                )}
                {Number(invoice.discount_amount) > 0 && (
                  <div className="flex justify-between text-[hsl(200,10%,46%)]">
                    <span>Discount</span>
                    <span>-${Number(invoice.discount_amount).toFixed(2)}</span>
                  </div>
                )}
                {Number(invoice.amount_paid) > 0 && (
                  <div className="flex justify-between text-[hsl(152,52%,42%)]">
                    <span>Paid</span>
                    <span>-${Number(invoice.amount_paid).toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg text-[hsl(200,30%,14%)] pt-1">
                  <span>Amount Due</span>
                  <span>${balanceDue.toFixed(2)} CAD</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          {balanceDue > 0 && company?.stripe_charges_enabled && stripePromise ? (
            <div className="px-6 py-5 bg-[hsl(40,23%,96%)] border-t border-[hsl(40,15%,88%)]">
              <h3 className="text-sm font-semibold text-[hsl(200,30%,14%)] mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Pay Now
              </h3>
              <Elements stripe={stripePromise}>
                <PaymentForm
                  invoiceId={invoice.id}
                  amount={balanceDue}
                  onSuccess={() => setPaid(true)}
                />
              </Elements>
            </div>
          ) : balanceDue > 0 ? (
            <div className="px-6 py-5 bg-[hsl(40,23%,96%)] border-t border-[hsl(40,15%,88%)] text-center text-sm text-[hsl(200,10%,46%)]">
              Online payment is not available for this invoice. Please contact {company?.company_name || "the business"} directly.
            </div>
          ) : null}

          {/* Download PDF */}
          <div className="px-6 py-4 border-t border-[hsl(40,15%,88%)]">
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="w-full h-10 gap-2 text-sm"
            >
              <Download className="h-4 w-4" /> Download PDF
            </Button>
          </div>
        </div>

        {/* Company Footer */}
        {company && (
          <div className="bg-white rounded-xl shadow-lg px-6 py-5">
            <div className="flex items-center gap-3 mb-3">
              {company.logo_url && (
                <img src={company.logo_url} alt="" className="h-8 w-8 object-contain" />
              )}
              <span className="font-semibold text-[hsl(200,30%,14%)]">{company.company_name}</span>
            </div>
            <div className="space-y-1.5 text-sm text-[hsl(200,10%,46%)]">
              {companyAddress && <p>{companyAddress}</p>}
              {company.phone && (
                <p className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> {company.phone}
                </p>
              )}
              {company.email && (
                <p className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> {company.email}
                </p>
              )}
              {(company as any).website && (
                <p className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" /> {(company as any).website}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Powered by */}
        <p className="text-center text-xs text-[hsl(200,10%,46%)] pb-6">
          Powered by <span className="font-semibold text-[hsl(192,60%,22%)]">QuickLinq</span>
        </p>
      </div>
    </div>
  );
}
