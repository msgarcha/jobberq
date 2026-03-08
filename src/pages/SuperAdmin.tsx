import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Shield, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { SubscriberTable, type Subscriber } from "@/components/admin/SubscriberTable";
import { AdminRevenueCharts } from "@/components/admin/AdminRevenueCharts";
import { ManageSubscriptionDialog } from "@/components/admin/ManageSubscriptionDialog";
import { SUBSCRIPTION_TIERS } from "@/lib/subscriptionTiers";

export default function SuperAdmin() {
  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState("");
  const [selectedSub, setSelectedSub] = useState<Subscriber | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const headers = session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};

  const { data: subscribersData, isLoading: subsLoading } = useQuery({
    queryKey: ["admin-subscribers"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-list-subscribers", { headers });
      if (error) throw error;
      return data.subscribers as Subscriber[];
    },
  });

  const { data: revenueStats, isLoading: revenueLoading } = useQuery({
    queryKey: ["admin-revenue-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-revenue-stats", { headers });
      if (error) throw error;
      return data;
    },
  });

  const handleAction = (action: string, subscriber: Subscriber) => {
    setDialogAction(action);
    setSelectedSub(subscriber);

    // Instant actions
    if (action === "grant_free" || action === "resume") {
      setDialogOpen(true);
    } else {
      setDialogOpen(true);
    }
  };

  const handleConfirm = useCallback(async (action: string, subscriber: Subscriber, params: any) => {
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-manage-subscription", {
        headers,
        body: {
          action,
          subscription_id: subscriber.subscription_id,
          customer_email: subscriber.email,
          ...params,
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({ title: "Success", description: data.message });
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-subscribers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-revenue-stats"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  }, [headers, toast, queryClient]);

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-subscribers"] });
    queryClient.invalidateQueries({ queryKey: ["admin-revenue-stats"] });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Super Admin</h1>
              <p className="text-sm text-muted-foreground">Platform management dashboard</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={refreshAll}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>

        <Tabs defaultValue="subscribers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
          </TabsList>

          <TabsContent value="subscribers">
            <SubscriberTable
              subscribers={subscribersData || []}
              loading={subsLoading}
              onAction={handleAction}
            />
          </TabsContent>

          <TabsContent value="revenue">
            <AdminRevenueCharts stats={revenueStats || null} loading={revenueLoading} />
          </TabsContent>

          <TabsContent value="pricing">
            <div className="grid md:grid-cols-3 gap-4">
              {Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => (
                <Card key={key} className={tier.popular ? "border-primary ring-1 ring-primary" : ""}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{tier.name}</CardTitle>
                      {tier.popular && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
                          Popular
                        </span>
                      )}
                    </div>
                    <p className="text-3xl font-bold">{tier.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                    <p className="text-sm text-muted-foreground">{tier.description}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {tier.features.map((f) => (
                        <li key={f} className="text-sm flex items-start gap-2">
                          <span className="text-primary mt-0.5">✓</span> {f}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 pt-4 border-t space-y-1 text-xs text-muted-foreground">
                      <p>Price ID: <code className="bg-muted px-1 rounded">{tier.priceId}</code></p>
                      <p>Product ID: <code className="bg-muted px-1 rounded">{tier.productId}</code></p>
                      <p>Client Limit: {tier.clientLimit === Infinity ? "Unlimited" : tier.clientLimit}</p>
                      <p>Team Limit: {tier.teamLimit === Infinity ? "Unlimited" : tier.teamLimit}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              💡 To change prices, update them in the Stripe Dashboard. Prices are managed by Stripe and reflected here automatically.
            </p>
          </TabsContent>
        </Tabs>
      </div>

      <ManageSubscriptionDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        action={dialogAction}
        subscriber={selectedSub}
        onConfirm={handleConfirm}
        loading={actionLoading}
      />
    </div>
  );
}
