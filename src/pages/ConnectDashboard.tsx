/**
 * Connect Dashboard
 * =================
 * Stripe Connect V2 with direct charges and embedded components.
 * Sellers onboard, manage payouts, and view payments inline (no Stripe-hosted UI).
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  UserPlus, RefreshCw, Package, ShoppingCart, Settings,
  CheckCircle2, AlertCircle, Clock, Loader2,
} from "lucide-react";
import { loadConnectAndInitialize } from "@stripe/connect-js";
import {
  ConnectComponentsProvider,
  ConnectAccountOnboarding,
  ConnectAccountManagement,
  ConnectPayments,
  ConnectPayouts,
  ConnectNotificationBanner,
} from "@stripe/react-connect-js";

interface ConnectedAccount {
  id: string;
  stripe_account_id: string;
  display_name: string;
  contact_email: string | null;
}

interface AccountStatus {
  ready_to_receive_payments: boolean;
  onboarding_complete: boolean;
  requirements_status: string;
  card_payments_active?: boolean;
  transfers_active?: boolean;
}

interface ConnectProduct {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  connected_account_id: string;
}

async function connectAction(action: string, data: Record<string, unknown> = {}) {
  const { data: result, error } = await supabase.functions.invoke("stripe-connect-v2", {
    body: { action, ...data },
  });
  if (error) throw new Error(error.message);
  if (result?.error) throw new Error(result.error);
  return result;
}

// --------------------------------------------------------------------
// Embedded components host — initialises one Connect instance per account
// --------------------------------------------------------------------
function EmbeddedSection({
  accountId,
  publishableKey,
  mode,
  onExit,
}: {
  accountId: string;
  publishableKey: string;
  mode: "onboarding" | "manage";
  onExit?: () => void;
}) {
  const stripeConnectInstance = useMemo(() => {
    if (!publishableKey || !accountId) return null;
    return loadConnectAndInitialize({
      publishableKey,
      fetchClientSecret: async () => {
        const r = await connectAction("create-account-session", { account_id: accountId });
        return r.client_secret as string;
      },
      appearance: { overlays: "dialog", variables: { colorPrimary: "#1f5f6e" } },
    });
  }, [accountId, publishableKey]);

  if (!stripeConnectInstance) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
      <ConnectNotificationBanner />
      {mode === "onboarding" ? (
        <ConnectAccountOnboarding onExit={() => onExit?.()} />
      ) : (
        <div className="space-y-6">
          <ConnectAccountManagement />
          <ConnectPayments />
          <ConnectPayouts />
        </div>
      )}
    </ConnectComponentsProvider>
  );
}

export default function ConnectDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // Config
  const [publishableKey, setPublishableKey] = useState<string>("");

  // Onboarding
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [accountStatuses, setAccountStatuses] = useState<Record<string, AccountStatus>>({});
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [country, setCountry] = useState("ca");
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [loadingStatuses, setLoadingStatuses] = useState<Record<string, boolean>>({});

  // Embedded dialog state
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [embeddedMode, setEmbeddedMode] = useState<"onboarding" | "manage">("onboarding");

  // Products
  const [productName, setProductName] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productCurrency, setProductCurrency] = useState("cad");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [creatingProduct, setCreatingProduct] = useState(false);

  // Storefront
  const [products, setProducts] = useState<ConnectProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [buyingProduct, setBuyingProduct] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    const { data } = await supabase
      .from("connected_accounts")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setAccounts(data as ConnectedAccount[]);
  }, []);

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const result = await connectAction("list-products");
      setProducts(result.products || []);
    } catch {
      /* ignore */
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const refreshStatus = useCallback(async (accountId: string) => {
    setLoadingStatuses((p) => ({ ...p, [accountId]: true }));
    try {
      const status = await connectAction("get-status", { account_id: accountId });
      setAccountStatuses((p) => ({ ...p, [accountId]: status }));
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoadingStatuses((p) => ({ ...p, [accountId]: false }));
    }
  }, [toast]);

  // Load config + initial data
  useEffect(() => {
    connectAction("get-config")
      .then((r) => setPublishableKey(r.publishable_key || ""))
      .catch(() => {/* ignore */});
  }, []);

  useEffect(() => {
    if (user) loadAccounts();
    loadProducts();
  }, [user, loadAccounts, loadProducts]);

  // Auto-refresh status on each account once loaded
  useEffect(() => {
    accounts.forEach((a) => {
      if (!accountStatuses[a.stripe_account_id]) {
        refreshStatus(a.stripe_account_id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts]);

  useEffect(() => {
    const accountId = searchParams.get("accountId");
    if (accountId) refreshStatus(accountId);
  }, [searchParams, refreshStatus]);

  const handleCreateAccount = async () => {
    if (!newName.trim()) {
      toast({ title: "Error", description: "Display name is required", variant: "destructive" });
      return;
    }
    setCreatingAccount(true);
    try {
      const result = await connectAction("create-account", {
        display_name: newName.trim(),
        contact_email: newEmail.trim() || undefined,
        country,
      });
      toast({ title: "Account created", description: "Now complete onboarding inline." });
      setNewName("");
      setNewEmail("");
      await loadAccounts();
      // Auto-open onboarding for the new account
      setActiveAccountId(result.account_id);
      setEmbeddedMode("onboarding");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCreatingAccount(false);
    }
  };

  const openOnboarding = (accountId: string) => {
    setActiveAccountId(accountId);
    setEmbeddedMode("onboarding");
  };

  const openManage = (accountId: string) => {
    setActiveAccountId(accountId);
    setEmbeddedMode("manage");
  };

  const handleCreateProduct = async () => {
    if (!productName.trim() || !productPrice || !selectedAccountId) {
      toast({ title: "Error", description: "Name, price, and connected account are required", variant: "destructive" });
      return;
    }
    setCreatingProduct(true);
    try {
      const priceCents = Math.round(parseFloat(productPrice) * 100);
      await connectAction("create-product", {
        name: productName.trim(),
        description: productDesc.trim() || undefined,
        price_cents: priceCents,
        currency: productCurrency,
        connected_account_id: selectedAccountId,
      });
      toast({ title: "Product created", description: "Product created successfully" });
      setProductName("");
      setProductDesc("");
      setProductPrice("");
      await loadProducts();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCreatingProduct(false);
    }
  };

  const handleBuy = async (productId: string) => {
    setBuyingProduct(productId);
    try {
      const result = await connectAction("create-checkout", { product_id: productId });
      window.location.href = result.url;
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setBuyingProduct(null);
    }
  };

  const StatusBadge = ({ accountId }: { accountId: string }) => {
    const status = accountStatuses[accountId];
    if (!status) return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Loading…</Badge>;
    if (status.ready_to_receive_payments) {
      return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle2 className="h-3 w-3 mr-1" />Active</Badge>;
    }
    if (status.onboarding_complete) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="h-3 w-3 mr-1" />Pending activation</Badge>;
    }
    return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Onboarding required</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stripe Connect</h1>
          <p className="text-muted-foreground">
            Direct charges · Sellers paid individually · Embedded onboarding &amp; dashboard
          </p>
        </div>

        {!publishableKey && (
          <Card className="border-destructive/40">
            <CardContent className="py-4 text-sm text-destructive">
              Stripe publishable key not loaded. Embedded components will not render.
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="onboarding" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="onboarding"><UserPlus className="h-4 w-4 mr-2" />Sellers</TabsTrigger>
            <TabsTrigger value="products"><Package className="h-4 w-4 mr-2" />Products</TabsTrigger>
            <TabsTrigger value="storefront"><ShoppingCart className="h-4 w-4 mr-2" />Storefront</TabsTrigger>
          </TabsList>

          {/* ===== Sellers tab ===== */}
          <TabsContent value="onboarding" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add a seller</CardTitle>
                <CardDescription>
                  Create a connected account. The seller will complete onboarding inline
                  via Stripe's embedded component — no redirect.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2 sm:col-span-1">
                    <Label htmlFor="displayName">Display Name *</Label>
                    <Input id="displayName" placeholder="e.g. Acme Corp"
                      value={newName} onChange={(e) => setNewName(e.target.value)} />
                  </div>
                  <div className="space-y-2 sm:col-span-1">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input id="contactEmail" type="email" placeholder="seller@example.com"
                      value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2 sm:col-span-1">
                    <Label htmlFor="country">Country</Label>
                    <select id="country"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={country} onChange={(e) => setCountry(e.target.value)}>
                      <option value="ca">Canada</option>
                      <option value="us">United States</option>
                      <option value="gb">United Kingdom</option>
                      <option value="au">Australia</option>
                    </select>
                  </div>
                </div>
                <Button onClick={handleCreateAccount} disabled={creatingAccount}>
                  {creatingAccount && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Create &amp; onboard
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Connected accounts</CardTitle>
              </CardHeader>
              <CardContent>
                {accounts.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No connected accounts yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {accounts.map((account) => (
                      <div key={account.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{account.display_name}</span>
                            <StatusBadge accountId={account.stripe_account_id} />
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">{account.stripe_account_id}</p>
                          {account.contact_email && (
                            <p className="text-xs text-muted-foreground">{account.contact_email}</p>
                          )}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Button size="sm" variant="outline"
                            onClick={() => refreshStatus(account.stripe_account_id)}
                            disabled={loadingStatuses[account.stripe_account_id]}>
                            {loadingStatuses[account.stripe_account_id] ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3 w-3" />
                            )}
                            <span className="ml-1">Refresh</span>
                          </Button>
                          {accountStatuses[account.stripe_account_id]?.ready_to_receive_payments ? (
                            <Button size="sm" onClick={() => openManage(account.stripe_account_id)}>
                              <Settings className="h-3 w-3 mr-1" /> Manage
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => openOnboarding(account.stripe_account_id)}>
                              Continue onboarding
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== Products tab ===== */}
          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Create product</CardTitle>
                <CardDescription>
                  Linked to a connected account. The seller charges the buyer directly;
                  your platform takes an application fee on each sale.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Product Name *</Label>
                    <Input value={productName} onChange={(e) => setProductName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Price *</Label>
                    <Input type="number" step="0.01" min="0.50"
                      value={productPrice} onChange={(e) => setProductPrice(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={productDesc} onChange={(e) => setProductDesc(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={productCurrency} onChange={(e) => setProductCurrency(e.target.value)}>
                      <option value="cad">CAD</option>
                      <option value="usd">USD</option>
                      <option value="eur">EUR</option>
                      <option value="gbp">GBP</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Connected Account *</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)}>
                      <option value="">Select…</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.stripe_account_id}>
                          {a.display_name} ({a.stripe_account_id})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <Button onClick={handleCreateProduct} disabled={creatingProduct}>
                  {creatingProduct && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Create product
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== Storefront tab ===== */}
          <TabsContent value="storefront" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Storefront</CardTitle>
                <CardDescription>
                  Payments are processed as direct charges on the seller's Stripe account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingProducts ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : products.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No products yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((p) => (
                      <Card key={p.id} className="flex flex-col">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{p.name}</CardTitle>
                          {p.description && (
                            <CardDescription className="text-xs">{p.description}</CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col justify-end pt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xl font-bold text-foreground">
                              ${(p.price_cents / 100).toFixed(2)}
                              <span className="text-xs font-normal text-muted-foreground ml-1">
                                {p.currency.toUpperCase()}
                              </span>
                            </span>
                            <Button size="sm" onClick={() => handleBuy(p.id)}
                              disabled={buyingProduct === p.id}>
                              {buyingProduct === p.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <ShoppingCart className="h-3 w-3" />
                              )}
                              <span className="ml-1">Buy</span>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Embedded components dialog */}
        <Dialog open={!!activeAccountId} onOpenChange={(o) => !o && setActiveAccountId(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {embeddedMode === "onboarding" ? "Complete onboarding" : "Manage account"}
              </DialogTitle>
            </DialogHeader>
            {activeAccountId && publishableKey && (
              <EmbeddedSection
                accountId={activeAccountId}
                publishableKey={publishableKey}
                mode={embeddedMode}
                onExit={() => {
                  refreshStatus(activeAccountId);
                  setActiveAccountId(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
