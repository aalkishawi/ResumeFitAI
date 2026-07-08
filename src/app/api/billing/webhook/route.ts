import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/db/client";
import { getStripe, isStripeConfigured } from "@/lib/billing/stripe";
import { planForPriceId } from "@/lib/billing/catalog";
import { getPlan } from "@/lib/config/plans";

export const runtime = "nodejs";

// Stripe webhook. Configure the endpoint in the Stripe dashboard (or `stripe
// listen --forward-to localhost:3000/api/billing/webhook`) and set
// STRIPE_WEBHOOK_SECRET. Grants credits + activates/downgrades plans.

/** Add a plan's monthly credit allotment to a user (skips unlimited plans). */
async function grantMonthlyCredits(userId: string, planKey: string): Promise<void> {
  const plan = getPlan(planKey);
  if (plan.monthlyScans === -1 || plan.monthlyCredits <= 0) return; // unlimited plans don't use credits
  await prisma.creditBalance.upsert({
    where: { userId },
    update: { credits: { increment: plan.monthlyCredits } },
    create: { userId, credits: plan.monthlyCredits },
  });
}

async function syncSubscription(sub: Stripe.Subscription, grant: boolean): Promise<void> {
  const userId = sub.metadata?.userId;
  if (!userId) return;
  const priceId = sub.items.data[0]?.price?.id;
  const planKey = (priceId && planForPriceId(priceId)) || sub.metadata?.planKey || "free";
  const periodEndRaw = (sub as unknown as { current_period_end?: number }).current_period_end;

  await prisma.subscription.update({
    where: { userId },
    data: {
      planKey,
      status: sub.status,
      stripeSubscriptionId: sub.id,
      stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
      currentPeriodEnd:
        typeof periodEndRaw === "number" ? new Date(periodEndRaw * 1000) : undefined,
    },
  });

  if (grant) await grantMonthlyCredits(userId, planKey);
}

export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Billing not configured." }, { status: 501 });
  }
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret not set." }, { status: 500 });
  }

  const sig = req.headers.get("stripe-signature") || "";
  const raw = await req.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    console.error("[billing/webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        if (session.mode === "payment" && userId) {
          // One-time credit pack purchase.
          const credits = Number(session.metadata?.credits || 0);
          if (credits > 0) {
            await prisma.creditBalance.upsert({
              where: { userId },
              update: { credits: { increment: credits } },
              create: { userId, credits },
            });
            await prisma.usageLog.create({
              data: { userId, action: "credit_purchase", quantity: credits },
            });
          }
        }
        // Subscription plan activation is handled by customer.subscription.created.
        break;
      }

      case "customer.subscription.created":
        await syncSubscription(event.data.object as Stripe.Subscription, true);
        break;

      case "customer.subscription.updated":
        await syncSubscription(event.data.object as Stripe.Subscription, false);
        break;

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (userId) {
          await prisma.subscription.update({
            where: { userId },
            data: { planKey: "free", status: "canceled" },
          });
        }
        break;
      }

      case "invoice.paid": {
        // Renewal — grant the next period's credits. Skip the first invoice
        // (subscription.created already granted it).
        const invoice = event.data.object as Stripe.Invoice & {
          billing_reason?: string;
          customer?: string | { id: string };
        };
        if (invoice.billing_reason === "subscription_cycle") {
          const customerId =
            typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
          if (customerId) {
            const sub = await prisma.subscription.findFirst({
              where: { stripeCustomerId: customerId },
            });
            if (sub) await grantMonthlyCredits(sub.userId, sub.planKey);
          }
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error(`[billing/webhook] handler error for ${event.type}:`, err);
    return NextResponse.json({ error: "Handler error." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
