import { prisma } from "@/lib/db/client";
import { getPlan } from "@/lib/config/plans";

// ---------------------------------------------------------------------------
// Give every new account a Free subscription + starter credit balance. Called
// both when the OAuth adapter creates a user and from the email/password
// registration route. Idempotent.
// ---------------------------------------------------------------------------

export async function provisionNewUser(userId: string): Promise<void> {
  const free = getPlan("free");
  await prisma.subscription.upsert({
    where: { userId },
    update: {},
    create: { userId, planKey: "free", status: "active" },
  });
  await prisma.creditBalance.upsert({
    where: { userId },
    update: {},
    create: { userId, credits: free.monthlyCredits },
  });
}
