import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useUpsertCompanySettings } from "@/hooks/useCompanySettings";
import { useTeam } from "@/hooks/useTeam";
import { useToast } from "@/hooks/use-toast";
import { Upload, X } from "lucide-react";
import {
  Briefcase,
  Building2,
  MapPin,
  Settings2,
  ClipboardCheck,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Sprout,
  Scissors,
  Wrench,
  Zap,
  Thermometer,
  Home,
  Paintbrush,
  Brush,
  Hammer,
  Square,
  Droplets,
  Snowflake,
  Bug,
  HardHat,
  MoreHorizontal,
  Pencil,
} from "lucide-react";
import QuickLinqLogo from "@/components/QuickLinqLogo";

const paymentTermOptions = [
  { value: "due_on_receipt", label: "Due on Receipt" },
  { value: "net_15", label: "Net 15" },
  { value: "net_30", label: "Net 30" },
  { value: "net_45", label: "Net 45" },
  { value: "net_60", label: "Net 60" },
];

const TRADES = [
  { value: "Landscaping", icon: Sprout },
  { value: "Lawn Care", icon: Scissors },
  { value: "Plumbing", icon: Wrench },
  { value: "Electrical", icon: Zap },
  { value: "HVAC", icon: Thermometer },
  { value: "Roofing", icon: Home },
  { value: "Painting", icon: Paintbrush },
  { value: "Cleaning", icon: Brush },
  { value: "Handyman", icon: Hammer },
  { value: "Carpentry", icon: Hammer },
  { value: "Flooring", icon: Square },
  { value: "Pressure Washing", icon: Droplets },
  { value: "Snow Removal", icon: Snowflake },
  { value: "Pest Control", icon: Bug },
  { value: "General Contractor", icon: HardHat },
  { value: "Other", icon: MoreHorizontal },
];

