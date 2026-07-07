"use client";

import { useState } from "react";

export function PortalButton({ className }: { className?: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const go = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setErr(data.error || "Could not open billing portal.");
        setBusy(false);
        return;
      }
      window.location.href = data.url as string;
    } catch {
      setErr("Could not open billing portal.");
      setBusy(false);
    }
  };

  return (
    <span className="flex flex-col">
      <button onClick={go} disabled={busy} className={className}>
        {busy ? "Opening…" : "Manage subscription"}
      </button>
      {err ? <span className="mt-1 text-xs text-rose-600">{err}</span> : null}
    </span>
  );
}
