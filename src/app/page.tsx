import Link from "next/link";
import {
  Wand2,
  FileCheck2,
  KeyRound,
  MessagesSquare,
  Linkedin,
  ScanSearch,
  ShieldCheck,
  ArrowRight,
  Check,
  Sparkles,
} from "lucide-react";
import { PLAN_DEFS } from "@/lib/config/plans";

export const metadata = {
  title: "ResumeFit AI — Tailor every resume to every job",
  description:
    "AI-powered resume optimization for ATS alignment, recruiter readability, and interview readiness. Ethical: improves your real experience, never fabricates it.",
};

const FEATURES = [
  { icon: <FileCheck2 size={20} />, title: "AI Resume Tailoring", desc: "Rewrite your resume for a specific job — clearer, aligned, and ATS-friendly." },
  { icon: <ScanSearch size={20} />, title: "ATS Compatibility Check", desc: "Spot formatting and parsing risks, with concrete fixes recruiters' systems reward." },
  { icon: <KeyRound size={20} />, title: "Keyword Gap Analysis", desc: "See exactly which job-description keywords your resume is missing or underusing." },
  { icon: <FileCheck2 size={20} />, title: "Cover Letter Generator", desc: "A tailored, truthful cover letter grounded in your real experience." },
  { icon: <MessagesSquare size={20} />, title: "Interview Coach", desc: "Likely questions, STAR answers, and salary-negotiation talking points." },
  { icon: <Linkedin size={20} />, title: "LinkedIn Optimizer", desc: "A recruiter-ready headline, About section, and improved experience bullets." },
];

const STEPS = [
  { n: "1", title: "Paste your resume & the job", desc: "Upload a PDF/DOCX or paste text. Add an optional instruction." },
  { n: "2", title: "AI tailors it — truthfully", desc: "We align your real experience to the role. No invented skills or metrics." },
  { n: "3", title: "Download & prepare", desc: "Export DOCX/PDF, generate a cover letter, and prep for the interview." },
];

const FAQS = [
  { q: "Does this fabricate experience to beat the ATS?", a: "No. ResumeFit only rephrases and reorganizes your real experience for clarity and job alignment. It flags any claim it can't support from your resume." },
  { q: "Is it really ATS-friendly?", a: "We improve ATS compatibility — clean structure, standard sections, keyword alignment — and flag formatting risks. No tool can guarantee passing every ATS." },
  { q: "Do you store my resume?", a: "Your tailored resumes are saved to your account history so you can revisit them, and you can delete any run at any time. We never sell your data or use it to train models." },
  { q: "Which AI models do you use?", a: "A cost-routed mix: fast, affordable models for analysis and stronger models for tailoring. Premium unlocks our most capable model; Local mode can run on your own server." },
];

