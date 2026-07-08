# ResumeFit AI — Deliverables & Operations Guide

This document summarizes the transformation of ResumeFit AI from an expensive
single-provider prototype into a cost-optimized, subscription-ready SaaS, and is
the operational reference for configuring, running, testing, and launching it.

- **Branch:** `feature/enhancements`
- **Stable checkpoint:** tag `v1.0-stable` (pre-transformation working version)
- **Repo:** github.com/aalkishawi/ResumeFitAI

---

## 1. Summary of what was changed

| Stage | Delivered |
|---|---|
| Cost core | Multi-provider AI abstraction, model routing by cost tier, cost/token tracking, response cache |
| S1 | Database foundation (Prisma + SQLite, Postgres-ready) with the full domain model |
| S2 | Authentication (Auth.js v5) — Google + email/password |
| S3 | Plans, credits, and usage-limit enforcement (tailoring now requires sign-in) |
| S4 | Stripe billing — subscriptions + credit packs, webhooks, billing portal |
| S5 | Revenue features — cover letter, interview coach, LinkedIn optimizer, recruiter review, ATS checker |
| S6 | Premium UI/UX — landing page, light/dark theme toggle, admin dashboard, job tracker, history |
| S7 | Trust & compliance — privacy toggle, data deletion, privacy/terms/ethics pages |
| S8 | Vitest test suite (36 tests) + multi-level sample dataset |

Key correctness fixes along the way: removed oversized Structured-Outputs schemas
(grammar-limit 400), and made resume output robust (raw markdown between sentinels
instead of embedding a large document inside a JSON string).

---

## 2. Architecture at a glance

- **Framework:** Next.js 16 (App Router), React 19, TypeScript, Tailwind (class-based dark mode).
- **AI layer** (`src/lib/ai/`): a provider interface (`providers/`) with an Anthropic
  adapter and one OpenAI-compatible adapter that covers OpenAI, Gemini, Groq, Ollama,
  and vLLM. A **router** (`router.ts`) maps each pipeline stage to a cost tier; a
  **cost** module tracks tokens/USD; a **cache** module deduplicates identical runs.
- **Parsing** (`src/lib/parse/`): deterministic (pdf-parse, mammoth) — no AI.
- **Data** (`prisma/`, `src/lib/db/`): Prisma + SQLite by default; one datasource line
  switches to Postgres.
- **Auth** (`src/auth.ts`, `src/lib/auth/`): NextAuth v5 + Prisma adapter, JWT sessions.
- **Billing** (`src/lib/billing/`, `src/app/api/billing/`): Stripe (optional).
- **Admin** (`src/app/admin/`): cost/usage analytics, routing, flags.

---

## 3. Environment variables

Copy `.env.example` to `.env.local` (or `.env`) and fill in what you use. Nothing
here is required except a provider key + `AUTH_SECRET` + `DATABASE_URL`.

### AI provider & routing
| Var | Purpose |
|---|---|
| `AI_PROVIDER` | `anthropic` \| `openai` \| `gemini` \| `groq` \| `ollama` \| `vllm` (cloud tiers) |
| `ECONOMY_MODEL` / `BALANCED_MODEL` / `PREMIUM_MODEL` / `LOCAL_MODEL` | Model per cost tier |
| `DEFAULT_MODEL` / `RESUMEFIT_MODEL` | Legacy aliases for the balanced/Anthropic default |
| `ANTHROPIC_API_KEY` | Anthropic key |
| `OPENAI_API_KEY` / `OPENAI_BASE_URL` | OpenAI (or compatible) |
| `GEMINI_API_KEY` / `GEMINI_BASE_URL` | Google Gemini (OpenAI-compatible endpoint) |
| `GROQ_API_KEY` / `GROQ_BASE_URL` | Groq |
| `OLLAMA_BASE_URL` | Local Ollama (e.g. `http://localhost:11434`) |
| `VLLM_BASE_URL` / `VLLM_API_KEY` | Local/self-hosted vLLM |

### Cost controls & caching
`MAX_COST_PER_RUN`, `MAX_INPUT_TOKENS_PER_TASK`, `MAX_OUTPUT_TOKENS_PER_TASK`,
`ENABLE_COST_LOGGING`, `ENABLE_RESPONSE_CACHE`.

### Auth
`AUTH_SECRET` (required — generate with
`node -e "console.log(require('crypto').randomBytes(33).toString('base64'))"`),
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

### Database, admin, flags
`DATABASE_URL`, `ADMIN_EMAILS`, `ADMIN_TOKEN`, `ENABLE_TEST_UPGRADE`,
`FREE_PLAN_ENABLED`, `CREDIT_SYSTEM_ENABLED`, `SUBSCRIPTION_SYSTEM_ENABLED`,
`TEAM_PLAN_ENABLED`, `WHITE_LABEL_ENABLED`, `RESUMEFIT_MAX_FILE_MB`.

