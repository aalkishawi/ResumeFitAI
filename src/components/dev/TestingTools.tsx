"use client";

import { useState } from "react";

async function call(body: Record<string, unknown>) {
  await fetch("/api/dev/upgrade", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => {});
  window.location.reload();
}

export function TestingTools() {
  const [busy, setBusy] = useState(false);
  const act = (body: Record<string, unknown>) => {
    setBusy(true);
    void call(body);
  };
  const btn =
    "rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50";
  return (
    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="text-sm font-semibold text-amber-900">🧪 Testing tools (test mode)</div>
      <p className="mt-1 text-xs text-amber-700">
        Unlock features without paying — for testing only. Disabled in production.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button disabled={busy} onClick={() => act({ plan: "premium" })} className={btn}>
          Unlock Premium (unlimited)
        </button>
        <button disabled={busy} onClick={() => act({ plan: "pro" })} className={btn}>
          Set Pro
        </button>
        <button disabled={busy} onClick={() => act({ action: "credits", credits: 100 })} className={btn}>
          +100 credits
        </button>
        <button disabled={busy} onClick={() => act({ plan: "free" })} className={btn}>
          Reset to Free
        </button>
      </div>
    </div>
  );
}
