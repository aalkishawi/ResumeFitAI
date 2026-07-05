import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { parseResumeMarkdown, type ResumeBlock } from "./markdown";

// ---------------------------------------------------------------------------
// DOCX generation. We deliberately keep the layout single-column, heading +
// bullet based, with a common ATS-safe font (Calibri) and no tables, text
// boxes, images, or columns — so applicant tracking systems parse it cleanly.
// ---------------------------------------------------------------------------

const FONT = "Calibri";

function blockToParagraph(block: ResumeBlock): Paragraph {
  switch (block.type) {
    case "name":
      return new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [
          new TextRun({ text: block.text, bold: true, size: 32, font: FONT }),
        ],
      });
    case "contact":
      return new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 160 },
        children: [new TextRun({ text: block.text, size: 20, font: FONT })],
      });
    case "heading":
      return new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 80 },
        border: {
          bottom: { color: "888888", size: 6, space: 2, style: "single" },
        },
        children: [
          new TextRun({
            text: block.text.toUpperCase(),
            bold: true,
            size: 24,
            font: FONT,
            color: "1832E1",
          }),
        ],
      });
    case "bullet":
      return new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: block.text, size: 21, font: FONT })],
      });
    case "paragraph":
    default:
      return new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: block.text, size: 21, font: FONT })],
      });
  }
}

/** Build a DOCX file (as a Buffer) from tailored resume Markdown. */
export async function generateDocx(markdown: string): Promise<Buffer> {
  const blocks = parseResumeMarkdown(markdown);
  const doc = new Document({
    creator: "ResumeFit AI",
    title: "Tailored Resume",
    styles: {
      default: {
        document: { run: { font: FONT, size: 21 } },
      },
    },
    sections: [
      {
        properties: {
          page: { margin: { top: 720, bottom: 720, left: 900, right: 900 } },
        },
        children: blocks.map(blockToParagraph),
      },
    ],
  });

  return Packer.toBuffer(doc);
}
