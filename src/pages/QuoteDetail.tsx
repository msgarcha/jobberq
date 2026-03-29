import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { EmailDocumentDialog } from "@/components/EmailDocumentDialog";
import { useQuote, useQuoteLineItems, useUpdateQuote, useDeleteQuote } from "@/hooks/useQuotes";
import { useCreateInvoice, useSaveInvoiceLineItems, useIncrementInvoiceNumber, useNextInvoiceNumber } from "@/hooks/useInvoices";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { ArrowLeft, Edit, Send, CheckCircle, FileText, Trash2, Download, Mail, Link2 } from "lucide-react";
import { format } from "date-fns";

const statusStyles: Record<string, string> = {
  draft: "bg-status-neutral text-status-neutral-foreground",
  sent: "bg-status-info text-status-info-foreground",
  approved: "bg-status-success text-status-success-foreground",
  converted: "bg-primary text-primary-foreground",
  expired: "bg-status-danger text-status-danger-foreground",
};

const QuoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: quote, isLoading } = useQuote(id);
  const { data: lineItems } = useQuoteLineItems(id);
  const updateQuote = useUpdateQuote();
  const deleteQuote = useDeleteQuote();
  const createInvoice = useCreateInvoice();
  const saveInvoiceLineItems = useSaveInvoiceLineItems();
  const { data: nextInvNumber } = useNextInvoiceNumber();
  const incrementInvNumber = useIncrementInvoiceNumber();
  const { data: companySettings } = useCompanySettings();
  const [emailOpen, setEmailOpen] = useState(false);

  const handleSend = () => {
    setEmailOpen(true);
  };

  const handleApprove = () => {
    updateQuote.mutate({ id: id!, status: "approved", approved_at: new Date().toISOString() });
  };

  const handleConvert = async () => {
    if (!quote || !lineItems) return;
    const invoiceNumber = nextInvNumber?.formatted || `INV-${Date.now()}`;
    const inv = await createInvoice.mutateAsync({
      invoice_number: invoiceNumber,
      client_id: quote.client_id,
      quote_id: quote.id,
      title: quote.title,
      subtotal: quote.subtotal,
      tax_amount: quote.tax_amount,
      discount_amount: quote.discount_amount,
      total: quote.total,
      balance_due: quote.total,
      client_notes: quote.client_notes,
      internal_notes: quote.internal_notes,
    });
    await saveInvoiceLineItems.mutateAsync({
      invoiceId: inv.id,
      items: lineItems.map((li) => ({
        description: li.description,
        service_id: li.service_id,
        quantity: li.quantity,
        unit_price: li.unit_price,
        tax_rate: li.tax_rate,
        discount_percent: li.discount_percent,
        line_total: li.line_total,
      })),
    });
    incrementInvNumber.mutate();
    updateQuote.mutate({ id: id!, status: "converted" });
    navigate(`/invoices/${inv.id}`);
  };

  const handleDelete = () => {
    deleteQuote.mutate(id!, { onSuccess: () => navigate("/quotes") });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading…</div>
      </DashboardLayout>
    );
  }

  if (!quote) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Quote not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/quotes")}>Back to Quotes</Button>
        </div>
      </DashboardLayout>
    );
  }

  const client = (quote as any).clients;

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in max-w-4xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/quotes")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-display font-bold tracking-tight">{quote.quote_number}</h1>
                <Badge className={`${statusStyles[quote.status]} text-xs`}>{quote.status}</Badge>
              </div>
              {quote.title && <p className="text-sm text-muted-foreground">{quote.title}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.open(`/quotes/${id}/print`, '_blank')}>
              <Download className="h-3.5 w-3.5" /> PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                const quoteLink = `${window.location.origin}/quote/view/${id}`;
                navigator.clipboard.writeText(quoteLink);
                import("sonner").then(({ toast }) => toast.success("Quote link copied!"));
              }}
            >
              <Link2 className="h-3.5 w-3.5" /> Copy Link
            </Button>
            {(quote.status === "sent" || quote.status === "draft") && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEmailOpen(true)}>
                <Mail className="h-3.5 w-3.5" /> Email
              </Button>
            )}
            {quote.status === "draft" && (
              <>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(`/quotes/${id}/edit`)}>
                  <Edit className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button size="sm" className="gap-1.5" onClick={handleSend}>
                  <Send className="h-3.5 w-3.5" /> Send
                </Button>
              </>
            )}
            {quote.status === "sent" && (
              <Button size="sm" className="gap-1.5" onClick={handleApprove}>
                <CheckCircle className="h-3.5 w-3.5" /> Approve
              </Button>
            )}
            {quote.status === "approved" && (
              <Button size="sm" className="gap-1.5" onClick={handleConvert}>
                <FileText className="h-3.5 w-3.5" /> Convert to Invoice
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this quote?</AlertDialogTitle>
                  <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Card className="shadow-warm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Client</CardTitle>
            </CardHeader>
            <CardContent>
              {client ? (
                <div>
                  <p className="font-medium text-sm">{client.first_name} {client.last_name}</p>
                  {client.company_name && <p className="text-xs text-muted-foreground">{client.company_name}</p>}
                  {client.email && <p className="text-xs text-muted-foreground">{client.email}</p>}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No client assigned</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-warm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span>{format(new Date(quote.created_at), "MMM d, yyyy")}</span></div>
              {quote.valid_until && <div className="flex justify-between"><span className="text-muted-foreground">Valid Until</span><span>{format(new Date(quote.valid_until), "MMM d, yyyy")}</span></div>}
              {quote.sent_at && <div className="flex justify-between"><span className="text-muted-foreground">Sent</span><span>{format(new Date(quote.sent_at), "MMM d, yyyy")}</span></div>}
              {quote.approved_at && <div className="flex justify-between"><span className="text-muted-foreground">Approved</span><span>{format(new Date(quote.approved_at), "MMM d, yyyy")}</span></div>}
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-warm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right w-[80px]">Qty</TableHead>
                    <TableHead className="text-right w-[100px]">Price</TableHead>
                    <TableHead className="text-right w-[80px]">Tax</TableHead>
                    <TableHead className="text-right w-[100px]">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(!lineItems || lineItems.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-6">No line items</TableCell>
                    </TableRow>
                  )}
                  {lineItems?.map((li) => (
                    <TableRow key={li.id}>
                      <TableCell className="text-sm">{li.description}</TableCell>
                      <TableCell className="text-right text-sm">{Number(li.quantity)}</TableCell>
                      <TableCell className="text-right text-sm">${Number(li.unit_price).toFixed(2)}</TableCell>
                      <TableCell className="text-right text-sm">{Number(li.tax_rate)}%</TableCell>
                      <TableCell className="text-right text-sm font-medium">${Number(li.line_total).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end mt-3">
              <div className="text-sm space-y-1 text-right min-w-[200px]">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${Number(quote.subtotal).toFixed(2)}</span></div>
                {Number(quote.discount_amount) > 0 && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="text-destructive">-${Number(quote.discount_amount).toFixed(2)}</span></div>
                )}
                <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>${Number(quote.tax_amount).toFixed(2)}</span></div>
                <div className="flex justify-between font-semibold border-t pt-1"><span>Total</span><span>${Number(quote.total).toFixed(2)}</span></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {(quote.client_notes || quote.internal_notes) && (
          <div className="grid gap-5 md:grid-cols-2">
            {quote.client_notes && (
              <Card className="shadow-warm">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Client Notes</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground whitespace-pre-wrap">{quote.client_notes}</p></CardContent>
              </Card>
            )}
            {quote.internal_notes && (
              <Card className="shadow-warm">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Internal Notes</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground whitespace-pre-wrap">{quote.internal_notes}</p></CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default QuoteDetail;
