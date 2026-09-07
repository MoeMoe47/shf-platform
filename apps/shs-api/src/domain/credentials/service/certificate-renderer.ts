import { hashBytes } from "../../reporting/report-renderer.js";
import QRCode from "qrcode";
import { existsSync } from "node:fs";

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>\"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" } as any)[character]);
}

export type CertificatePresentation = {
  learnerDisplayName: string;
  certificateTitle: string;
  programName: string;
  issuer: string;
  accomplishment: string;
  issuedAt: string;
  certificateReference: string;
  competencies: string[];
  status: string;
  verificationReference: string;
  profileKey: string;
  profileVersion: string;
  verificationUrl?: string;
  qrSvg?: string;
};

export function certificateHtml(presentation: CertificatePresentation): string {
  const competencies = presentation.competencies.length
    ? `<ul class="competencies">${presentation.competencies.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(presentation.certificateTitle)}</title><style>
  @page{size:Letter landscape;margin:.45in}*{box-sizing:border-box}body{margin:0;background:#f5f7f7;color:#19262c;font-family:Arial,Helvetica,sans-serif}.certificate{min-height:7.6in;border:10px solid #1e5d63;background:#fff;padding:.56in .7in;position:relative;display:flex;flex-direction:column;align-items:center;text-align:center}.certificate:before{content:"";position:absolute;inset:18px;border:1px solid #d3a84b;pointer-events:none}.eyebrow{font-size:10pt;letter-spacing:.18em;text-transform:uppercase;color:#1e5d63;font-weight:700}.certificate h1{font-family:Georgia,serif;color:#1e5d63;font-size:28pt;margin:20px 0 8px}.learner{font-family:Georgia,serif;font-size:26pt;color:#142b31;border-bottom:2px solid #d3a84b;padding:0 24px 8px;margin:14px 0}.accomplishment{font-size:13pt;max-width:7.4in;line-height:1.5}.competencies{display:flex;gap:18px;list-style:none;padding:0;margin:10px 0}.competencies li{border:1px solid #d3a84b;padding:7px 12px;font-size:9pt}.meta{margin-top:auto;display:grid;grid-template-columns:1fr 1fr 1fr;gap:22px;width:80%;font-size:8.5pt;color:#53656a}.meta strong{display:block;color:#19262c;font-size:9pt}.verification{position:absolute;right:28px;bottom:25px;text-align:right;font-size:7.5pt;color:#53656a}.verification strong{display:block;color:#1e5d63}.issuer{margin-top:8px;font-weight:700;color:#1e5d63}@media print{body{background:#fff}.certificate{min-height:7.6in}}
  </style></head><body><main class="certificate"><div class="eyebrow">${escapeHtml(presentation.issuer)}</div><h1>${escapeHtml(presentation.certificateTitle)}</h1><div class="learner">${escapeHtml(presentation.learnerDisplayName)}</div><p class="accomplishment">${escapeHtml(presentation.accomplishment)}</p><div class="issuer">${escapeHtml(presentation.programName)}</div>${competencies}<div class="meta"><div><strong>Issued</strong>${escapeHtml(presentation.issuedAt)}</div><div><strong>Status</strong>${escapeHtml(presentation.status)}</div><div><strong>Certificate reference</strong>${escapeHtml(presentation.certificateReference)}</div></div><div class="verification">${presentation.qrSvg || ""}<strong>Verify</strong>${escapeHtml(presentation.verificationReference)}<br>${escapeHtml(presentation.verificationUrl)}<br>Profile ${escapeHtml(presentation.profileKey)} v${escapeHtml(presentation.profileVersion)}</div></main></body></html>`;
}

export async function renderCertificate(presentation: CertificatePresentation, format: "HTML" | "PDF") {
  const qrSvg = presentation.qrSvg || await QRCode.toString(presentation.verificationUrl || presentation.verificationReference, { type: "svg", margin: 1, width: 96, errorCorrectionLevel: "M" });
  const html = certificateHtml({ ...presentation, qrSvg });
  if (format === "HTML") {
    const bytes = Buffer.from(html, "utf8");
    return { bytes, mimeType: "text/html; charset=utf-8", hash: hashBytes(bytes), rendererVersion: "shu-certificate-1" };
  }
  const { chromium } = await import("playwright");
  const configuredExecutable = process.env.SHS_CHROMIUM_EXECUTABLE;
  const localMacExecutable = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  const browser = await chromium.launch({ headless: true, ...(configuredExecutable || existsSync(localMacExecutable) ? { executablePath: configuredExecutable || localMacExecutable } : {}) });
  try {
    const page = await browser.newPage({ javaScriptEnabled: false });
    await page.setContent(html, { waitUntil: "networkidle" });
    const bytes = Buffer.from(await page.pdf({ format: "Letter", landscape: true, printBackground: true, margin: { top: "0.45in", right: "0.45in", bottom: "0.45in", left: "0.45in" } }));
    return { bytes, mimeType: "application/pdf", hash: hashBytes(bytes), rendererVersion: "shu-certificate-1" };
  } finally { await browser.close(); }
}
