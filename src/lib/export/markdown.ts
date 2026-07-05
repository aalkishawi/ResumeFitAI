// ---------------------------------------------------------------------------
// A tiny, purpose-built Markdown parser for the tailored resume. The tailoring
// prompt constrains output to a small subset of Markdown (name line, contact
// line, ## headings, - bullets, **bold**), so we only need to recognize those.
// Both the DOCX and PDF exporters consume these blocks.
// ---------------------------------------------------------------------------

export type ResumeBlock =
  | { type: "name"; text: string }
  | { type: "contact"; text: string }
  | { type: "heading"; text: string }
  | { type: "bullet"; text: string }
  | { type: "paragraph"; text: string };

/** Remove inline Markdown emphasis markers for clean, ATS-safe plain text. */
export function stripInline(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/(^|[^*])\*(?!\*)([^*]+)\*/g, "$1$2")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .trim();
}

export function parseResumeMarkdown(markdown: string): ResumeBlock[] {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ResumeBlock[] = [];
  let seenName = false;
  let seenContact = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Headings: '#', '##', '###' ...
    const headingMatch = line.match(/^#{1,6}\s+(.*)$/);
    if (headingMatch) {
      blocks.push({ type: "heading", text: stripInline(headingMatch[1]) });
      seenContact = true; // once a heading appears, the header block is done
      continue;
    }

    // Bullets: '-', '*', '+' followed by a space.
    const bulletMatch = line.match(/^[-*+]\s+(.*)$/);
    if (bulletMatch) {
      blocks.push({ type: "bullet", text: stripInline(bulletMatch[1]) });
      seenContact = true;
      continue;
    }

    const clean = stripInline(line);
    if (!seenName) {
      blocks.push({ type: "name", text: clean });
      seenName = true;
      continue;
    }
    if (!seenContact) {
      blocks.push({ type: "contact", text: clean });
      seenContact = true;
      continue;
    }
    blocks.push({ type: "paragraph", text: clean });
  }

  return blocks;
}

/** Render blocks back to clean plain text (for TXT export). */
export function blocksToPlainText(blocks: ResumeBlock[]): string {
  const out: string[] = [];
  for (const b of blocks) {
    switch (b.type) {
      case "name":
        out.push(b.text.toUpperCase(), "");
        break;
      case "contact":
        out.push(b.text, "");
        break;
      case "heading":
        out.push("", b.text.toUpperCase(), "");
        break;
      case "bullet":
        out.push(`- ${b.text}`);
        break;
      case "paragraph":
        out.push(b.text, "");
        break;
    }
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}
