import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { REPORT_FORMATS } from "./report-template-registry.js";

function escapeHtml(value: any) {
  return String(value ?? "").replace(/[&<>\"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
}

function stableJson(value: any) { return JSON.stringify(value); }

export function hashBytes(bytes: Buffer) { return createHash("sha256").update(bytes).digest("hex"); }

function cell(value: any) { return `<td>${escapeHtml(value)}</td>`; }

function table(headers: string[], rows: any[][], empty = "No canonical records are available for this section.") {
  if (!rows.length) return `<p class="empty">${escapeHtml(empty)}</p>`;
  return `<div class="table-wrap"><table><thead><tr>${headers.map((header) => `<th scope="col">${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map(cell).join("")}</tr>`).join("")}</tbody></table></div>`;
}

function list(items: any[], empty = "No canonical records are available.") {
  return items?.length ? `<ul class="reference-list">${items.map((item) => `<li><strong>${escapeHtml(item.type)}</strong> <span>${escapeHtml(item.id)}</span>${item.label && item.label !== item.id ? ` — ${escapeHtml(item.label)}` : ""}</li>`).join("")}</ul>` : `<p class="empty">${escapeHtml(empty)}</p>`;
}

function ohioMotif() {
  return `<svg class="ohio-motif" viewBox="0 0 120 150" role="img" aria-label="Abstract Ohio-inspired civic outline"><path d="M48 8 74 17l-5 19 18 8-4 18 18 16-10 12 6 25-18 6-11 30-18-7-6-22-20-4 4-22-12-15 16-12 2-19 17-10z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M20 111c24 7 47 8 75-4" fill="none" stroke="currentColor" stroke-width="2" opacity=".45"/></svg>`;
}

function section(title: string, body: string, options: { pageBreak?: boolean } = {}) {
  return `<section class="report-section${options.pageBreak ? " page-break" : ""}"><h2>${escapeHtml(title)}</h2>${body}</section>`;
}

function executiveHtml(immutablePayload: any, template: any) {
  const p = immutablePayload.presentation || {};
  const scorecardRows = (p.scorecard || []).map((item: any) => [item.label, item.value, item.state]);
  const fundingRows = (p.funding?.rows || []).map((item: any) => [item.reference, item.program, item.provider, item.type, item.amount, item.status]);
  const programRows = (p.programs || []).map((item: any) => [item.reference, item.name, item.status, item.providers, item.issues]);
  const providerRows = (p.providers || []).map((item: any) => [item.reference, item.name, item.status, item.findings, item.actions]);
  const outcomeRows = (p.verifiedOutcomes || []).map((item: any) => [item.reference, item.subject, item.type, item.value, item.level]);
  const attentionRows = (p.attention || []).map((item: any) => [item.type, item.reference, item.status, item.detail]);
  const findingRows = (p.findings || []).map((item: any) => [item.reference, item.status, item.severity, item.owner, item.action]);
  const sourceRows = (p.sourceHealth || []).map((item: any) => [item.source, item.authority, item.freshness, item.status]);
  const decisionRows = (p.decisionsRequired || []).map((item: any) => [item.reference, item.subject, item.status, item.detail]);
  const activityRows = (p.activity || []).map((item: any) => [item.type, item.reference, item.status]);
  const metadata = p.metadata || {};
  const classification = p.classification || metadata.classification || "INTERNAL";
  const title = p.reportTitle || "Executive Assurance Report";
  const period = p.reportingPeriod || "Reporting period not specified";
  const jurisdiction = p.jurisdiction || "Jurisdiction not specified";
  const body = [
    section("Executive Summary", `<div class="summary-grid">${[["What was funded?", p.summary?.funded], ["What was delivered?", p.summary?.delivered], ["What has been verified?", p.summary?.verified], ["What requires attention?", p.summary?.attention], ["What decisions are required?", p.summary?.decisions]].map(([label, value]) => `<div class="summary-item"><h3>${escapeHtml(label)}</h3><p>${escapeHtml(value)}</p></div>`).join("")}</div>`),
    section("Assurance Scorecard", table(["Dimension", "Value", "State"], scorecardRows)),
    section("Funding Assurance", `<div class="flow">${(p.funding?.totals || []).map((item: any) => `<div><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.value)}</strong></div>`).join("<span class=\"flow-arrow\" aria-hidden=\"true\">→</span>")}</div>${table(["Reference", "Program", "Provider", "Record type", "Amount", "Status"], fundingRows)}`),
    section("Program Assurance", table(["Program", "Name", "Status", "Providers", "Issues"], programRows)),
    section("Provider Assurance", table(["Provider", "Name", "Status", "Open findings", "Overdue actions"], providerRows)),
    section("Verified Outcomes", `<p class="section-intro">Only accepted canonical facts in the immutable reporting snapshot are presented as Verified Outcomes.</p>${table(["Reference", "Subject", "Outcome type", "Value", "Verification level"], outcomeRows)}`),
    section("Items Requiring Attention", table(["Type", "Reference", "Status", "Detail"], attentionRows, "No canonical attention items are reported.")),
    section("Findings and Corrective Actions", table(["Finding", "Status", "Severity", "Owner", "Corrective action"], findingRows, "No canonical findings are reported.")),
    section("Data Quality and Source Health", table(["Source", "Authoritative source", "Freshness", "Lifecycle"], sourceRows, "No source-health detail is available in this snapshot.")),
    section("Decisions Required", table(["Reference", "Subject", "Status", "Detail"], decisionRows, "No canonical decisions requiring review are reported.")),
    section("Assurance Activity", table(["Activity", "Reference", "Status"], activityRows, "No recent assurance activity is reported.")),
    section("Methodology", `<dl class="methodology">${Object.entries(p.methodology || {}).map(([key, value]) => `<div><dt>${escapeHtml(String(key).replaceAll("_", " "))}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl>`),
    section("Evidence and Lineage Appendix", `<p class="section-intro">This evidence index preserves inspectable canonical references without exposing raw restricted source payloads.</p>${list(p.references, "No canonical references were supplied.")}`, { pageBreak: true }),
    section("Generation Metadata", `<dl class="metadata-grid">${Object.entries(metadata).map(([key, value]) => `<div><dt>${escapeHtml(String(key).replaceAll("_", " "))}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl>`),
  ].join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(p.product || "CivicSure")} — ${escapeHtml(title)}</title><style>${executiveStyles()}</style></head><body data-template-version="${escapeHtml(template.templateVersion)}"><div class="preview-header">CivicSure | Executive Assurance Report | ${escapeHtml(classification)}</div><main class="report"><header class="cover"><div class="brand"><span class="wordmark">${escapeHtml(p.product || "CivicSure")}</span><span class="brand-line">Government Program Assurance</span></div><div class="cover-motif">${ohioMotif()}</div><p class="eyebrow">${escapeHtml(p.category || "Government Program Assurance Infrastructure")}</p><h1>${escapeHtml(title)}</h1><p class="promise">Public Dollar <span>→</span> Verified Outcome</p><dl class="cover-meta"><div><dt>Jurisdiction</dt><dd>${escapeHtml(jurisdiction)}</dd></div><div><dt>Reporting period</dt><dd>${escapeHtml(period)}</dd></div><div><dt>Generated</dt><dd>${escapeHtml(p.generatedAt)}</dd></div><div><dt>Report version</dt><dd>${escapeHtml(p.reportVersion)}</dd></div></dl><div class="classification-mark">${escapeHtml(classification)}</div><p class="attribution">Prepared by Silicon Heartland</p></header>${body}<footer class="end-note">CivicSure — Government Program Assurance Platform · ${escapeHtml(classification)}</footer></main><div class="preview-footer">${escapeHtml(classification)} | CivicSure report preview</div></body></html>`;
}

function r3Html(immutablePayload: any, template: any) {
  const p = immutablePayload.presentation || {};
  const reportType = immutablePayload.reportType || immutablePayload.metadata?.reportType || "REPORT";
  const classification = p.classification || immutablePayload.metadata?.classification || "INTERNAL";
  const fundingRows = (p.funding || []).map((item: any) => [item.reference, item.source, item.program, item.provider, item.type, item.amount, item.status]);
  const attentionRows = (p.attention || []).map((item: any) => [item.type, item.reference, item.subject, item.status, item.severity, item.detail]);
  const outcomeRows = (p.verifiedOutcomes || []).map((item: any) => [item.reference, item.subject, item.outcome, item.value, item.level, item.status]);
  const issueRows = (p.findings || []).map((item: any) => [item.finding_id || item.reference, item.status, item.severity, item.program_reference || item.provider_reference || "Not specified", item.description || item.summary || "Canonical finding"]);
  const sourceRows = (p.sources || []).map((item: any) => [item.source_system_id || item.reference || "Source", item.authority || "Not specified", item.current_freshness_state || item.health || "Not specified", statusText(item.status)]);
  const referenceList = list(p.references, "No canonical references were supplied.");
  let subjectSection = "";
  if (reportType === "PROGRAM_ASSURANCE") {
    subjectSection = [
      section("Program Overview", table(["Program", "Status", "Funding", "Providers"], [[p.program?.reference, p.program?.status, p.program?.funding, p.program?.providers]])),
      section("Assurance Summary", table(["Dimension", "Value"], [["Funding", p.program?.funding], ["Providers", p.program?.providers], ["Claims", p.claims?.length || 0], ["Metrics", p.metrics?.length || 0], ["Verified Outcomes", p.verifiedOutcomes?.length || 0], ["Items Requiring Attention", p.attention?.length || 0]])),
      section("Funding", table(["Reference", "Source", "Program", "Provider", "Type", "Amount", "Status"], fundingRows)),
      section("Providers", table(["Provider", "Status", "Funding"], (p.providers || []).map((item: any) => [item.reference, item.status, item.funding]))),
      section("Monitoring and Corrective Action", table(["Record", "Status", "Owner"], (p.correctiveActions || []).map((item: any) => [item.corrective_action_id || item.reference, item.status, item.owner || item.assigned_to || "Not specified"]))),
      section("Audit", table(["Engagement", "Status"], (p.audits || []).map((item: any) => [item.audit_engagement_id || item.reference, item.status || "In scope"]))),
    ].join("");
  } else if (reportType === "PROVIDER_ASSURANCE") {
    subjectSection = [
      section("Provider Overview", table(["Provider", "Status", "Programs", "Funding Exposure"], [[p.provider?.reference, p.provider?.status, p.provider?.programs, p.provider?.fundingExposure]])),
      section("Assurance Summary", table(["Dimension", "Value"], [["Funding Exposure", p.provider?.fundingExposure], ["Programs", p.provider?.programs], ["Verified Outcomes", p.verifiedOutcomes?.length || 0], ["Findings", p.findings?.length || 0], ["Corrective Actions", p.correctiveActions?.length || 0]])),
      section("Program Participation", table(["Program"], (p.programs || []).map((item: any) => [item]))),
      section("Funding Exposure", table(["Reference", "Source", "Program", "Provider", "Type", "Amount", "Status"], fundingRows)),
      section("Findings", table(["Finding", "Status", "Severity", "Program", "Detail"], issueRows, "No canonical findings are reported.")),
      section("Corrective Actions", table(["Action", "Status", "Owner", "Due date"], (p.correctiveActions || []).map((item: any) => [item.corrective_action_id || item.reference, item.status, item.owner || item.assigned_to || "Not specified", item.due_date || item.dueDate || "Not specified"]), "No canonical corrective actions are reported.")),
      section("Privacy Boundary", "<p class=\"section-intro\">Restricted Investigation details and protected participant data are excluded from this report.</p>"),
    ].join("");
  } else {
    subjectSection = [
      section("Funding Overview", table(["Reference", "Source", "Program", "Provider", "Type", "Amount", "Status"], fundingRows)),
      section("Funding Flow", table(["From", "Stage", "To", "Relationship", "Amount"], (p.stages || []).map((item: any) => [item.from, `${item.fromType} to ${item.toType}`, item.to, item.relationship, item.amount]), "No canonical lineage edges were supplied in this snapshot.")),
      section("Program Distribution", table(["Program"], (p.programs || []).map((item: any) => [item]))),
      section("Provider Distribution", table(["Provider"], (p.providers || []).map((item: any) => [item]))),
      section("Verified Outcomes", table(["Reference", "Subject", "Outcome", "Value", "Verification level", "Status"], outcomeRows, "No accepted verified outcomes are linked to this funding scope.")),
      section("Lineage Gaps", table(["Gap"], (p.lineageGaps || []).map((item: any) => [item]), "No canonical lineage gaps are reported.")),
    ].join("");
  }
  const title = p.reportTitle || "CivicSure Report";
  const body = [
    section("Scope and Assurance Summary", `<div class="summary-grid">${[["Subject", p.subjectLabel], ["Jurisdiction", p.jurisdiction], ["Reporting period", p.reportingPeriod], ["Classification", classification], ["Canonical references", p.references?.length || 0], ["Verified outcomes", p.verifiedOutcomes?.length || 0]].map(([label, value]) => `<div class="summary-item"><h3>${escapeHtml(label)}</h3><p>${escapeHtml(value)}</p></div>`).join("")}</div>`),
    subjectSection,
    section("Items Requiring Attention", table(["Type", "Reference", "Subject", "Status", "Severity", "Detail"], attentionRows, "No canonical items require attention.")),
    section("Data Quality and Source Health", table(["Source", "Authoritative source", "Freshness", "Status"], sourceRows, "No source-health detail is available in this snapshot.")),
    section("Methodology", `<dl class="methodology"><div><dt>Scope</dt><dd>This report presents the authorized canonical records included in the immutable reporting snapshot.</dd></div><div><dt>Lineage</dt><dd>Missing links are shown as incomplete; the report does not infer causality or create official facts.</dd></div><div><dt>Privacy</dt><dd>Restricted records are excluded according to organization, tenant, classification, and Public Disclosure controls.</dd></div></dl>`),
    section("Evidence and Lineage Appendix", `<p class="section-intro">Canonical references are listed for inspection without exposing raw restricted payloads.</p>${referenceList}`, { pageBreak: true }),
    section("Generation Metadata", `<dl class="metadata-grid">${Object.entries(p.metadata || {}).map(([key, value]) => `<div><dt>${escapeHtml(String(key).replaceAll("_", " "))}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl>`),
  ].join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CivicSure — ${escapeHtml(title)}</title><style>${executiveStyles()}</style></head><body data-template-version="${escapeHtml(template.templateVersion)}"><div class="preview-header">CivicSure | ${escapeHtml(title)} | ${escapeHtml(classification)}</div><main class="report"><header class="cover"><div class="brand"><span class="wordmark">CivicSure</span><span class="brand-line">Government Program Assurance</span></div><div class="cover-motif">${ohioMotif()}</div><p class="eyebrow">Government Program Assurance Infrastructure</p><h1>${escapeHtml(title)}</h1><p class="promise">${escapeHtml(p.subjectLabel || "Canonical assurance report")}</p><dl class="cover-meta"><div><dt>Jurisdiction</dt><dd>${escapeHtml(p.jurisdiction)}</dd></div><div><dt>Reporting period</dt><dd>${escapeHtml(p.reportingPeriod)}</dd></div><div><dt>Generated</dt><dd>${escapeHtml(p.generatedAt)}</dd></div><div><dt>Report version</dt><dd>${escapeHtml(p.reportVersion)}</dd></div></dl><div class="classification-mark">${escapeHtml(classification)}</div><p class="attribution">Prepared by Silicon Heartland</p></header>${body}<footer class="end-note">CivicSure — Government Program Assurance Platform · ${escapeHtml(classification)}</footer></main><div class="preview-footer">${escapeHtml(classification)} | CivicSure report preview</div></body></html>`;
}

function universalHtml(immutablePayload: any, template: any) {
  const p = immutablePayload.presentation || {};
  const metadata = p.metadata || immutablePayload.metadata || {};
  const brand = p.brand || {};
  const classification = p.classification || immutablePayload.metadata?.classification || "INTERNAL";
  const title = p.reportTitle || immutablePayload.metadata?.reportType || "SHU Report";
  const summary = Object.entries(p.summary || {}).map(([label, value]) => `<div class="summary-item"><h3>${escapeHtml(String(label).replaceAll("_", " "))}</h3><p>${escapeHtml(value)}</p></div>`).join("");
  const sections = (p.sections || []).map((item: any) => {
    const tables = (item.tables || []).map((tableSpec: any) => table(tableSpec.headers || [], tableSpec.rows || [], tableSpec.empty)).join("");
    const notes = (item.notes || []).map((note: any) => `<p class="section-intro">${escapeHtml(note)}</p>`).join("");
    return section(item.title || "Report Section", `${notes}${tables}`);
  }).join("");
  const references = list(p.references || immutablePayload.metadata?.canonicalReferences || [], "No canonical references were supplied.");
  const metadataBlock = `<dl class="metadata-grid">${Object.entries(metadata).map(([key, value]) => `<div><dt>${escapeHtml(String(key).replaceAll("_", " "))}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl>`;
  const body = [
    section("Summary", `<div class="summary-grid">${summary || `<div class="summary-item"><h3>Status</h3><p>Deterministic report projection</p></div>`}</div>`),
    sections,
    section("Methodology", `<dl class="methodology">${Object.entries(p.methodology || {}).map(([key, value]) => `<div><dt>${escapeHtml(String(key).replaceAll("_", " "))}</dt><dd>${escapeHtml(value)}</dd></div>`).join("") || "<div><dt>Scope</dt><dd>Authorized product records captured in the immutable report snapshot.</dd></div>"}</dl>`),
    section("Evidence and Canonical References", `<p class="section-intro">This index identifies source records without exposing protected source payloads.</p>${references}`, { pageBreak: true }),
    section("Generation Metadata", metadataBlock),
  ].join("");
  const subtitle = brand.subtitle || brand.displayName || "Shared Reporting";
  const header = brand.headerLabel || brand.shortName || brand.displayName || "SHU";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(header)} — ${escapeHtml(title)}</title><style>${executiveStyles()}</style></head><body data-template-version="${escapeHtml(template.templateVersion)}"><div class="preview-header">${escapeHtml(header)} | ${escapeHtml(title)} | ${escapeHtml(classification)}</div><main class="report"><header class="cover"><div class="brand"><span class="wordmark">${escapeHtml(brand.displayName || header)}</span><span class="brand-line">${escapeHtml(subtitle)}</span></div><p class="eyebrow">${escapeHtml(brand.category || "Product Report")}</p><h1>${escapeHtml(title)}</h1><p class="promise">${escapeHtml(p.subjectLabel || "Authorized product report")}</p><dl class="cover-meta"><div><dt>Subject</dt><dd>${escapeHtml(p.subjectLabel || "Not specified")}</dd></div><div><dt>Reporting period</dt><dd>${escapeHtml(p.reportingPeriod || "Not specified")}</dd></div><div><dt>Generated</dt><dd>${escapeHtml(p.generatedAt || immutablePayload.metadata?.generatedAt || "Not specified")}</dd></div><div><dt>Report version</dt><dd>${escapeHtml(p.reportVersion || immutablePayload.reportVersion || 1)}</dd></div></dl><div class="classification-mark">${escapeHtml(classification)}</div><p class="attribution">${escapeHtml(brand.attribution || "Silicon Heartland")}</p></header>${body}<footer class="end-note">${escapeHtml(header)} · ${escapeHtml(classification)}</footer></main><div class="preview-footer">${escapeHtml(classification)} | ${escapeHtml(header)} report preview</div></body></html>`;
}

function statusText(value: any) { return String(value || "Not specified").replaceAll("_", " "); }

function executiveStyles() {
  return `:root{--navy:#17324d;--dark:#10263a;--slate:#596a78;--ivory:#f7f5f0;--paper:#fff;--charcoal:#20252b;--blue:#eaf0f5;--red:#a43d3d;--border:#d6dde2}*{box-sizing:border-box}html{background:var(--ivory)}body{margin:0;background:var(--ivory);color:var(--charcoal);font-family:Arial,Helvetica,sans-serif;font-size:10.5pt;line-height:1.45}.preview-header,.preview-footer{max-width:8.5in;margin:0 auto;padding:8px 18px;color:var(--slate);font-size:8pt;background:var(--paper);text-align:center}.preview-footer{border-top:1px solid var(--border)}.report{max-width:8.5in;margin:0 auto;background:var(--paper);min-height:11in}.cover{min-height:9.55in;padding:.78in .78in .55in;position:relative;background:var(--ivory);border-bottom:8px solid var(--navy);overflow:hidden}.brand{display:flex;flex-direction:column;gap:3px;position:relative;z-index:1}.wordmark{font-size:25pt;font-weight:800;letter-spacing:.01em;color:var(--navy)}.brand-line{font-size:10pt;text-transform:uppercase;letter-spacing:.12em;color:var(--slate)}.eyebrow{text-transform:uppercase;letter-spacing:.14em;color:var(--red);font-weight:700;margin:1.2in 0 12px;font-size:9pt}.cover h1{font-family:Georgia,"Times New Roman",serif;color:var(--navy);font-size:31pt;line-height:1.08;max-width:5.6in;margin:0 0 20px}.promise{font-family:Georgia,"Times New Roman",serif;color:var(--slate);font-size:14pt}.promise span{color:var(--red);padding:0 6px}.cover-motif{position:absolute;right:.55in;top:.55in;color:var(--red);opacity:.22}.ohio-motif{width:1.35in;height:1.7in}.cover-meta{position:absolute;left:.78in;bottom:1.15in;display:grid;grid-template-columns:1fr 1fr;gap:14px 34px;margin:0;width:5.3in}.cover-meta dt,.metadata-grid dt,.methodology dt{font-size:8pt;text-transform:uppercase;letter-spacing:.08em;color:var(--slate);font-weight:700}.cover-meta dd,.metadata-grid dd{margin:3px 0 0;font-weight:700}.classification-mark{position:absolute;right:.78in;bottom:1.15in;border:1px solid var(--navy);color:var(--navy);padding:6px 9px;font-size:8pt;font-weight:800;letter-spacing:.08em}.attribution{position:absolute;bottom:.55in;left:.78in;color:var(--slate);font-size:8.5pt}.report-section{padding:.36in .78in 0;break-inside:avoid}.report-section.page-break{break-before:page}.report-section h2{font-family:Georgia,"Times New Roman",serif;color:var(--navy);font-size:18pt;margin:0 0 13px;padding-bottom:6px;border-bottom:2px solid var(--red)}.section-intro{color:var(--slate);margin-top:-4px}.summary-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.summary-item{background:var(--blue);border-left:4px solid var(--navy);padding:11px 13px;break-inside:avoid}.summary-item h3{font-size:9pt;text-transform:uppercase;letter-spacing:.06em;color:var(--slate);margin:0 0 5px}.summary-item p{margin:0;font-weight:700}.table-wrap{overflow:visible}table{width:100%;border-collapse:collapse;font-size:8.5pt;margin:7px 0 4px;break-inside:auto}thead{display:table-header-group}tr{break-inside:avoid;break-after:auto}th{text-align:left;background:var(--navy);color:white;padding:7px 6px;font-size:7.5pt;text-transform:uppercase;letter-spacing:.04em}td{border-bottom:1px solid var(--border);padding:6px;vertical-align:top}tbody tr:nth-child(even){background:#fbfcfd}.empty{color:var(--slate);font-style:italic}.flow{display:flex;align-items:stretch;gap:5px;margin:10px 0 18px}.flow>div{flex:1;border:1px solid var(--border);padding:10px 8px;background:var(--blue)}.flow span{display:block;color:var(--slate);font-size:8pt;text-transform:uppercase;font-weight:700}.flow strong{display:block;color:var(--navy);font-size:13pt;margin-top:4px}.flow-arrow{align-self:center;color:var(--red);font-size:15pt}.reference-list{columns:2;margin:0;padding-left:22px;font-size:8.5pt}.reference-list li{break-inside:avoid;margin:4px 0}.methodology,.metadata-grid{margin:0}.methodology div{display:grid;grid-template-columns:1.5in 1fr;gap:14px;border-bottom:1px solid var(--border);padding:7px 0}.methodology dd{margin:0}.metadata-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 18px}.metadata-grid div{border-bottom:1px solid var(--border);padding:7px 0}.metadata-grid dd{margin:3px 0 0;overflow-wrap:anywhere}.end-note{margin:.45in .78in;padding-top:10px;border-top:1px solid var(--border);color:var(--slate);font-size:8pt;text-align:center}@media print{@page{size:Letter;margin:.62in .55in .65in}.preview-header,.preview-footer{display:none}.report{max-width:none;margin:0}.cover{min-height:9.4in}.report-section{padding-top:.3in}.end-note{display:none}}@media(max-width:700px){.cover{min-height:760px;padding:36px 28px}.cover h1{font-size:26pt}.cover-meta{position:static;width:auto;margin-top:80px;grid-template-columns:1fr}.classification-mark{position:static;display:inline-block;margin-top:24px}.attribution{position:static;margin-top:40px}.report-section{padding-left:28px;padding-right:28px}.summary-grid{grid-template-columns:1fr}.flow{display:grid;grid-template-columns:1fr}.flow-arrow{display:none}.reference-list{columns:1}.table-wrap{overflow-x:auto}table{min-width:620px}}`;
}

export class CivicSureRenderAdapter {
  constructor(public rendererVersion = "civicsure-r2-renderer-1") {}

  render({ immutablePayload, template, format }: any) {
    const normalized = String(format || "JSON").toUpperCase();
    if (!template.supportedFormats.includes(normalized)) throw new Error("REPORT_FORMAT_NOT_SUPPORTED_BY_TEMPLATE");
    if (normalized === REPORT_FORMATS.PDF) throw new Error("REPORT_PDF_REQUIRES_R2_ASYNC_RENDER");
    if (normalized === REPORT_FORMATS.JSON) {
      const bytes = Buffer.from(stableJson(immutablePayload), "utf8");
      return { bytes, mimeType: "application/json", byteLength: bytes.length, hash: hashBytes(bytes), rendererVersion: this.rendererVersion };
    }
    const html = template.rendererIdentifier === "civicsure-r2"
      ? executiveHtml(immutablePayload, template)
      : template.rendererIdentifier === "civicsure-r3"
        ? r3Html(immutablePayload, template)
        : template.rendererIdentifier === "shu-universal-r1"
          ? universalHtml(immutablePayload, template)
      : `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(immutablePayload.metadata?.reportType || immutablePayload.reportType || "CivicSure Report")}</title></head><body><h1>CivicSure — ${escapeHtml(immutablePayload.metadata?.reportType || immutablePayload.reportType || "Report")}</h1><pre>${escapeHtml(JSON.stringify(immutablePayload.payload || {}, null, 2))}</pre></body></html>`;
    const bytes = Buffer.from(html, "utf8");
    return { bytes, mimeType: "text/html; charset=utf-8", byteLength: bytes.length, hash: hashBytes(bytes), rendererVersion: this.rendererVersion };
  }

  async renderPdf({ immutablePayload, template }: any) {
    if (!template.supportedFormats.includes(REPORT_FORMATS.PDF)) throw new Error("REPORT_FORMAT_NOT_SUPPORTED_BY_TEMPLATE");
    if (!["civicsure-r2", "civicsure-r3", "shu-universal-r1"].includes(template.rendererIdentifier)) throw new Error("REPORT_PDF_TEMPLATE_NOT_SUPPORTED");
    const htmlOutput = this.render({ immutablePayload, template, format: REPORT_FORMATS.HTML });
    const { chromium } = await import("playwright");
    const configuredExecutable = process.env.SHS_CHROMIUM_EXECUTABLE;
    const localMacExecutable = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    const browser = await chromium.launch({ headless: true, ...(configuredExecutable || existsSync(localMacExecutable) ? { executablePath: configuredExecutable || localMacExecutable } : {}) });
    try {
      const page = await browser.newPage({ javaScriptEnabled: false });
      await page.setContent(htmlOutput.bytes.toString("utf8"), { waitUntil: "networkidle" });
      const classification = escapeHtml(immutablePayload.presentation?.classification || immutablePayload.metadata?.classification || "INTERNAL");
      const reportTitle = escapeHtml(immutablePayload.presentation?.reportTitle || "CivicSure Report");
      const pdfBytes = await page.pdf({
        format: "Letter",
        printBackground: true,
        displayHeaderFooter: true,
        margin: { top: "0.65in", right: "0.55in", bottom: "0.68in", left: "0.55in" },
        headerTemplate: `<div style="width:100%;font:8px Arial;color:#596a78;padding:0 0.55in">${escapeHtml(immutablePayload.presentation?.brand?.headerLabel || immutablePayload.metadata?.product || "SHU")} | ${reportTitle} | ${classification}</div>`,
        footerTemplate: `<div style="width:100%;font:8px Arial;color:#596a78;text-align:center">${classification} | <span class="pageNumber"></span> of <span class="totalPages"></span></div>`,
      });
      const bytes = Buffer.from(pdfBytes);
      return { bytes, mimeType: "application/pdf", byteLength: bytes.length, hash: hashBytes(bytes), rendererVersion: this.rendererVersion };
    } finally {
      await browser.close();
    }
  }
}
