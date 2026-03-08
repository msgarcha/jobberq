import { loadStripe } from "@stripe/stripe-js";

// Stripe publishable key - safe to include in client code
// Users will need to set this. For now we check env or use a placeholder.
const STRIPE_PK = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";

let stripePromise: ReturnType<typeof loadStripe> | null = null;

export function getStripe() {
  if (!stripePromise && STRIPE_PK) {
    stripePromise = loadStripe(STRIPE_PK);
  }
  return stripePromise;
}
