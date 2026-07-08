import type { PlanKey } from "@/lib/config/plans";

// ---------------------------------------------------------------------------
// Maps app plans + credit packs to Stripe Price IDs (from env). Create the
// Products/Prices in your Stripe dashboard, then set the price IDs here via env.
// Nothing is hardcoded, so test/live modes just swap env values.
// ---------------------------------------------------------------------------

const env = (k: string): string | undefined => {
  const v = process.env[k];
  return v && v.trim() ? v.trim() : undefined;
};

/** Stripe Price ID for a subscription plan, or undefined if unconfigured/free. */
export function subscriptionPriceId(plan: PlanKey): string | undefined {
  switch (plan) {
    case "basic":
      return env("STRIPE_PRICE_BASIC");
    case "pro":
      return env("STRIPE_PRICE_PRO");
    case "premium":
      return env("STRIPE_PRICE_PREMIUM");
    case "team":
      return env("STRIPE_PRICE_TEAM");
    default:
      return undefined; // free
  }
}

/** Reverse map: Stripe Price ID -> app plan key (for subscription webhooks). */
export function planForPriceId(priceId: string): PlanKey | null {
  const pairs: [PlanKey, string | undefined][] = [
    ["basic", env("STRIPE_PRICE_BASIC")],
    ["pro", env("STRIPE_PRICE_PRO")],
    ["premium", env("STRIPE_PRICE_PREMIUM")],
    ["team", env("STRIPE_PRICE_TEAM")],
  ];
  for (const [key, id] of pairs) if (id && id === priceId) return key;
  return null;
}

export interface CreditPack {
  id: string;
  label: string;
  credits: number;
  priceCents: number;
  priceId?: string;
}

/** One-time credit packs for pay-per-use top-ups. */
export function creditPacks(): CreditPack[] {
  return [
    { id: "small", label: "20 credits", credits: 20, priceCents: 500, priceId: env("STRIPE_PRICE_CREDITS_SMALL") },
    { id: "medium", label: "60 credits", credits: 60, priceCents: 1200, priceId: env("STRIPE_PRICE_CREDITS_MEDIUM") },
    { id: "large", label: "150 credits", credits: 150, priceCents: 2500, priceId: env("STRIPE_PRICE_CREDITS_LARGE") },
  ];
}

export function creditPackById(id: string): CreditPack | undefined {
  return creditPacks().find((p) => p.id === id);
}
