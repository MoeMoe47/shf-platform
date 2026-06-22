import { createNewReportVersion, lockExportedReport } from "./shsReportLifecycle";
import { getReportTypeDefinition } from "./shsReportRegistry";
import { buildDefaultReadiness } from "./shsReportReadiness";
import { shsReportSeedRecords } from "./shsReportSeedData";
import { SHS_PREMIUM_INTERIOR_TEMPLATE } from "./shsReportTemplates";

export const SHS_REPORT_RECORDS_KEY = "shs.reports.records.v1";
export const SHS_REPORT_DRAFT_KEY = "shs.reports.activeDraft.v1";
export const SHS_REPORT_TEMPLATES_KEY = "shs.reports.templates.v1";
export const SHS_REPORT_BRANDING_KEY = "shs.reports.branding.v1";
export const SHS_REPORT_HISTORY_KEY = "shs.reports.history.v1";
export const SHS_REPORT_EXPORTS_KEY = "shs.reports.exports.v1";

function canUseStorage() {
  return typeof window !== "undefined" && window.localStorage;
}

function readJson(key, fallback) {
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getReportRecords() {
  const records = readJson(SHS_REPORT_RECORDS_KEY, null);
  if (Array.isArray(records) && records.length) return records;
  return [...shsReportSeedRecords];
}

export function saveReportRecords(records) {
  writeJson(SHS_REPORT_RECORDS_KEY, records);
  return records;
}

export function getReportHistory() {
  const records = getReportRecords();
  const storedHistory = readJson(SHS_REPORT_HISTORY_KEY, []);
  return [...records, ...storedHistory].filter(Boolean);
}

export function createReportRecord(input = {}) {
  const definition = getReportTypeDefinition(input.reportType || "premium-os-report-book");
  const timestamp = Date.now();
  const report = {
    id: `report-${definition.id}-${timestamp}`,
    reportId: `SHS-${definition.id.toUpperCase()}-${timestamp}`,
    title: input.title || definition.displayName,
    reportType: definition.id,
    brandMode: input.brandMode || definition.supportedBrandModes[0],
    subjectType: input.subjectType || definition.allowedSubjectTypes[0],
    subjectId: input.subjectId || "",
    subjectName: input.subjectName || "Missing",
    lifecycleStatus: "draft",
    visibility: input.visibility || definition.defaultVisibility,
    dataMode: "draft",
    generatedBy: "Silicon Heartland OS",
    preparedBy: "Silicon Heartland Solutions",
    generatedDate: new Date().toISOString().slice(0, 10),
    reportingPeriodLabel: input.reportingPeriodLabel || "Missing",
    reportVersion: "v1",
    templateVersion: definition.templateVersion || SHS_PREMIUM_INTERIOR_TEMPLATE.version,
    pageCount: definition.id === "premium-os-report-book" ? 24 : 8,
    readiness: input.readiness || buildDefaultReadiness(definition.id),
    sections: definition.requiredSections.map((section) => ({
      id: section,
      title: section.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
      dataStatus: "draft",
      requiredSources: definition.requiredDataSources,
      isRequired: true,
      visibilitySafe: true,
    })),
    missingDataWarnings: [],
    auditExceptions: [],
    exportMetadata: {
      exportFormat: "pdf",
      exportVersion: "v1",
      exportLocked: false,
      printInstruction: SHS_PREMIUM_INTERIOR_TEMPLATE.printInstruction,
    },
    isLocked: false,
  };

  const records = [report, ...getReportRecords()];
  saveReportRecords(records);
  writeJson(SHS_REPORT_DRAFT_KEY, report);
  return report;
}

export function updateDraftReport(reportId, patch = {}) {
  const records = getReportRecords();
  const next = records.map((report) => {
    if (report.reportId !== reportId && report.id !== reportId) return report;
    if (report.isLocked || report.lifecycleStatus === "exported") return report;
    return { ...report, ...patch };
  });
  saveReportRecords(next);
  const updated = next.find((report) => report.reportId === reportId || report.id === reportId);
  if (updated) writeJson(SHS_REPORT_DRAFT_KEY, updated);
  return updated || null;
}

export function lockReportExport(reportId, exportMetadata = {}) {
  const records = getReportRecords();
  let locked = null;
  const next = records.map((report) => {
    if (report.reportId !== reportId && report.id !== reportId) return report;
    locked = lockExportedReport(report, exportMetadata);
    return locked;
  });
  saveReportRecords(next);
  if (locked) {
    const exports = readJson(SHS_REPORT_EXPORTS_KEY, []);
    writeJson(SHS_REPORT_EXPORTS_KEY, [locked, ...exports]);
  }
  return locked;
}

export function createReportVersion(reportId) {
  const records = getReportRecords();
  const source = records.find((report) => report.reportId === reportId || report.id === reportId);
  if (!source) return null;
  const version = createNewReportVersion(source);
  saveReportRecords([version, ...records]);
  writeJson(SHS_REPORT_DRAFT_KEY, version);
  return version;
}
