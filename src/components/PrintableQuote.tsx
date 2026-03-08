import { format } from "date-fns";
import type { CompanySettings } from "@/hooks/useCompanySettings";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount_percent: number;
  line_total: number;
}

interface Client {
  first_name: string;
  last_name: string;
  company_name?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface Quote {
  quote_number: string;
  title?: string | null;
  status: string;
  created_at: string;
  valid_until?: string | null;
  sent_at?: string | null;
  approved_at?: string | null;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  client_notes?: string | null;
}

interface Props {
  quote: Quote;
  lineItems: LineItem[];
  client: Client | null;
  company: CompanySettings | null;
}

export function PrintableQuote({ quote, lineItems, client, company }: Props) {
  return (
    <div className="print-document p-8 max-w-[800px] mx-auto bg-background text-foreground font-sans text-sm">
      {/* Header */}
      <div className="flex justify-between items-start mb-8 border-b border-border pb-6">
        <div>
          {company?.logo_url && (
            <img src={company.logo_url} alt="Logo" className="h-12 mb-2 object-contain" />
          )}
          <h2 className="text-lg font-bold">{company?.company_name || "Your Company"}</h2>
          {company?.email && <p className="text-muted-foreground text-xs">{company.email}</p>}
          {company?.phone && <p className="text-muted-foreground text-xs">{company.phone}</p>}
          {company?.address_line1 && <p className="text-muted-foreground text-xs">{company.address_line1}</p>}
          {(company?.city || company?.state || company?.zip) && (
            <p className="text-muted-foreground text-xs">
              {[company.city, company.state, company.zip].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-bold tracking-tight">QUOTE</h1>
          <p className="font-semibold text-base mt-1">{quote.quote_number}</p>
          {quote.title && <p className="text-muted-foreground text-xs mt-1">{quote.title}</p>}
        </div>
      </div>

      {/* Prepared For + Details */}
      <div className="flex justify-between mb-8">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Prepared For</p>
          {client ? (
            <>
              <p className="font-medium">{client.first_name} {client.last_name}</p>
              {client.company_name && <p className="text-muted-foreground text-xs">{client.company_name}</p>}
              {client.email && <p className="text-muted-foreground text-xs">{client.email}</p>}
              {client.phone && <p className="text-muted-foreground text-xs">{client.phone}</p>}
            </>
          ) : (
            <p className="text-muted-foreground">—</p>
          )}
        </div>
        <div className="text-right text-xs space-y-0.5">
          <div><span className="text-muted-foreground">Date: </span>{format(new Date(quote.created_at), "MMM d, yyyy")}</div>
          {quote.valid_until && <div><span className="text-muted-foreground">Valid Until: </span>{format(new Date(quote.valid_until), "MMM d, yyyy")}</div>}
          <div className="mt-2">
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium uppercase ${
              quote.status === "approved" ? "bg-emerald-100 text-emerald-800" :
              quote.status === "expired" ? "bg-red-100 text-red-800" : "bg-muted text-muted-foreground"
            }`}>
              {quote.status}
            </span>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <table className="w-full mb-6 border-collapse">
        <thead>
          <tr className="border-b-2 border-foreground/20">
            <th className="text-left py-2 font-semibold">Description</th>
            <th className="text-right py-2 font-semibold w-[60px]">Qty</th>
            <th className="text-right py-2 font-semibold w-[90px]">Price</th>
            <th className="text-right py-2 font-semibold w-[60px]">Tax</th>
            <th className="text-right py-2 font-semibold w-[90px]">Total</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map((li) => (
            <tr key={li.id} className="border-b border-border">
              <td className="py-2">{li.description}</td>
              <td className="text-right py-2">{Number(li.quantity)}</td>
              <td className="text-right py-2">${Number(li.unit_price).toFixed(2)}</td>
              <td className="text-right py-2">{Number(li.tax_rate)}%</td>
              <td className="text-right py-2 font-medium">${Number(li.line_total).toFixed(2)}</td>
            </tr>
          ))}
          {lineItems.length === 0 && (
            <tr><td colSpan={5} className="text-center py-4 text-muted-foreground">No line items</td></tr>
          )}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-[250px] space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${Number(quote.subtotal).toFixed(2)}</span></div>
          {Number(quote.discount_amount) > 0 && (
            <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>-${Number(quote.discount_amount).toFixed(2)}</span></div>
          )}
          <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>${Number(quote.tax_amount).toFixed(2)}</span></div>
          <div className="flex justify-between font-bold border-t border-foreground/20 pt-1 text-base">
            <span>Total</span><span>${Number(quote.total).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {quote.client_notes && (
        <div className="border-t border-border pt-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
          <p className="text-xs text-muted-foreground whitespace-pre-wrap">{quote.client_notes}</p>
        </div>
      )}
    </div>
  );
}
