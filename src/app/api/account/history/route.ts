import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSessionUser } from "@/lib/auth/session";

export const runtime = "nodejs";

// Delete all of the current user's saved runs (resume/JD/result history).
export async function DELETE() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const res = await prisma.resumeRun.deleteMany({ where: { userId: user.id } });
  return NextResponse.json({ ok: true, deleted: res.count });
}
