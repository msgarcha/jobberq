/**
 * Connect Dashboard
 * =================
 * Main page for the Stripe Connect V2 integration. Contains three tabs:
 *   1. Onboarding — create connected accounts & complete Express onboarding
 *   2. Products   — create products linked to a connected account
 *   3. Storefront — public-facing product listing with "Buy" buttons
 *
 * All Stripe operations go through the `stripe-connect-v2` edge function.
 */

import { useState, useEffect } from "react";
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
import { Separator } from "@/components/ui/separator";
import {
  UserPlus, ExternalLink, RefreshCw, Package, ShoppingCart,
  CheckCircle2, AlertCircle, Clock, Loader2,
} from "lucide-react";

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
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
}

interface ConnectProduct {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  connected_account_id: string;
}

// ------------------------------------------------------------------
// Helper: call the stripe-connect-v2 edge function
// ------------------------------------------------------------------
async function connectAction(action: string, data: Record<string, unknown> = {}) {
  const { data: result, error } = await supabase.functions.invoke("stripe-connect-v2", {
    body: { action, ...data },
  });
  if (error) throw new Error(error.message);
  if (result?.error) throw new Error(result.error);
  return result;
}

export default function ConnectDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // --- Onboarding state ---
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [accountStatuses, setAccountStatuses] = useState<Record<string, AccountStatus>>({});
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [loadingStatuses, setLoadingStatuses] = useState<Record<string, boolean>>({});

  // --- Product state ---
  const [productName, setProductName] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productCurrency, setProductCurrency] = useState("usd");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [creatingProduct, setCreatingProduct] = useState(false);

  // --- Storefront state ---
  const [products, setProducts] = useState<ConnectProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [buyingProduct, setBuyingProduct] = useState<string | null>(null);

  // ------------------------------------------------------------------
  // Load connected accounts from the database
  // ------------------------------------------------------------------
  const loadAccounts = async () => {
    const { data } = await supabase
      .from("connected_accounts")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setAccounts(data as ConnectedAccount[]);
  };

  // ------------------------------------------------------------------
  // Load products for the storefront
  // ------------------------------------------------------------------
  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const result = await connectAction("list-products");
      setProducts(result.products || []);
    } catch {
      // Silently fail — storefront will show empty
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (user) loadAccounts();
    loadProducts();
  }, [user]);

  // If returning from Stripe onboarding, refresh status
  useEffect(() => {
    const accountId = searchParams.get("accountId");
    if (accountId) {
      refreshStatus(accountId);
    }
  }, [searchParams]);

  // ------------------------------------------------------------------
  // Create a new connected account
  // ------------------------------------------------------------------
  const handleCreateAccount = async () => {
    if (!newName.trim()) {
      toast({ title: "Error", description: "Display name is required", variant: "destructive" });
      return;
    }
    setCreatingAccount(true);
    try {
      await connectAction("create-account", {
        display_name: newName.trim(),
        contact_email: newEmail.trim() || undefined,
      });
      toast({ title: "Account created", description: "Connected account created successfully" });
      setNewName("");
      setNewEmail("");
      await loadAccounts();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCreatingAccount(false);
    }
  };

  // ------------------------------------------------------------------
  // Refresh the onboarding status for an account (from Stripe API)
  // ------------------------------------------------------------------
  const refreshStatus = async (accountId: string) => {
    setLoadingStatuses((prev) => ({ ...prev, [accountId]: true }));
    try {
      const status = await connectAction("get-status", { account_id: accountId });
      setAccountStatuses((prev) => ({ ...prev, [accountId]: status }));
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoadingStatuses((prev) => ({ ...prev, [accountId]: false }));
    }
  };

  // ------------------------------------------------------------------
  // Start the Express onboarding flow
  // ------------------------------------------------------------------
  const handleOnboard = async (accountId: string) => {
    try {
      const result = await connectAction("create-onboarding-link", { account_id: accountId });
      // Redirect to Stripe-hosted onboarding
      window.location.href = result.url;
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  // ------------------------------------------------------------------
  // Create a new product
  // ------------------------------------------------------------------
  const handleCreateProduct = async () => {
    if (!productName.trim() || !productPrice || !selectedAccountId) {
      toast({ title: "Error", description: "Name, price, and connected account are required", variant: "destructive" });
      return;
    }
    setCreatingProduct(true);
    try {
      // Convert dollars to cents
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

  // ------------------------------------------------------------------
  // Buy a product (create checkout session)
  // ------------------------------------------------------------------
  const handleBuy = async (productId: string) => {
    setBuyingProduct(productId);
    try {
      const result = await connectAction("create-checkout", { product_id: productId });
      // Redirect to Stripe Checkout
      window.location.href = result.url;
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setBuyingProduct(null);
    }
  };

  // ------------------------------------------------------------------
  // Status badge helper
  // ------------------------------------------------------------------
  const StatusBadge = ({ accountId }: { accountId: string }) => {
    const status = accountStatuses[accountId];
    if (!status) return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Unknown</Badge>;
    if (status.ready_to_receive_payments) {
      return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle2 className="h-3 w-3 mr-1" />Active</Badge>;
    }
    if (status.onboarding_complete) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="h-3 w-3 mr-1" />Pending activation</Badge>;
    }
    return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Onboarding required</Badge>;
  };

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stripe Connect V2</h1>
          <p className="text-muted-foreground">
            Manage connected accounts, create products, and process payments
          </p>
        </div>

        <Tabs defaultValue="onboarding" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="onboarding">
              <UserPlus className="h-4 w-4 mr-2" />Onboarding
            </TabsTrigger>
            <TabsTrigger value="products">
              <Package className="h-4 w-4 mr-2" />Products
            </TabsTrigger>
            <TabsTrigger value="storefront">
              <ShoppingCart className="h-4 w-4 mr-2" />Storefront
            </TabsTrigger>
          </TabsList>

          {/* ===================== ONBOARDING TAB ===================== */}
          <TabsContent value="onboarding" className="space-y-4">
            {/* Create Account Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Create Connected Account</CardTitle>
                <CardDescription>
                  Create a new V2 connected account for a seller or service provider
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name *</Label>
                    <Input
                      id="displayName"
                      placeholder="e.g. Acme Corp"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="seller@example.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={handleCreateAccount} disabled={creatingAccount}>
                  {creatingAccount && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </CardContent>
            </Card>

            {/* Existing Accounts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Connected Accounts</CardTitle>
                <CardDescription>
                  View status and manage onboarding for your connected accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {accounts.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No connected accounts yet. Create one above to get started.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {accounts.map((account) => (
                      <div
                        key={account.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border rounded-lg"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{account.display_name}</span>
                            <StatusBadge accountId={account.stripe_account_id} />
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">
                            {account.stripe_account_id}
                          </p>
                          {account.contact_email && (
                            <p className="text-xs text-muted-foreground">{account.contact_email}</p>
                          )}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => refreshStatus(account.stripe_account_id)}
                            disabled={loadingStatuses[account.stripe_account_id]}
                          >
                            {loadingStatuses[account.stripe_account_id] ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3 w-3" />
                            )}
                            Check Status
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleOnboard(account.stripe_account_id)}
                          >
                            <ExternalLink className="h-3 w-3" />
                            Onboard
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===================== PRODUCTS TAB ===================== */}
          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Create Product</CardTitle>
                <CardDescription>
                  Create a product on the platform and link it to a connected account.
                  Payments for this product will be routed to the connected account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Product Name *</Label>
                    <Input
                      placeholder="e.g. Premium Widget"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Price (USD) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.50"
                      placeholder="29.99"
                      value={productPrice}
                      onChange={(e) => setProductPrice(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    placeholder="Optional product description"
                    value={productDesc}
                    onChange={(e) => setProductDesc(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Connected Account *</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                  >
                    <option value="">Select a connected account...</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.stripe_account_id}>
                        {a.display_name} ({a.stripe_account_id})
                      </option>
                    ))}
                  </select>
                </div>
                <Button onClick={handleCreateProduct} disabled={creatingProduct}>
                  {creatingProduct && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create Product
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===================== STOREFRONT TAB ===================== */}
          <TabsContent value="storefront" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Storefront</CardTitle>
                <CardDescription>
                  Browse products from all connected accounts. Payments are processed via
                  Stripe Checkout with destination charges.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingProducts ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : products.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    No products available yet. Create products in the Products tab.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((product) => (
                      <Card key={product.id} className="flex flex-col">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{product.name}</CardTitle>
                          {product.description && (
                            <CardDescription className="text-xs">
                              {product.description}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col justify-end pt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xl font-bold text-foreground">
                              ${(product.price_cents / 100).toFixed(2)}
                              <span className="text-xs font-normal text-muted-foreground ml-1">
                                {product.currency.toUpperCase()}
                              </span>
                            </span>
                            <Button
                              size="sm"
                              onClick={() => handleBuy(product.id)}
                              disabled={buyingProduct === product.id}
                            >
                              {buyingProduct === product.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <ShoppingCart className="h-3 w-3" />
                              )}
                              Buy
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 font-mono truncate">
                            Seller: {product.connected_account_id}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
