import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CollectPaymentSheet } from "@/components/invoice/CollectPaymentSheet";
import { useInvoice, useInvoiceLineItems, useUpdateInvoice, useDeleteInvoice, usePayments, useDuplicateInvoice } from "@/hooks/useInvoices";
import { ArrowLeft, Edit, Send, Trash2, Copy, RefreshCw, Download, Loader2, DollarSign, Link2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

const statusStyles: Record<string, string> = {
  draft: "bg-status-neutral text-status-neutral-foreground",
  sent: "bg-status-info text-status-info-foreground",
  viewed: "bg-status-warning text-status-warning-foreground",
  paid: "bg-status-success text-status-success-foreground",
  overdue: "bg-status-danger text-status-danger-foreground",
};

const frequencyLabels: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: invoice, isLoading } = useInvoice(id);
  const { data: lineItems } = useInvoiceLineItems(id);
  const { data: payments } = usePayments(id);
  const updateInvoice = useUpdateInvoice();
  const deleteInvoice = useDeleteInvoice();
  const duplicateInvoice = useDuplicateInvoice();

  const [collectOpen, setCollectOpen] = useState(false);

  const handleSend = () => {
    updateInvoice.mutate({ id: id!, status: "sent", sent_at: new Date().toISOString() });
  };

  const handleResend = () => {
    updateInvoice.mutate({ id: id!, sent_at: new Date().toISOString() });
  };

  const handleDuplicate = () => {
    duplicateInvoice.mutate(id!, {
      onSuccess: (newInvoice) => navigate(`/invoices/${newInvoice.id}`),
    });
  };

  const handleDelete = () => {
    deleteInvoice.mutate(id!, { onSuccess: () => navigate("/invoices") });
  };

  const handlePaymentRecorded = () => {
    qc.invalidateQueries({ queryKey: ["invoice", id] });
    qc.invalidateQueries({ queryKey: ["invoices"] });
    qc.invalidateQueries({ queryKey: ["payments", id] });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!invoice) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Invoice not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/invoices")}>Back to Invoices</Button>
        </div>
      </DashboardLayout>
    );
  }

  const client = (invoice as any).clients;
  const isPaid = invoice.status === "paid";
  const isDraft = invoice.status === "draft";
  const showCollect = !isPaid && !isDraft;

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in max-w-4xl pb-24 md:pb-5">
        {/* Top nav */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/invoices")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-display font-bold tracking-tight">{invoice.invoice_number}</h1>
              <Badge className={`${statusStyles[invoice.status]} text-xs`}>{invoice.status}</Badge>
              {invoice.is_recurring && (
                <Badge variant="outline" className="text-xs gap-1">
                  <RefreshCw className="h-3 w-3" />
                  {frequencyLabels[invoice.recurring_frequency || ""] || "Recurring"}
                </Badge>
              )}
            </div>
          </div>
          {/* Desktop actions */}
          <div className="hidden md:flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.open(`/invoices/${id}/print`, '_blank')}>
              <Download className="h-3.5 w-3.5" /> PDF
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDuplicate} disabled={duplicateInvoice.isPending}>
              <Copy className="h-3.5 w-3.5" /> Duplicate
            </Button>
            {isDraft && (
              <>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(`/invoices/${id}/edit`)}>
                  <Edit className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button size="sm" className="gap-1.5" onClick={handleSend}>
                  <Send className="h-3.5 w-3.5" /> Send
                </Button>
              </>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this invoice?</AlertDialogTitle>
                  <AlertDialogDescription>This will also delete all associated payments. This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Hero card — mobile-first with amount + status */}
        <Card className="shadow-warm overflow-hidden">
          <div className="bg-primary/5 border-b border-border/50 px-5 py-4 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 min-w-0">
                {invoice.title && (
                  <p className="text-sm font-medium text-foreground truncate">{invoice.title}</p>
                )}
                {client && (
                  <p className="text-sm text-muted-foreground">
                    {client.first_name} {client.last_name}
                    {client.company_name && ` · ${client.company_name}`}
                  </p>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground pt-0.5">
                  <span>Issued: {format(new Date(invoice.created_at), "MMM d, yyyy")}</span>
                  {invoice.due_date && <span>Due: {format(new Date(invoice.due_date), "MMM d, yyyy")}</span>}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl sm:text-3xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  ${Number(invoice.balance_due).toFixed(2)}
                </p>
                {Number(invoice.amount_paid) > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    of ${Number(invoice.total).toFixed(2)} total
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {showCollect && (
            <div className="px-5 py-3 sm:px-6 flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  const payLink = `${window.location.origin}/pay/${id}`;
                  navigator.clipboard.writeText(payLink);
                  toast.success("Payment link copied!");
                }}
              >
                <Link2 className="h-4 w-4" /> Copy Pay Link
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-1.5"
                onClick={handleResend}
                disabled={updateInvoice.isPending}
              >
                <Send className="h-4 w-4" /> Resend
              </Button>
              <Button
                className="flex-1 gap-1.5 bg-primary hover:bg-primary/90"
                onClick={() => setCollectOpen(true)}
              >
                <DollarSign className="h-4 w-4" /> Collect Payment
              </Button>
            </div>
          )}
          {isDraft && (
            <div className="px-5 py-3 sm:px-6 flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-1.5"
                onClick={() => navigate(`/invoices/${id}/edit`)}
              >
                <Edit className="h-4 w-4" /> Edit
              </Button>
              <Button
                className="flex-1 gap-1.5"
                onClick={handleSend}
              >
                <Send className="h-4 w-4" /> Send Invoice
              </Button>
            </div>
          )}
          {isPaid && (
            <div className="px-5 py-3 sm:px-6">
              <div className="flex items-center gap-2 text-sm text-status-success font-medium">
                <DollarSign className="h-4 w-4" />
                Paid in full
                {invoice.paid_at && ` on ${format(new Date(invoice.paid_at), "MMM d, yyyy")}`}
              </div>
            </div>
          )}
        </Card>

        {/* Tabs: Invoice / Notes / Payments */}
        <Tabs defaultValue="invoice" className="w-full">
          <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none h-auto p-0 gap-0">
            <TabsTrigger value="invoice" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm">
              Invoice
            </TabsTrigger>
            <TabsTrigger value="payments" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm">
              Payments {payments && payments.length > 0 && `(${payments.length})`}
            </TabsTrigger>
            <TabsTrigger value="notes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm">
              Notes
            </TabsTrigger>
          </TabsList>

          {/* Line Items Tab */}
          <TabsContent value="invoice" className="mt-4 space-y-4">
            <Card className="shadow-warm">
              <CardContent className="p-0">
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
                <div className="hidden sm:block">
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
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No line items</TableCell></TableRow>
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
              </CardContent>
            </Card>

            {/* Summary */}
            <div className="flex justify-end">
              <div className="text-sm space-y-1.5 text-right min-w-[200px]">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${Number(invoice.subtotal).toFixed(2)}</span></div>
                {Number(invoice.discount_amount) > 0 && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="text-destructive">-${Number(invoice.discount_amount).toFixed(2)}</span></div>
                )}
                <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>${Number(invoice.tax_amount).toFixed(2)}</span></div>
                <div className="flex justify-between font-semibold border-t border-border pt-1.5">
                  <span>Total</span><span>${Number(invoice.total).toFixed(2)}</span>
                </div>
                {Number(invoice.amount_paid) > 0 && (
                  <>
                    <div className="flex justify-between text-status-success">
                      <span>Paid</span><span>-${Number(invoice.amount_paid).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base border-t border-border pt-1.5">
                      <span>Balance Due</span><span>${Number(invoice.balance_due).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Details card */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="shadow-warm">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Client</CardTitle></CardHeader>
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
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Details</CardTitle></CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span>{format(new Date(invoice.created_at), "MMM d, yyyy")}</span></div>
                  {invoice.due_date && <div className="flex justify-between"><span className="text-muted-foreground">Due</span><span>{format(new Date(invoice.due_date), "MMM d, yyyy")}</span></div>}
                  {invoice.sent_at && <div className="flex justify-between"><span className="text-muted-foreground">Sent</span><span>{format(new Date(invoice.sent_at), "MMM d, yyyy")}</span></div>}
                  {invoice.paid_at && <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span>{format(new Date(invoice.paid_at), "MMM d, yyyy")}</span></div>}
                  {invoice.is_recurring && (
                    <>
                      <div className="flex justify-between"><span className="text-muted-foreground">Frequency</span><span>{frequencyLabels[invoice.recurring_frequency || ""] || "—"}</span></div>
                      {invoice.recurring_start && <div className="flex justify-between"><span className="text-muted-foreground">Starts</span><span>{format(new Date(invoice.recurring_start), "MMM d, yyyy")}</span></div>}
                      {invoice.recurring_end && <div className="flex justify-between"><span className="text-muted-foreground">Ends</span><span>{format(new Date(invoice.recurring_end), "MMM d, yyyy")}</span></div>}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="mt-4">
            {payments && payments.length > 0 ? (
              <Card className="shadow-warm">
                <CardContent className="p-0">
                  {/* Mobile payments */}
                  <div className="sm:hidden divide-y divide-border">
                    {payments.map((p) => (
                      <div key={p.id} className="px-4 py-3 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium capitalize">{p.payment_method.replace("_", " ")}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(p.payment_date), "MMM d, yyyy")}</p>
                          {p.reference_number && <p className="text-xs text-muted-foreground">Ref: {p.reference_number}</p>}
                        </div>
                        <p className="text-sm font-semibold text-status-success">${Number(p.amount).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                  {/* Desktop payments */}
                  <div className="hidden sm:block">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Date</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Reference</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="text-sm">{format(new Date(p.payment_date), "MMM d, yyyy")}</TableCell>
                            <TableCell className="text-sm capitalize">{p.payment_method.replace("_", " ")}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{p.reference_number || "—"}</TableCell>
                            <TableCell className="text-right text-sm font-medium">${Number(p.amount).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No payments recorded yet
              </div>
            )}
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="mt-4 space-y-4">
            {invoice.client_notes && (
              <Card className="shadow-warm">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Client Notes</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground whitespace-pre-wrap">{invoice.client_notes}</p></CardContent>
              </Card>
            )}
            {invoice.internal_notes && (
              <Card className="shadow-warm">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Internal Notes</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground whitespace-pre-wrap">{invoice.internal_notes}</p></CardContent>
              </Card>
            )}
            {!invoice.client_notes && !invoice.internal_notes && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No notes on this invoice
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Mobile sticky bottom bar */}
        {showCollect && (
          <div className="fixed bottom-0 left-0 right-0 md:hidden bg-background border-t border-border px-4 py-3 z-40">
            <Button
              className="w-full h-12 text-base gap-2 bg-primary hover:bg-primary/90"
              onClick={() => setCollectOpen(true)}
            >
              <DollarSign className="h-5 w-5" /> Collect Payment · ${Number(invoice.balance_due).toFixed(2)}
            </Button>
          </div>
        )}
      </div>

      {/* Collect Payment Sheet */}
      <CollectPaymentSheet
        open={collectOpen}
        onOpenChange={setCollectOpen}
        invoiceId={id!}
        clientId={invoice.client_id}
        balanceDue={Number(invoice.balance_due)}
        invoiceNumber={invoice.invoice_number}
        onPaymentRecorded={handlePaymentRecorded}
      />
    </DashboardLayout>
  );
};

export default InvoiceDetail;
