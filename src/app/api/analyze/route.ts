import { NextRequest, NextResponse } from "next/server";
import { analyzeRequestSchema } from "@/lib/schemas";
import { runPipeline } from "@/lib/ai/pipeline";
import { MissingApiKeyError, describeApiError } from "@/lib/ai/client";
import { getUserContext } from "@/lib/auth/session";
import { assertCanRun, chargeForRun, RunNotAllowedError } from "@/lib/billing/usage";
import { cacheKey } from "@/lib/ai/cache";

// AI + document parsing require the Node runtime (not Edge).
export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body. Expected JSON." },
      { status: 400 }
    );
  }

  const parsed = analyzeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  // --- Auth + entitlement gate ---------------------------------------------
  const ctx = await getUserContext();
  if (!ctx) {
    return NextResponse.json(
      { error: "Please sign in to tailor your resume.", code: "auth_required" },
      { status: 401 }
    );
  }

  const { resume, jobDescription, instruction, mode } = parsed.data;

  try {
    assertCanRun(ctx, mode);
  } catch (err) {
    if (err instanceof RunNotAllowedError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 402 });
    }
    throw err;
  }

  // --- Run the pipeline ----------------------------------------------------
  try {
    const result = await runPipeline({ resume, jobDescription, instruction, mode });

    // Charge + persist only for fresh runs (cache hits are free to the user).
    let credits = ctx.credits;
    if (result.usage && !result.usage.cached) {
      credits = await chargeForRun({
        userId: ctx.user.id,
        plan: ctx.plan,
        mode,
        usage: result.usage,
        inputHash: cacheKey({ resume, jobDescription, instruction, mode }),
      });
    }

    return NextResponse.json({
      result,
      account: {
        credits,
        plan: ctx.planKey,
        unlimited: ctx.plan.monthlyScans === -1,
      },
    });
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    console.error("[analyze] pipeline error:", err);
    return NextResponse.json({ error: describeApiError(err) }, { status: 502 });
  }
}
