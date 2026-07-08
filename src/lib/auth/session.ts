import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { getPlan, type PlanDef } from "@/lib/config/plans";

// ---------------------------------------------------------------------------
// Server-side helpers for reading the current user and their plan/credits.
// Use in server components and route handlers.
// ---------------------------------------------------------------------------

export interface SessionUser {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  return session?.user?.id ? (session.user as SessionUser) : null;
}

export interface UserContext {
  user: SessionUser;
  planKey: string;
  plan: PlanDef;
  credits: number;
  saveHistory: boolean;
}

export async function getUserContext(): Promise<UserContext | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const [sub, bal] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId: user.id } }),
    prisma.creditBalance.findUnique({ where: { userId: user.id } }),
  ]);
  // Fetch the privacy preference defensively: a transient DB error (or a stale
  // Prisma client that predates this column) must never sign the user out.
  let saveHistory = true;
  try {
    const row = await prisma.user.findUnique({
      where: { id: user.id },
      select: { saveHistory: true },
    });
    saveHistory = row?.saveHistory ?? true;
  } catch {
    saveHistory = true;
  }
  const planKey = sub?.planKey ?? "free";
  return {
    user,
    planKey,
    plan: getPlan(planKey),
    credits: bal?.credits ?? 0,
    saveHistory,
  };
}
