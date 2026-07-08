"use client";

import { useState } from "react";

export function CheckoutButton({
  plan,
  pack,
  className,
  children,
}: {
  plan?: string;
  pack?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const go = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(plan ? { plan } : { pack }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setErr(data.error || "Could not start checkout.");
        setBusy(false);
        return;
      }
      window.location.href = data.url as string;
    } catch {
      setErr("Could not start checkout.");
      setBusy(false);
    }
  };

  return (
    <span className="flex flex-col">
      <button onClick={go} disabled={busy} className={className}>
        {busy ? "Redirecting…" : children}
      </button>
      {err ? <span className="mt-1 text-xs text-rose-600">{err}</span> : null}
    </span>
  );
}
