import { existsSync } from "node:fs";
import { hashBytes } from "../../reporting/report-renderer.js";

export type DocumentationRenderInput = {
  title: string;
  documentType: string;
  templateVersion: string;
  organizationId: string;
  serviceKey?: string | null;
  classification: string;
  structuredData: Record<string, unknown>;
};

export type DocumentationRenderResult = {
  bytes: Buffer;
  mimeType: string;
  format: "HTML" | "PDF";
  hash: string;
  rendererId: string;
  rendererVersion: string;
  accessibility: { semanticHtml: true; labels: true; taggedPdf: boolean };
};

// Reporting owns the repository-wide artifact hash primitive; DGAL reuses it
// so document and report references use the same integrity semantics.
export function hashDocumentationBytes(bytes: Buffer) { return hashBytes(bytes); }

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>\"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character] as string));
}

function rows(data: Record<string, unknown>) {
  return Object.entries(data).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `<tr><th scope="row">${escapeHtml(key.replaceAll("_", " "))}</th><td>${escapeHtml(typeof value === "object" ? JSON.stringify(value) : value)}</td></tr>`).join("");
}

export class DocumentationRenderer {
  constructor(public readonly rendererId = "dgal-html", public readonly rendererVersion = "dgal-html-1") {}

  renderHtml(input: DocumentationRenderInput): DocumentationRenderResult {
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(input.title)}</title><style>body{font-family:Arial,sans-serif;color:#172b2d;line-height:1.5;max-width:8.5in;margin:0 auto;padding:2rem}header{border-bottom:3px solid #176b70;margin-bottom:2rem}h1{font-size:2rem}dl{display:grid;grid-template-columns:11rem 1fr;gap:.4rem 1rem}dt{font-weight:700}table{width:100%;border-collapse:collapse}th,td{text-align:left;border-bottom:1px solid #d7e0e1;padding:.6rem}@media print{body{padding:0}}@media(max-width:40rem){dl{display:block}dt{margin-top:.75rem}}</style></head><body><header><p>${escapeHtml(input.classification)} · ${escapeHtml(input.documentType)}</p><h1>${escapeHtml(input.title)}</h1><dl><dt>Organization</dt><dd>${escapeHtml(input.organizationId)}</dd><dt>Service</dt><dd>${escapeHtml(input.serviceKey || "Not specified")}</dd><dt>Template version</dt><dd>${escapeHtml(input.templateVersion)}</dd></dl></header><main><h2>Document data</h2><table><tbody>${rows(input.structuredData)}</tbody></table></main></body></html>`;
    const bytes = Buffer.from(html, "utf8");
    return { bytes, mimeType: "text/html; charset=utf-8", format: "HTML", hash: hashDocumentationBytes(bytes), rendererId: this.rendererId, rendererVersion: this.rendererVersion, accessibility: { semanticHtml: true, labels: true, taggedPdf: false } };
  }

  async renderPdf(input: DocumentationRenderInput): Promise<DocumentationRenderResult> {
    const html = this.renderHtml(input);
    const { chromium } = await import("playwright");
    const configuredExecutable = process.env.SHS_CHROMIUM_EXECUTABLE;
    const localMacExecutable = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    const browser = await chromium.launch({ headless: true, ...(configuredExecutable || existsSync(localMacExecutable) ? { executablePath: configuredExecutable || localMacExecutable } : {}) });
    try {
      const page = await browser.newPage({ javaScriptEnabled: false });
      await page.setContent(html.bytes.toString("utf8"), { waitUntil: "networkidle" });
      const pdf = Buffer.from(await page.pdf({ format: "Letter", printBackground: true, displayHeaderFooter: false }));
      return { ...html, bytes: pdf, mimeType: "application/pdf", format: "PDF", hash: hashDocumentationBytes(pdf), accessibility: { ...html.accessibility, taggedPdf: false } };
    } finally { await browser.close(); }
  }
}
