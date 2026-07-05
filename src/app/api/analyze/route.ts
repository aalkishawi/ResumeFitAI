import { NextRequest, NextResponse } from "next/server";
import { analyzeRequestSchema } from "@/lib/schemas";
import { runPipeline } from "@/lib/ai/pipeline";
import { MissingApiKeyError, describeApiError } from "@/lib/ai/client";

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

  try {
    const result = await runPipeline({
      resume: parsed.data.resume,
      jobDescription: parsed.data.jobDescription,
      instruction: parsed.data.instruction,
      mode: parsed.data.mode,
    });
    return NextResponse.json({ result });
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    console.error("[analyze] pipeline error:", err);
    return NextResponse.json({ error: describeApiError(err) }, { status: 502 });
  }
}
