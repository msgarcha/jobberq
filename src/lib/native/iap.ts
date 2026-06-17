import { isNative, getPlatform } from './platform';
import { supabase } from '@/integrations/supabase/client';
import { RC_ENTITLEMENT_ID, getTierByAppleProductId, type TierKey } from '@/lib/subscriptionTiers';

// RevenueCat is only loaded on native to keep the web bundle clean.
type PurchasesModule = typeof import('@revenuecat/purchases-capacitor');
type PurchasesPackage = import('@revenuecat/purchases-capacitor').PurchasesPackage;
type CustomerInfo = import('@revenuecat/purchases-capacitor').CustomerInfo;

let purchasesPromise: Promise<PurchasesModule> | null = null;
let configured = false;

async function loadPurchases(): Promise<PurchasesModule> {
  if (!purchasesPromise) {
    purchasesPromise = import('@revenuecat/purchases-capacitor');
  }
  return purchasesPromise;
}

/**
 * Configure the RevenueCat SDK. Safe to call multiple times; only the first
 * call actually configures. No-op on web.
 */
export async function configureIap(): Promise<boolean> {
  if (!isNative() || getPlatform() !== 'ios') return false;
  if (configured) return true;

  try {
    const { data, error } = await supabase.functions.invoke('iap-config');
    if (error) throw error;
    const apiKey: string = data?.iosKey || '';
    if (!apiKey) {
      console.warn('[IAP] No RevenueCat iOS key configured');
      return false;
    }
    const { Purchases, LOG_LEVEL } = await loadPurchases();
    await Purchases.setLogLevel({ level: LOG_LEVEL.WARN });
    await Purchases.configure({ apiKey });
    configured = true;
    return true;
  } catch (err) {
    console.warn('[IAP] configure failed', err);
    return false;
  }
}

/** Associate purchases with the signed-in Supabase user. */
export async function logInIap(userId: string): Promise<void> {
  if (!(await configureIap())) return;
  try {
    const { Purchases } = await loadPurchases();
    await Purchases.logIn({ appUserID: userId });
  } catch (err) {
    console.warn('[IAP] logIn failed', err);
  }
}

export async function logOutIap(): Promise<void> {
  if (!isNative() || !configured) return;
  try {
    const { Purchases } = await loadPurchases();
    await Purchases.logOut();
  } catch {
    /* ignore */
  }
}

export interface IapPackage {
  identifier: string;
  productId: string;
  tier: TierKey | null;
  priceString: string;
  raw: PurchasesPackage;
}

/** Fetch the current offering's packages, mapped to QuickLinq tiers. */
export async function getIapPackages(): Promise<IapPackage[]> {
  if (!(await configureIap())) return [];
  try {
    const { Purchases } = await loadPurchases();
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) return [];
    return current.availablePackages.map((p) => ({
      identifier: p.identifier,
      productId: p.product.identifier,
      tier: getTierByAppleProductId(p.product.identifier),
      priceString: p.product.priceString,
      raw: p,
    }));
  } catch (err) {
    console.warn('[IAP] getOfferings failed', err);
    return [];
  }
}

function hasEntitlement(info: CustomerInfo): boolean {
  return !!info?.entitlements?.active?.[RC_ENTITLEMENT_ID];
}

export interface IapPurchaseResult {
  success: boolean;
  active: boolean;
  cancelled?: boolean;
  error?: string;
}

/** Start the StoreKit purchase flow for a package. */
export async function purchaseIapPackage(pkg: IapPackage): Promise<IapPurchaseResult> {
  if (!(await configureIap())) return { success: false, active: false, error: 'IAP unavailable' };
  try {
    const { Purchases } = await loadPurchases();
    const result = await Purchases.purchasePackage({ aPackage: pkg.raw });
    return { success: true, active: hasEntitlement(result.customerInfo) };
  } catch (err: any) {
    if (err?.userCancelled) return { success: false, active: false, cancelled: true };
    console.warn('[IAP] purchase failed', err);
    return { success: false, active: false, error: err?.message || 'Purchase failed' };
  }
}

/** Restore previous purchases (required by Apple). */
export async function restoreIapPurchases(): Promise<IapPurchaseResult> {
  if (!(await configureIap())) return { success: false, active: false, error: 'IAP unavailable' };
  try {
    const { Purchases } = await loadPurchases();
    const info = await Purchases.restorePurchases();
    return { success: true, active: hasEntitlement(info.customerInfo) };
  } catch (err: any) {
    console.warn('[IAP] restore failed', err);
    return { success: false, active: false, error: err?.message || 'Restore failed' };
  }
}

/** Open the native App Store subscription management screen. */
export async function manageIapSubscription(): Promise<void> {
  if (!(await configureIap())) return;
  try {
    const { Purchases } = await loadPurchases();
    // Available on the Capacitor plugin; falls back silently if unsupported.
    // @ts-expect-error - showManageSubscriptions exists on iOS
    if (typeof Purchases.showManageSubscriptions === 'function') {
      // @ts-expect-error - iOS-only API
      await Purchases.showManageSubscriptions();
    }
  } catch (err) {
    console.warn('[IAP] manage subscription failed', err);
  }
}
