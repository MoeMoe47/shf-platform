import { shsReportSeedRecords } from "@/data/shsReports/shsReportSeedData";
import { SHS_PREMIUM_INTERIOR_TEMPLATE } from "@/data/shsReports/shsReportTemplates";
import {
  displayDataStatus,
  displayLifecycleStatus,
  displayVisibilityMode,
  normalizeReportStatus,
  safeReportText,
  SHS_REPORT_DATA_STATUSES,
} from "@/data/shsReports/shsReportTypes";
import { filterReportForVisibility } from "@/data/shsReports/shsReportVisibility";

export { SHS_PREMIUM_INTERIOR_TEMPLATE, SHS_REPORT_DATA_STATUSES };

const SYSTEM_HEALTH_LABELS = Object.freeze({
  excellent: "Excellent",
  good: "Good",
  watch: "Watch",
  "at-risk": "At Risk",
  blocked: "Blocked",
  missing: "Missing",
});

const AUDIT_STATUS_LABELS = Object.freeze({
  clear: "Clear",
  "minor-exceptions": "Minor Exceptions",
  "major-exceptions": "Major Exceptions",
  blocked: "Blocked",
  missing: "Missing",
});

export const shsPremiumReportSeeds = shsReportSeedRecords.filter(
  (report) => report.reportType === "premium-os-report-book"
);

export function normalizeShsStatus(value, fallback = "Missing") {
  return displayDataStatus(normalizeReportStatus(value, String(fallback).toLowerCase()));
}

export function normalizeLifecycleStatus(value) {
  return displayLifecycleStatus(value);
}

export function normalizeVisibility(value) {
  return displayVisibilityMode(value);
}

export function normalizeSystemHealth(value) {
  return SYSTEM_HEALTH_LABELS[String(value || "").toLowerCase()] || "Missing";
}

export function normalizeAuditStatus(value) {
  return AUDIT_STATUS_LABELS[String(value || "").toLowerCase()] || "Missing";
}

export function safeReportValue(value, fallback = "Missing") {
  return safeReportText(value, fallback);
}

export function isRestrictedReportVisibility(report = {}) {
  return ["client-visible", "white-label-external"].includes(report.visibility);
}

export function filterReadinessForVisibility(report = {}) {
  return filterReportForVisibility(report, report.visibility).readiness || [];
}

function readinessStatus(report, sourceArea) {
  const normalizedSource = String(sourceArea || "").toLowerCase().replace(/\s+/g, "-");
  const row = (Array.isArray(report.readiness) ? report.readiness : []).find((item) => {
    const label = String(item.label || item.sourceArea || "").toLowerCase().replace(/\s+/g, "-");
    return label === normalizedSource || item.sourceArea === normalizedSource;
  });
  return normalizeShsStatus(row?.status);
}

function isApprovedOrVerified(status) {
  return status === "Approved" || status === "Verified";
}

export function getRecommendedNextAction(report = {}) {
  const explicit = report.executiveSummary?.recommendedNextAction;
  if (explicit) return explicit;

  switch (String(report.lifecycleStatus || "").toLowerCase()) {
    case "draft":
      return "Move this report into Data Review.";
    case "data-review":
      return "Resolve missing source notes and confirm required data.";
    case "brand-review":
      return "Confirm branding mode and report visibility.";
    case "audit-review":
      return "Resolve audit exceptions before export.";
    case "ready-for-export":
      return "Prepare export metadata and save as PDF.";
    case "exported":
      return "Use the locked exported record or create a new version for changes.";
    case "blocked":
      return "Resolve blocking data requirements before continuing.";
    default:
      return "Resolve missing report lifecycle data before continuing.";
  }
}

export function getExecutiveSummaryRead(report = {}) {
  if (report.executiveSummary?.currentRead) return report.executiveSummary.currentRead;
  const missingRows = (report.readiness || []).filter((row) => normalizeReportStatus(row.status) === "missing").length;
  if (report.lifecycleStatus === "blocked") return "This report is blocked. Required data must be resolved before the report can move toward export readiness.";
  if (missingRows > 0) return "This report has missing source data. Available sections may be reviewed, but missing items must remain visible until resolved.";
  if (["sample", "draft"].includes(report.dataMode)) return "This report is available for draft review. Sections marked Draft or Sample should not be treated as final verified evidence.";
  return "This report is available for leadership review based on the current lifecycle, readiness, and data mode fields.";
}

export function getExecutiveSummaryFindings(report = {}) {
  const findings = [];
  const clientOps = readinessStatus(report, "ClientOps Center");
  const qaDelivery = readinessStatus(report, "QA + Delivery");
  const auditTrail = readinessStatus(report, "Audit Trail");
  const brandProfile = readinessStatus(report, "Brand Profile");
  const exportMetadata = readinessStatus(report, "Export Metadata");
  const missingRows = (report.readiness || []).filter((row) => normalizeReportStatus(row.status) === "missing");

  if (isApprovedOrVerified(clientOps)) findings.push("ClientOps records are available for system health, support activity, and version history.");
  if (isApprovedOrVerified(qaDelivery)) findings.push("QA + Delivery records support launch readiness and blocker review.");
  if (auditTrail === "Draft" || auditTrail === "Missing") findings.push("Audit trail is present or expected, but one source area needs review before export.");
  if (isApprovedOrVerified(brandProfile)) findings.push("Report branding is aligned with Silicon Heartland OS Premium Template V1.");
  if (isApprovedOrVerified(exportMetadata)) findings.push("Export metadata is ready for draft preview, but final export requires lifecycle approval.");
  if (missingRows.length) findings.push(`${missingRows.length} required source area${missingRows.length === 1 ? "" : "s"} remain Missing and must not be treated as verified.`);
  if (!findings.length) findings.push("Missing readiness data prevents a complete executive finding set.");
  return findings.slice(0, 6);
}

export function getReportById(reportId) {
  if (!reportId) return shsPremiumReportSeeds[0] || shsReportSeedRecords[0];
  return shsReportSeedRecords.find((report) => report.reportId === reportId || report.id === reportId) || shsPremiumReportSeeds[0] || shsReportSeedRecords[0];
}
