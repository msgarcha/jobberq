import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, RotateCcw } from "lucide-react";
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

const TIER_ORDER: TierKey[] = ["starter", "pro", "business"];

/**
 * Native iOS In-App Purchase plan cards (StoreKit via RevenueCat).
 *
 * Always renders all three plans. Static prices show immediately; once
 * RevenueCat returns offerings the localized App Store prices replace them.
 * If a tier's App Store product isn't available, the card stays visible but
 * its purchase button is disabled. Only used inside `isNative()` branches.
 */
export function NativePlanCards() {
  const { toast } = useToast();
  const { subscription, checkSubscription } = useAuth();
  const [offers, setOffers] = useState<TierOffer[]>([]);
  const [offersLoaded, setOffersLoaded] = useState(false);
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
        setOffersLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const offerByTier = (tier: TierKey) => offers.find((o) => o.tier === tier);

  // The entitlement row is written by the RevenueCat webhook a moment after the
  // StoreKit transaction completes, so poll check-subscription a few times until
  // the backend reflects the new active subscription.
  const pollUntilSubscribed = async (attempts = 5, delayMs = 1500) => {
    for (let i = 0; i < attempts; i++) {
      await checkSubscription();
      await new Promise((r) => setTimeout(r, delayMs));
    }
  };

  const handleBuy = async (offer: TierOffer) => {
    setBusy(offer.tier);
    const res = await purchaseTier(offer);
    if (res.status === "success") {
      toast({ title: "You're subscribed!", description: "Activating your plan…" });
      await pollUntilSubscribed();
      setBusy(null);
    } else {
      setBusy(null);
      if (res.status === "error") {
        toast({ title: "Purchase failed", description: res.message, variant: "destructive" });
      }
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    const res = await restorePurchases();
    if (res.status === "success") {
      await pollUntilSubscribed(3, 1500);
      setRestoring(false);
      toast({ title: "Purchases restored", description: "Your subscription has been restored." });
    } else {
      setRestoring(false);
      if (res.status === "error") {
        toast({ title: "Restore failed", description: res.message, variant: "destructive" });
      }
    }
  };

  return (
    <div className="space-y-4">
      {managedOnWeb && (
        <Card className="shadow-warm border-border/50">
          <CardContent className="p-4 space-y-1">
            <p className="text-sm font-medium">You subscribed on the web</p>
            <p className="text-sm text-muted-foreground">
              Your plan was purchased through QuickLinq's website. To change or cancel it,
              log into your account from a web browser.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 grid-cols-1">
        {TIER_ORDER.map((tierKey) => {
          const tier = SUBSCRIPTION_TIERS[tierKey];
          const isPopular = "popular" in tier && tier.popular;
          const isCurrent = currentTier === tierKey && subscription.subscribed;
          const offer = offerByTier(tierKey);
          // Show App Store localized price once loaded; otherwise the static price.
          const priceString = offer?.priceString ?? tier.price;
          // A tier is purchasable only when its App Store product is available
          // and the user isn't already managed on the web.
          const unavailable = offersLoaded && !offer;
          const canBuy = !!offer && !managedOnWeb && !isCurrent;

          let label: string;
          if (isCurrent) label = "Current Plan";
          else if (busy === tierKey) label = "Processing…";
          else if (managedOnWeb) label = "Managed on web";
          else if (unavailable) label = "Unavailable";
          else if (!offersLoaded) label = "Loading…";
          else if (subscription.subscribed) label = "Switch Plan";
          else label = "Start 14-day Free Trial";

          return (
            <Card
              key={tierKey}
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
                  <span className="text-3xl font-display font-bold">{priceString}</span>
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
                  disabled={!canBuy || busy !== null}
                  onClick={() => offer && handleBuy(offer)}
                >
                  {label}
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
