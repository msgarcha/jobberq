import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useInvoice, useInvoiceLineItems, useUpdateInvoice, useDeleteInvoice, usePayments, useRecordPayment, useDuplicateInvoice } from "@/hooks/useInvoices";
import { ArrowLeft, Edit, Send, DollarSign, Trash2, Copy, RefreshCw, Download, Link, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

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

const paymentMethods = [
  { value: "cash", label: "Cash" },
  { value: "check", label: "Check" },
  { value: "credit_card", label: "Credit Card" },
  { value: "ach", label: "ACH" },
  { value: "stripe", label: "Stripe" },
  { value: "other", label: "Other" },
];

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: invoice, isLoading } = useInvoice(id);
  const { data: lineItems } = useInvoiceLineItems(id);
  const { data: payments } = usePayments(id);
  const updateInvoice = useUpdateInvoice();
  const deleteInvoice = useDeleteInvoice();
  const recordPayment = useRecordPayment();
  const duplicateInvoice = useDuplicateInvoice();

  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<string>("other");
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [generatingLink, setGeneratingLink] = useState(false);

  const handleSend = () => {
    updateInvoice.mutate({ id: id!, status: "sent", sent_at: new Date().toISOString() });
  };

  const handleDuplicate = () => {
    duplicateInvoice.mutate(id!, {
      onSuccess: (newInvoice) => navigate(`/invoices/${newInvoice.id}`),
    });
  };

  const handleRecordPayment = async () => {
    await recordPayment.mutateAsync({
      invoice_id: id!,
      amount: parseFloat(payAmount),
      payment_method: payMethod as any,
      reference_number: payRef || null,
      notes: payNotes || null,
    });
    setPayDialogOpen(false);
    setPayAmount("");
    setPayRef("");
    setPayNotes("");
  };

  const handleDelete = () => {
    deleteInvoice.mutate(id!, { onSuccess: () => navigate("/invoices") });
  };

  const handleGeneratePaymentLink = async () => {
    setGeneratingLink(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-invoice-checkout", {
        body: { invoice_id: id },
      });
      if (error) throw error;
      if (data?.url) {
        await navigator.clipboard.writeText(data.url);
        toast.success("Payment link copied to clipboard!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate payment link");
    } finally {
      setGeneratingLink(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading…</div>
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

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in max-w-4xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/invoices")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-display font-bold tracking-tight">{invoice.invoice_number}</h1>
                <Badge className={`${statusStyles[invoice.status]} text-xs`}>{invoice.status}</Badge>
                {invoice.is_recurring && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <RefreshCw className="h-3 w-3" />
                    {frequencyLabels[invoice.recurring_frequency || ""] || "Recurring"}
                  </Badge>
                )}
              </div>
              {invoice.title && <p className="text-sm text-muted-foreground">{invoice.title}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.open(`/invoices/${id}/print`, '_blank')}>
              <Download className="h-3.5 w-3.5" /> PDF
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDuplicate} disabled={duplicateInvoice.isPending}>
              <Copy className="h-3.5 w-3.5" /> Duplicate
            </Button>
            {invoice.status === "draft" && (
              <>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(`/invoices/${id}/edit`)}>
                  <Edit className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button size="sm" className="gap-1.5" onClick={handleSend}>
                  <Send className="h-3.5 w-3.5" /> Send
                </Button>
              </>
            )}
            {invoice.status !== "paid" && invoice.status !== "draft" && (
              <Button size="sm" className="gap-1.5" onClick={() => { setPayAmount(String(Number(invoice.balance_due))); setPayDialogOpen(true); }}>
                <DollarSign className="h-3.5 w-3.5" /> Record Payment
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

        <div className="grid gap-5 md:grid-cols-3">
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

          <Card className="shadow-warm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Balance</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-medium">${Number(invoice.total).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span className="text-status-success">${Number(invoice.amount_paid).toFixed(2)}</span></div>
              <div className="flex justify-between font-semibold border-t pt-1"><span>Balance Due</span><span>${Number(invoice.balance_due).toFixed(2)}</span></div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-warm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Line Items</CardTitle></CardHeader>
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
            <div className="flex justify-end mt-3">
              <div className="text-sm space-y-1 text-right min-w-[200px]">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${Number(invoice.subtotal).toFixed(2)}</span></div>
                {Number(invoice.discount_amount) > 0 && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="text-destructive">-${Number(invoice.discount_amount).toFixed(2)}</span></div>
                )}
                <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>${Number(invoice.tax_amount).toFixed(2)}</span></div>
                <div className="flex justify-between font-semibold border-t pt-1"><span>Total</span><span>${Number(invoice.total).toFixed(2)}</span></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {payments && payments.length > 0 && (
          <Card className="shadow-warm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Payment History</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
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
        )}

        {(invoice.client_notes || invoice.internal_notes) && (
          <div className="grid gap-5 md:grid-cols-2">
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
          </div>
        )}
      </div>

      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Amount</Label>
              <Input type="number" min={0} step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
            </div>
            <div>
              <Label>Method</Label>
              <Select value={payMethod} onValueChange={setPayMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reference Number</Label>
              <Input value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="Optional" />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={payNotes} onChange={(e) => setPayNotes(e.target.value)} placeholder="Optional" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRecordPayment} disabled={!payAmount || parseFloat(payAmount) <= 0 || recordPayment.isPending}>
              {recordPayment.isPending ? "Recording…" : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default InvoiceDetail;