export default function LandingPage() {
  const free = PLAN_DEFS.find((p) => p.key === "free")!;
  const pro = PLAN_DEFS.find((p) => p.key === "pro")!;
  const premium = PLAN_DEFS.find((p) => p.key === "premium")!;
  const teaser = [free, pro, premium];

  return (
    <div className="bg-slate-950 text-slate-100">
      {/* Hero */}
      <section className="hero-glow relative overflow-hidden">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
            <Sparkles size={13} className="text-brand-400" /> Ethical AI career assistant
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            Tailor every resume to <span className="text-gradient">every job</span> — in minutes.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-300">
            AI-powered resume optimization for ATS alignment, recruiter readability, and interview
            readiness. It improves your real experience — it never invents it.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup" className="btn-primary">
              Get started free <ArrowRight size={16} />
            </Link>
            <Link href="#how" className="btn-ghost">
              See how it works
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-400">
            3 free tailored resumes every month · No credit card required
          </p>
        </div>
      </section>

      {/* Value strip */}
      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 text-center sm:grid-cols-4 sm:px-6">
          {[
            ["ATS-ready", "Formatting checked"],
            ["Keyword-aligned", "To the job description"],
            ["Truthful", "Never fabricated"],
            ["Interview-ready", "Coaching included"],
          ].map(([h, s]) => (
            <div key={h}>
              <div className="text-sm font-semibold text-white">{h}</div>
              <div className="text-xs text-slate-400">{s}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight">How it works</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="glass rounded-2xl p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 font-bold text-white">
                {s.n}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">{s.title}</h3>
              <p className="mt-1.5 text-sm text-slate-300">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Everything you need to land the interview
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-slate-300">
            One platform for tailoring, keyword analysis, ATS checks, and interview prep.
          </p>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="glass glass-hover rounded-2xl p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-brand-400">
                  {f.icon}
                </div>
                <h3 className="mt-4 font-semibold text-white">{f.title}</h3>
                <p className="mt-1.5 text-sm text-slate-300">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ethics / positioning */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
          <ShieldCheck size={24} />
        </div>
        <h2 className="mt-5 text-3xl font-bold tracking-tight">Honest by design</h2>
        <p className="mx-auto mt-4 max-w-2xl text-slate-300">
          We don&apos;t help you trick hiring systems or fabricate experience. ResumeFit improves
          clarity, ATS compatibility, and job alignment — and flags any claim it can&apos;t support
          from your resume, so what you send is genuinely yours.
        </p>
      </section>

      {/* Pricing preview */}
      <section className="border-t border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight">Start free. Upgrade when it pays off.</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {teaser.map((p) => {
              const featured = p.key === "pro";
              return (
                <div
                  key={p.key}
                  className={
                    "glass rounded-2xl p-6 " +
                    (featured ? "ring-2 ring-brand-500/50" : "")
                  }
                >
                  <div className="text-sm font-semibold text-white">{p.name}</div>
                  <div className="mt-2 text-3xl font-bold text-white">
                    {p.priceMonthlyCents === 0 ? "Free" : `$${(p.priceMonthlyCents / 100).toFixed(0)}`}
                    {p.priceMonthlyCents > 0 ? (
                      <span className="text-sm font-normal text-slate-400">/mo</span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{p.tagline}</p>
                  <div className="mt-3 text-xs text-slate-300">
                    {p.monthlyScans === -1 ? "Unlimited scans" : `${p.monthlyScans} scans / month`}
                  </div>
                  <Link
                    href="/signup"
                    className={
                      "mt-5 block rounded-lg px-3.5 py-2 text-center text-sm font-semibold " +
                      (featured
                        ? "bg-brand-600 text-white hover:bg-brand-500"
                        : "border border-white/15 text-slate-100 hover:bg-white/10")
                    }
                  >
                    {p.priceMonthlyCents === 0 ? "Get started" : "Choose " + p.name}
                  </Link>
                </div>
              );
            })}
          </div>
          <div className="mt-6 text-center">
            <Link href="/pricing" className="text-sm font-medium text-brand-400 hover:underline">
              Compare all plans →
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight">Frequently asked</h2>
        <div className="mt-10 space-y-3">
          {FAQS.map((f) => (
            <details key={f.q} className="glass rounded-xl p-4 [&_summary]:cursor-pointer">
              <summary className="flex items-center justify-between text-sm font-semibold text-white">
                {f.q}
                <Check size={16} className="text-brand-400" />
              </summary>
              <p className="mt-2 text-sm text-slate-300">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="hero-glow border-t border-white/10">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Turn your resume into a job-specific application package.
          </h2>
          <div className="mt-8">
            <Link href="/signup" className="btn-primary">
              Get started free <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-slate-950">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-slate-400 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-violet-500 text-white">
              <Wand2 size={14} />
            </span>
            <span className="font-semibold text-slate-200">ResumeFit AI</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link href="/pricing" className="hover:text-white">Pricing</Link>
            <Link href="/ethics" className="hover:text-white">Ethics</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/signin" className="hover:text-white">Sign in</Link>
          </div>
          <div className="text-xs">Improves your real experience — never fabricates it.</div>
        </div>
      </footer>
    </div>
  );
}
