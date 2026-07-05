# ResumeFit AI

**Ethical, ATS-friendly AI resume tailoring.** ResumeFit AI takes a resume, a
job description, and a plain-language instruction, then produces a tailored,
keyword-optimized resume — while **never fabricating** skills, metrics, jobs,
degrees, or credentials. It only rewrites, restructures, and reprioritizes the
candidate's *real* experience.

Built with **Next.js (App Router) + TypeScript**, Tailwind CSS, and the
Anthropic Claude API.

---

## ✨ Features

- **Three-input workflow** — paste or upload a resume, a job description, and a
  chat-style tailoring instruction.
- **File upload & extraction** — PDF, DOCX, TXT, and Markdown. Extracted text is
  previewed and **editable** before processing, with validation and clear errors.
- **Instruction understanding** — detects tone, length, seniority, emphasis
  areas, target role, and requested output format ("Word document" → DOCX).
- **JD analysis** — job title, required/preferred skills, tools, methodologies,
  certifications, responsibilities, high-priority keywords, and qualification themes.
- **Resume analysis** — section parsing, strengths, missing/weak keywords,
  irrelevant content, and vague bullets to strengthen.
- **Match scoring** — overall + skills, experience, tools, keyword alignment, and
  seniority sub-scores, before and after tailoring, with explanations.
- **Truthful tailoring engine** — ATS-friendly summary, reordered skills,
  strengthened bullets (action verb + task + tools + outcome), natural keyword
  weaving — all grounded in the original resume.
- **Truthfulness guardrails** — a validation layer flags any unsupported claim in
  a dedicated **Potentially Unsupported Claims** section with ethical alternatives.
- **Rich output** — keyword gap analysis, list of changes made, skills to learn,
  and interview talking points.
- **Export** — copy, or download as **DOCX, PDF, TXT, or Markdown**. Exports are
  single-column, heading + bullet, standard-font, ATS-safe layouts.
- **Privacy-first** — nothing is stored; all processing is session-based.

---

## 🧱 Tech stack

| Concern | Library |
| --- | --- |
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| AI | `@anthropic-ai/sdk` (Claude) |
| PDF extraction | `pdf-parse` |
| DOCX extraction | `mammoth` |
| DOCX generation | `docx` |
| PDF generation | `pdf-lib` |
| Validation | `zod` |
| Markdown rendering | `react-markdown` + `remark-gfm` |
| Icons | `lucide-react` |

---

## 🚀 Getting started

### 1. Prerequisites

