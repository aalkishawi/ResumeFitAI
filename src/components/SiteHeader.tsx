"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Wand2 } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export function SiteHeader() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => setIsAdmin(Boolean(d.isAdmin)))
      .catch(() => {});
  }, [status]);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-violet-500 text-white shadow-lg shadow-brand-600/30">
            <Wand2 size={16} />
          </span>
          <span className="text-sm font-bold tracking-tight text-white">
            ResumeFit <span className="text-gradient">AI</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <ThemeToggle />
          <Link
            href="/pricing"
            className="hidden rounded-lg px-3 py-1.5 text-slate-300 hover:bg-white/10 hover:text-white sm:inline"
          >
            Pricing
          </Link>
          {status === "loading" ? null : user ? (
            <>
              <Link
                href="/app"
                className="rounded-lg px-3 py-1.5 font-medium text-slate-200 hover:bg-white/10 hover:text-white"
              >
                Open app
              </Link>
              <Link
                href="/billing"
                className="rounded-lg px-3 py-1.5 font-medium text-slate-200 hover:bg-white/10 hover:text-white"
              >
                Billing
              </Link>
              {isAdmin ? (
                <Link
                  href="/admin"
                  className="rounded-lg px-3 py-1.5 font-medium text-slate-200 hover:bg-white/10 hover:text-white"
                >
                  Admin
                </Link>
              ) : null}
              <Link
                href="/account"
                className="hidden rounded-lg px-3 py-1.5 font-medium text-slate-300 hover:bg-white/10 hover:text-white sm:inline"
              >
                {user.name || user.email}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-lg border border-white/15 px-3 py-1.5 font-medium text-slate-200 hover:bg-white/10"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/signin"
                className="rounded-lg px-3 py-1.5 font-medium text-slate-200 hover:bg-white/10 hover:text-white"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-brand-600 px-3.5 py-1.5 font-semibold text-white shadow-lg shadow-brand-600/20 hover:bg-brand-500"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
