import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientSelector } from "@/components/ClientSelector";
import { LineItemsEditor, LineItem, computeTotals } from "@/components/LineItemsEditor";
import { useQuote, useQuoteLineItems, useCreateQuote, useUpdateQuote, useSaveQuoteLineItems, useNextQuoteNumber, useIncrementQuoteNumber } from "@/hooks/useQuotes";
import { ArrowLeft, Save, Plus } from "lucide-react";

const QuoteForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: existingQuote, isLoading: loadingQuote } = useQuote(id);
  const { data: existingLineItems } = useQuoteLineItems(id);
  const { data: nextNumber } = useNextQuoteNumber();
  const createQuote = useCreateQuote();
  const updateQuote = useUpdateQuote();
  const saveLineItems = useSaveQuoteLineItems();
  const incrementNumber = useIncrementQuoteNumber();

  const [clientId, setClientId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [clientNotes, setClientNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingQuote) {
      setClientId(existingQuote.client_id);
      setTitle(existingQuote.title || "");
      setValidUntil(existingQuote.valid_until || "");
      setClientNotes(existingQuote.client_notes || "");
      setInternalNotes(existingQuote.internal_notes || "");
    }
  }, [existingQuote]);

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

  const handleSave = async (createAnother = false) => {
    setSaving(true);
    try {
      const totals = computeTotals(lineItems);
      const quoteData = {
        client_id: clientId,
        title: title || null,
        valid_until: validUntil || null,
        client_notes: clientNotes || null,
        internal_notes: internalNotes || null,
        ...totals,
      };

      let quoteId: string;

      if (isEdit) {
        await updateQuote.mutateAsync({ id, ...quoteData });
        quoteId = id;
      } else {
        const quoteNumber = nextNumber?.formatted || `Q-${Date.now()}`;
        const result = await createQuote.mutateAsync({
          ...quoteData,
          quote_number: quoteNumber,
        });
        quoteId = result.id;
        incrementNumber.mutate();
      }

      await saveLineItems.mutateAsync({
        quoteId,
        items: lineItems.map(({ id: _, ...rest }) => rest),
      });

      if (createAnother && !isEdit) {
        setClientId(null);
        setTitle("");
        setValidUntil("");
        setClientNotes("");
        setInternalNotes("");
        setLineItems([]);
      } else {
        navigate(`/quotes/${quoteId}`);
      }
    } catch {
      // error handled by hooks
    } finally {
      setSaving(false);
    }
  };

  if (isEdit && loadingQuote) {
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
              {isEdit ? "Edit Quote" : "New Quote"}
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
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Quote title (optional)" />
              </div>
              <div>
                <Label className="text-xs">Valid Until</Label>
                <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
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
            <Textarea
              value={clientNotes}
              onChange={(e) => setClientNotes(e.target.value)}
              placeholder="Notes visible to client…"
              rows={3}
            />
          </div>
          <div>
            <Label className="text-xs">Internal Notes</Label>
            <Textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Internal notes…"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          {!isEdit && (
            <Button variant="outline" onClick={() => handleSave(true)} disabled={saving} className="gap-1.5">
              <Plus className="h-4 w-4" />
              {saving ? "Saving…" : "Save & Create Another"}
            </Button>
          )}
          <Button onClick={() => handleSave(false)} disabled={saving} className="gap-1.5">
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : isEdit ? "Update Quote" : "Create Quote"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default QuoteForm;