### Stripe (optional)
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_BASIC/PRO/PREMIUM/TEAM`,
`STRIPE_PRICE_CREDITS_SMALL/MEDIUM/LARGE`.

---

## 4. Provider configuration

**Anthropic (default)**
```
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
ECONOMY_MODEL=claude-haiku-4-5
BALANCED_MODEL=claude-sonnet-5
PREMIUM_MODEL=claude-opus-4-8
```

**Google Gemini**
```
AI_PROVIDER=gemini
GEMINI_API_KEY=...
ECONOMY_MODEL=gemini-2.0-flash
BALANCED_MODEL=gemini-1.5-pro
```

**Groq**
```
AI_PROVIDER=groq
GROQ_API_KEY=...
ECONOMY_MODEL=llama-3.1-8b-instant
BALANCED_MODEL=llama-3.3-70b-versatile
```

**Ollama (local)** — run `ollama serve`, then in the app pick **Local** mode:
```
OLLAMA_BASE_URL=http://localhost:11434
LOCAL_MODEL=llama3.1
```

**vLLM (self-hosted, OpenAI-compatible)** — pick **Local** mode:
```
VLLM_BASE_URL=http://your-host:8000/v1
VLLM_API_KEY=not-needed
LOCAL_MODEL=<served-model-id>
```

---

## 5. Run locally

```bash
npm install
npx prisma migrate deploy      # or: npm run db:migrate  (dev)
npm run db:seed                # seed the plan catalog
npm run dev                    # http://localhost:3000
```

> After any Prisma migration, **restart `npm run dev`** so it loads the freshly
> generated client.

Production: `npm run build` then `npm start`.

---

## 6. Testing

**Unit tests:** `npm test` (Vitest, 36 tests — routing, cost, cache, plans, credit
gates, ATS scan, JSON repair, sanitization, config).

**Model switching:** change `AI_PROVIDER` (and tier models), restart, tailor a resume,
and watch the **cost badge** on the results + `/admin` (cost-by-model). Or switch the
in-app **mode** selector (Economy/Balanced/Premium/Local) per run.

**DOCX/PDF export:** run a tailoring, open the **Export** tab, download DOCX/PDF/TXT/MD;
cover letters also export to DOCX/PDF from the Career Tools panel.

**Testing without paying (dev):** `ENABLE_TEST_UPGRADE` is on outside production.
Use **"Unlock all (test)"** on the results panel or `/billing → Testing tools`
(Unlock Premium / +100 credits / Reset to Free). Or set a user to `premium` in
`npm run db:studio`.

---

## 7. Cost-reduction strategy

Baseline before changes: ~**$0.075 / run** (both AI calls on a mid-tier model).

Levers now in place:
- **Model routing:** the analysis call runs on the cheap economy tier; only tailoring
  uses the balanced/premium model.
- **Deterministic parsing:** no AI tokens spent extracting text from files.
- **Response cache:** identical re-runs cost $0.
- **Per-mode control** and **local models** for near-zero marginal cost.

Estimated effect:
- **Balanced mode:** ~25–30% cheaper (quality unchanged for the rewrite).
- **Economy mode** (Haiku / Groq / Gemini Flash): ~60–70% cheaper.
- **Local mode:** ~$0 marginal.
- **Premium mode** (Opus) is a *paid* upsell — cost becomes revenue.

---

## 8. Recommended pricing model

Seeded in the plan catalog (`src/lib/config/plans.ts`):

| Plan | Price | Scans/mo | Highlights |
|---|---|---|---|
| Free | $0 | 3 | Tailoring + PDF export |
| Basic | $9 | 30 | + interview prep |
| Pro | $19 | 200 | + cover letter, LinkedIn, ATS checker, versions, job tracker, DOCX |
| Premium | $39 | Unlimited | + premium (Opus) model, executive mode, advanced interview, recruiter review |
| Team | $99 | Unlimited | + team admin, white-label, API access |

Credit packs (pay-per-use / top-ups): 20 / $5, 60 / $12, 150 / $25.
1 credit = 1 run; Premium mode = 3 credits. Given per-run cost of ~$0.02–0.07,
margins are healthy across every tier.

**B2B / white-label:** the data model already carries teams + per-tenant branding —
price these as custom enterprise deals (seats + branding + optional API).

---

## 9. Remaining work before launch

- **Stripe:** create products/prices, set keys + webhook secret, and test a full
  checkout (the 4 setup steps in `.env.example`).
- **Legal:** have counsel review/replace the `/privacy` and `/terms` templates.
- **Scale/persistence:** move the in-memory cost log + response cache to the DB or
  Redis for multi-instance deployments; switch `DATABASE_URL` to Postgres if scaling.
- **Auth hardening:** email verification + password reset; production `AUTH_URL` and
  Google OAuth redirect URIs; rate limiting / abuse protection.
- **Ops:** error monitoring, DB backups, and an E2E test pass (Playwright) over the
  sign-in → tailor → export → billing flow.
- **Accessibility & content:** a11y audit; testimonials and final marketing copy.

---

*Generated as the S9 deliverable. Pair this with `docs/ResumeFit-AI-Product-Brief.docx`
(business/positioning) and the product showcase page.*
