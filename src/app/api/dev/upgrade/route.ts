import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSessionUser } from "@/lib/auth/session";
import { testUpgradeEnabled } from "@/lib/config/flags";
import { getPlan } from "@/lib/config/plans";

export const runtime = "nodejs";

// Dev/test-only self-service upgrade so all features can be exercised without
// payment. Gated by testUpgradeEnabled (off in production unless opted in).
export async function POST(req: NextRequest) {
  if (!testUpgradeEnabled) {
    return NextResponse.json({ error: "Test upgrade is disabled." }, { status: 403 });
  }
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    plan?: string;
    credits?: number;
  };

  // Top up credits.
  if (body.action === "credits") {
    const amount = typeof body.credits === "number" ? body.credits : 100;
    const bal = await prisma.creditBalance.update({
      where: { userId: user.id },
      data: { credits: { increment: amount } },
    });
    return NextResponse.json({ ok: true, credits: bal.credits });
  }

  // Switch plan (defaults to Premium = all features + unlimited).
  const valid = ["free", "basic", "pro", "premium", "team"];
  const planKey = valid.includes(body.plan || "") ? (body.plan as string) : "premium";
  const plan = getPlan(planKey);
  await prisma.subscription.update({
    where: { userId: user.id },
    data: { planKey, status: "active" },
  });
  // Give metered plans a healthy testing balance; unlimited plans don't need it.
  const credits = plan.monthlyScans === -1 ? 0 : Math.max(plan.monthlyCredits, 100);
  await prisma.creditBalance.update({
    where: { userId: user.id },
    data: { credits },
  });

  return NextResponse.json({ ok: true, plan: planKey });
}
