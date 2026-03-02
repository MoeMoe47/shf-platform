import fs from "node:fs";
import path from "node:path";
import { executiveSection } from "./sections/executive.js";
import { technicalSection } from "./sections/technical.js";

export function buildHtml({ mode, data }) {
  const tplPath = path.resolve("src/templates/institutional-minimal.html");
  const tpl = fs.readFileSync(tplPath, "utf8");

  const bodyHtml = mode === "technical"
    ? technicalSection(data)
    : executiveSection(data);

  const now = new Date();
  const reportDate = data.reportDate || now.toISOString().slice(0,10);
  const reportId = data.reportId || `SHF-ALLOC-${now.toISOString().replace(/[-:]/g,"").slice(0,13)}`;

  // Prefer embedded SHF report mark (portable PDF). Falls back to data.logoUrl if provided.
  const embeddedLogoUrl = (() => {
    try {
      const b64Path = path.resolve(process.cwd(), "assets/shf-report-mark.b64");
      const b64 = fs.readFileSync(b64Path, "utf8").trim();
      if (b64.length > 0) return `data:image/png;base64,${b64}`;
    } catch (e) {}
    return data.logoUrl || "";
  })();

  const html = tpl
    .replaceAll("{{title}}", data.title || "Franklin County Allocation Intelligence Report")
    .replaceAll("{{subtitle}}", data.subtitle || "Prepared for Franklin County Review")
    .replaceAll("{{productLine}}", data.productLine || "Allocation Intelligence • Decision Support Output")
    .replaceAll("{{methodologyVersion}}", data.methodologyVersion || "1.0")
    .replaceAll("{{reportDate}}", reportDate)
    .replaceAll("{{reportId}}", reportId)
    .replaceAll("{{logoUrl}}", embeddedLogoUrl)
    .replaceAll("{{bodyHtml}}", bodyHtml);

  return { html, reportId, reportDate };
}
