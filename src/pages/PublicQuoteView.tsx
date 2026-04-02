import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, CheckCircle2, AlertCircle, FileText, Phone, Mail, Globe, Download } from "lucide-react";

interface QuoteData {
  quote: {
    id: string;
    quote_number: string;
    title: string | null;
    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    total: number;
    status: string;
    valid_until: string | null;
    created_at: string;
    client_notes: string | null;
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
    website: string | null;
  } | null;
}

export default function PublicQuoteView() {
  const { quoteId } = useParams<{ quoteId: string }>();
  const [data, setData] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    if (!quoteId) return;
    loadQuote();
  }, [quoteId]);

  const loadQuote = async () => {
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/public-quote`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quote_id: quoteId }),
        }
      );
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      setData(result);
      if (result.quote.status === "approved") setApproved(true);
    } catch (err: any) {
      setError(err.message || "Quote not found");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!quoteId) return;
    setApproving(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/approve-quote`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quote_id: quoteId }),
        }
      );
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      setApproved(true);
    } catch (err: any) {
      setError(err.message || "Failed to approve");
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(40,23%,96%)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(200,10%,46%)]" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-[hsl(40,23%,96%)] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-[hsl(0,60%,52%)] mb-3" />
          <h2 className="text-lg font-semibold text-[hsl(200,30%,14%)] mb-1">Estimate Not Found</h2>
          <p className="text-sm text-[hsl(200,10%,46%)]">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { quote, line_items, company } = data;
  const isApproved = approved || quote.status === "approved";
  const isExpired = quote.status === "expired";
  const canApprove = quote.status === "sent" && !isApproved;

  const companyAddress = [company?.address_line1, company?.city, company?.state, company?.zip]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="min-h-screen bg-[hsl(40,23%,96%)]">
      {/* Company Header Bar */}
      <div className="bg-[hsl(192,60%,22%)] text-white">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          {company?.logo_url && (
            <img src={company.logo_url} alt="" className="h-10 w-10 object-contain rounded bg-white/10 p-1" />
          )}
          <span className="font-semibold text-lg">{company?.company_name || "Estimate"}</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Approved banner */}
        {isApproved && (
          <div className="bg-white rounded-xl shadow-lg p-6 text-center space-y-3">
            <CheckCircle2 className="h-14 w-14 mx-auto text-[hsl(152,52%,42%)]" />
            <h2 className="text-2xl font-bold text-[hsl(200,30%,14%)]">Estimate Approved!</h2>
            <p className="text-[hsl(200,10%,46%)]">
              Thank you for approving this estimate. {company?.company_name || "We"} will be in touch soon.
            </p>
          </div>
        )}

        {/* Expired banner */}
        {isExpired && (
          <div className="bg-white rounded-xl shadow-lg p-6 text-center space-y-3">
            <AlertCircle className="h-14 w-14 mx-auto text-[hsl(36,80%,50%)]" />
            <h2 className="text-2xl font-bold text-[hsl(200,30%,14%)]">Estimate Expired</h2>
            <p className="text-[hsl(200,10%,46%)]">
              This estimate has expired. Please contact {company?.company_name || "us"} for an updated quote.
            </p>
          </div>
        )}

        {/* Main estimate card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-[hsl(40,15%,88%)]">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-[hsl(192,60%,22%)]" />
                  <span className="text-sm font-medium text-[hsl(200,10%,46%)]">ESTIMATE</span>
                </div>
                <h1 className="text-xl font-bold text-[hsl(200,30%,14%)]">{quote.quote_number}</h1>
                {quote.title && <p className="text-sm text-[hsl(200,10%,46%)] mt-0.5">{quote.title}</p>}
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-[hsl(200,30%,14%)]">
                  ${Number(quote.total).toFixed(2)}
                </p>
                <p className="text-xs text-[hsl(200,10%,46%)] mt-0.5">CAD</p>
              </div>
            </div>

            {/* Meta info */}
            <div className="flex gap-4 mt-3 text-xs text-[hsl(200,10%,46%)]">
              <span>Issued: {new Date(quote.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              {quote.valid_until && (
                <span>Valid Until: {new Date(quote.valid_until).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
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
                  <span>${Number(quote.subtotal).toFixed(2)}</span>
                </div>
                {Number(quote.tax_amount) > 0 && (
                  <div className="flex justify-between text-[hsl(200,10%,46%)]">
                    <span>Tax</span>
                    <span>${Number(quote.tax_amount).toFixed(2)}</span>
                  </div>
                )}
                {Number(quote.discount_amount) > 0 && (
                  <div className="flex justify-between text-[hsl(200,10%,46%)]">
                    <span>Discount</span>
                    <span>-${Number(quote.discount_amount).toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg text-[hsl(200,30%,14%)] pt-1">
                  <span>Total</span>
                  <span>${Number(quote.total).toFixed(2)} CAD</span>
                </div>
              </div>
            </div>
          </div>

          {/* Client notes */}
          {quote.client_notes && (
            <div className="px-6 py-4 bg-[hsl(40,23%,96%)] border-t border-[hsl(40,15%,88%)]">
              <p className="text-xs font-medium text-[hsl(200,10%,46%)] mb-1">NOTES</p>
              <p className="text-sm text-[hsl(200,30%,14%)] whitespace-pre-wrap">{quote.client_notes}</p>
            </div>
          )}

          {/* Approve CTA */}
          {canApprove && (
            <div className="px-6 py-5 bg-[hsl(40,23%,96%)] border-t border-[hsl(40,15%,88%)]">
              <Button
                onClick={handleApprove}
                disabled={approving}
                className="w-full h-12 text-base gap-2 bg-[hsl(152,52%,42%)] hover:bg-[hsl(152,52%,36%)] text-white"
                size="lg"
              >
                {approving ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Approving…</>
                ) : (
                  <><CheckCircle2 className="h-5 w-5" /> Approve Estimate</>
                )}
              </Button>
            </div>
          )}
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
              {company.website && (
                <p className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" /> {company.website}
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
