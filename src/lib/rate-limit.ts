import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Lightweight fixed-window rate limiter (in-memory, process-local). Protects
// expensive / abusable endpoints. For multi-instance deployments, back this
// with Redis — the interface (checkRateLimit) can stay the same.
// ---------------------------------------------------------------------------

interface Bucket {
  count: number;
  reset: number; // epoch ms when the window resets
}

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10000;

export interface RateLimitResult {
  ok: boolean;
  retryAfter: number; // seconds
}

/** Fixed-window limit for a key. Returns ok=false once `limit` is exceeded. */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  // Opportunistic cleanup so the map can't grow unbounded.
  if (buckets.size > MAX_BUCKETS) {
    for (const [k, b] of buckets) if (b.reset < now) buckets.delete(k);
  }

  let bucket = buckets.get(key);
  if (!bucket || bucket.reset <= now) {
    bucket = { count: 0, reset: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((bucket.reset - now) / 1000)) };
  }
  return { ok: true, retryAfter: 0 };
}

/** Best-effort client identifier from proxy headers (falls back to "local"). */
export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "local";
}

/**
 * Enforce a rate limit for a request. Returns a 429 NextResponse when the limit
 * is exceeded, or null to proceed. `bucket` namespaces the limit (e.g. "analyze").
 */
export function enforceRateLimit(
  req: NextRequest,
  bucket: string,
  limit: number,
  windowMs: number,
  id?: string
): NextResponse | null {
  const key = `${bucket}:${id || clientIp(req)}`;
  const res = checkRateLimit(key, limit, windowMs);
  if (res.ok) return null;
  return NextResponse.json(
    {
      error: "Too many requests. Please slow down and try again shortly.",
      code: "rate_limited",
    },
    { status: 429, headers: { "Retry-After": String(res.retryAfter) } }
  );
}

const MINUTE = 60_000;

/** Default limits per endpoint class (per minute). */
export const RATE_LIMITS = {
  analyze: { limit: 15, windowMs: MINUTE },
  tools: { limit: 30, windowMs: MINUTE },
  register: { limit: 5, windowMs: 10 * MINUTE },
  billing: { limit: 20, windowMs: MINUTE },
} as const;
