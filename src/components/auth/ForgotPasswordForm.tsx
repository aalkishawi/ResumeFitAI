"use client";

import { useState } from "react";
import Link from "next/link";

const inputCls =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => {});
    setBusy(false);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-300">
          If an account exists for <strong className="text-white">{email}</strong>, we&apos;ve sent a
          password reset link. Check your inbox (and spam).
        </p>
        <Link href="/signin" className="inline-block text-sm font-medium text-brand-400 hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <input
        type="email"
        required
        placeholder="Your account email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={inputCls}
      />
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-60"
      >
        {busy ? "Sending…" : "Send reset link"}
      </button>
      <p className="text-center text-sm text-slate-400">
        Remembered it?{" "}
        <Link href="/signin" className="font-medium text-brand-400 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
