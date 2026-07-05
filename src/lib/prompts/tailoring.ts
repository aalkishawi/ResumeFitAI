// Prompt fragment: rewrite the resume + bullet enhancement rules.
export const TAILORING_PROMPT = `## Task: Resume Tailoring Engine

Produce a tailored, ATS-friendly resume in the "tailoredResume" field as clean
Markdown. Follow these rules:

Structure & formatting:
- Use simple Markdown only: a top line with the candidate name, contact details,
  '##' section headings, and '-' bullet points. No tables, columns, text boxes,
  images, icons, or multi-column layouts (unless the user explicitly requested a
  non-ATS creative format).
- Recommended section order: Name/Contact, Professional Summary, Core Skills,
  Professional Experience, Projects (if any), Education, Certifications.
- Keep it clean and readable. Respect any length request (one-page ≈ 450-550
  words; two-page ≈ 800-1000 words) by prioritizing the most relevant content.

Content:
- Write a strong ATS-friendly professional summary tuned to the JD and the
  user's instruction.
- Reorder skills so the most JD-relevant skills come first. Only include skills
  present in or clearly supported by the original resume.
- Rewrite work experience bullets with strong action verbs, prioritizing
  achievements that match the JD responsibilities.
- Weave in JD keywords NATURALLY, but only where the original resume supports
  them.
- Remove or de-emphasize content irrelevant to the JD.
- Adjust tone, length, and emphasis based on the user's instruction.

Bullet enhancement formula:
  Action verb + task/initiative + tools/process + measurable OR qualitative outcome.
- If the original resume has a metric, keep it. If it does NOT, do not invent
  one — use truthful qualitative impact language instead.

Also return:
- changes: array of { section, change, rationale } describing the key edits you
  made and why.
- keywordGaps: array of { keyword, status, suggestion } where status is
  "present", "underused", or "missing", covering the most important JD keywords.
- missingSkillSuggestions: real skills/certifications the candidate may want to
  LEARN to close remaining gaps (clearly framed as suggestions to acquire, never
  added to the resume).`;
