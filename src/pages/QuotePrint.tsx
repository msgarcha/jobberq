import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuote, useQuoteLineItems } from "@/hooks/useQuotes";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { PrintableQuote } from "@/components/PrintableQuote";

const QuotePrint = () => {
  const { id } = useParams();
  const { data: quote, isLoading: loadingQuote } = useQuote(id);
  const { data: lineItems, isLoading: loadingItems } = useQuoteLineItems(id);
  const { data: company, isLoading: loadingCompany } = useCompanySettings();
  const printed = useRef(false);

  const isLoading = loadingQuote || loadingItems || loadingCompany;

  useEffect(() => {
    if (!isLoading && quote && lineItems && !printed.current) {
      printed.current = true;
      setTimeout(() => {
        window.print();
      }, 300);
    }
  }, [isLoading, quote, lineItems]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen text-muted-foreground">Preparing document…</div>;
  }

  if (!quote) {
    return <div className="flex items-center justify-center h-screen text-muted-foreground">Quote not found</div>;
  }

  const client = (quote as any).clients || null;

  return (
    <PrintableQuote
      quote={quote}
      lineItems={lineItems || []}
      client={client}
      company={company || null}
    />
  );
};

export default QuotePrint;
