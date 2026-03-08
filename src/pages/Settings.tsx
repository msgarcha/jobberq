import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCompanySettings, useUpsertCompanySettings } from "@/hooks/useCompanySettings";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SUBSCRIPTION_TIERS, type TierKey } from "@/lib/subscriptionTiers";
import { Save, Building2, Upload, CreditCard, CheckCircle2, Crown, Zap } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";

const paymentTermOptions = [
  { value: "due_on_receipt", label: "Due on Receipt" },
  { value: "net_15", label: "Net 15" },
  { value: "net_30", label: "Net 30" },
  { value: "net_45", label: "Net 45" },
  { value: "net_60", label: "Net 60" },
];

const Settings = () => {
  const { data: settings, isLoading } = useCompanySettings();
  const upsert = useUpsertCompanySettings();
  const { subscription, checkSubscription } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "company";

  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("US");
  const [logoUrl, setLogoUrl] = useState("");
  const [quotePrefix, setQuotePrefix] = useState("Q-");
  const [invoicePrefix, setInvoicePrefix] = useState("INV-");
  const [nextQuoteNumber, setNextQuoteNumber] = useState(1001);
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState(1001);
  const [defaultTaxRate, setDefaultTaxRate] = useState(13);
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState("net_30");
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  // Handle checkout success
  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast({ title: "Subscription activated!", description: "Welcome to ServicePro." });
      checkSubscription();
    }
  }, [searchParams]);

  useEffect(() => {
    if (settings) {
      setCompanyName(settings.company_name || "");
      setEmail(settings.email || "");
      setPhone(settings.phone || "");
      setWebsite(settings.website || "");
      setAddressLine1(settings.address_line1 || "");
      setAddressLine2(settings.address_line2 || "");
      setCity(settings.city || "");
      setState(settings.state || "");
      setZip(settings.zip || "");
      setCountry(settings.country || "US");
      setLogoUrl(settings.logo_url || "");
      setQuotePrefix(settings.quote_prefix || "Q-");
      setInvoicePrefix(settings.invoice_prefix || "INV-");
      setNextQuoteNumber(settings.next_quote_number || 1001);
      setNextInvoiceNumber(settings.next_invoice_number || 1001);
      setDefaultTaxRate(Number(settings.default_tax_rate) || 0);
      setDefaultPaymentTerms(settings.default_payment_terms || "net_30");
    }
  }, [settings]);

  const handleSave = () => {
    upsert.mutate({
      company_name: companyName || null,
      email: email || null,
      phone: phone || null,
      website: website || null,
      address_line1: addressLine1 || null,
      address_line2: addressLine2 || null,
      city: city || null,
      state: state || null,
      zip: zip || null,
      country: country || null,
      logo_url: logoUrl || null,
      quote_prefix: quotePrefix || null,
      invoice_prefix: invoicePrefix || null,
      next_quote_number: nextQuoteNumber,
      next_invoice_number: nextInvoiceNumber,
      default_tax_rate: defaultTaxRate,
      default_payment_terms: defaultPaymentTerms || null,
    });
  };

  const handleCheckout = async (tierKey: TierKey) => {
    setCheckoutLoading(tierKey);
    try {
      const tier = SUBSCRIPTION_TIERS[tierKey];
      const { data, error } = await supabase.functions.invoke("create-subscription-checkout", {
        body: { priceId: tier.priceId },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to start checkout", variant: "destructive" });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to open billing portal", variant: "destructive" });
    } finally {
      setPortalLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading…</div>
      </DashboardLayout>
    );
  }

  const currentTier = subscription.tier;
  const isTrialing = subscription.isTrialing;
  const trialEnd = subscription.trialEndsAt;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-4xl">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your company and subscription.</p>
        </div>

        <Tabs defaultValue={defaultTab}>
          <TabsList>
            <TabsTrigger value="company">Company</TabsTrigger>
            <TabsTrigger value="invoicing">Invoicing</TabsTrigger>
            <TabsTrigger value="billing" className="gap-1.5">
              <CreditCard className="h-3.5 w-3.5" /> Billing
            </TabsTrigger>
          </TabsList>

          {/* Company Tab */}
          <TabsContent value="company" className="space-y-5 mt-5">
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={upsert.isPending} className="gap-1.5">
                <Save className="h-4 w-4" />
                {upsert.isPending ? "Saving…" : "Save Changes"}
              </Button>
            </div>
            <Card className="shadow-warm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Company Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-6">
                  <div className="shrink-0">
                    <Label className="text-xs mb-1.5 block">Logo</Label>
                    <div className="flex flex-col items-center gap-2">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Company logo" className="h-16 w-16 rounded-xl object-cover border" />
                      ) : (
                        <div className="h-16 w-16 rounded-xl bg-secondary flex items-center justify-center">
                          <Upload className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="Logo URL" className="text-xs h-8 w-40" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <Label className="text-xs">Company Name</Label>
                      <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Your Company Name" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Email</Label>
                        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="hello@company.com" />
                      </div>
                      <div>
                        <Label className="text-xs">Phone</Label>
                        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Website</Label>
                      <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://company.com" />
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Address</p>
                  <div>
                    <Label className="text-xs">Address Line 1</Label>
                    <Input value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} placeholder="123 Main St" />
                  </div>
                  <div>
                    <Label className="text-xs">Address Line 2</Label>
                    <Input value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} placeholder="Suite 100" />
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="col-span-2">
                      <Label className="text-xs">City</Label>
                      <Input value={city} onChange={(e) => setCity(e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">State</Label>
                      <Input value={state} onChange={(e) => setState(e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">ZIP</Label>
                      <Input value={zip} onChange={(e) => setZip(e.target.value)} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoicing Tab */}
          <TabsContent value="invoicing" className="space-y-5 mt-5">
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={upsert.isPending} className="gap-1.5">
                <Save className="h-4 w-4" />
                {upsert.isPending ? "Saving…" : "Save Changes"}
              </Button>
            </div>
            <Card className="shadow-warm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">Invoicing & Quotes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Quote Prefix</Label>
                    <Input value={quotePrefix} onChange={(e) => setQuotePrefix(e.target.value)} placeholder="Q-" />
                  </div>
                  <div>
                    <Label className="text-xs">Next Quote Number</Label>
                    <Input type="number" min={1} value={nextQuoteNumber} onChange={(e) => setNextQuoteNumber(parseInt(e.target.value) || 1)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Invoice Prefix</Label>
                    <Input value={invoicePrefix} onChange={(e) => setInvoicePrefix(e.target.value)} placeholder="INV-" />
                  </div>
                  <div>
                    <Label className="text-xs">Next Invoice Number</Label>
                    <Input type="number" min={1} value={nextInvoiceNumber} onChange={(e) => setNextInvoiceNumber(parseInt(e.target.value) || 1)} />
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Default Tax Rate (%)</Label>
                    <Input type="number" min={0} step="0.01" value={defaultTaxRate} onChange={(e) => setDefaultTaxRate(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                    <Label className="text-xs">Default Payment Terms</Label>
                    <Select value={defaultPaymentTerms} onValueChange={setDefaultPaymentTerms}>
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
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-5 mt-5">
            {/* Current Plan Status */}
            <Card className="shadow-warm border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold text-lg">
                        {currentTier ? SUBSCRIPTION_TIERS[currentTier].name : "Free Trial"}
                      </h3>
                      {isTrialing && (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <Zap className="h-3 w-3" /> Trial
                        </Badge>
                      )}
                      {subscription.subscribed && !isTrialing && (
                        <Badge className="bg-primary text-primary-foreground gap-1 text-xs">
                          <Crown className="h-3 w-3" /> Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {subscription.subscribed && subscription.subscriptionEnd
                        ? `Renews ${format(new Date(subscription.subscriptionEnd), "MMM d, yyyy")}`
                        : isTrialing && trialEnd
                        ? `Trial ends ${format(new Date(trialEnd), "MMM d, yyyy")}`
                        : "No active subscription"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={checkSubscription} disabled={subscription.loading}>
                      Refresh
                    </Button>
                    {subscription.subscribed && (
                      <Button variant="outline" size="sm" onClick={handleManageSubscription} disabled={portalLoading}>
                        {portalLoading ? "Loading…" : "Manage Subscription"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing Cards */}
            <div className="grid gap-5 sm:grid-cols-3">
              {(Object.entries(SUBSCRIPTION_TIERS) as [TierKey, typeof SUBSCRIPTION_TIERS[TierKey]][]).map(([key, tier]) => {
                const isCurrentPlan = currentTier === key;
                const isPopular = "popular" in tier && tier.popular;
                return (
                  <Card
                    key={key}
                    className={`relative shadow-warm transition-shadow ${
                      isCurrentPlan
                        ? "border-primary ring-2 ring-primary/20"
                        : isPopular
                        ? "border-primary/50"
                        : "border-border/50"
                    }`}
                  >
                    {isCurrentPlan && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground text-xs px-3">Your Plan</Badge>
                      </div>
                    )}
                    {!isCurrentPlan && isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge variant="secondary" className="text-xs px-3">Most Popular</Badge>
                      </div>
                    )}
                    <CardContent className="p-5 pt-7 space-y-4">
                      <div>
                        <h4 className="font-display font-semibold text-lg">{tier.name}</h4>
                        <CardDescription className="text-xs">{tier.description}</CardDescription>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-display font-bold">{tier.price}</span>
                        <span className="text-muted-foreground text-sm">/mo</span>
                      </div>
                      <ul className="space-y-2">
                        {tier.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="w-full"
                        variant={isCurrentPlan ? "outline" : isPopular ? "default" : "outline"}
                        disabled={isCurrentPlan || !!checkoutLoading}
                        onClick={() => handleCheckout(key)}
                      >
                        {isCurrentPlan
                          ? "Current Plan"
                          : checkoutLoading === key
                          ? "Loading…"
                          : subscription.subscribed
                          ? "Switch Plan"
                          : "Start Free Trial"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
