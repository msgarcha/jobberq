// Stripe product & price IDs for ServicePro subscription tiers
export const SUBSCRIPTION_TIERS = {
  starter: {
    name: "Starter",
    price: "$29",
    priceAmount: 29,
    priceId: "price_1T8l0lFr0YtqsPW07tE2zaKS",
    productId: "prod_U6yyGorJZoTTuw",
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
    price: "$79",
    priceAmount: 79,
    priceId: "price_1T8l5lFr0YtqsPW0ZFQZhdz9",
    productId: "prod_U6z3Y8rbHA1uhQ",
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
    price: "$149",
    priceAmount: 149,
    priceId: "price_1T8l6DFr0YtqsPW04TSSW5dh",
    productId: "prod_U6z4mV3LY4CeeP",
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

export function getTierByProductId(productId: string | null): TierKey | null {
  if (!productId) return null;
  for (const [key, tier] of Object.entries(SUBSCRIPTION_TIERS)) {
    if (tier.productId === productId) return key as TierKey;
  }
  return null;
}
