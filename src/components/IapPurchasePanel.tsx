import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { SUBSCRIPTION_TIERS, type TierKey } from "@/lib/subscriptionTiers";
import {
  getIapPackages,
  purchaseIapPackage,
  restoreIapPurchases,
  type IapPackage,
} from "@/lib/native/iap";

interface IapPurchasePanelProps {
  /** Compact layout (single column) for the TrialExpired screen. */
  compact?: boolean;
  onPurchased?: () => void;
}

/**
 * Native iOS In-App Purchase panel. Lists the RevenueCat offering packages with
 * StoreKit-localized prices, a Subscribe button per plan, and Restore Purchases.
 * Only rendered on native iOS (callers gate with isNative()).
 */
export function IapPurchasePanel({ compact, onPurchased }: IapPurchasePanelProps) {
  const { toast } = useToast();
  const { checkSubscription, subscription } = useAuth();
  const [packages, setPackages] = useState<IapPackage[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  const load = useCallback(async () => {
    const pkgs = await getIapPackages();
    // Order by our known tier sequence so cards render consistently.
    const order: TierKey[] = ["starter", "pro", "business"];
    pkgs.sort((a, b) => order.indexOf(a.tier as TierKey) - order.indexOf(b.tier as TierKey));
    setPackages(pkgs);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handlePurchase = async (pkg: IapPackage) => {
    setBusy(pkg.identifier);
    try {
      const res = await purchaseIapPackage(pkg);
      if (res.cancelled) return;
      if (res.success) {
        await checkSubscription();
        toast({ title: "Subscription active", description: "Thanks for subscribing to QuickLinq!" });
        onPurchased?.();
      } else {
        toast({ title: "Purchase failed", description: res.error || "Please try again.", variant: "destructive" });
      }
    } finally {
      setBusy(null);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const res = await restoreIapPurchases();
      if (res.success && res.active) {
        await checkSubscription();
        toast({ title: "Purchases restored", description: "Your subscription is active again." });
        onPurchased?.();
      } else if (res.success) {
        toast({ title: "Nothing to restore", description: "No active subscription found for this Apple ID." });
      } else {
        toast({ title: "Restore failed", description: res.error || "Please try again.", variant: "destructive" });
      }
    } finally {
      setRestoring(false);
    }
  };

  if (packages === null) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading plans…
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <Card className="shadow-warm border-border/50">
        <CardContent className="p-6 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            Plans are currently unavailable. Please check your connection and try again.
          </p>
          <Button variant="outline" size="sm" onClick={load}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className={compact ? "grid gap-3 grid-cols-1" : "grid gap-5 grid-cols-1 sm:grid-cols-3"}>
        {packages.map((pkg) => {
          const tierMeta = pkg.tier ? SUBSCRIPTION_TIERS[pkg.tier] : null;
          const isCurrentPlan = !!pkg.tier && subscription.tier === pkg.tier && subscription.subscribed;
          const isPopular = !!tierMeta && "popular" in tierMeta && (tierMeta as any).popular;
          return (
            <Card
              key={pkg.identifier}
              className={`relative shadow-warm ${
                isCurrentPlan ? "border-primary ring-2 ring-primary/20" : isPopular ? "border-primary/50" : "border-border/50"
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
                  <h4 className="font-display font-semibold text-lg">{tierMeta?.name ?? pkg.identifier}</h4>
                  {tierMeta && <p className="text-xs text-muted-foreground">{tierMeta.description}</p>}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-display font-bold">{pkg.priceString}</span>
                  <span className="text-muted-foreground text-sm">/mo</span>
                </div>
                {tierMeta && (
                  <ul className="space-y-2">
                    {tierMeta.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
                <Button
                  className="w-full"
                  variant={isCurrentPlan ? "outline" : isPopular ? "default" : "outline"}
                  disabled={isCurrentPlan || busy !== null}
                  onClick={() => handlePurchase(pkg)}
                >
                  {isCurrentPlan ? (
                    "Current Plan"
                  ) : busy === pkg.identifier ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing…</>
                  ) : (
                    `Subscribe — ${pkg.priceString}/mo`
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-center">
        <Button variant="ghost" size="sm" onClick={handleRestore} disabled={restoring}>
          {restoring ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RotateCcw className="h-4 w-4 mr-2" />}
          Restore Purchases
        </Button>
      </div>
    </div>
  );
}
