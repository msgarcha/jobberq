import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useUpsertCompanySettings } from "@/hooks/useCompanySettings";
import { Building2, MapPin, Settings2, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import QuickLinqLogo from "@/components/QuickLinqLogo";

const paymentTermOptions = [
  { value: "due_on_receipt", label: "Due on Receipt" },
  { value: "net_15", label: "Net 15" },
  { value: "net_30", label: "Net 30" },
  { value: "net_45", label: "Net 45" },
  { value: "net_60", label: "Net 60" },
];

const TOTAL_STEPS = 3;

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const upsert = useUpsertCompanySettings();
  const [step, setStep] = useState(1);

  // Step 1
  const [companyName, setCompanyName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  // Step 2
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(user?.email || "");

  // Step 3
  const [defaultTaxRate, setDefaultTaxRate] = useState(13);
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState("net_30");
  const [invoicePrefix, setInvoicePrefix] = useState("INV-");
  const [quotePrefix, setQuotePrefix] = useState("Q-");

  const progress = (step / TOTAL_STEPS) * 100;

  const handleFinish = () => {
    upsert.mutate(
      {
        company_name: companyName || null,
        logo_url: logoUrl || null,
        address_line1: addressLine1 || null,
        city: city || null,
        state: state || null,
        zip: zip || null,
        phone: phone || null,
        email: email || null,
        default_tax_rate: defaultTaxRate,
        default_payment_terms: defaultPaymentTerms,
        invoice_prefix: invoicePrefix,
        quote_prefix: quotePrefix,
      },
      {
        onSuccess: async () => {
          await qc.invalidateQueries({ queryKey: ["company-settings"] });
          navigate("/");
        },
      }
    );
  };

  const stepIcons = [Building2, MapPin, Settings2];
  const stepLabels = ["Company Info", "Address & Contact", "Defaults"];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border/50 bg-background">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            QL
          </div>
          <div>
            <h1 className="font-bold text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Welcome to QuickLinq
            </h1>
            <p className="text-xs text-muted-foreground">Send Quotes. Win Jobs. Get Paid.</p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="max-w-2xl mx-auto w-full px-4 pt-6">
        <div className="flex items-center justify-between mb-3">
          {stepLabels.map((label, i) => {
            const Icon = stepIcons[i];
            const isActive = step === i + 1;
            const isDone = step > i + 1;
            return (
              <div key={label} className="flex items-center gap-1.5 text-xs">
                <div
                  className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors ${
                    isDone
                      ? "bg-primary text-primary-foreground"
                      : isActive
                      ? "bg-primary/10 text-primary"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
                </div>
                <span className={isActive || isDone ? "font-medium text-foreground" : "text-muted-foreground"}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-4 pt-8 pb-16">
        <Card className="w-full max-w-2xl shadow-warm-md border-border/50">
          <CardContent className="p-6 sm:p-8">
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    What's your business called?
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    This will appear on your quotes and invoices.
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Company Name</Label>
                    <Input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Acme Landscaping"
                      autoFocus
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Logo URL (optional)</Label>
                    <Input
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="mt-1.5"
                    />
                    <p className="text-xs text-muted-foreground mt-1">You can add or change this later in Settings.</p>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    Where are you located?
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your address appears on invoices and quotes.
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Address</Label>
                    <Input
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      placeholder="123 Main St"
                      className="mt-1.5"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>City</Label>
                      <Input value={city} onChange={(e) => setCity(e.target.value)} className="mt-1.5" />
                    </div>
                    <div>
                      <Label>State</Label>
                      <Input value={state} onChange={(e) => setState(e.target.value)} className="mt-1.5" />
                    </div>
                    <div>
                      <Label>ZIP</Label>
                      <Input value={zip} onChange={(e) => setZip(e.target.value)} className="mt-1.5" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Phone</Label>
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" className="mt-1.5" />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    Set your defaults
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    These will be pre-filled on new quotes and invoices. You can always change them later.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Default Tax Rate (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={defaultTaxRate}
                        onChange={(e) => setDefaultTaxRate(parseFloat(e.target.value) || 0)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label>Payment Terms</Label>
                      <Select value={defaultPaymentTerms} onValueChange={setDefaultPaymentTerms}>
                        <SelectTrigger className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentTermOptions.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Invoice Prefix</Label>
                      <Input value={invoicePrefix} onChange={(e) => setInvoicePrefix(e.target.value)} className="mt-1.5" />
                    </div>
                    <div>
                      <Label>Quote Prefix</Label>
                      <Input value={quotePrefix} onChange={(e) => setQuotePrefix(e.target.value)} className="mt-1.5" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-5 border-t border-border/50">
              {step > 1 ? (
                <Button variant="ghost" onClick={() => setStep(step - 1)} className="gap-1.5">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
              ) : (
                <Button variant="ghost" onClick={() => navigate("/")} className="text-muted-foreground">
                  Skip for now
                </Button>
              )}
              {step < TOTAL_STEPS ? (
                <Button onClick={() => setStep(step + 1)} className="gap-1.5">
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleFinish} disabled={upsert.isPending} className="gap-1.5">
                  {upsert.isPending ? "Saving…" : "Finish Setup"} <CheckCircle2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
