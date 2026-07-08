import Stripe from "stripe";

// ---------------------------------------------------------------------------
// Stripe client. Optional — the app works fully without billing configured;
// checkout/portal endpoints return a friendly error and the billing UI shows a
// "not configured" note until STRIPE_SECRET_KEY is set.
// ---------------------------------------------------------------------------

let cached: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe is not configured (STRIPE_SECRET_KEY is missing).");
  }
  if (!cached) {
    cached = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return cached;
}
