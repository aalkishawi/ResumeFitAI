import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { getUserContext } from "@/lib/auth/session";
import { planHasFeature } from "@/lib/config/plans";

export const runtime = "nodejs";

const STATUSES = ["saved", "applied", "interview", "offer", "rejected"] as const;

const createSchema = z.object({
  company: z.string().trim().min(1, "Company is required.").max(200),
  role: z.string().trim().min(1, "Role is required.").max(200),
  status: z.enum(STATUSES).optional().default("saved"),
  url: z.string().trim().max(500).optional().default(""),
  notes: z.string().trim().max(4000).optional().default(""),
  appliedAt: z.string().optional(),
  resumeRunId: z.string().optional(),
});

async function gate() {
  const ctx = await getUserContext();
  if (!ctx) return { error: NextResponse.json({ error: "Please sign in.", code: "auth_required" }, { status: 401 }) };
  if (!planHasFeature(ctx.planKey, "job_tracker")) {
    return {
      error: NextResponse.json(
        { error: "The job tracker is a Pro feature. Upgrade to use it.", code: "feature_locked" },
        { status: 402 }
      ),
    };
  }
  return { ctx };
}

export async function POST(req: NextRequest) {
  const g = await gate();
  if (g.error) return g.error;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }
  const d = parsed.data;
  const job = await prisma.jobApplication.create({
    data: {
      userId: g.ctx.user.id,
      company: d.company,
      role: d.role,
      status: d.status,
      url: d.url || null,
      notes: d.notes || null,
      appliedAt: d.appliedAt ? new Date(d.appliedAt) : null,
      resumeRunId: d.resumeRunId || null,
    },
  });
  return NextResponse.json({ job });
}
