import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { parseResumeMarkdown, type ResumeBlock } from "./markdown";

// ---------------------------------------------------------------------------
// PDF generation with pdf-lib (pure JS — no headless browser needed). We lay
// out a single-column, ATS-friendly document using the standard Helvetica
// fonts, wrapping text by measuring glyph widths and paginating as needed.
// ---------------------------------------------------------------------------

const PAGE_WIDTH = 612; // US Letter, points
const PAGE_HEIGHT = 792;
const MARGIN_X = 54;
const MARGIN_TOP = 54;
const MARGIN_BOTTOM = 54;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const ACCENT = rgb(0.094, 0.196, 0.882); // brand blue

interface Fonts {
  regular: PDFFont;
  bold: PDFFont;
}

class Layout {
  private doc: PDFDocument;
  private fonts: Fonts;
  private page: PDFPage;
  private y: number;

  constructor(doc: PDFDocument, fonts: Fonts) {
    this.doc = doc;
    this.fonts = fonts;
    this.page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.y = PAGE_HEIGHT - MARGIN_TOP;
  }

  private ensureSpace(height: number) {
    if (this.y - height < MARGIN_BOTTOM) {
      this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      this.y = PAGE_HEIGHT - MARGIN_TOP;
    }
  }

  private wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !current) {
        current = candidate;
      } else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
    return lines.length ? lines : [""];
  }

  private drawWrapped(
    text: string,
    opts: {
      font: PDFFont;
      size: number;
      indent?: number;
      lineGap?: number;
      color?: ReturnType<typeof rgb>;
      align?: "left" | "center";
      bulletMarker?: boolean;
    }
  ) {
    const indent = opts.indent ?? 0;
    const lineGap = opts.lineGap ?? 3;
    const color = opts.color ?? rgb(0.1, 0.12, 0.16);
    const lineHeight = opts.size + lineGap;
    const maxWidth = CONTENT_WIDTH - indent;
    const lines = this.wrap(text, opts.font, opts.size, maxWidth);

    lines.forEach((line, i) => {
      this.ensureSpace(lineHeight);
      let x = MARGIN_X + indent;
      if (opts.align === "center") {
        const w = opts.font.widthOfTextAtSize(line, opts.size);
        x = (PAGE_WIDTH - w) / 2;
      }
      if (opts.bulletMarker && i === 0) {
        this.page.drawText("•", {
          x: MARGIN_X + indent - 12,
          y: this.y - opts.size,
          size: opts.size,
          font: opts.font,
          color,
        });
      }
      this.page.drawText(line, {
        x,
        y: this.y - opts.size,
        size: opts.size,
        font: opts.font,
        color,
      });
      this.y -= lineHeight;
    });
  }

  private gap(amount: number) {
    this.y -= amount;
  }

  private rule() {
    this.ensureSpace(6);
    this.page.drawLine({
      start: { x: MARGIN_X, y: this.y },
      end: { x: PAGE_WIDTH - MARGIN_X, y: this.y },
      thickness: 0.75,
      color: rgb(0.7, 0.72, 0.78),
    });
    this.gap(6);
  }

  render(block: ResumeBlock) {
    switch (block.type) {
      case "name":
        this.drawWrapped(block.text, {
          font: this.fonts.bold,
          size: 20,
          align: "center",
          color: rgb(0.06, 0.09, 0.16),
        });
        this.gap(2);
        break;
      case "contact":
        this.drawWrapped(block.text, {
          font: this.fonts.regular,
          size: 9.5,
          align: "center",
          color: rgb(0.32, 0.36, 0.42),
        });
        this.gap(8);
        break;
      case "heading":
        this.gap(8);
        this.drawWrapped(block.text.toUpperCase(), {
          font: this.fonts.bold,
          size: 11.5,
          color: ACCENT,
        });
        this.gap(1);
        this.rule();
        break;
      case "bullet":
        this.drawWrapped(block.text, {
          font: this.fonts.regular,
          size: 10,
          indent: 16,
          bulletMarker: true,
        });
        this.gap(2);
        break;
      case "paragraph":
      default:
        this.drawWrapped(block.text, { font: this.fonts.regular, size: 10 });
        this.gap(4);
        break;
    }
  }
}

/** Build a PDF file (as a Buffer) from tailored resume Markdown. */
export async function generatePdf(markdown: string): Promise<Buffer> {
  const blocks = parseResumeMarkdown(markdown);
  const doc = await PDFDocument.create();
  doc.setTitle("Tailored Resume");
  doc.setCreator("ResumeFit AI");
  doc.setProducer("ResumeFit AI");

  const fonts: Fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
  };

  const layout = new Layout(doc, fonts);
  for (const block of blocks) layout.render(block);

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
