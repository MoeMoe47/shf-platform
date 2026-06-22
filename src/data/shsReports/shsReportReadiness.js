import { getReportTypeDefinition } from "./shsReportRegistry";
import {
  normalizeReportStatus,
  SHS_REPORT_SOURCE_AREAS,
  SHS_REPORT_SOURCE_LABELS,
} from "./shsReportTypes";
import { getVisibilityWarnings } from "./shsReportVisibility";

export function buildDefaultReadiness(reportTypeId = "generic-shs-report") {
  const definition = getReportTypeDefinition(reportTypeId);

  return SHS_REPORT_SOURCE_AREAS.map((sourceArea) => {
    const required = definition.requiredDataSources.includes(sourceArea);
    return {
      sourceArea,
      label: SHS_REPORT_SOURCE_LABELS[sourceArea],
      status: required ? "missing" : "sample",
      lastUpdated: "",
      notes: required ? "Required source has not been connected." : "Optional source not connected for this report.",
      requiredForPremium: definition.id === "premium-os-report-book" && required,
      safeForVisibility: !["internal-ops", "audit-trail", "support-maintenance"].includes(sourceArea),
      blockingReason: required ? "missing_required_source" : "",
    };
  });
}

export function evaluateReportReadiness(report = {}) {
  const definition = getReportTypeDefinition(report.reportType);
  const readiness = Array.isArray(report.readiness) && report.readiness.length
    ? report.readiness
    : buildDefaultReadiness(report.reportType);

  const bySource = new Map(readiness.map((item) => [item.sourceArea, item]));
  const sourceRows = definition.requiredDataSources.map((sourceArea) => {
    const existing = bySource.get(sourceArea);
    const status = normalizeReportStatus(existing?.status);
    return {
      sourceArea,
      label: existing?.label || SHS_REPORT_SOURCE_LABELS[sourceArea] || sourceArea,
      status,
      lastUpdated: existing?.lastUpdated || "",
      notes: existing?.notes || "Missing source readiness details.",
      requiredForPremium: definition.id === "premium-os-report-book",
      safeForVisibility: existing?.safeForVisibility !== false,
      blockingReason: status === "missing" ? "missing_required_source" : existing?.blockingReason || "",
    };
  });

  const optionalRows = readiness.filter((item) => !definition.requiredDataSources.includes(item.sourceArea));
  const allRows = [...sourceRows, ...optionalRows];
  const missingRequired = sourceRows.filter((item) => item.status === "missing");
  const draftOrSample = allRows.filter((item) => item.status === "draft" || item.status === "sample");
  const visibilityWarnings = getVisibilityWarnings(report);
  const blocked = missingRequired.length > 0 || definition.blockedVisibilityModes.includes(report.visibility);
  const canMoveToReview = !blocked;
  const canExport =
    !blocked &&
    draftOrSample.length === 0 &&
    visibilityWarnings.length === 0 &&
    Boolean(report.exportMetadata);

  return {
    reportType: definition.id,
    rows: allRows,
    missingRequired,
    draftOrSample,
    visibilityWarnings,
    blocked,
    canMoveToReview,
    canExport,
    summary: {
      verified: allRows.filter((item) => item.status === "verified").length,
      approved: allRows.filter((item) => item.status === "approved").length,
      draft: allRows.filter((item) => item.status === "draft").length,
      sample: allRows.filter((item) => item.status === "sample").length,
      missing: allRows.filter((item) => item.status === "missing").length,
    },
  };
}
