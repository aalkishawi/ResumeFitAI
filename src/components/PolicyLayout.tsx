import { PageHeader } from "./PageHeader";

export function PolicyLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <PageHeader title={title} subtitle={`Last updated ${updated}`} />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300 [&_a]:text-brand-600 [&_a]:underline [&_h2]:mt-7 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-slate-900 dark:[&_h2]:text-white [&_li]:mt-1 [&_strong]:font-semibold [&_strong]:text-slate-800 dark:[&_strong]:text-slate-100 [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>
      </main>
    </>
  );
}

export function PolicyNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
      {children}
    </div>
  );
}
