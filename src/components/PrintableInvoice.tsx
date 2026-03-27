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

interface Invoice {
  invoice_number: string;
  title?: string | null;
  status: string;
  created_at: string;
  due_date?: string | null;
  sent_at?: string | null;
  paid_at?: string | null;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  amount_paid: number;
  balance_due: number;
  client_notes?: string | null;
  payment_terms?: string | null;
}

interface Props {
  invoice: Invoice;
  lineItems: LineItem[];
  client: Client | null;
  company: CompanySettings | null;
}

export function PrintableInvoice({ invoice, lineItems, client, company }: Props) {
  const primaryColor = (company as any)?.pdf_primary_color || "#1a1a1a";
  const accentColor = (company as any)?.pdf_accent_color || "#6366f1";
  const style = (company as any)?.pdf_style || "classic";

  const statusBadge = (status: string) => {
    const base = "inline-block px-2 py-0.5 rounded text-xs font-medium uppercase";
    if (status === "paid") return `${base}` ;
    if (status === "overdue") return `${base}`;
    return `${base}`;
  };

  const statusBgColor = (status: string) => {
    if (status === "paid") return { backgroundColor: `${accentColor}20`, color: accentColor };
    if (status === "overdue") return { backgroundColor: "#fee2e2", color: "#991b1b" };
    return { backgroundColor: "#f3f4f6", color: "#6b7280" };
  };

  if (style === "modern") {
    return (
      <div className="print-document max-w-[800px] mx-auto bg-white font-sans text-sm" style={{ color: "#333" }}>
        {/* Colored Header Band */}
        <div className="px-8 py-6" style={{ backgroundColor: accentColor }}>
          <div className="flex justify-between items-start">
            <div className="text-white">
              {company?.logo_url && (
                <img src={company.logo_url} alt="Logo" className="h-12 mb-2 object-contain rounded" />
              )}
              <h2 className="text-lg font-bold">{company?.company_name || "Your Company"}</h2>
              {company?.email && <p className="text-white/80 text-xs">{company.email}</p>}
              {company?.phone && <p className="text-white/80 text-xs">{company.phone}</p>}
            </div>
            <div className="text-right text-white">
              <h1 className="text-2xl font-bold tracking-tight">INVOICE</h1>
              <p className="font-semibold text-base mt-1">{invoice.invoice_number}</p>
              {invoice.title && <p className="text-white/70 text-xs mt-1">{invoice.title}</p>}
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Address Bar */}
          {(company?.address_line1 || company?.city) && (
            <p className="text-xs mb-6" style={{ color: "#888" }}>
              {[company.address_line1, [company.city, company.state, company.zip].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}
            </p>
          )}

          {/* Bill To + Details */}
          <div className="flex justify-between mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: accentColor }}>Bill To</p>
              {client ? (
                <>
                  <p className="font-medium">{client.first_name} {client.last_name}</p>
                  {client.company_name && <p className="text-xs" style={{ color: "#888" }}>{client.company_name}</p>}
                  {client.email && <p className="text-xs" style={{ color: "#888" }}>{client.email}</p>}
                  {client.phone && <p className="text-xs" style={{ color: "#888" }}>{client.phone}</p>}
                </>
              ) : <p style={{ color: "#888" }}>—</p>}
            </div>
            <div className="text-right text-xs space-y-0.5">
              <div><span style={{ color: "#888" }}>Date: </span>{format(new Date(invoice.created_at), "MMM d, yyyy")}</div>
              {invoice.due_date && <div><span style={{ color: "#888" }}>Due: </span>{format(new Date(invoice.due_date), "MMM d, yyyy")}</div>}
              {invoice.payment_terms && <div><span style={{ color: "#888" }}>Terms: </span>{invoice.payment_terms}</div>}
              <div className="mt-2">
                <span className={statusBadge(invoice.status)} style={statusBgColor(invoice.status)}>{invoice.status}</span>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <table className="w-full mb-6 border-collapse">
            <thead>
              <tr style={{ borderBottom: `2px solid ${accentColor}` }}>
                <th className="text-left py-2 font-semibold" style={{ color: primaryColor }}>Description</th>
                <th className="text-right py-2 font-semibold w-[60px]" style={{ color: primaryColor }}>Qty</th>
                <th className="text-right py-2 font-semibold w-[90px]" style={{ color: primaryColor }}>Price</th>
                <th className="text-right py-2 font-semibold w-[60px]" style={{ color: primaryColor }}>Tax</th>
                <th className="text-right py-2 font-semibold w-[90px]" style={{ color: primaryColor }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((li, i) => (
                <tr key={li.id} style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: i % 2 === 0 ? "transparent" : "#f9fafb" }}>
                  <td className="py-2">{li.description}</td>
                  <td className="text-right py-2">{Number(li.quantity)}</td>
                  <td className="text-right py-2">${Number(li.unit_price).toFixed(2)}</td>
                  <td className="text-right py-2">{Number(li.tax_rate)}%</td>
                  <td className="text-right py-2 font-medium">${Number(li.line_total).toFixed(2)}</td>
                </tr>
              ))}
              {lineItems.length === 0 && (
                <tr><td colSpan={5} className="text-center py-4" style={{ color: "#888" }}>No line items</td></tr>
              )}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-[250px] space-y-1 text-sm rounded-lg p-4" style={{ backgroundColor: "#f9fafb" }}>
              <div className="flex justify-between"><span style={{ color: "#888" }}>Subtotal</span><span>${Number(invoice.subtotal).toFixed(2)}</span></div>
              {Number(invoice.discount_amount) > 0 && (
                <div className="flex justify-between"><span style={{ color: "#888" }}>Discount</span><span>-${Number(invoice.discount_amount).toFixed(2)}</span></div>
              )}
              <div className="flex justify-between"><span style={{ color: "#888" }}>Tax</span><span>${Number(invoice.tax_amount).toFixed(2)}</span></div>
              <div className="flex justify-between font-bold pt-1 text-base" style={{ borderTop: `2px solid ${accentColor}`, color: primaryColor }}>
                <span>Total</span><span>${Number(invoice.total).toFixed(2)}</span>
              </div>
              {Number(invoice.amount_paid) > 0 && (
                <>
                  <div className="flex justify-between"><span style={{ color: "#888" }}>Paid</span><span>${Number(invoice.amount_paid).toFixed(2)}</span></div>
                  <div className="flex justify-between font-bold" style={{ color: primaryColor }}><span>Balance Due</span><span>${Number(invoice.balance_due).toFixed(2)}</span></div>
                </>
              )}
            </div>
          </div>

          {invoice.client_notes && (
            <div style={{ borderTop: `1px solid ${accentColor}30` }} className="pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: accentColor }}>Notes</p>
              <p className="text-xs whitespace-pre-wrap" style={{ color: "#888" }}>{invoice.client_notes}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (style === "minimal") {
    return (
      <div className="print-document p-10 max-w-[800px] mx-auto bg-white font-sans text-sm" style={{ color: "#333" }}>
        {/* Header */}
        <div className="flex justify-between items-start mb-12">
          <div>
            {company?.logo_url && (
              <img src={company.logo_url} alt="Logo" className="h-10 mb-3 object-contain" />
            )}
            <h2 className="text-lg font-bold" style={{ color: primaryColor }}>{company?.company_name || "Your Company"}</h2>
            <p className="text-xs mt-1" style={{ color: "#aaa" }}>
              {[company?.email, company?.phone].filter(Boolean).join(" · ")}
            </p>
            {company?.address_line1 && (
              <p className="text-xs" style={{ color: "#aaa" }}>
                {[company.address_line1, [company.city, company.state, company.zip].filter(Boolean).join(", ")].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
          <div className="text-right">
            <h1 className="text-xl font-light tracking-widest uppercase" style={{ color: primaryColor }}>Invoice</h1>
            <p className="font-medium text-sm mt-1">{invoice.invoice_number}</p>
          </div>
        </div>

        {/* Bill To + Details */}
        <div className="flex justify-between mb-10">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-widest mb-2" style={{ color: "#aaa" }}>Bill To</p>
            {client ? (
              <>
                <p className="font-medium">{client.first_name} {client.last_name}</p>
                {client.company_name && <p className="text-xs" style={{ color: "#999" }}>{client.company_name}</p>}
                {client.email && <p className="text-xs" style={{ color: "#999" }}>{client.email}</p>}
              </>
            ) : <p style={{ color: "#999" }}>—</p>}
          </div>
          <div className="text-right text-xs space-y-1" style={{ color: "#999" }}>
            <div>Date: {format(new Date(invoice.created_at), "MMM d, yyyy")}</div>
            {invoice.due_date && <div>Due: {format(new Date(invoice.due_date), "MMM d, yyyy")}</div>}
            <div className="mt-2">
              <span className={statusBadge(invoice.status)} style={statusBgColor(invoice.status)}>{invoice.status}</span>
            </div>
          </div>
        </div>

        {/* Line Items — no borders */}
        <div className="mb-8">
          <div className="flex text-[10px] font-medium uppercase tracking-widest pb-2 mb-2" style={{ color: "#aaa", borderBottom: `1px solid ${accentColor}40` }}>
            <div className="flex-1">Description</div>
            <div className="w-[50px] text-right">Qty</div>
            <div className="w-[80px] text-right">Price</div>
            <div className="w-[50px] text-right">Tax</div>
            <div className="w-[80px] text-right">Total</div>
          </div>
          {lineItems.map((li) => (
            <div key={li.id} className="flex py-2">
              <div className="flex-1">{li.description}</div>
              <div className="w-[50px] text-right">{Number(li.quantity)}</div>
              <div className="w-[80px] text-right">${Number(li.unit_price).toFixed(2)}</div>
              <div className="w-[50px] text-right">{Number(li.tax_rate)}%</div>
              <div className="w-[80px] text-right font-medium">${Number(li.line_total).toFixed(2)}</div>
            </div>
          ))}
          {lineItems.length === 0 && (
            <div className="text-center py-4" style={{ color: "#aaa" }}>No line items</div>
          )}
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-10">
          <div className="w-[220px] space-y-1.5 text-sm">
            <div className="flex justify-between" style={{ color: "#999" }}><span>Subtotal</span><span>${Number(invoice.subtotal).toFixed(2)}</span></div>
            {Number(invoice.discount_amount) > 0 && (
              <div className="flex justify-between" style={{ color: "#999" }}><span>Discount</span><span>-${Number(invoice.discount_amount).toFixed(2)}</span></div>
            )}
            <div className="flex justify-between" style={{ color: "#999" }}><span>Tax</span><span>${Number(invoice.tax_amount).toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-base pt-2" style={{ borderTop: `2px solid ${accentColor}`, color: primaryColor }}>
              <span>Total</span><span>${Number(invoice.total).toFixed(2)}</span>
            </div>
            {Number(invoice.amount_paid) > 0 && (
              <>
                <div className="flex justify-between" style={{ color: "#999" }}><span>Paid</span><span>${Number(invoice.amount_paid).toFixed(2)}</span></div>
                <div className="flex justify-between font-bold" style={{ color: primaryColor }}><span>Balance Due</span><span>${Number(invoice.balance_due).toFixed(2)}</span></div>
              </>
            )}
          </div>
        </div>

        {invoice.client_notes && (
          <div className="pt-6">
            <p className="text-[10px] font-medium uppercase tracking-widest mb-1" style={{ color: "#aaa" }}>Notes</p>
            <p className="text-xs whitespace-pre-wrap" style={{ color: "#999" }}>{invoice.client_notes}</p>
          </div>
        )}
      </div>
    );
  }

  // Classic (default)
  return (
    <div className="print-document p-8 max-w-[800px] mx-auto bg-white font-sans text-sm" style={{ color: "#333" }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-8 pb-6" style={{ borderBottom: `2px solid ${accentColor}30` }}>
        <div>
          {company?.logo_url && (
            <img src={company.logo_url} alt="Logo" className="h-12 mb-2 object-contain" />
          )}
          <h2 className="text-lg font-bold" style={{ color: primaryColor }}>{company?.company_name || "Your Company"}</h2>
          {company?.email && <p className="text-xs" style={{ color: "#888" }}>{company.email}</p>}
          {company?.phone && <p className="text-xs" style={{ color: "#888" }}>{company.phone}</p>}
          {company?.address_line1 && <p className="text-xs" style={{ color: "#888" }}>{company.address_line1}</p>}
          {(company?.city || company?.state || company?.zip) && (
            <p className="text-xs" style={{ color: "#888" }}>
              {[company.city, company.state, company.zip].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: primaryColor }}>INVOICE</h1>
          <p className="font-semibold text-base mt-1">{invoice.invoice_number}</p>
          {invoice.title && <p className="text-xs mt-1" style={{ color: "#888" }}>{invoice.title}</p>}
        </div>
      </div>

      {/* Bill To + Details */}
      <div className="flex justify-between mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: accentColor }}>Bill To</p>
          {client ? (
            <>
              <p className="font-medium">{client.first_name} {client.last_name}</p>
              {client.company_name && <p className="text-xs" style={{ color: "#888" }}>{client.company_name}</p>}
              {client.email && <p className="text-xs" style={{ color: "#888" }}>{client.email}</p>}
              {client.phone && <p className="text-xs" style={{ color: "#888" }}>{client.phone}</p>}
            </>
          ) : <p style={{ color: "#888" }}>—</p>}
        </div>
        <div className="text-right text-xs space-y-0.5">
          <div><span style={{ color: "#888" }}>Date: </span>{format(new Date(invoice.created_at), "MMM d, yyyy")}</div>
          {invoice.due_date && <div><span style={{ color: "#888" }}>Due: </span>{format(new Date(invoice.due_date), "MMM d, yyyy")}</div>}
          {invoice.payment_terms && <div><span style={{ color: "#888" }}>Terms: </span>{invoice.payment_terms}</div>}
          <div className="mt-2">
            <span className={statusBadge(invoice.status)} style={statusBgColor(invoice.status)}>{invoice.status}</span>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <table className="w-full mb-6 border-collapse">
        <thead>
          <tr style={{ borderBottom: `2px solid ${accentColor}40` }}>
            <th className="text-left py-2 font-semibold" style={{ color: primaryColor }}>Description</th>
            <th className="text-right py-2 font-semibold w-[60px]" style={{ color: primaryColor }}>Qty</th>
            <th className="text-right py-2 font-semibold w-[90px]" style={{ color: primaryColor }}>Price</th>
            <th className="text-right py-2 font-semibold w-[60px]" style={{ color: primaryColor }}>Tax</th>
            <th className="text-right py-2 font-semibold w-[90px]" style={{ color: primaryColor }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map((li) => (
            <tr key={li.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
              <td className="py-2">{li.description}</td>
              <td className="text-right py-2">{Number(li.quantity)}</td>
              <td className="text-right py-2">${Number(li.unit_price).toFixed(2)}</td>
              <td className="text-right py-2">{Number(li.tax_rate)}%</td>
              <td className="text-right py-2 font-medium">${Number(li.line_total).toFixed(2)}</td>
            </tr>
          ))}
          {lineItems.length === 0 && (
            <tr><td colSpan={5} className="text-center py-4" style={{ color: "#888" }}>No line items</td></tr>
          )}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-[250px] space-y-1 text-sm">
          <div className="flex justify-between"><span style={{ color: "#888" }}>Subtotal</span><span>${Number(invoice.subtotal).toFixed(2)}</span></div>
          {Number(invoice.discount_amount) > 0 && (
            <div className="flex justify-between"><span style={{ color: "#888" }}>Discount</span><span>-${Number(invoice.discount_amount).toFixed(2)}</span></div>
          )}
          <div className="flex justify-between"><span style={{ color: "#888" }}>Tax</span><span>${Number(invoice.tax_amount).toFixed(2)}</span></div>
          <div className="flex justify-between font-bold pt-1 text-base" style={{ borderTop: `2px solid ${accentColor}40`, color: primaryColor }}>
            <span>Total</span><span>${Number(invoice.total).toFixed(2)}</span>
          </div>
          {Number(invoice.amount_paid) > 0 && (
            <>
              <div className="flex justify-between"><span style={{ color: "#888" }}>Paid</span><span>${Number(invoice.amount_paid).toFixed(2)}</span></div>
              <div className="flex justify-between font-bold" style={{ color: primaryColor }}><span>Balance Due</span><span>${Number(invoice.balance_due).toFixed(2)}</span></div>
            </>
          )}
        </div>
      </div>

      {invoice.client_notes && (
        <div className="pt-4" style={{ borderTop: `1px solid ${accentColor}20` }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: accentColor }}>Notes</p>
          <p className="text-xs whitespace-pre-wrap" style={{ color: "#888" }}>{invoice.client_notes}</p>
        </div>
      )}
    </div>
  );
}
