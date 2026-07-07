import { NextResponse } from "next/server";
import { getUserContext } from "@/lib/auth/session";
import { testUpgradeEnabled } from "@/lib/config/flags";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lightweight account snapshot for the client (auth state, plan, credits,
// entitlements). Used to gate UI (premium mode, credit display, upgrade CTAs).
export async function GET() {
  const ctx = await getUserContext();
  if (!ctx) return NextResponse.json({ authenticated: false, testMode: testUpgradeEnabled });
  return NextResponse.json({
    authenticated: true,
    email: ctx.user.email,
    plan: ctx.planKey,
    planName: ctx.plan.name,
    credits: ctx.credits,
    unlimited: ctx.plan.monthlyScans === -1,
    features: ctx.plan.features,
    testMode: testUpgradeEnabled,
  });
}
