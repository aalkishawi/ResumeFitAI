import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/db/client";
import { sendPasswordResetEmail } from "@/lib/email";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({ email: z.string().trim().email() });

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "register", RATE_LIMITS.register.limit, RATE_LIMITS.register.windowMs);
  if (limited) return limited;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  // Always respond ok — never reveal whether an email is registered.
  if (!parsed.success) return NextResponse.json({ ok: true });

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  // Only send for accounts that use a password (OAuth-only users sign in with Google).
  if (user?.passwordHash) {
    const raw = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(raw).digest("hex");
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expires: new Date(Date.now() + 60 * 60 * 1000) },
    });
    const link = `${new URL(req.url).origin}/reset-password?token=${raw}`;
    await sendPasswordResetEmail(email, link);
  }

  return NextResponse.json({ ok: true });
}
