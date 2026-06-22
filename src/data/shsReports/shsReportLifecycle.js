import { getReportTypeDefinition } from "./shsReportRegistry";
import { evaluateReportReadiness } from "./shsReportReadiness";
import { normalizeReportLifecycle } from "./shsReportTypes";

export function getReportLifecycleWarnings(report = {}) {
  const definition = getReportTypeDefinition(report.reportType);
  const readiness = evaluateReportReadiness(report);
  const warnings = [];

  if (readiness.missingRequired.length) warnings.push("Required report data is missing.");
  if (definition.requiresDataReview && !["data-review", "brand-review", "audit-review", "ready-for-export", "exported"].includes(report.lifecycleStatus)) {
    warnings.push("Data review is required before export.");
  }
  if (definition.requiresBrandReview && !["brand-review", "audit-review", "ready-for-export", "exported"].includes(report.lifecycleStatus)) {
    warnings.push("Brand review is required before export.");
  }
  if (definition.requiresAuditReview && !["audit-review", "ready-for-export", "exported"].includes(report.lifecycleStatus)) {
    warnings.push("Audit review is required before export.");
  }
  if (definition.blockedVisibilityModes.includes(report.visibility)) {
    warnings.push("Selected visibility mode is blocked for this report type.");
  }
  return warnings;
}

export function canAdvanceReportLifecycle(report = {}) {
  if (report.isLocked || report.lifecycleStatus === "exported" || report.lifecycleStatus === "archived") return false;
  return getReportLifecycleWarnings(report).filter((warning) => warning.includes("missing")).length === 0;
}

export function getNextLifecycleStatus(report = {}) {
  const current = normalizeReportLifecycle(report.lifecycleStatus);
  const definition = getReportTypeDefinition(report.reportType);
  const readiness = evaluateReportReadiness(report);

  if (readiness.blocked) return "blocked";
  if (current === "draft") return definition.requiresDataReview ? "data-review" : "ready-for-export";
  if (current === "data-review") return definition.requiresBrandReview ? "brand-review" : definition.requiresAuditReview ? "audit-review" : "ready-for-export";
  if (current === "brand-review") return definition.requiresAuditReview ? "audit-review" : "ready-for-export";
  if (current === "audit-review") return "ready-for-export";
  if (current === "ready-for-export") return "exported";
  return current;
}

export function isReportExportEligible(report = {}) {
  if (report.isLocked) return false;
  if (report.lifecycleStatus !== "ready-for-export") return false;
  return evaluateReportReadiness(report).canExport;
}

export function lockExportedReport(report = {}, exportMetadata = {}) {
  return {
    ...report,
    lifecycleStatus: "exported",
    isLocked: true,
    visibility: report.visibility || "internal-only",
    exportMetadata: {
      ...(report.exportMetadata || {}),
      ...exportMetadata,
      exportedAt: exportMetadata.exportedAt || new Date().toISOString(),
      exportFormat: exportMetadata.exportFormat || "pdf",
      exportLocked: true,
      printInstruction: "Users must Save as PDF first, then print the saved PDF if needed.",
    },
  };
}

export function createNewReportVersion(report = {}) {
  const versionNumber = Number(String(report.reportVersion || "v1").replace(/^v/i, "")) || 1;
  const nextVersion = `v${versionNumber + 1}`;
  return {
    ...report,
    id: `${report.id || report.reportId || "report"}-${nextVersion}-${Date.now()}`,
    reportId: `${report.reportId || "SHS-REPORT"}-${nextVersion.toUpperCase()}`,
    reportVersion: nextVersion,
    lifecycleStatus: "draft",
    isLocked: false,
    parentReportId: report.reportId || report.id,
    exportMetadata: {
      ...(report.exportMetadata || {}),
      exportedAt: "",
      exportedBy: "",
      exportLocked: false,
    },
  };
}