- Node.js 18.17+ (Node 20 LTS recommended)
- An [Anthropic API key](https://console.anthropic.com/)

### 2. Install

```bash
npm install
```

### 3. Configure your environment

Copy the example env file and add your key:

```bash
cp .env.example .env.local
```

Then edit `.env.local`:

```bash
ANTHROPIC_API_KEY=sk-ant-...      # required
RESUMEFIT_MODEL=claude-sonnet-5   # optional (default). Or claude-opus-4-8.
RESUMEFIT_MAX_FILE_MB=8           # optional upload size limit
```

> The API key is used **only** in server-side API routes and is never exposed to
> the browser.

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000.

Click **"Load sample data"** to populate the fictional CIO example, or upload the
files in [`/samples`](./samples). Then click **Analyze & Tailor Resume**.

### Other scripts

```bash
npm run build      # production build
npm start          # run the production build
npm run typecheck  # TypeScript check (no emit)
npm run lint       # ESLint
```

---

## 🛠️ Troubleshooting

**"The configured model … wasn't found or isn't available on your account."**
This message means Anthropic returned a genuine 404 for the model in
`RESUMEFIT_MODEL`. Confirm which models your key can use at
[console.anthropic.com](https://console.anthropic.com/settings/limits), then set
`RESUMEFIT_MODEL` to one of them (e.g. `claude-sonnet-5`, `claude-opus-4-8`, or
an older GA model like `claude-sonnet-4-5`). Note that your Claude subscription
(claude.ai / Claude Code) and your **API key** are separate accounts — a model
you can chat with in one is not automatically available to the other.

> **Env changes require a server restart.** `.env.local` is read only when the
> process starts, so stop `npm run dev` (Ctrl+C) and start it again after
> editing it.

**"The AI response was cut off … (hit the output token limit)."**
The tailoring call ran out of output tokens before finishing its JSON. This can
happen with very long resumes. The tailoring budget is set in
`src/lib/ai/pipeline.ts` (`maxTokens`, currently 12000) — raise it, or shorten
the resume / job description.

**Connection closed early / network errors.**
Usually a corporate proxy, VPN, or TLS-inspecting firewall. Try another network,
or set an `HTTPS_PROXY` environment variable if your network requires one.

---

## 🗂️ Project structure

```
src/
  app/
    layout.tsx                 # root layout
    page.tsx                   # main three-input UI + orchestration
    globals.css                # Tailwind + resume markdown styles
    api/
      analyze/route.ts         # runs the AI tailoring pipeline
      extract/route.ts         # extracts text from uploaded files
      export/route.ts          # generates DOCX / PDF / TXT / MD downloads
  components/
    DocumentInput.tsx          # resume/JD paste + upload + preview + edit
    ResultsView.tsx            # tabbed results
    ui.tsx                     # shared primitives (cards, score gauges, ...)
    tabs/                      # Analysis, Tailored Resume, Keyword Gaps,
                               # Changes, Interview Prep, Export
  lib/
    ai/
      client.ts                # Anthropic client + JSON call helper
      pipeline.ts              # two-call analyze → tailor orchestration
    prompts/                   # one file per AI concern (see below)
    parse/extract.ts           # PDF/DOCX/TXT/MD text extraction
    export/
      markdown.ts              # resume-markdown parser
      docx.ts                  # DOCX generation
      pdf.ts                   # PDF generation (pdf-lib)
    schemas.ts                 # zod request validation
    sanitize.ts                # text normalization
    types.ts                   # shared domain types
  data/sample.ts               # sample JD, resume, instruction
samples/                       # uploadable sample files
```

### AI prompts (one concern per file)

`src/lib/prompts/` keeps each prompt isolated and easy to tune:

- `guardrails.ts` — **the truthfulness guardrails** (always take priority)
- `instruction-analysis.ts` — interpret the user instruction
- `jd-analysis.ts` — analyze the job description
- `resume-analysis.ts` — parse and analyze the resume
- `match-scoring.ts` — score the current match
- `tailoring.ts` — rewrite the resume + bullet-enhancement rules
- `truthfulness.ts` — validate output against the original resume
- `interview.ts` — interview talking points + post-tailoring score
- `export-format.ts` — export-safe formatting contract
- `index.ts` — composes the above into two pipeline calls

The pipeline runs **two** Claude calls (analysis, then tailoring+validation) to
balance quality against latency and cost, while keeping every concern in its own
prompt file.

---

## 🔒 Truthfulness & privacy

- **No fabrication.** The system may rewrite, restructure, and reprioritize, but
  it must not invent jobs, degrees, certifications, dates, companies, metrics,
  tools, or achievements. If a metric doesn't exist, it uses truthful qualitative
  language instead.
- **Guardrails win.** If an instruction would require an unsupported claim, the
  app does the truthful version and explains the ethical alternative.
- **Session-based.** Resumes are processed in memory and are not persisted. A
  privacy note is shown in the UI. Uploaded files are validated and size-limited,
  and extracted text is sanitized before processing.

---

## ⚠️ Notes & limitations

- Scanned/image-only PDFs contain no selectable text — the app will ask you to
  paste the text manually (no OCR is bundled).
- AI output is probabilistic. Always review the tailored resume and the
  **Potentially Unsupported Claims** section before submitting anywhere.
- Match scores are directional estimates to guide tailoring, not guarantees of
  how a specific ATS will score you.

---

## 📄 License

Provided as-is for demonstration and personal use.
