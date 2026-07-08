import { PrismaClient } from "@prisma/client";
import { PLAN_DEFS } from "../src/lib/config/plans";

// Seed the Plan table from the plan catalog (single source of truth in
// src/lib/config/plans.ts). Idempotent — safe to run repeatedly.

const prisma = new PrismaClient();

async function main() {
  for (const p of PLAN_DEFS) {
    const data = {
      name: p.name,
      priceMonthlyCents: p.priceMonthlyCents,
      monthlyScans: p.monthlyScans,
      monthlyCredits: p.monthlyCredits,
      features: JSON.stringify(p.features),
      sortOrder: p.sortOrder,
      active: true,
    };
    await prisma.plan.upsert({
      where: { key: p.key },
      update: data,
      create: { key: p.key, ...data },
    });
  }
  console.log(`Seeded ${PLAN_DEFS.length} plans: ${PLAN_DEFS.map((p) => p.key).join(", ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
