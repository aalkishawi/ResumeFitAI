"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { cx } from "../ui";

export function PrivacyControls({ initialSaveHistory }: { initialSaveHistory: boolean }) {
  const [save, setSave] = useState(initialSaveHistory);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const toggleSave = async () => {
    const next = !save;
    setSave(next);
    setMsg(null);
    await fetch("/api/account/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ saveHistory: next }),
    }).catch(() => {});
  };

  const clearHistory = async () => {
    if (!confirm("Delete all your saved runs? This cannot be undone.")) return;
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/account/history", { method: "DELETE" });
      const d = await r.json().catch(() => ({}));
      setMsg(r.ok ? `Deleted ${d.deleted ?? 0} saved run(s).` : "Could not delete history.");
    } finally {
      setBusy(false);
    }
  };

  const deleteAccount = async () => {
    if (!confirm("Permanently delete your account and ALL your data? This cannot be undone.")) return;
    if (!confirm("Are you absolutely sure? This is irreversible.")) return;
    setBusy(true);
    const r = await fetch("/api/account", { method: "DELETE" });
    if (r.ok) {
      await signOut({ callbackUrl: "/" });
    } else {
      setMsg("Could not delete account. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Save-to-history toggle */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-slate-800 dark:text-slate-100">Save my work to history</div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            When off, your resume, job description, and results are processed for the request but
            <strong> not stored</strong>. Only anonymous cost/token stats are kept.
          </p>
        </div>
        <button
          onClick={toggleSave}
          role="switch"
          aria-checked={save}
          className={cx(
            "relative h-6 w-11 shrink-0 rounded-full transition",
            save ? "bg-brand-600" : "bg-slate-300 dark:bg-white/15"
          )}
        >
          <span
            className={cx(
              "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all",
              save ? "left-[22px]" : "left-0.5"
            )}
          />
        </button>
      </div>

      <div className="h-px bg-slate-200 dark:bg-white/10" />

      {/* Delete history */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-slate-800 dark:text-slate-100">Delete my history</div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Remove every saved resume, job description, and result from your account.
          </p>
        </div>
        <button
          onClick={clearHistory}
          disabled={busy}
          className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
        >
          Delete history
        </button>
      </div>

      <div className="h-px bg-slate-200 dark:bg-white/10" />

      {/* Delete account */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-rose-600 dark:text-rose-400">Delete my account</div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Permanently delete your account and all associated data.
          </p>
        </div>
        <button
          onClick={deleteAccount}
          disabled={busy}
          className="shrink-0 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10"
        >
          Delete account
        </button>
      </div>

      {msg ? <p className="text-xs text-slate-500 dark:text-slate-400">{msg}</p> : null}
    </div>
  );
}
