import { isNative, getPlatform } from "./platform";
import { supabase } from "@/integrations/supabase/client";
import {
  SUBSCRIPTION_TIERS,
  getTierByAppleProductId,
  type TierKey,
} from "@/lib/subscriptionTiers";

/**
 * RevenueCat-backed In-App Purchases for native iOS.
 *
 * All exports are safe to call on web / PWA — they no-op or throw a friendly
 * error so the web Stripe flow is never affected.
 *
 * Cross-platform identity: we `logIn` to RevenueCat with the Supabase user id
 * as the app_user_id, so an Apple purchase and a web (Stripe) subscription
 * converge on the same account in `check-subscription`.
 */

let configured = false;
let onChange: (() => void) | null = null;

type RCPackage = {
  identifier: string;
  product: { identifier: string; priceString: string; title?: string };
};

async function getPurchases() {
  const mod = await import("@revenuecat/purchases-capacitor");
  return mod;
}

/** Initialise RevenueCat and bind the current user. No-op on web. */
export async function initIap(userId: string, onEntitlementChange?: () => void) {
  if (!isNative() || getPlatform() !== "ios") return;
  onChange = onEntitlementChange ?? null;

  try {
    const { Purchases, LOG_LEVEL } = await getPurchases();

    if (!configured) {
      // Fetch the publishable iOS SDK key from the backend at runtime.
      const { data, error } = await supabase.functions.invoke("get-iap-config");
      if (error || !data?.iosKey) {
        console.warn("[iap] could not load RC config", error);
        return;
      }
      // Safe diagnostic: log only key prefix/type, never the full secret.
      console.log(
        "[iap] RC config loaded; key prefix:",
        String(data.iosKey).slice(0, 5),
      );

      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
      await Purchases.configure({ apiKey: data.iosKey, appUserID: userId });
      configured = true;
      console.log("[iap] RevenueCat configured for user", userId);

      // Refresh app subscription state whenever entitlements change.
      await Purchases.addCustomerInfoUpdateListener(() => {
        onChange?.();
      });
    } else {
      await Purchases.logIn({ appUserID: userId });
    }
  } catch (err) {
    console.warn("[iap] init failed", err);
  }
}

export async function logoutIap() {
  if (!isNative() || getPlatform() !== "ios" || !configured) return;
  try {
    const { Purchases } = await getPurchases();
    await Purchases.logOut();
  } catch (err) {
    console.warn("[iap] logout failed", err);
  }
}

export interface TierOffer {
  tier: TierKey;
  priceString: string;
  productId: string;
  pkg: RCPackage;
}

/** Returns the available StoreKit offers mapped to our tiers (iOS only). */
export async function getTierOffers(): Promise<TierOffer[]> {
  if (!isNative() || getPlatform() !== "ios") return [];
  try {
    const { Purchases } = await getPurchases();
    const offerings = await Purchases.getOfferings();
    const pkgs: RCPackage[] =
      (offerings.current?.availablePackages as unknown as RCPackage[]) ?? [];

    const offers: TierOffer[] = [];
    for (const pkg of pkgs) {
      const tier = getTierByAppleProductId(pkg.product.identifier);
      if (tier) {
        offers.push({
          tier,
          priceString: pkg.product.priceString,
          productId: pkg.product.identifier,
          pkg,
        });
      }
    }
    // Keep a stable order: starter, pro, business
    const order: TierKey[] = ["starter", "pro", "business"];
    offers.sort((a, b) => order.indexOf(a.tier) - order.indexOf(b.tier));
    return offers;
  } catch (err) {
    console.warn("[iap] getOfferings failed", err);
    return [];
  }
}

export type PurchaseResult =
  | { status: "success" }
  | { status: "cancelled" }
  | { status: "error"; message: string };

/** Purchase the StoreKit package for the given tier. */
export async function purchaseTier(offer: TierOffer): Promise<PurchaseResult> {
  if (!isNative() || getPlatform() !== "ios") {
    return { status: "error", message: "In-app purchases are only available in the iOS app." };
  }
  try {
    const { Purchases } = await getPurchases();
    await Purchases.purchasePackage({ aPackage: offer.pkg as never });
    onChange?.();
    return { status: "success" };
  } catch (err: unknown) {
    const e = err as { code?: string; userCancelled?: boolean; message?: string };
    if (e?.userCancelled || e?.code === "1" || e?.code === "PURCHASE_CANCELLED") {
      return { status: "cancelled" };
    }
    return { status: "error", message: e?.message ?? "Purchase failed. Please try again." };
  }
}

/** Restore previous purchases (reinstall / new device). */
export async function restorePurchases(): Promise<PurchaseResult> {
  if (!isNative() || getPlatform() !== "ios") {
    return { status: "error", message: "Restore is only available in the iOS app." };
  }
  try {
    const { Purchases } = await getPurchases();
    await Purchases.restorePurchases();
    onChange?.();
    return { status: "success" };
  } catch (err: unknown) {
    const e = err as { message?: string };
    return { status: "error", message: e?.message ?? "Could not restore purchases." };
  }
}

/** Open Apple's native "Manage Subscriptions" screen. */
export async function openManageSubscriptions() {
  // itms-apps deep link opens the App Store subscriptions screen on device.
  window.open("itms-apps://apps.apple.com/account/subscriptions", "_blank");
}

export { SUBSCRIPTION_TIERS };
