import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { getUserContext } from "@/lib/auth/session";
import { getStripe, isStripeConfigured } from "@/lib/billing/stripe";
import { subscriptionPriceId, creditPackById } from "@/lib/billing/catalog";

export const runtime = "nodejs";

const schema = z.object({
  plan: z.enum(["basic", "pro", "premium", "team"]).optional(),
  pack: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const ctx = await getUserContext();
  if (!ctx) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Billing isn't configured yet. Please check back soon." },
      { status: 501 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success || (!parsed.data.plan && !parsed.data.pack)) {
    return NextResponse.json({ error: "Specify a plan or credit pack." }, { status: 400 });
  }

  const stripe = getStripe();
  const origin = new URL(req.url).origin;

  // Ensure a Stripe customer exists for this user.
  const sub = await prisma.subscription.findUnique({ where: { userId: ctx.user.id } });
  let customerId = sub?.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: ctx.user.email ?? undefined,
      metadata: { userId: ctx.user.id },
    });
    customerId = customer.id;
    await prisma.subscription.update({
      where: { userId: ctx.user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  try {
    if (parsed.data.plan) {
      const priceId = subscriptionPriceId(parsed.data.plan);
      if (!priceId) {
        return NextResponse.json(
          { error: "This plan isn't available for checkout yet." },
          { status: 400 }
        );
      }
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${origin}/billing?status=success`,
        cancel_url: `${origin}/pricing?status=cancel`,
        metadata: { userId: ctx.user.id, planKey: parsed.data.plan },
        subscription_data: {
          metadata: { userId: ctx.user.id, planKey: parsed.data.plan },
        },
      });
      return NextResponse.json({ url: session.url });
    }

    // Credit pack (one-time payment)
    const pack = creditPackById(parsed.data.pack!);
    if (!pack?.priceId) {
      return NextResponse.json(
        { error: "This credit pack isn't available for checkout yet." },
        { status: 400 }
      );
    }
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      line_items: [{ price: pack.priceId, quantity: 1 }],
      success_url: `${origin}/billing?status=credits`,
      cancel_url: `${origin}/billing?status=cancel`,
      metadata: { userId: ctx.user.id, credits: String(pack.credits) },
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[billing/checkout]", err);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 502 }
    );
  }
}
