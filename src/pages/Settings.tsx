import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCompanySettings, useUpsertCompanySettings } from "@/hooks/useCompanySettings";
import { useAuth } from "@/contexts/AuthContext";
import { useTeam, useTeamMembers, useTeamInvitations, useSendInvite, useUpdateMemberRole, useRemoveMember, useCancelInvitation } from "@/hooks/useTeam";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SUBSCRIPTION_TIERS, type TierKey } from "@/lib/subscriptionTiers";
import { Save, Building2, Upload, CreditCard, CheckCircle2, Crown, Zap, Users, Mail, Trash2, Copy, UserPlus, Star, FileSpreadsheet, ArrowRight, Link2, Unlink, Loader2, ExternalLink, X, Palette } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useSearchParams, useNavigate } from "react-router-dom";
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
  const { subscription, checkSubscription, user, team: authTeam } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "company";

  // Team hooks
  const { data: teamData } = useTeam();
  const teamId = authTeam.teamId;
  const { data: members } = useTeamMembers(teamId || undefined);
  const { data: invitations } = useTeamInvitations(teamId || undefined);
  const sendInvite = useSendInvite();
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const cancelInvite = useCancelInvitation();

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [lastInviteUrl, setLastInviteUrl] = useState("");

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
  const [logoUploading, setLogoUploading] = useState(false);
  const [pdfPrimaryColor, setPdfPrimaryColor] = useState("#1a1a1a");
  const [pdfAccentColor, setPdfAccentColor] = useState("#6366f1");
  const [pdfStyle, setPdfStyle] = useState("classic");
  const [quotePrefix, setQuotePrefix] = useState("Q-");
  const [invoicePrefix, setInvoicePrefix] = useState("INV-");
  const [nextQuoteNumber, setNextQuoteNumber] = useState(1001);
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState(1001);
  const [defaultTaxRate, setDefaultTaxRate] = useState(13);
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState("net_30");
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [reviewMinStars, setReviewMinStars] = useState(4);
  const [reviewGatingEnabled, setReviewGatingEnabled] = useState(true);

  // Stripe Connect state
  const [stripeConnectLoading, setStripeConnectLoading] = useState(false);
  const [stripeStatus, setStripeStatus] = useState<{
    connected: boolean;
    onboarding_complete?: boolean;
    charges_enabled?: boolean;
    payouts_enabled?: boolean;
    account_id?: string;
  } | null>(null);
  const [stripeStatusLoading, setStripeStatusLoading] = useState(false);

  // Check Stripe Connect status on mount and after redirect
  useEffect(() => {
    if (user) {
      checkStripeStatus();
    }
  }, [user]);

  useEffect(() => {
    if (searchParams.get("stripe") === "complete") {
      checkStripeStatus();
      toast({ title: "Stripe setup updated", description: "Checking your account status..." });
    }
  }, [searchParams]);

  const checkStripeStatus = async () => {
    setStripeStatusLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("connect-stripe-account", {
        body: { action: "status" },
      });
      if (error) throw error;
      setStripeStatus(data);
    } catch (err: any) {
      console.error("Failed to check Stripe status:", err);
    } finally {
      setStripeStatusLoading(false);
    }
  };

  const handleConnectStripe = async () => {
    setStripeConnectLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("connect-stripe-account", {
        body: { action: "create" },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to start Stripe Connect", variant: "destructive" });
    } finally {
      setStripeConnectLoading(false);
    }
  };

  const handleDisconnectStripe = async () => {
    setStripeConnectLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("connect-stripe-account", {
        body: { action: "disconnect" },
      });
      if (error) throw error;
      setStripeStatus({ connected: false });
      toast({ title: "Stripe disconnected" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setStripeConnectLoading(false);
    }
  };

  // Handle checkout success
  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast({ title: "Subscription activated!", description: "Welcome to QuickLinq." });
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
      setGoogleReviewUrl((settings as any).google_review_url || "");
      setReviewMinStars((settings as any).review_min_stars ?? 4);
      setReviewGatingEnabled((settings as any).review_gating_enabled ?? true);
      setPdfPrimaryColor((settings as any).pdf_primary_color || "#1a1a1a");
      setPdfAccentColor((settings as any).pdf_accent_color || "#6366f1");
      setPdfStyle((settings as any).pdf_style || "classic");
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
      google_review_url: googleReviewUrl || null,
      review_min_stars: reviewMinStars,
      review_gating_enabled: reviewGatingEnabled,
      pdf_primary_color: pdfPrimaryColor,
      pdf_accent_color: pdfAccentColor,
      pdf_style: pdfStyle,
    } as any);
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
          <div className="overflow-x-auto -mx-1 px-1 scrollbar-hide">
            <TabsList className="inline-flex w-auto min-w-full md:w-auto">
              <TabsTrigger value="company">Company</TabsTrigger>
              <TabsTrigger value="invoicing">Invoicing</TabsTrigger>
              <TabsTrigger value="team" className="gap-1.5">
                <Users className="h-3.5 w-3.5" /> Team
              </TabsTrigger>
              <TabsTrigger value="reviews" className="gap-1.5">
                <Star className="h-3.5 w-3.5" /> Reviews
              </TabsTrigger>
              <TabsTrigger value="billing" className="gap-1.5">
                <CreditCard className="h-3.5 w-3.5" /> Billing
              </TabsTrigger>
              <TabsTrigger value="import" className="gap-1.5">
                <FileSpreadsheet className="h-3.5 w-3.5" /> Import
              </TabsTrigger>
            </TabsList>
          </div>

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
              <div className="flex flex-col md:flex-row items-start gap-6">
                  <div className="shrink-0 w-full md:w-auto">
                    <Label className="text-xs mb-1.5 block">Logo</Label>
                    <div className="flex flex-row md:flex-col items-center gap-3 md:gap-2">
                      {logoUrl ? (
                        <div className="relative">
                          <img src={logoUrl} alt="Company logo" className="h-16 w-16 rounded-xl object-cover border" />
                          <button
                            type="button"
                            onClick={() => setLogoUrl("")}
                            className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="h-16 w-16 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                          <Upload className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex flex-col gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 gap-1"
                          disabled={logoUploading}
                          onClick={() => document.getElementById("logo-upload-input")?.click()}
                        >
                          {logoUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                          {logoUrl ? "Change" : "Upload"}
                        </Button>
                        <input
                          id="logo-upload-input"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setLogoUploading(true);
                            try {
                              const ext = file.name.split(".").pop() || "png";
                              const teamId = authTeam.teamId || "default";
                              const path = `${teamId}/logo.${ext}`;
                              const { error: upErr } = await supabase.storage.from("company-assets").upload(path, file, { upsert: true });
                              if (upErr) throw upErr;
                              const { data: urlData } = supabase.storage.from("company-assets").getPublicUrl(path);
                              setLogoUrl(urlData.publicUrl);
                              toast({ title: "Logo uploaded" });
                            } catch (err: any) {
                              toast({ title: "Upload failed", description: err.message, variant: "destructive" });
                            } finally {
                              setLogoUploading(false);
                              e.target.value = "";
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 space-y-3 w-full">
                    <div>
                      <Label className="text-xs">Company Name</Label>
                      <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Your Company Name" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

            {/* Payment Setup - Stripe Connect */}
            <Card className="shadow-warm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  Payment Setup
                </CardTitle>
                <CardDescription className="text-xs">
                  Connect your Stripe account so invoice payments go directly to your bank account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {stripeStatusLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                    <Loader2 className="h-4 w-4 animate-spin" /> Checking payment setup…
                  </div>
                ) : stripeStatus?.connected ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-2.5 w-2.5 rounded-full ${stripeStatus.onboarding_complete ? 'bg-green-500' : 'bg-amber-500'}`} />
                        <span className="text-sm font-medium">
                          {stripeStatus.onboarding_complete ? "Connected & Active" : "Setup Incomplete"}
                        </span>
                      </div>
                      <Badge variant={stripeStatus.onboarding_complete ? "default" : "secondary"} className="text-xs">
                        {stripeStatus.onboarding_complete ? (
                          <><CheckCircle2 className="h-3 w-3 mr-1" /> Ready</>
                        ) : (
                          "Pending"
                        )}
                      </Badge>
                    </div>
                    {!stripeStatus.onboarding_complete && (
                      <p className="text-xs text-muted-foreground">
                        Your Stripe account needs more information before you can accept payments. Click below to complete setup.
                      </p>
                    )}
                    {stripeStatus.onboarding_complete && (
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>✓ Charges enabled — you can accept payments</p>
                        <p>{stripeStatus.payouts_enabled ? "✓" : "✗"} Payouts enabled — funds transfer to your bank</p>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {!stripeStatus.onboarding_complete && (
                        <Button size="sm" onClick={handleConnectStripe} disabled={stripeConnectLoading} className="gap-1.5">
                          {stripeConnectLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
                          Complete Setup
                        </Button>
                      )}
                      {stripeStatus.onboarding_complete && (
                        <Button size="sm" variant="outline" className="gap-1.5" onClick={async () => {
                          try {
                            const { data, error } = await supabase.functions.invoke("connect-stripe-account", {
                              body: { action: "login-link" },
                            });
                            if (error) throw error;
                            if (data?.url) window.open(data.url, "_blank");
                          } catch (err: any) {
                            toast({ title: "Error", description: err.message || "Failed to open Stripe dashboard", variant: "destructive" });
                          }
                        }}>
                          <ExternalLink className="h-3.5 w-3.5" /> View Stripe Dashboard
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={checkStripeStatus} disabled={stripeStatusLoading}>
                        Refresh Status
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={handleDisconnectStripe}
                        disabled={stripeConnectLoading}
                      >
                        <Unlink className="h-3.5 w-3.5 mr-1" /> Disconnect
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Connect your Stripe account to accept credit card payments on invoices. You'll be redirected to Stripe to enter your bank details and verify your identity — we never see your banking info.
                    </p>
                    <Button onClick={handleConnectStripe} disabled={stripeConnectLoading} className="gap-1.5">
                      {stripeConnectLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                      Connect with Stripe
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* PDF Appearance */}
            <Card className="shadow-warm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  PDF Appearance
                </CardTitle>
                <CardDescription className="text-xs">
                  Customize how your invoices and quotes look when printed or downloaded.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Primary Color</Label>
                    <p className="text-[10px] text-muted-foreground mb-1">Headings and main text accents</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={pdfPrimaryColor}
                        onChange={(e) => setPdfPrimaryColor(e.target.value)}
                        className="h-9 w-12 rounded border border-input cursor-pointer"
                      />
                      <Input
                        value={pdfPrimaryColor}
                        onChange={(e) => setPdfPrimaryColor(e.target.value)}
                        className="text-xs h-9 font-mono uppercase"
                        maxLength={7}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Accent Color</Label>
                    <p className="text-[10px] text-muted-foreground mb-1">Borders, status badges, highlights</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={pdfAccentColor}
                        onChange={(e) => setPdfAccentColor(e.target.value)}
                        className="h-9 w-12 rounded border border-input cursor-pointer"
                      />
                      <Input
                        value={pdfAccentColor}
                        onChange={(e) => setPdfAccentColor(e.target.value)}
                        className="text-xs h-9 font-mono uppercase"
                        maxLength={7}
                      />
                    </div>
                  </div>
                </div>
                <Separator />
                <div>
                  <Label className="text-xs mb-2 block">PDF Style</Label>
                  <RadioGroup value={pdfStyle} onValueChange={setPdfStyle} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { value: "classic", label: "Classic", desc: "Traditional layout with border lines" },
                      { value: "modern", label: "Modern", desc: "Colored header band, rounded elements" },
                      { value: "minimal", label: "Minimal", desc: "Clean, no borders, lots of whitespace" },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex items-start gap-3 border rounded-lg p-3 cursor-pointer transition-colors ${
                          pdfStyle === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                        }`}
                      >
                        <RadioGroupItem value={opt.value} className="mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">{opt.label}</p>
                          <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                        </div>
                      </label>
                    ))}
                  </RadioGroup>
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

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-5 mt-5">
            {/* Invite Member */}
            <Card className="shadow-warm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                  Invite Team Member
                </CardTitle>
                <CardDescription className="text-xs">
                  {authTeam.role === "admin"
                    ? "Send an email invite to add someone to your team."
                    : "Only team admins can invite new members."}
                </CardDescription>
              </CardHeader>
              {authTeam.role === "admin" && (
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <Label className="text-xs">Email Address</Label>
                      <Input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="colleague@company.com"
                      />
                    </div>
                    <div className="flex gap-3">
                      <div className="w-32">
                        <Label className="text-xs">Role</Label>
                        <Select value={inviteRole} onValueChange={setInviteRole}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                      <Button
                        onClick={async () => {
                          if (!inviteEmail || !teamId) return;
                          sendInvite.mutate(
                            { teamId, email: inviteEmail, role: inviteRole },
                            {
                              onSuccess: (data) => {
                                setInviteEmail("");
                                if (data?.inviteUrl) setLastInviteUrl(data.inviteUrl);
                              },
                            }
                          );
                        }}
                        disabled={sendInvite.isPending || !inviteEmail}
                        className="gap-1.5"
                      >
                        <Mail className="h-4 w-4" />
                        {sendInvite.isPending ? "Sending…" : "Send Invite"}
                      </Button>
                      </div>
                    </div>
                  </div>
                  {lastInviteUrl && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 border border-border/50">
                      <p className="text-xs text-muted-foreground flex-1 truncate">{lastInviteUrl}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(lastInviteUrl);
                          toast({ title: "Invite link copied!" });
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Current Members */}
            <Card className="shadow-warm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Team Members ({members?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-border/50">
                  {members?.map((member) => (
                    <div key={member.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                          {((member.profiles as any)?.display_name || "?")[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{(member.profiles as any)?.display_name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {authTeam.role === "admin" && member.user_id !== user?.id && (
                          <>
                            <Select
                              value={member.role}
                              onValueChange={(val) =>
                                updateRole.mutate({ memberId: member.id, role: val, teamId: teamId! })
                              }
                            >
                              <SelectTrigger className="h-8 w-28 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => removeMember.mutate({ memberId: member.id, teamId: teamId! })}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        {member.user_id === user?.id && (
                          <Badge variant="secondary" className="text-xs">You</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pending Invitations */}
            {invitations && invitations.length > 0 && (
              <Card className="shadow-warm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium">Pending Invitations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-border/50">
                    {invitations.map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                        <div>
                          <p className="text-sm font-medium">{inv.email}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {inv.role} · Expires {format(new Date(inv.expires_at), "MMM d")}
                          </p>
                        </div>
                        {authTeam.role === "admin" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => cancelInvite.mutate({ invitationId: inv.id, teamId: teamId! })}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-5 mt-5">
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={upsert.isPending} className="gap-1.5">
                <Save className="h-4 w-4" />
                {upsert.isPending ? "Saving…" : "Save Changes"}
              </Button>
            </div>
            <Card className="shadow-warm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Star className="h-4 w-4 text-[hsl(36,80%,50%)]" />
                  Reputation Shield
                </CardTitle>
                <CardDescription className="text-xs">
                  Screen reviews before they reach Google. Low ratings stay private, great ratings get redirected to your Google Reviews page.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Enable Review Gating</Label>
                    <p className="text-xs text-muted-foreground">When enabled, only reviews above the threshold are redirected to Google.</p>
                  </div>
                  <Switch checked={reviewGatingEnabled} onCheckedChange={setReviewGatingEnabled} />
                </div>
                <Separator />
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Google Review URL</Label>
                  <Input
                    value={googleReviewUrl}
                    onChange={(e) => setGoogleReviewUrl(e.target.value)}
                    placeholder="https://g.page/r/your-business/review"
                  />
                  <p className="text-xs text-muted-foreground">
                    Search your business on Google Maps → click "Write a review" → copy the URL from your browser.
                  </p>
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Minimum Stars for Google</Label>
                    <Badge variant="secondary" className="font-mono text-sm">{reviewMinStars} ★</Badge>
                  </div>
                  <Slider
                    min={1}
                    max={5}
                    step={1}
                    value={[reviewMinStars]}
                    onValueChange={(val) => setReviewMinStars(val[0])}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Reviews with {reviewMinStars}+ stars will be redirected to Google. Lower ratings stay in your dashboard for private follow-up.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-5 mt-5">
            {/* Current Plan Status */}
            <Card className="shadow-warm border-primary/20">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
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
            <div className="grid gap-5 grid-cols-1 sm:grid-cols-3">
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

          {/* Import Tab */}
          <TabsContent value="import" className="space-y-5 mt-5">
            <div>
              <h2 className="text-base font-medium mb-1">Import Your Data</h2>
              <p className="text-sm text-muted-foreground">Migrate clients, services, and jobs from another platform.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { source: 'jobber', label: 'Jobber', desc: 'Import from Jobber CSV exports', color: 'hsl(var(--primary))' },
                { source: 'quickbooks', label: 'QuickBooks', desc: 'Import from QuickBooks CSV', color: 'hsl(142 71% 45%)' },
                { source: 'csv', label: 'Generic CSV', desc: 'Import from any CSV file', color: 'hsl(var(--muted-foreground))' },
              ].map(s => (
                <Card
                  key={s.source}
                  className="cursor-pointer hover:shadow-warm-md transition-all group border-2 border-transparent hover:border-primary/30"
                  onClick={() => navigate(`/import?source=${s.source}`)}
                >
                  <CardContent className="p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${s.color}15` }}>
                        <FileSpreadsheet className="h-5 w-5" style={{ color: s.color }} />
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{s.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
