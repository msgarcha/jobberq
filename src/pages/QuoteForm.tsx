import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ClientSelector } from "@/components/ClientSelector";
import { LineItemsEditor, LineItem, computeTotals } from "@/components/LineItemsEditor";
import { useQuote, useQuoteLineItems, useCreateQuote, useUpdateQuote, useSaveQuoteLineItems, useNextQuoteNumber, useIncrementQuoteNumber } from "@/hooks/useQuotes";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { SuggestionChip } from "@/components/ai/SuggestionChip";
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
  const { data: companySettings } = useCompanySettings();
  const defaultTaxRate = companySettings?.default_tax_rate != null ? Number(companySettings.default_tax_rate) : 5;
  const [clientId, setClientId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [clientNotes, setClientNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [saving, setSaving] = useState(false);

  // Deposit state
  const [depositEnabled, setDepositEnabled] = useState(false);
  const [depositType, setDepositType] = useState<"percent" | "fixed">("percent");
  const [depositValue, setDepositValue] = useState("");

  useEffect(() => {
    if (existingQuote) {
      setClientId(existingQuote.client_id);
      setTitle(existingQuote.title || "");
      setValidUntil(existingQuote.valid_until || "");
      setClientNotes(existingQuote.client_notes || "");
      setInternalNotes(existingQuote.internal_notes || "");
      // Load deposit fields
      const eq = existingQuote as any;
      if (eq.deposit_type) {
        setDepositEnabled(true);
        setDepositType(eq.deposit_type);
        setDepositValue(String(eq.deposit_value || ""));
      }
    }
  }, [existingQuote]);

  useEffect(() => {
    if (existingLineItems) {
      setLineItems(
        existingLineItems.map((li) => ({
          id: li.id, service_id: li.service_id, description: li.description,
          quantity: Number(li.quantity), unit_price: Number(li.unit_price),
          tax_rate: Number(li.tax_rate), discount_percent: Number(li.discount_percent),
          line_total: Number(li.line_total),
        }))
      );
    }
  }, [existingLineItems]);

  const totals = computeTotals(lineItems);
  const calculatedDeposit = depositEnabled
    ? depositType === "percent"
      ? Math.round(totals.total * (Number(depositValue) || 0) / 100 * 100) / 100
      : Number(depositValue) || 0
    : 0;

  const handleSave = async (createAnother = false) => {
    setSaving(true);
    try {
      const quoteData: any = {
        client_id: clientId, title: title || null, valid_until: validUntil || null,
        client_notes: clientNotes || null, internal_notes: internalNotes || null, ...totals,
        deposit_type: depositEnabled ? depositType : null,
        deposit_value: depositEnabled ? Number(depositValue) || 0 : 0,
        deposit_amount: calculatedDeposit,
      };

      let quoteId: string;

      if (isEdit) {
        await updateQuote.mutateAsync({ id, ...quoteData });
        quoteId = id;
      } else {
        const quoteNumber = nextNumber?.formatted || `Q-${Date.now()}`;
        const result = await createQuote.mutateAsync({ ...quoteData, quote_number: quoteNumber });
        quoteId = result.id;
        incrementNumber.mutate();
      }

      await saveLineItems.mutateAsync({ quoteId, items: lineItems.map(({ id: _, ...rest }) => rest) });

      if (createAnother && !isEdit) {
        setClientId(null); setTitle(""); setValidUntil(""); setClientNotes(""); setInternalNotes(""); setLineItems([]);
        setDepositEnabled(false); setDepositType("percent"); setDepositValue("");
      } else {
        navigate(`/quotes/${quoteId}`);
      }
    } catch { /* handled */ } finally { setSaving(false); }
  };

  if (isEdit && loadingQuote) {
    return (<DashboardLayout><div className="flex items-center justify-center py-20 text-muted-foreground">Loading…</div></DashboardLayout>);
  }

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in max-w-4xl mx-auto md:mx-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">{isEdit ? "Edit Quote" : "New Quote"}</h1>
            {!isEdit && nextNumber && (<p className="text-sm text-muted-foreground">{nextNumber.formatted}</p>)}
          </div>
        </div>

        <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
          <Card className="shadow-warm">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Client</CardTitle></CardHeader>
            <CardContent><ClientSelector value={clientId} onChange={setClientId} /></CardContent>
          </Card>

          <Card className="shadow-warm">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Details</CardTitle></CardHeader>
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
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Line Items</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <LineItemsEditor items={lineItems} onChange={setLineItems} defaultTaxRate={defaultTaxRate} />
            <SuggestionChip
              docType="quote"
              title={title}
              lineItems={lineItems.map((li) => ({ description: li.description, unit_price: li.unit_price, tax_rate: li.tax_rate }))}
              enabled={companySettings?.ai_assistant_enabled !== false}
              onAdd={(s) => setLineItems((curr) => [
                ...curr,
                { service_id: null, description: s.description, quantity: 1, unit_price: s.suggested_price, tax_rate: defaultTaxRate, discount_percent: 0, line_total: s.suggested_price * (1 + defaultTaxRate / 100) },
              ])}
            />
          </CardContent>
        </Card>

        {/* Deposit Section */}
        <Card className="shadow-warm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Deposit Required</CardTitle>
              <Switch checked={depositEnabled} onCheckedChange={setDepositEnabled} />
            </div>
          </CardHeader>
          {depositEnabled && (
            <CardContent className="space-y-4">
              <RadioGroup value={depositType} onValueChange={(v) => setDepositType(v as "percent" | "fixed")} className="flex gap-4">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="percent" id="dep-percent" />
                  <Label htmlFor="dep-percent" className="text-sm">Percentage</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="fixed" id="dep-fixed" />
                  <Label htmlFor="dep-fixed" className="text-sm">Fixed Amount</Label>
                </div>
              </RadioGroup>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <Label className="text-xs">{depositType === "percent" ? "Percentage (%)" : "Amount ($)"}</Label>
                  <Input
                    type="number"
                    min="0"
                    step={depositType === "percent" ? "1" : "0.01"}
                    max={depositType === "percent" ? "100" : undefined}
                    value={depositValue}
                    onChange={(e) => setDepositValue(e.target.value)}
                    placeholder={depositType === "percent" ? "e.g. 25" : "e.g. 500.00"}
                  />
                </div>
                <div className="pb-2 text-sm font-medium text-foreground">
                  Deposit: <span className="text-primary">${calculatedDeposit.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
          <div>
            <Label className="text-xs">Client Notes</Label>
            <Textarea value={clientNotes} onChange={(e) => setClientNotes(e.target.value)} placeholder="Notes visible to client…" rows={3} />
          </div>
          <div>
            <Label className="text-xs">Internal Notes</Label>
            <Textarea value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} placeholder="Internal notes…" rows={3} />
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-end gap-3 pt-2 sticky bottom-20 md:static md:bottom-auto bg-background/95 backdrop-blur-sm py-3 md:py-0 -mx-4 px-4 md:mx-0 md:px-0 border-t md:border-0">
          <Button variant="outline" onClick={() => navigate(-1)} className="md:w-auto">Cancel</Button>
          {!isEdit && (
            <Button variant="outline" onClick={() => handleSave(true)} disabled={saving} className="gap-1.5 md:w-auto">
              <Plus className="h-4 w-4" />{saving ? "Saving…" : "Save & Create Another"}
            </Button>
          )}
          <Button onClick={() => handleSave(false)} disabled={saving} className="gap-1.5 md:w-auto">
            <Save className="h-4 w-4" />{saving ? "Saving…" : isEdit ? "Update Quote" : "Create Quote"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default QuoteForm;
