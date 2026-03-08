import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientSelector } from "@/components/ClientSelector";
import { LineItemsEditor, LineItem, computeTotals } from "@/components/LineItemsEditor";
import { useInvoice, useInvoiceLineItems, useCreateInvoice, useUpdateInvoice, useSaveInvoiceLineItems, useNextInvoiceNumber, useIncrementInvoiceNumber } from "@/hooks/useInvoices";
import { ArrowLeft, Save } from "lucide-react";

const paymentTermOptions = [
  { value: "due_on_receipt", label: "Due on Receipt" },
  { value: "net_15", label: "Net 15" },
  { value: "net_30", label: "Net 30" },
  { value: "net_45", label: "Net 45" },
  { value: "net_60", label: "Net 60" },
];

const InvoiceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: existingInvoice, isLoading } = useInvoice(id);
  const { data: existingLineItems } = useInvoiceLineItems(id);
  const { data: nextNumber } = useNextInvoiceNumber();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const saveLineItems = useSaveInvoiceLineItems();
  const incrementNumber = useIncrementInvoiceNumber();

  const [clientId, setClientId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("net_30");
  const [clientNotes, setClientNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingInvoice) {
      setClientId(existingInvoice.client_id);
      setTitle(existingInvoice.title || "");
      setDueDate(existingInvoice.due_date || "");
      setPaymentTerms(existingInvoice.payment_terms || "net_30");
      setClientNotes(existingInvoice.client_notes || "");
      setInternalNotes(existingInvoice.internal_notes || "");
    }
  }, [existingInvoice]);

  useEffect(() => {
    if (existingLineItems) {
      setLineItems(
        existingLineItems.map((li) => ({
          id: li.id,
          service_id: li.service_id,
          description: li.description,
          quantity: Number(li.quantity),
          unit_price: Number(li.unit_price),
          tax_rate: Number(li.tax_rate),
          discount_percent: Number(li.discount_percent),
          line_total: Number(li.line_total),
        }))
      );
    }
  }, [existingLineItems]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const totals = computeTotals(lineItems);
      const invoiceData = {
        client_id: clientId,
        title: title || null,
        due_date: dueDate || null,
        payment_terms: paymentTerms,
        client_notes: clientNotes || null,
        internal_notes: internalNotes || null,
        ...totals,
        balance_due: isEdit
          ? totals.total - Number(existingInvoice?.amount_paid || 0)
          : totals.total,
      };

      let invoiceId: string;

      if (isEdit) {
        await updateInvoice.mutateAsync({ id, ...invoiceData });
        invoiceId = id;
      } else {
        const invoiceNumber = nextNumber?.formatted || `INV-${Date.now()}`;
        const result = await createInvoice.mutateAsync({
          ...invoiceData,
          invoice_number: invoiceNumber,
        });
        invoiceId = result.id;
        incrementNumber.mutate();
      }

      await saveLineItems.mutateAsync({
        invoiceId,
        items: lineItems.map(({ id: _, ...rest }) => rest),
      });

      navigate(`/invoices/${invoiceId}`);
    } catch {
      // error handled by hooks
    } finally {
      setSaving(false);
    }
  };

  if (isEdit && isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading…</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in max-w-4xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">
              {isEdit ? "Edit Invoice" : "New Invoice"}
            </h1>
            {!isEdit && nextNumber && (
              <p className="text-sm text-muted-foreground">{nextNumber.formatted}</p>
            )}
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Card className="shadow-warm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Client</CardTitle>
            </CardHeader>
            <CardContent>
              <ClientSelector value={clientId} onChange={setClientId} />
            </CardContent>
          </Card>

          <Card className="shadow-warm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Invoice title (optional)" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Due Date</Label>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Payment Terms</Label>
                  <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {paymentTermOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-warm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            <LineItemsEditor items={lineItems} onChange={setLineItems} />
          </CardContent>
        </Card>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <Label className="text-xs">Client Notes</Label>
            <Textarea value={clientNotes} onChange={(e) => setClientNotes(e.target.value)} placeholder="Notes visible to client…" rows={3} />
          </div>
          <div>
            <Label className="text-xs">Internal Notes</Label>
            <Textarea value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} placeholder="Internal notes…" rows={3} />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : isEdit ? "Update Invoice" : "Create Invoice"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InvoiceForm;
