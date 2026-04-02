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
import { ArrowLeft, Edit, Send, CheckCircle, FileText, Trash2, Download, Mail, Link2, Eye } from "lucide-react";
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

  const handleCopyLink = () => {
    const quoteLink = `${window.location.origin}/quote/view/${id}`;
    navigator.clipboard.writeText(quoteLink);
    import("sonner").then(({ toast }) => toast.success("Quote link copied!"));
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
  const isDraft = quote.status === "draft";
  const isSent = quote.status === "sent";
  const isApproved = quote.status === "approved";

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in max-w-4xl pb-24">
        {/* Header - mobile: back + title only */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/quotes")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-display font-bold tracking-tight">{quote.quote_number}</h1>
              <Badge className={`${statusStyles[quote.status]} text-xs`}>{quote.status}</Badge>
            </div>
            {quote.title && <p className="text-sm text-muted-foreground truncate">{quote.title}</p>}
          </div>
          {/* Desktop-only action buttons */}
          <div className="hidden sm:flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.open(`/quotes/${id}/print`, '_blank')}>
              <Download className="h-3.5 w-3.5" /> PDF
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopyLink}>
              <Link2 className="h-3.5 w-3.5" /> Copy Link
            </Button>
            {(isSent || isDraft) && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEmailOpen(true)}>
                <Mail className="h-3.5 w-3.5" /> Email
              </Button>
            )}
            {isDraft && (
              <>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(`/quotes/${id}/edit`)}>
                  <Edit className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button size="sm" className="gap-1.5" onClick={handleSend}>
                  <Send className="h-3.5 w-3.5" /> Send
                </Button>
              </>
            )}
            {isSent && (
              <Button size="sm" className="gap-1.5" onClick={handleApprove}>
                <CheckCircle className="h-3.5 w-3.5" /> Approve
              </Button>
            )}
            {isApproved && (
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

        {/* Mobile Hero Card with amount + actions */}
        <Card className="sm:hidden shadow-warm overflow-hidden">
          <div className="bg-primary/5 border-b border-border/50 px-4 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 min-w-0">
                {client && (
                  <p className="text-sm text-muted-foreground">
                    {client.first_name} {client.last_name}
                    {client.company_name && ` · ${client.company_name}`}
                  </p>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground pt-0.5">
                  <span>Created: {format(new Date(quote.created_at), "MMM d, yyyy")}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-bold text-foreground">${Number(quote.total).toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="px-4 py-3 flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => window.open(`/quotes/${id}/print`, '_blank')}>
              <Download className="h-4 w-4" /> PDF
            </Button>
            <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={handleCopyLink}>
              <Link2 className="h-4 w-4" /> Copy Link
            </Button>
            {(isSent || isDraft) && (
              <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => setEmailOpen(true)}>
                <Mail className="h-4 w-4" /> Email
              </Button>
            )}
          </div>
          {isDraft && (
            <div className="px-4 py-3 border-t flex gap-2">
              <Button variant="outline" className="flex-1 gap-1.5" onClick={() => navigate(`/quotes/${id}/edit`)}>
                <Edit className="h-4 w-4" /> Edit
              </Button>
              <Button className="flex-1 gap-1.5" onClick={handleSend}>
                <Send className="h-4 w-4" /> Send Quote
              </Button>
            </div>
          )}
          {isSent && (
            <div className="px-4 py-3 border-t">
              <Button className="w-full gap-1.5" onClick={handleApprove}>
                <CheckCircle className="h-4 w-4" /> Approve
              </Button>
            </div>
          )}
          {isApproved && (
            <div className="px-4 py-3 border-t">
              <Button className="w-full gap-1.5" onClick={handleConvert}>
                <FileText className="h-4 w-4" /> Convert to Invoice
              </Button>
            </div>
          )}
        </Card>

        {/* Client & Details Cards */}
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
              {(quote as any).viewed_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1"><Eye className="h-3 w-3" /> Viewed</span>
                  <span>{format(new Date((quote as any).viewed_at), "MMM d, yyyy h:mm a")}</span>
                </div>
              )}
              {quote.approved_at && <div className="flex justify-between"><span className="text-muted-foreground">Approved</span><span>{format(new Date(quote.approved_at), "MMM d, yyyy")}</span></div>}
            </CardContent>
          </Card>
        </div>

        {/* Line Items */}
        <Card className="shadow-warm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Line Items</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            {/* Mobile line items */}
            <div className="sm:hidden divide-y divide-border">
              {(!lineItems || lineItems.length === 0) && (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">No line items</div>
              )}
              {lineItems?.map((li) => (
                <div key={li.id} className="px-4 py-3 space-y-1">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-foreground pr-4">{li.description}</p>
                    <p className="text-sm font-semibold text-foreground shrink-0">${Number(li.line_total).toFixed(2)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {Number(li.quantity)} × ${Number(li.unit_price).toFixed(2)}
                    {Number(li.tax_rate) > 0 && ` · ${Number(li.tax_rate)}% tax`}
                  </p>
                </div>
              ))}
            </div>

            {/* Desktop line items */}
            <div className="hidden sm:block rounded-lg border overflow-hidden">
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

            {/* Summary */}
            <div className="flex justify-end mt-3 px-4 sm:px-0">
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

        {/* Mobile delete button */}
        <div className="sm:hidden">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full text-destructive border-destructive/30 gap-1.5">
                <Trash2 className="h-4 w-4" /> Delete Quote
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

      {/* Email Dialog */}
      <EmailDocumentDialog
        open={emailOpen}
        onOpenChange={setEmailOpen}
        type="quote"
        documentId={id!}
        documentNumber={quote.quote_number}
        documentTitle={quote.title}
        clientName={client ? `${client.first_name} ${client.last_name}` : undefined}
        clientEmail={client?.email}
        companyName={companySettings?.company_name}
        total={Number(quote.total)}
      />
    </DashboardLayout>
  );
};

export default QuoteDetail;
