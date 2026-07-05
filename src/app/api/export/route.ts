import { NextRequest, NextResponse } from "next/server";
import { exportRequestSchema } from "@/lib/schemas";
import { generateDocx } from "@/lib/export/docx";
import { generatePdf } from "@/lib/export/pdf";
import { blocksToPlainText, parseResumeMarkdown } from "@/lib/export/markdown";

export const runtime = "nodejs";
export const maxDuration = 60;

function safeName(name: string): string {
  return (
    name
      .trim()
      .replace(/[^a-z0-9\-_ ]/gi, "")
      .replace(/\s+/g, "-")
      .slice(0, 80) || "tailored-resume"
  );
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = exportRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  const { content, format, filename } = parsed.data;
  const base = safeName(filename);

  try {
    let bytes: Buffer | Uint8Array;
    let contentType: string;
    let ext: string;

    switch (format) {
      case "docx":
        bytes = await generateDocx(content);
        contentType =
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        ext = "docx";
        break;
      case "pdf":
        bytes = await generatePdf(content);
        contentType = "application/pdf";
        ext = "pdf";
        break;
      case "md":
        bytes = Buffer.from(content, "utf8");
        contentType = "text/markdown; charset=utf-8";
        ext = "md";
        break;
      case "txt":
      default:
        bytes = Buffer.from(
          blocksToPlainText(parseResumeMarkdown(content)),
          "utf8"
        );
        contentType = "text/plain; charset=utf-8";
        ext = "txt";
        break;
    }

    // Copy into a plain Uint8Array, which is a valid BodyInit for NextResponse.
    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${base}.${ext}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[export] error:", err);
    return NextResponse.json(
      { error: "Failed to generate the export file." },
      { status: 500 }
    );
  }
}
