export const SHS_PREMIUM_INTERIOR_TEMPLATE = Object.freeze({
  displayName: "Silicon Heartland OS Premium Report Interior Template V1",
  version: "shos-premium-interior-v1",
  label: "SHOS Premium Interior V1",
  totalPages: 24,
  printInstruction: "Users must Save as PDF first, then print the saved PDF if needed.",
});

export const SHS_REPORT_TEMPLATES = Object.freeze([
  {
    id: "shs-generic-report-v1",
    displayName: "Generic SHS Report V1",
    reportTypes: ["generic-shs-report"],
    brandModes: ["shs-premium"],
  },
  {
    id: SHS_PREMIUM_INTERIOR_TEMPLATE.version,
    displayName: SHS_PREMIUM_INTERIOR_TEMPLATE.displayName,
    reportTypes: ["premium-os-report-book", "executive-summary-report"],
    brandModes: ["shs-premium", "client-white-label"],
  },
  {
    id: "shs-client-white-label-v1",
    displayName: "SHS Client White-Label Report V1",
    reportTypes: ["client-white-label-report"],
    brandModes: ["client-white-label"],
  },
  {
    id: "shs-audit-report-v1",
    displayName: "SHS Audit Report V1",
    reportTypes: ["audit-report"],
    brandModes: ["shs-premium"],
  },
]);

export function getTemplateByVersion(version) {
  return SHS_REPORT_TEMPLATES.find((template) => template.id === version) || SHS_REPORT_TEMPLATES[0];
}
