export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="hero-glow flex min-h-[calc(100vh-3.5rem)] flex-col justify-center bg-slate-950 px-4 py-12">
      <div className="mx-auto w-full max-w-md">
        <div className="glass rounded-2xl p-6 sm:p-8">
          <h1 className="text-xl font-bold tracking-tight text-white">{title}</h1>
          <p className="mb-6 mt-1 text-sm text-slate-400">{subtitle}</p>
          {children}
        </div>
      </div>
    </main>
  );
}
