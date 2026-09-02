// SHF Lesson + Assignment + Curriculum — Phase 4.6: Raw Document
// Extraction, Structure Detection, and Draft Curriculum Transformation.
//
// Server-side only (Step 4) — never invoked from browser code. Dispatches
// by the AcceptedSourceType Phase 1's own upload validation already
// established (PDF/DOCX/TXT/MARKDOWN); no second file-type taxonomy is
// introduced.
//
// Every parser here returns the SAME canonical ExtractedDocument shape
// (Step 9) regardless of source format, so structure detection
// (document-structure-service.ts) has one input contract to reason
// about, not four.
import { createHash } from "node:crypto";

export type ExtractedBlockType = "HEADING" | "PARAGRAPH" | "LIST_ITEM";

export interface ExtractedBlock {
  blockId: string;         // deterministic "b0", "b1", ... — stable as long as extraction of the same bytes is deterministic (it is)
  sequence: number;
  type: ExtractedBlockType;
  headingLevel?: number;   // 1-6, HEADING only
  text: string;
  pageNumber?: number;     // PDF only (Step 5, Step 23)
  href?: string;           // DOCX/Markdown only — an inline hyperlink found in this block (Step 32)
}

export interface ExtractedDocument {
  sourceType: "PDF" | "DOCX" | "TXT" | "MARKDOWN";
  title: string | null;
  blocks: ExtractedBlock[];
  pageCount: number | null;
  extractorVersion: string;
  warnings: string[];
}

export class ExtractionError extends Error {
  constructor(public code: string, message: string) { super(message); this.name = "ExtractionError"; }
}

// Step 13: a scanned/image PDF has real pages but effectively no
// extractable text. This is thrown, never silently returned as a
// "successful" empty extraction (Step 12's "do not silently claim
// success when no text is extracted").
export class OcrRequiredError extends Error {
  constructor(message: string) { super(message); this.name = "OcrRequiredError"; }
}

// Deliberately NOT module-level mutable state (a prior version used a
// shared `let blockSeq` — a real, observed race: concurrent extraction
// requests interleaving at await boundaries corrupted each other's block
// numbering, non-deterministically). Each extraction call owns its own
// counter via this local class instance instead.
class BlockBuilder {
  private seq = 0;
  readonly blocks: ExtractedBlock[] = [];
  push(block: Omit<ExtractedBlock, "blockId" | "sequence">) {
    this.blocks.push({ ...block, blockId: `b${this.seq}`, sequence: this.seq });
    this.seq += 1;
  }
}

// ---------------- PDF ----------------

const HEADING_PATTERNS: Array<{ re: RegExp; level: number }> = [
  { re: /^\s*(chapter)\s+\d+\b/i, level: 1 },
  { re: /^\s*(unit)\s+\d+\b/i, level: 2 },
  { re: /^\s*(lesson)\s+\d+\b/i, level: 3 },
  { re: /^\s*\d+\.\d+\s+\S/, level: 3 },   // "3.2 Something" — numbered subsection
  { re: /^\s*\d+\s+[A-Z]\S*/, level: 2 },  // bare numbered heading, e.g. "3 Advanced Topics" — lower-confidence signal, structure service downgrades it
];

function classifyLine(line: string): { level: number } | null {
  for (const { re, level } of HEADING_PATTERNS) {
    if (re.test(line.trim())) return { level };
  }
  return null;
}

async function extractPdf(buffer: Buffer): Promise<ExtractedDocument> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  let result;
  try {
    result = await parser.getText();
  } finally {
    await parser.destroy().catch(() => undefined);
  }

  const totalChars = result.pages.reduce((sum: number, p: { text: string }) => sum + p.text.replace(/\s+/g, "").length, 0);
  if (result.total > 0 && totalChars < result.total * 10) {
    throw new OcrRequiredError(`extracted only ${totalChars} non-whitespace characters across ${result.total} page(s) — this appears to be a scanned/image-based PDF`);
  }

  // pdf.js's per-page text join does not reliably reproduce blank-line
  // paragraph gaps (a heading and its very next body line are typically
  // just consecutive "\n"-joined lines, not "\n\n"-separated) — so
  // headings are detected per LINE, not per blank-line-delimited
  // paragraph. Consecutive non-heading lines are merged into one running
  // paragraph until a heading line or a genuine blank line ends it.
  const blockBuilder = new BlockBuilder();
  const warnings: string[] = [];
  for (const page of result.pages) {
    const lines = page.text.split("\n").map((l: string) => l.trim());
    let paragraphLines: string[] = [];
    const flushParagraph = () => {
      const text = paragraphLines.join(" ").trim();
      if (text) blockBuilder.push({ type: "PARAGRAPH", text, pageNumber: page.num });
      paragraphLines = [];
    };
    for (const line of lines) {
      if (!line) { flushParagraph(); continue; }
      const heading = classifyLine(line);
      if (heading) {
        flushParagraph();
        blockBuilder.push({ type: "HEADING", headingLevel: heading.level, text: line, pageNumber: page.num });
      } else {
        paragraphLines.push(line);
      }
    }
    flushParagraph();
  }
  if (!blockBuilder.blocks.length) warnings.push("no paragraph blocks were extracted despite non-trivial text content");

  return { sourceType: "PDF", title: null, blocks: blockBuilder.blocks, pageCount: result.total, extractorVersion: "pdf-parse@2.4.5", warnings };
}

// ---------------- DOCX ----------------

