import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { getSessionUser } from "@/lib/auth/session";

export const runtime = "nodejs";

const STATUSES = ["saved", "applied", "interview", "offer", "rejected"] as const;

const patchSchema = z.object({
  company: z.string().trim().min(1).max(200).optional(),
  role: z.string().trim().min(1).max(200).optional(),
  status: z.enum(STATUSES).optional(),
  url: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(4000).optional(),
  appliedAt: z.string().nullable().optional(),
  resumeRunId: z.string().nullable().optional(),
});

async function own(id: string) {
  const user = await getSessionUser();
  if (!user) return null;
  const job = await prisma.jobApplication.findFirst({ where: { id, userId: user.id } });
  return job;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await own(id);
  if (!job) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }
  const d = parsed.data;
  const updated = await prisma.jobApplication.update({
    where: { id },
    data: {
      ...(d.company !== undefined ? { company: d.company } : {}),
      ...(d.role !== undefined ? { role: d.role } : {}),
      ...(d.status !== undefined ? { status: d.status } : {}),
      ...(d.url !== undefined ? { url: d.url || null } : {}),
      ...(d.notes !== undefined ? { notes: d.notes || null } : {}),
      ...(d.appliedAt !== undefined ? { appliedAt: d.appliedAt ? new Date(d.appliedAt) : null } : {}),
      ...(d.resumeRunId !== undefined ? { resumeRunId: d.resumeRunId || null } : {}),
    },
  });
  return NextResponse.json({ job: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await own(id);
  if (!job) return NextResponse.json({ error: "Not found." }, { status: 404 });
  await prisma.jobApplication.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
