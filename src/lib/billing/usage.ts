import { prisma } from "@/lib/db/client";
import {
  CREDITS_PER_RUN,
  planHasFeature,
  type PlanDef,
} from "@/lib/config/plans";
import type { RunUsageInfo } from "@/lib/types";

// ---------------------------------------------------------------------------
// Metering & entitlement. A run is metered in CREDITS. Plans grant monthly
// credits; unlimited plans (monthlyScans === -1) don't consume credits. Premium
// mode (strongest model) requires the `premium_model` plan feature.
// ---------------------------------------------------------------------------

export class RunNotAllowedError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "RunNotAllowedError";
  }
}

export interface BillingContext {
  user: { id: string };
  planKey: string;
  plan: PlanDef;
  credits: number;
}

export function creditsForMode(mode: string): number {
  return CREDITS_PER_RUN[mode] ?? 1;
}

export function isUnlimited(plan: PlanDef): boolean {
  return plan.monthlyScans === -1;
}

/** Throw RunNotAllowedError if this user can't run in this mode. */
export function assertCanRun(ctx: BillingContext, mode: string): void {
  if (mode === "premium" && !planHasFeature(ctx.planKey, "premium_model")) {
    throw new RunNotAllowedError(
      "premium_required",
      "Premium mode uses our strongest model and requires the Premium plan."
    );
  }
  if (!isUnlimited(ctx.plan)) {
    const cost = creditsForMode(mode);
    if (ctx.credits < cost) {
      throw new RunNotAllowedError(
        "insufficient_credits",
        `This run needs ${cost} credit${cost > 1 ? "s" : ""}, but you have ${ctx.credits}. Upgrade your plan or top up credits to continue.`
      );
    }
  }
}

/**
 * Deduct credits (unless unlimited) and persist the run + per-call cost logs.
 * Runs in a transaction. Returns the user's remaining credit balance.
 */
export async function chargeForRun(params: {
  userId: string;
  plan: PlanDef;
  mode: string;
  usage: RunUsageInfo;
  inputHash: string;
}): Promise<number> {
  const cost = isUnlimited(params.plan) ? 0 : creditsForMode(params.mode);

  return prisma.$transaction(async (tx) => {
    let remaining: number;
    if (cost > 0) {
      const bal = await tx.creditBalance.update({
        where: { userId: params.userId },
        data: { credits: { decrement: cost } },
      });
      remaining = bal.credits;
    } else {
      const bal = await tx.creditBalance.findUnique({
        where: { userId: params.userId },
      });
      remaining = bal?.credits ?? 0;
    }

    const run = await tx.resumeRun.create({
      data: {
        userId: params.userId,
        mode: params.mode,
        inputHash: params.inputHash,
        costUsd: params.usage.costUsd,
        inputTokens: params.usage.inputTokens,
        outputTokens: params.usage.outputTokens,
        cached: params.usage.cached,
        creditsUsed: cost,
      },
    });

    if (params.usage.calls.length) {
      await tx.costLog.createMany({
        data: params.usage.calls.map((c) => ({
          runId: run.id,
          task: c.task,
          provider: c.provider,
          model: c.model,
          inputTokens: c.inputTokens,
          outputTokens: c.outputTokens,
          costUsd: c.costUsd,
        })),
      });
    }

    await tx.usageLog.create({
      data: {
        userId: params.userId,
        action: "scan",
        quantity: 1,
        meta: JSON.stringify({ mode: params.mode }),
      },
    });

    return remaining;
  });
}
