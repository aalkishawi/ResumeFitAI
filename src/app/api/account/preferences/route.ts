import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { getSessionUser } from "@/lib/auth/session";

export const runtime = "nodejs";

const schema = z.object({ saveHistory: z.boolean() });

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { saveHistory: parsed.data.saveHistory },
  });
  return NextResponse.json({ ok: true, saveHistory: parsed.data.saveHistory });
}
