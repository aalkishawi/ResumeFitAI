import { prisma } from "@/lib/db/client";

// Aggregate cost/usage analytics from persisted runs + cost logs.
export async function getAdminStats() {
  const [runAgg, runCount, userCount, byModel, recent] = await Promise.all([
    prisma.resumeRun.aggregate({
      _sum: { costUsd: true, inputTokens: true, outputTokens: true, creditsUsed: true },
    }),
    prisma.resumeRun.count(),
    prisma.user.count(),
    prisma.costLog.groupBy({
      by: ["model"],
      _sum: { costUsd: true, inputTokens: true, outputTokens: true },
      _count: { _all: true },
    }),
    prisma.resumeRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        title: true,
        mode: true,
        costUsd: true,
        scoreOverall: true,
        createdAt: true,
      },
    }),
  ]);

  const totalCost = runAgg._sum.costUsd ?? 0;
  return {
    runCount,
    userCount,
    totalCost,
    avgCost: runCount ? totalCost / runCount : 0,
    inputTokens: runAgg._sum.inputTokens ?? 0,
    outputTokens: runAgg._sum.outputTokens ?? 0,
    creditsUsed: runAgg._sum.creditsUsed ?? 0,
    byModel: byModel
      .map((m) => ({
        model: m.model,
        calls: m._count._all,
        costUsd: m._sum.costUsd ?? 0,
        inputTokens: m._sum.inputTokens ?? 0,
        outputTokens: m._sum.outputTokens ?? 0,
      }))
      .sort((a, b) => b.costUsd - a.costUsd),
    recent,
  };
}