const TOTAL_STEPS = 6;
const stepIcons = [Briefcase, Building2, MapPin, Settings2, ClipboardCheck, Sparkles];
const stepLabels = ["Trade", "Business", "Location", "Defaults", "Review", "Finish"];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const upsert = useUpsertCompanySettings();
  const { data: team } = useTeam();
  const { toast } = useToast();
  const [step, setStep] = useState(1);

  // Step 1 — trade
  const [trade, setTrade] = useState<string>("");
  const [otherTrade, setOtherTrade] = useState("");

  // Step 2 — business
  const [companyName, setCompanyName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);

  // Step 3 — address
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(user?.email || "");

  // Step 4 — defaults
  const [defaultTaxRate, setDefaultTaxRate] = useState(13);
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState("net_30");
  const [invoicePrefix, setInvoicePrefix] = useState("INV-");
  const [quotePrefix, setQuotePrefix] = useState("Q-");

  const resolvedTrade = trade === "Other" ? otherTrade.trim() : trade;
  const progress = (step / TOTAL_STEPS) * 100;

  const canContinue = (() => {
    if (step === 1) return resolvedTrade.length > 0;
    if (step === 2) return companyName.trim().length > 0;
    return true;
  })();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border/50 bg-background">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <QuickLinqLogo size={32} type="full" variant="dark" />
          <div>
            <h1
              className="font-bold text-lg"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Welcome to QuickLinq
            </h1>
            <p className="text-xs text-muted-foreground">
              Send Quotes. Win Jobs. Get Paid.
            </p>
          </div>
        </div>
      </div>

      {/* Progress */}
      {step < TOTAL_STEPS && (
        <div className="max-w-2xl mx-auto w-full px-4 pt-6">
          <div className="hidden sm:flex items-center justify-between mb-3 gap-2">
            {stepLabels.slice(0, TOTAL_STEPS - 1).map((label, i) => {
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
                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Icon className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <span
                    className={
                      isActive || isDone
                        ? "font-medium text-foreground"
                        : "text-muted-foreground"
                    }
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-4 pt-8 pb-16">
        <Card className="w-full max-w-2xl shadow-warm-md border-border/50">
          <CardContent className="p-6 sm:p-8">
            {step === 1 && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h2
                    className="text-xl font-bold"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    What kind of business do you run?
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    We'll personalize your dashboard and suggest starter services.
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {TRADES.map((t) => {
                    const Icon = t.icon;
                    const selected = trade === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setTrade(t.value)}
                        className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border text-sm transition-all ${
                          selected
                            ? "border-primary bg-primary/5 text-primary shadow-sm scale-[1.02]"
                            : "border-border hover:border-primary/40 hover:bg-muted/40"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium text-center leading-tight">
                          {t.value}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {trade === "Other" && (
                  <div>
                    <Label>What's your trade?</Label>
                    <Input
                      value={otherTrade}
                      onChange={(e) => setOtherTrade(e.target.value)}
                      placeholder="e.g. Window Tinting"
                      autoFocus
                      className="mt-1.5"
                    />
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h2
                    className="text-xl font-bold"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    What's your business called?
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    This appears on your quotes and invoices.
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
                    <p className="text-xs text-muted-foreground mt-1">
                      You can add or change this later in Settings.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h2
                    className="text-xl font-bold"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
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
                      <Input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label>State</Label>
                      <Input
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label>ZIP</Label>
                      <Input
                        value={zip}
                        onChange={(e) => setZip(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(555) 123-4567"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h2
                    className="text-xl font-bold"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    Set your defaults
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    These pre-fill new quotes and invoices. You can change them anytime.
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
                        onChange={(e) =>
                          setDefaultTaxRate(parseFloat(e.target.value) || 0)
                        }
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label>Payment Terms</Label>
                      <Select
                        value={defaultPaymentTerms}
                        onValueChange={setDefaultPaymentTerms}
                      >
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
                      <Input
                        value={invoicePrefix}
                        onChange={(e) => setInvoicePrefix(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label>Quote Prefix</Label>
                      <Input
                        value={quotePrefix}
                        onChange={(e) => setQuotePrefix(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h2
                    className="text-xl font-bold"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    Looks good?
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Review your setup. You can edit any section.
                  </p>
                </div>
                <div className="space-y-3">
                  <ReviewRow
                    label="Trade"
                    value={resolvedTrade || "—"}
                    onEdit={() => setStep(1)}
                  />
                  <ReviewRow
                    label="Business"
                    value={companyName || "—"}
                    onEdit={() => setStep(2)}
                  />
                  <ReviewRow
                    label="Location"
                    value={
                      [addressLine1, city, state, zip].filter(Boolean).join(", ") ||
                      "—"
                    }
                    onEdit={() => setStep(3)}
                  />
                  <ReviewRow
                    label="Contact"
                    value={[phone, email].filter(Boolean).join(" • ") || "—"}
                    onEdit={() => setStep(3)}
                  />
                  <ReviewRow
                    label="Defaults"
                    value={`Tax ${defaultTaxRate}% • ${
                      paymentTermOptions.find(
                        (o) => o.value === defaultPaymentTerms,
                      )?.label
                    } • ${invoicePrefix} / ${quotePrefix}`}
                    onEdit={() => setStep(4)}
                  />
                </div>
              </div>
            )}

            {step === 6 && (
              <PreparingDashboard
                trade={resolvedTrade}
                payload={{
                  trade: resolvedTrade || null,
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
                }}
                onDone={async () => {
                  await qc.invalidateQueries({ queryKey: ["company-settings"] });
                  navigate("/");
                }}
                upsert={upsert.mutateAsync}
              />
            )}

            {/* Navigation */}
            {step < TOTAL_STEPS && (
              <div className="flex items-center justify-between mt-8 pt-5 border-t border-border/50">
                {step > 1 ? (
                  <Button
                    variant="ghost"
                    onClick={() => setStep(step - 1)}
                    className="gap-1.5"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/")}
                    className="text-muted-foreground"
                  >
                    Skip for now
                  </Button>
                )}
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={!canContinue}
                  className="gap-1.5"
                >
                  {step === 5 ? "Finish Setup" : "Continue"}{" "}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ReviewRow({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border/50 bg-muted/20">
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
          {label}
        </div>
        <div className="text-sm text-foreground mt-0.5 break-words">{value}</div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onEdit}
        className="h-8 px-2 text-muted-foreground hover:text-foreground"
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

type Task = { id: string; label: string; status: "pending" | "active" | "done" };

function PreparingDashboard({
  trade,
  payload,
  upsert,
  onDone,
}: {
  trade: string;
  payload: Record<string, unknown>;
  upsert: (data: Record<string, unknown>) => Promise<unknown>;
  onDone: () => void | Promise<void>;
}) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([
    { id: "workspace", label: "Creating your workspace", status: "active" },
    { id: "company", label: "Saving company details", status: "pending" },
    {
      id: "services",
      label: `Generating starter services${trade ? ` for ${trade}` : ""}`,
      status: "pending",
    },
    { id: "dashboard", label: "Personalizing your dashboard", status: "pending" },
  ]);

  const mark = (id: string, status: Task["status"]) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // 1. workspace (instant)
        await sleep(500);
        if (cancelled) return;
        mark("workspace", "done");
        mark("company", "active");

        // 2. save company settings
        await upsert(payload);
        if (cancelled) return;
        mark("company", "done");
        mark("services", "active");

        // 3. generate services (best-effort)
        if (trade) {
          try {
            await supabase.functions.invoke("generate-starter-services", {
              body: { trade },
            });
          } catch (e) {
            console.error("starter services failed:", e);
          }
        }
        if (cancelled) return;
        mark("services", "done");
        mark("dashboard", "active");

        // 4. welcome email + final shimmer
        if (user?.email) {
          supabase.functions
            .invoke("send-transactional-email", {
              body: {
                templateName: "welcome-email",
                recipientEmail: user.email,
                idempotencyKey: `welcome-${user.id}`,
                templateData: {
                  companyName: (payload.company_name as string) || undefined,
                },
              },
            })
            .catch(console.error);
        }
        await sleep(800);
        if (cancelled) return;
        mark("dashboard", "done");
        await sleep(600);
        if (cancelled) return;
        await onDone();
      } catch (e) {
        console.error("Onboarding finalize error:", e);
        // Even on error, send user to dashboard so they're not stuck
        await onDone();
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="py-6 space-y-6 animate-fade-in">
      <div className="text-center space-y-3">
        <div className="relative inline-flex">
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          <div className="relative h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-primary animate-pulse" />
          </div>
        </div>
        <h2
          className="text-xl font-bold"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Preparing your dashboard
        </h2>
        <p className="text-sm text-muted-foreground">
          Hang tight — we're tailoring QuickLinq to your business.
        </p>
      </div>

      <ul className="space-y-2 max-w-md mx-auto">
        {tasks.map((t) => (
          <li
            key={t.id}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
              t.status === "active"
                ? "border-primary/40 bg-primary/5"
                : t.status === "done"
                  ? "border-border/50 bg-muted/20"
                  : "border-border/40 bg-background opacity-60"
            }`}
          >
            <div className="flex-shrink-0">
              {t.status === "done" ? (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              ) : t.status === "active" ? (
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
              )}
            </div>
            <span
              className={`text-sm ${
                t.status === "done"
                  ? "text-foreground"
                  : t.status === "active"
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
              }`}
            >
              {t.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
