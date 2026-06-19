// Stripe product & price IDs + Apple App Store product IDs for QuickLinq tiers.
// `appleProductId` must match the auto-renewable subscription product IDs created
// in App Store Connect and mapped in RevenueCat.
export const SUBSCRIPTION_TIERS = {
  starter: {
    name: "Starter",
    price: "$14",
    priceAmount: 14,
    priceId: "price_1Ta2j8KFLt6KnglEa0EVNat8",
    productId: "prod_UZB5bIhMsXcmZa",
    appleProductId: "quicklinq_starter_monthly",
    description: "For solo operators getting started.",
    features: [
      "Up to 50 clients",
      "Unlimited quotes & invoices",
      "Job scheduling",
      "Online payments",
      "Email support",
    ],
    clientLimit: 50,
    teamLimit: 1,
  },
  pro: {
    name: "Pro",
    price: "$29",
    priceAmount: 29,
    priceId: "price_1Ta2j9KFLt6KnglEof9oZLDj",
    productId: "prod_UZB5c821ACqF2q",
    appleProductId: "quicklinq_pro_monthly",
    description: "For growing service businesses.",
    features: [
      "Unlimited clients",
      "Team members (up to 5)",
      "Recurring invoices",
      "Custom branding",
      "Priority support",
      "Reports & analytics",
    ],
    clientLimit: Infinity,
    teamLimit: 5,
    popular: true,
  },
  business: {
    name: "Business",
    price: "$49",
    priceAmount: 49,
    priceId: "price_1Ta2jAKFLt6KnglEvHUjVzvP",
    productId: "prod_UZB5tos0Dglji1",
    appleProductId: "quicklinq_business_monthly",
    description: "For agencies managing multiple crews.",
    features: [
      "Everything in Pro",
      "Unlimited team members",
      "Client portal",
      "API access",
      "Dedicated account manager",
      "Custom integrations",
    ],
    clientLimit: Infinity,
    teamLimit: Infinity,
  },
} as const;

export type TierKey = keyof typeof SUBSCRIPTION_TIERS;

// Legacy product IDs from the previous $29/$79/$149 pricing — kept so
// existing subscribers on old products still resolve to the right tier.
const LEGACY_PRODUCT_IDS: Record<string, TierKey> = {
  prod_U6yyGorJZoTTuw: "starter",
  prod_U6z3Y8rbHA1uhQ: "pro",
  prod_U6z4mV3LY4CeeP: "business",
};

export function getTierByProductId(productId: string | null): TierKey | null {
  if (!productId) return null;
  for (const [key, tier] of Object.entries(SUBSCRIPTION_TIERS)) {
    if (tier.productId === productId) return key as TierKey;
  }
  return LEGACY_PRODUCT_IDS[productId] ?? null;
}
