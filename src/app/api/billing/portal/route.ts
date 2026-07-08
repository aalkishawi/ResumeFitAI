import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getUserContext } from "@/lib/auth/session";
import { getStripe, isStripeConfigured } from "@/lib/billing/stripe";

export const runtime = "nodejs";

// Opens the Stripe Billing Portal so users can update payment methods, view
// invoices, and cancel their subscription.
export async function POST(req: NextRequest) {
  const ctx = await getUserContext();
  if (!ctx) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Billing isn't configured yet." }, { status: 501 });
  }

  const sub = await prisma.subscription.findUnique({ where: { userId: ctx.user.id } });
  if (!sub?.stripeCustomerId) {
    return NextResponse.json(
      { error: "You don't have a billing account yet. Subscribe to a plan first." },
      { status: 400 }
    );
  }

  const stripe = getStripe();
  const origin = new URL(req.url).origin;
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${origin}/billing`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[billing/portal]", err);
    return NextResponse.json({ error: "Could not open the billing portal." }, { status: 502 });
  }
}
