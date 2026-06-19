import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, RotateCcw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { SUBSCRIPTION_TIERS, type TierKey } from "@/lib/subscriptionTiers";
import {
  getTierOffers,
  purchaseTier,
  restorePurchases,
  openManageSubscriptions,
  type TierOffer,
} from "@/lib/native/iap";

/**
 * Native iOS In-App Purchase plan cards (StoreKit via RevenueCat).
 * Renders the real, localized App Store prices and handles purchase/restore.
 * Only used inside `isNative()` branches.
 */
export function NativePlanCards() {
  const { toast } = useToast();
  const { subscription, checkSubscription } = useAuth();
  const [offers, setOffers] = useState<TierOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<TierKey | null>(null);
  const [restoring, setRestoring] = useState(false);

  const currentTier = subscription.tier;
  // A subscription bought on the web (Stripe) must be managed on the web.
  const managedOnWeb = subscription.subscribed && subscription.source === "stripe";

  useEffect(() => {
    let active = true;
    (async () => {
      const o = await getTierOffers();
      if (active) {
        setOffers(o);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleBuy = async (offer: TierOffer) => {
    setBusy(offer.tier);
    const res = await purchaseTier(offer);
    setBusy(null);
    if (res.status === "success") {
      toast({ title: "You're subscribed!", description: "Your plan is now active." });
      await checkSubscription();
    } else if (res.status === "error") {
      toast({ title: "Purchase failed", description: res.message, variant: "destructive" });
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    const res = await restorePurchases();
    setRestoring(false);
    if (res.status === "success") {
      await checkSubscription();
      toast({ title: "Purchases restored", description: "Your subscription has been restored." });
    } else if (res.status === "error") {
      toast({ title: "Restore failed", description: res.message, variant: "destructive" });
    }
  };

  if (managedOnWeb) {
    return (
      <Card className="shadow-warm border-border/50">
        <CardContent className="p-6 space-y-2">
          <p className="text-sm font-medium">You subscribed on the web</p>
          <p className="text-sm text-muted-foreground">
            Your plan was purchased through QuickLinq's website. To change or cancel it,
            log into your account from a web browser.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading plans…
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <Card className="shadow-warm border-border/50">
        <CardContent className="p-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            Plans are temporarily unavailable. Please try again in a moment.
          </p>
          <Button variant="outline" size="sm" onClick={handleRestore} disabled={restoring}>
            {restoring ? "Restoring…" : "Restore Purchases"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 grid-cols-1">
        {offers.map((offer) => {
          const tier = SUBSCRIPTION_TIERS[offer.tier];
          const isPopular = "popular" in tier && tier.popular;
          const isCurrent = currentTier === offer.tier && subscription.subscribed;
          return (
            <Card
              key={offer.tier}
              className={`relative shadow-warm ${
                isCurrent ? "border-primary ring-2 ring-primary/20" : isPopular ? "border-primary/50" : "border-border/50"
              }`}
            >
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground text-xs px-3">Your Plan</Badge>
                </div>
              )}
              {!isCurrent && isPopular && (
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
                  <span className="text-3xl font-display font-bold">{offer.priceString}</span>
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
                  variant={isCurrent ? "outline" : isPopular ? "default" : "outline"}
                  disabled={isCurrent || busy !== null}
                  onClick={() => handleBuy(offer)}
                >
                  {isCurrent
                    ? "Current Plan"
                    : busy === offer.tier
                    ? "Processing…"
                    : subscription.subscribed
                    ? "Switch Plan"
                    : "Start 14-day Free Trial"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-[11px] leading-relaxed text-muted-foreground px-1">
        Subscriptions auto-renew unless cancelled at least 24 hours before the end of the period.
        Your Apple ID is charged at confirmation. Manage or cancel anytime in your App Store account settings.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" size="sm" onClick={handleRestore} disabled={restoring}>
          <RotateCcw className="mr-2 h-4 w-4" />
          {restoring ? "Restoring…" : "Restore Purchases"}
        </Button>
        {subscription.subscribed && subscription.source === "apple" && (
          <Button variant="ghost" size="sm" onClick={openManageSubscriptions}>
            Manage Subscription
          </Button>
        )}
      </div>
    </div>
  );
}
