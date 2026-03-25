import { loadStripe } from "@stripe/stripe-js";

// Platform publishable key — safe to include in client code
const STRIPE_PK = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";

let stripePromise: ReturnType<typeof loadStripe> | null = null;

export function getStripe() {
  if (!stripePromise && STRIPE_PK) {
    stripePromise = loadStripe(STRIPE_PK);
  }
  return stripePromise;
}
