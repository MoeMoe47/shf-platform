export const SHS_REPORT_BRAND_MODES = Object.freeze(["shs-premium", "client-white-label"]);

export const SHS_REPORT_DATA_STATUSES = Object.freeze([
  "verified",
  "approved",
  "draft",
  "sample",
  "missing",
]);

export const SHS_REPORT_LIFECYCLE_STATUSES = Object.freeze([
  "draft",
  "data-review",
  "brand-review",
  "audit-review",
  "ready-for-export",
  "exported",
  "archived",
  "blocked",
]);

export const SHS_REPORT_VISIBILITY_MODES = Object.freeze([
  "internal-only",
  "client-visible",
  "executive-view",
  "white-label-external",
  "archived",
]);

export const SHS_REPORT_TYPE_IDS = Object.freeze([
  "generic-shs-report",
  "premium-os-report-book",
  "client-white-label-report",
  "audit-report",
  "monthly-review-report",
  "qa-delivery-report",
  "project-status-report",
  "executive-summary-report",
  "proposal-report",
  "build-packet-report",
  "visual-qa-report",
  "internal-ops-report",
]);

export const SHS_REPORT_SOURCE_AREAS = Object.freeze([
  "clientops",
  "reporting-layer",
  "internal-ops",
  "qa-delivery",
  "support-maintenance",
  "version-history",
  "audit-trail",
  "export-metadata",
  "sales-handoff",
  "production-projects",
  "development-library",
  "brand-profile",
  "data-binding",
  "mock-review",
  "screenshot-qa",
]);

export const SHS_REPORT_SOURCE_LABELS = Object.freeze({
  clientops: "ClientOps Center",
  "reporting-layer": "Reporting Layer",
  "internal-ops": "Internal Ops",
  "qa-delivery": "QA + Delivery",
  "support-maintenance": "Support & Maintenance",
  "version-history": "Version History",
  "audit-trail": "Audit Trail",
  "export-metadata": "Export Metadata",
  "sales-handoff": "Sales Handoff",
  "production-projects": "Production Projects",
  "development-library": "Development Library",
  "brand-profile": "Brand Profile",
  "data-binding": "Data Binding",
  "mock-review": "Mock Review",
  "screenshot-qa": "Screenshot QA",
});

export function normalizeReportStatus(value, fallback = "missing") {
  const normalized = String(value || "").trim().toLowerCase();
  return SHS_REPORT_DATA_STATUSES.includes(normalized) ? normalized : fallback;
}

export function normalizeReportLifecycle(value, fallback = "draft") {
  const normalized = String(value || "").trim().toLowerCase();
  return SHS_REPORT_LIFECYCLE_STATUSES.includes(normalized) ? normalized : fallback;
}

export function normalizeReportVisibility(value, fallback = "internal-only") {
  const normalized = String(value || "").trim().toLowerCase();
  return SHS_REPORT_VISIBILITY_MODES.includes(normalized) ? normalized : fallback;
}

export function labelizeReportToken(value) {
  return String(value || "missing")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function displayDataStatus(value) {
  return labelizeReportToken(normalizeReportStatus(value));
}

export function displayLifecycleStatus(value) {
  return labelizeReportToken(normalizeReportLifecycle(value));
}

export function displayVisibilityMode(value) {
  return labelizeReportToken(normalizeReportVisibility(value));
}

export function safeReportText(value, fallback = "Missing") {
  const text = String(value || "").trim();
  return text || fallback;
}
