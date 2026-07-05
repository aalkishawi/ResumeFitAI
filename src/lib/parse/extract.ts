import mammoth from "mammoth";
import { sanitizeText } from "@/lib/sanitize";

// ---------------------------------------------------------------------------
// File text extraction for PDF, DOCX, TXT, and Markdown. All parsing runs
// server-side (Node runtime). We validate the extension, extract raw text, and
// sanitize it before returning.
// ---------------------------------------------------------------------------

export const SUPPORTED_EXTENSIONS = ["pdf", "docx", "txt", "md", "markdown"] as const;
export type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number];

export class UnsupportedFileError extends Error {
  constructor(ext: string) {
    super(
      `Unsupported file type ".${ext}". Please upload a PDF, DOCX, TXT, or Markdown file.`
    );
    this.name = "UnsupportedFileError";
  }
}

export class UnreadableFileError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = "UnreadableFileError";
  }
}

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot === -1) return "";
  return filename.slice(dot + 1).toLowerCase();
}

export function isSupportedExtension(ext: string): ext is SupportedExtension {
  return (SUPPORTED_EXTENSIONS as readonly string[]).includes(ext);
}

/**
 * pdf-parse ships a debug harness in its index.js that tries to read a bundled
 * test PDF at import time. Importing the library entry point directly avoids it.
 */
async function extractPdf(buffer: Buffer): Promise<string> {
  const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default as (
    data: Buffer
  ) => Promise<{ text: string }>;
  const result = await pdfParse(buffer);
  return result.text || "";
}

async function extractDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value || "";
}

export interface ExtractOutput {
  text: string;
  warnings: string[];
}

/** Extract sanitized text from a supported file buffer. */
export async function extractTextFromFile(
  buffer: Buffer,
  filename: string
): Promise<ExtractOutput> {
  const ext = getExtension(filename);
  if (!isSupportedExtension(ext)) throw new UnsupportedFileError(ext || "unknown");

  const warnings: string[] = [];
  let raw = "";

  try {
    switch (ext) {
      case "pdf":
        raw = await extractPdf(buffer);
        break;
      case "docx":
        raw = await extractDocx(buffer);
        break;
      case "txt":
      case "md":
      case "markdown":
        raw = buffer.toString("utf8");
        break;
    }
  } catch (err) {
    throw new UnreadableFileError(
      `Could not read "${filename}". The file may be corrupted, password-protected, or image-only. Details: ${
        err instanceof Error ? err.message : "unknown error"
      }`
    );
  }

  const text = sanitizeText(raw);

  if (text.trim().length === 0) {
    // Common for scanned/image-only PDFs that contain no selectable text.
    throw new UnreadableFileError(
      `No readable text found in "${filename}". If this is a scanned PDF/image, please paste the text manually.`
    );
  }

  if (ext === "pdf" && text.length < 120) {
    warnings.push(
      "This PDF produced very little text — if it is a scanned/image PDF, consider pasting the text manually."
    );
  }

  return { text, warnings };
}
