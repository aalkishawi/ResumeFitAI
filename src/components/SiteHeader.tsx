"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Wand2 } from "lucide-react";

export function SiteHeader() {
  const { data: session, status } = useSession();
  const user = session?.user;

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Wand2 size={16} />
          </span>
          <span className="text-sm font-bold tracking-tight text-slate-900">
            ResumeFit <span className="text-brand-600">AI</span>
          </span>
        </Link>

        <nav className="flex items-center gap-2 text-sm">
          <Link href="/pricing" className="hidden px-3 py-1.5 text-slate-500 hover:text-slate-800 sm:inline">
            Pricing
          </Link>
          {status === "loading" ? null : user ? (
            <>
              <Link
                href="/account"
                className="rounded-lg px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-50"
              >
                {user.name || user.email}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-500 hover:bg-slate-50"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/signin"
                className="rounded-lg px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-50"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-brand-600 px-3 py-1.5 font-semibold text-white hover:bg-brand-700"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
