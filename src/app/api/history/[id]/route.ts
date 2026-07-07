import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSessionUser } from "@/lib/auth/session";

export const runtime = "nodejs";

// Delete one of the current user's saved runs (ownership enforced).
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const run = await prisma.resumeRun.findFirst({ where: { id, userId: user.id } });
  if (!run) return NextResponse.json({ error: "Not found." }, { status: 404 });

  await prisma.resumeRun.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
