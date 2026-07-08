import { prisma } from "@/lib/db/client";
import { getSessionUser } from "./session";
import { testUpgradeEnabled } from "@/lib/config/flags";

// ---------------------------------------------------------------------------
// Admin access. A user is an admin if their email is in ADMIN_EMAILS, their
// User.role is "admin", or we're in dev/test mode (convenience). Gate the
// /admin page and admin APIs with isCurrentUserAdmin().
// ---------------------------------------------------------------------------

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const user = await getSessionUser();
  if (!user) return false;
  // Dev/test convenience: anyone signed in can see the admin dashboard.
  if (testUpgradeEnabled) return true;
  if (user.email && adminEmails().includes(user.email.toLowerCase())) return true;
  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  return row?.role === "admin";
}
