import { normalizeReportVisibility } from "./shsReportTypes";

const HIDDEN_FOR_EXTERNAL = Object.freeze([
  "paymentStatus",
  "contractNotes",
  "privateSupportDetails",
  "internalAuditExceptions",
  "internalQaNotes",
  "internalBlockerComments",
]);

export function isReportFieldVisible(field, visibility = "internal-only") {
  const mode = normalizeReportVisibility(visibility);
  if (mode === "internal-only") return true;
  if (mode === "executive-view") return field !== "privateSupportDetails" && field !== "paymentStatus";
  if (mode === "client-visible" || mode === "white-label-external") {
    return !HIDDEN_FOR_EXTERNAL.includes(field);
  }
  return mode !== "archived";
}

export function filterReportForVisibility(report = {}, visibility = report.visibility) {
  const mode = normalizeReportVisibility(visibility);
  const hiddenMessage = "Some internal-only details are hidden for this report visibility mode.";

  const filtered = {
    ...report,
    visibility: mode,
    readiness: (report.readiness || []).map((item) =>
      item.safeForVisibility === false && (mode === "client-visible" || mode === "white-label-external")
        ? { ...item, notes: hiddenMessage, status: item.status === "verified" ? "approved" : item.status }
        : item
    ),
    auditExceptions: (report.auditExceptions || []).filter((exception) =>
      (exception.visibility || ["internal-only"]).includes(mode)
    ),
  };

  if (!isReportFieldVisible("internalBlockerComments", mode)) {
    filtered.internalBlockerComments = hiddenMessage;
  }

  return filtered;
}

export function getVisibilityWarnings(report = {}) {
  const mode = normalizeReportVisibility(report.visibility);
  if (mode !== "client-visible" && mode !== "white-label-external") return [];

  const warnings = [];
  if ((report.auditExceptions || []).some((exception) => !(exception.visibility || []).includes(mode))) {
    warnings.push("Internal audit exception details are hidden for this visibility mode.");
  }
  if ((report.readiness || []).some((item) => item.safeForVisibility === false)) {
    warnings.push("Some source notes are internal-only and are filtered from this report view.");
  }
  return warnings;
}
