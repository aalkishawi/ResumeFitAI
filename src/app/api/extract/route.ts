import { NextRequest, NextResponse } from "next/server";
import {
  UnreadableFileError,
  UnsupportedFileError,
  extractTextFromFile,
} from "@/lib/parse/extract";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_MB = Number(process.env.RESUMEFIT_MAX_FILE_MB || 8);
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected a multipart/form-data upload." },
      { status: 400 }
    );
  }

  const file = form.get("file");
  const kindRaw = String(form.get("kind") || "resume");
  const kind = kindRaw === "jd" ? "jd" : "resume";

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
  }

  const uploaded = file as File;

  if (uploaded.size === 0) {
    return NextResponse.json({ error: "The uploaded file is empty." }, { status: 400 });
  }
  if (uploaded.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: `File is too large. Maximum size is ${MAX_FILE_MB} MB.` },
      { status: 413 }
    );
  }

  try {
    const buffer = Buffer.from(await uploaded.arrayBuffer());
    const { text, warnings } = await extractTextFromFile(buffer, uploaded.name);
    return NextResponse.json({
      filename: uploaded.name,
      kind,
      text,
      charCount: text.length,
      warnings,
    });
  } catch (err) {
    if (err instanceof UnsupportedFileError || err instanceof UnreadableFileError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    console.error("[extract] error:", err);
    return NextResponse.json(
      { error: "Failed to extract text from the file." },
      { status: 500 }
    );
  }
}
