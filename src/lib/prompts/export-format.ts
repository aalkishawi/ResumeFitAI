// Prompt fragment: formatting rules so the resume Markdown exports cleanly to
// DOCX/PDF and stays ATS-parseable.
export const EXPORT_FORMAT_PROMPT = `## Formatting contract for downstream export

The "tailoredResume" Markdown will be converted directly to DOCX/PDF/TXT, so it
must be export-safe:
- First line: the candidate's full name only.
- Second line: a single contact line separated by " | " (email, phone,
  location, LinkedIn) — only details present in the original resume.
- Use '## Heading' for each section. Use '- ' for every bullet. Use '**bold**'
  sparingly for role titles/companies. No other Markdown constructs (no tables,
  no images, no HTML, no code fences, no blockquotes).
- Keep bullets to one or two lines each. Use consistent spacing.`;
