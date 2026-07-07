// ---------------------------------------------------------------------------
// Deterministic ATS-risk signals from resume text (no AI). These are fed to the
// ATS checker prompt as hints so the model grounds its assessment in concrete
// findings. Extracted text loses some layout, so this is a best-effort prefilter.
// ---------------------------------------------------------------------------

export function atsSignals(text: string): string[] {
  const s: string[] = [];

  if (/\t/.test(text)) {
    s.push("Tab characters detected — may indicate a table or multi-column layout.");
  }
  const pipes = (text.match(/\|/g) || []).length;
  if (pipes > 3) {
    s.push(`Pipe characters (${pipes}) detected — possible table formatting ATS can misread.`);
  }
  if (/[^\x00-\x7F]/.test(text)) {
    s.push("Non-ASCII characters/symbols detected — some ATS strip or garble special glyphs/icons.");
  }
  if (/ {3,}/.test(text)) {
    s.push("Runs of 3+ spaces detected — often a sign of column layouts that ATS read out of order.");
  }
  const longLines = text.split(/\n/).filter((l) => l.length > 200).length;
  if (longLines > 0) {
    s.push(`${longLines} very long line(s) — may be merged multi-column text.`);
  }
  if (!/\b(experience|work history|employment)\b/i.test(text)) {
    s.push("No clear 'Experience' section heading found.");
  }
  if (!/\b(education)\b/i.test(text)) {
    s.push("No clear 'Education' section heading found.");
  }
  if (!/\b(skills)\b/i.test(text)) {
    s.push("No clear 'Skills' section heading found.");
  }
  if (!/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/.test(text)) {
    s.push("No email address detected in the text.");
  }
  return s;
}
