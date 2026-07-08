import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSessionUser } from "@/lib/auth/session";

export const runtime = "nodejs";

// Permanently delete the current user's account and all associated data
// (runs, applications, subscription, credits, sessions — via cascade).
export async function DELETE() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  await prisma.user.delete({ where: { id: user.id } });
  return NextResponse.json({ ok: true });
}
