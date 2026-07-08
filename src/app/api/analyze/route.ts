import { NextRequest, NextResponse } from "next/server";
import { analyzeRequestSchema } from "@/lib/schemas";
import { runPipeline } from "@/lib/ai/pipeline";
import { MissingApiKeyError, describeApiError } from "@/lib/ai/client";
import { getUserContext } from "@/lib/auth/session";
import { assertCanRun, chargeForRun, RunNotAllowedError } from "@/lib/billing/usage";
import { cacheKey } from "@/lib/ai/cache";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

// AI + document parsing require the Node runtime (not Edge).
export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "analyze", RATE_LIMITS.analyze.limit, RATE_LIMITS.analyze.windowMs);
  if (limited) return limited;

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

    // Charge + persist only for fresh runs. The run's cost/token metadata is
    // always recorded; the resume/JD/result text is stored only if the user
    // has "save to history" enabled (privacy-first opt-out).
    let credits = ctx.credits;
    if (result.usage && !result.usage.cached) {
      const save = ctx.saveHistory;
      credits = await chargeForRun({
        userId: ctx.user.id,
        plan: ctx.plan,
        mode,
        usage: result.usage,
        inputHash: cacheKey({ resume, jobDescription, instruction, mode }),
        scoreOverall: result.scoreAfter.overall,
        title: save ? result.jd.jobTitle || "Tailored resume" : undefined,
        resume: save ? resume : undefined,
        jobDescription: save ? jobDescription : undefined,
        instruction: save ? instruction : undefined,
        resultJson: save ? JSON.stringify(result) : undefined,
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
