import React from "react";

// Dark gradient hero band used at the top of logged-in pages, matching the
// landing aesthetic. Content below it stays on the light workspace.
export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="hero-glow border-b border-white/10 bg-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-slate-300">{subtitle}</p> : null}
        </div>
        {children ? (
          <div className="flex flex-wrap items-center gap-2">{children}</div>
        ) : null}
      </div>
    </div>
  );
}