async function extractDocx(buffer: Buffer): Promise<ExtractedDocument> {
  const mammoth = (await import("mammoth")).default;
  const result = await mammoth.convertToHtml({ buffer });
  const html: string = result.value;
  const warnings = (result.messages || []).map((m: { message: string }) => m.message);

  const blockBuilder = new BlockBuilder();
  const tagPattern = /<(h[1-6]|p|li)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;
  let title: string | null = null;
  while ((match = tagPattern.exec(html))) {
    const tag = match[1].toLowerCase();
    const inner = match[2];
    const hrefMatch = /<a\s+[^>]*href="([^"]+)"/i.exec(inner);
    const text = inner.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
    if (!text) continue;
    if (tag === "li") {
      blockBuilder.push({ type: "LIST_ITEM", text, href: hrefMatch?.[1] });
    } else if (/^h[1-6]$/.test(tag)) {
      const level = Number(tag[1]);
      if (title === null && level === 1) title = text;
      blockBuilder.push({ type: "HEADING", headingLevel: level, text, href: hrefMatch?.[1] });
    } else {
      blockBuilder.push({ type: "PARAGRAPH", text, href: hrefMatch?.[1] });
    }
  }
  if (!blockBuilder.blocks.length) warnings.push("no headings/paragraphs/list items were found in the converted document");

  return { sourceType: "DOCX", title, blocks: blockBuilder.blocks, pageCount: null, extractorVersion: "mammoth@1.12.2", warnings };
}

// ---------------- Markdown ----------------

function extractMarkdown(buffer: Buffer): ExtractedDocument {
  const text = buffer.toString("utf8").replace(/\r\n/g, "\n");
  const lines = text.split("\n");
  const blockBuilder = new BlockBuilder();
  const warnings: string[] = [];
  let title: string | null = null;
  let paragraphLines: string[] = [];
  let inCodeFence = false;
  let codeFenceLines: string[] = [];

  const flushParagraph = () => {
    const joined = paragraphLines.join(" ").trim();
    if (joined) {
      const hrefMatch = /\[[^\]]*\]\(([^)]+)\)/.exec(joined);
      blockBuilder.push({ type: "PARAGRAPH", text: joined, href: hrefMatch?.[1] });
    }
    paragraphLines = [];
  };

  for (const rawLine of lines) {
    const line = rawLine;
    if (/^```/.test(line.trim())) {
      if (inCodeFence) {
        blockBuilder.push({ type: "PARAGRAPH", text: codeFenceLines.join("\n") });
        codeFenceLines = [];
        inCodeFence = false;
      } else {
        flushParagraph();
        inCodeFence = true;
      }
      continue;
    }
    if (inCodeFence) { codeFenceLines.push(line); continue; }

    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(line);
    const listMatch = /^\s*[-*+]\s+(.*)$/.exec(line);
    if (headingMatch) {
      flushParagraph();
      const level = headingMatch[1].length;
      const headingText = headingMatch[2].trim();
      if (title === null && level === 1) title = headingText;
      blockBuilder.push({ type: "HEADING", headingLevel: level, text: headingText });
    } else if (listMatch) {
      flushParagraph();
      const itemText = listMatch[1].trim();
      const hrefMatch = /\[[^\]]*\]\(([^)]+)\)/.exec(itemText);
      blockBuilder.push({ type: "LIST_ITEM", text: itemText, href: hrefMatch?.[1] });
    } else if (line.trim() === "") {
      flushParagraph();
    } else {
      paragraphLines.push(line.trim());
    }
  }
  flushParagraph();
  if (!blockBuilder.blocks.length) warnings.push("no headings/paragraphs/list items were found in the Markdown source");

  return { sourceType: "MARKDOWN", title, blocks: blockBuilder.blocks, pageCount: null, extractorVersion: "shf-markdown-blocks@1", warnings };
}

// ---------------- TXT ----------------

function extractTxt(buffer: Buffer): ExtractedDocument {
  // Honest fallback (Step 8): plain text carries no heading signal at
  // all — every block is a PARAGRAPH, never guessed into a heading.
  const text = buffer.toString("utf8").replace(/\r\n/g, "\n");
  const paragraphs = text.split(/\n{2,}/).map((p) => p.replace(/\n/g, " ").trim()).filter(Boolean);
  const blockBuilder = new BlockBuilder();
  for (const para of paragraphs) blockBuilder.push({ type: "PARAGRAPH", text: para });
  const warnings = blockBuilder.blocks.length ? [] : ["no paragraph blocks were extracted from this text file"];
  return { sourceType: "TXT", title: null, blocks: blockBuilder.blocks, pageCount: null, extractorVersion: "shf-txt-blocks@1", warnings };
}

// ---------------- Dispatch ----------------

export async function extractDocument(sourceType: "PDF" | "DOCX" | "TXT" | "MARKDOWN", buffer: Buffer): Promise<ExtractedDocument> {
  switch (sourceType) {
    case "PDF": return extractPdf(buffer);
    case "DOCX": return extractDocx(buffer);
    case "MARKDOWN": return extractMarkdown(buffer);
    case "TXT": return extractTxt(buffer);
    default: throw new ExtractionError("UNSUPPORTED_SOURCE_TYPE", `no extractor exists for source type "${sourceType}"`);
  }
}

export function canonicalExtractionHash(doc: ExtractedDocument): string {
  const canonical = JSON.stringify(doc.blocks.map((b) => ({ t: b.type, h: b.headingLevel ?? null, x: b.text, p: b.pageNumber ?? null })));
  return createHash("sha256").update(canonical).digest("hex");
}
