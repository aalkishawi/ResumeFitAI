"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const inputCls =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30";

export function ResetPasswordForm() {
  const token = useSearchParams().get("token") || "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not reset your password.");
        return;
      }
      setDone(true);
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <p className="text-sm text-rose-400">
        This reset link is missing its token. Please request a new one from{" "}
        <Link href="/forgot-password" className="underline">forgot password</Link>.
      </p>
    );
  }

  if (done) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-300">Your password has been updated.</p>
        <Link
          href="/signin"
          className="inline-block rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-500"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <input
        type="password"
        required
        minLength={8}
        placeholder="New password (min 8 characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={inputCls}
      />
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-60"
      >
        {busy ? "Updating…" : "Reset password"}
      </button>
    </form>
  );
}
