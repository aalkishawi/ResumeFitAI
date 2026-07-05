// ---------------------------------------------------------------------------
// Text sanitization helpers. Extracted document text can contain control
// characters, null bytes, and inconsistent whitespace that confuse both the
// AI model and the exporters. We normalize aggressively but non-destructively.
// ---------------------------------------------------------------------------

// C0 control chars + DEL, but preserving \t (\x09) and \n (\x0A).
const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
// Non-breaking and other unicode whitespace we fold to a normal space.
const UNICODE_SPACES = /[   -​  　﻿]/g;
// "Smart" punctuation normalized to ASCII for maximum ATS friendliness.
const SINGLE_QUOTES = /[‘’‚‛]/g;
const DOUBLE_QUOTES = /[“”„‟]/g;
const DASHES = /[–—]/g;
const ELLIPSIS = /…/g;
const BULLETS = /[•●▪◦⁃∙]/g;

/** Remove control characters (except tab/newline), normalize whitespace/quotes. */
export function sanitizeText(input: string): string {
  if (!input) return "";
  let text = input
    .replace(/\r\n?/g, "\n") // normalize line endings
    .replace(CONTROL_CHARS, "")
    .replace(SINGLE_QUOTES, "'")
    .replace(DOUBLE_QUOTES, '"')
    .replace(DASHES, "-")
    .replace(ELLIPSIS, "...")
    .replace(UNICODE_SPACES, " ")
    .replace(BULLETS, "-");

  // Collapse runs of spaces/tabs, trim trailing spaces per line.
  text = text
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").replace(/\s+$/g, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n") // collapse 3+ blank lines to 2
    .trim();

  return text;
}

/** Truncate very large inputs to keep prompt sizes reasonable. */
export function clampLength(input: string, maxChars = 24000): string {
  if (input.length <= maxChars) return input;
  return input.slice(0, maxChars) + "\n\n[...content truncated for length...]";
}
