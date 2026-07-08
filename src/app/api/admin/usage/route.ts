import { NextRequest, NextResponse } from "next/server";
import { getRunLog, getUsageSummary } from "@/lib/ai/cost";
import { runtimeConfig } from "@/lib/ai/models";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// Admin cost/usage analytics. Returns the in-memory run log + summary.
// Protected by ADMIN_TOKEN when set (send `Authorization: Bearer <token>` or
// `?token=<token>`). If ADMIN_TOKEN is unset, the endpoint is open — set it in
// any shared/production environment.
// ---------------------------------------------------------------------------

function authorized(req: NextRequest): boolean {
  const token = runtimeConfig.adminToken;
  if (!token) return true;
  const header = req.headers.get("authorization") || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";
  const query = req.nextUrl.searchParams.get("token") || "";
  return bearer === token || query === token;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  return NextResponse.json({
    summary: getUsageSummary(),
    runs: getRunLog(100),
  });
}
