import { NextRequest, NextResponse } from "next/server";
import { toolRequestSchema, type ToolRequest } from "@/lib/schemas";
import { getUserContext } from "@/lib/auth/session";
import {
  assertCredits,
  assertFeature,
  spendCredits,
  RunNotAllowedError,
} from "@/lib/billing/usage";
import { describeApiError } from "@/lib/ai/client";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import type { FeatureKey } from "@/lib/config/plans";
import type { RunUsage } from "@/lib/ai/cost";

// ---------------------------------------------------------------------------
// Shared handler for add-on career tools: validate -> require sign-in ->
// gate by plan feature + credits -> run the generator -> spend credits ->
// return { result, account }. Each tool route just supplies a generator.
// ---------------------------------------------------------------------------

export async function handleTool<T>(
  req: NextRequest,
  opts: {
    feature: FeatureKey;
    action: string;
    cost?: number;
    generate: (input: ToolRequest) => Promise<{ payload: T; usage: RunUsage }>;
  }
): Promise<NextResponse> {
  const limited = enforceRateLimit(req, "tools", RATE_LIMITS.tools.limit, RATE_LIMITS.tools.windowMs);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const parsed = toolRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  const ctx = await getUserContext();
  if (!ctx) {
    return NextResponse.json(
      { error: "Please sign in first.", code: "auth_required" },
      { status: 401 }
    );
  }

  const cost = opts.cost ?? 1;
  try {
    assertFeature(ctx, opts.feature);
    assertCredits(ctx, cost);
  } catch (e) {
    if (e instanceof RunNotAllowedError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: 402 });
    }
    throw e;
  }

  try {
    const { payload, usage } = await opts.generate(parsed.data);
    const credits = await spendCredits(ctx.user.id, ctx.plan, cost, opts.action);
    return NextResponse.json({
      result: payload,
      usage: { ...usage, mode: "assist" },
      account: { credits, unlimited: ctx.plan.monthlyScans === -1 },
    });
  } catch (err) {
    console.error(`[tool:${opts.action}]`, err);
    return NextResponse.json({ error: describeApiError(err) }, { status: 502 });
  }
}

/** Build the standard user message for a tool from resume + JD (+ instruction). */
export function toolUserMessage(input: ToolRequest, resumeBasis: string): string {
  const lines = [
    "=== JOB DESCRIPTION ===",
    input.jobDescription,
    "",
    "=== CANDIDATE RESUME (the ONLY source of truth) ===",
    resumeBasis,
  ];
  if (input.instruction) {
    lines.push("", "=== USER INSTRUCTION ===", input.instruction);
  }
  return lines.join("\n");
}
