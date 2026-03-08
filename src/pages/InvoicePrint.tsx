import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useInvoice, useInvoiceLineItems } from "@/hooks/useInvoices";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { PrintableInvoice } from "@/components/PrintableInvoice";

const InvoicePrint = () => {
  const { id } = useParams();
  const { data: invoice, isLoading: loadingInvoice } = useInvoice(id);
  const { data: lineItems, isLoading: loadingItems } = useInvoiceLineItems(id);
  const { data: company, isLoading: loadingCompany } = useCompanySettings();
  const printed = useRef(false);

  const isLoading = loadingInvoice || loadingItems || loadingCompany;

  useEffect(() => {
    if (!isLoading && invoice && lineItems && !printed.current) {
      printed.current = true;
      setTimeout(() => {
        window.print();
      }, 300);
    }
  }, [isLoading, invoice, lineItems]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen text-muted-foreground">Preparing document…</div>;
  }

  if (!invoice) {
    return <div className="flex items-center justify-center h-screen text-muted-foreground">Invoice not found</div>;
  }

  const client = (invoice as any).clients || null;

  return (
    <PrintableInvoice
      invoice={invoice}
      lineItems={lineItems || []}
      client={client}
      company={company || null}
    />
  );
};

export default InvoicePrint;
