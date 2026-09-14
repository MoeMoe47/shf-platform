import {
  EXR_ALIAS_CONSOLIDATION_PLAN,
  EXR_CONSOLIDATION_DISPOSITIONS,
  EXR_DASHBOARD_CLASSIFICATIONS,
  EXR_DASHBOARD_RECLASSIFICATION,
  EXR_EXR4_BACKLOG,
  EXR_PAGE_CONSOLIDATION_PLAN,
  validateExrPageConsolidation,
} from "../src/system/exr/exrPageConsolidationPlan.js";

const result = validateExrPageConsolidation();
const errors = [...result.errors];

if (new Set(EXR_PAGE_CONSOLIDATION_PLAN.map((entry) => entry.currentSurface)).size !== EXR_PAGE_CONSOLIDATION_PLAN.length) {
  errors.push("page surfaces must be unique");
}
if (EXR_DASHBOARD_RECLASSIFICATION.some((entry) => !EXR_DASHBOARD_CLASSIFICATIONS.includes(entry.classification))) {
  errors.push("dashboard reclassification contains an invalid classification");
}
if (EXR_PAGE_CONSOLIDATION_PLAN.some((entry) => !EXR_CONSOLIDATION_DISPOSITIONS.includes(entry.disposition))) {
  errors.push("page plan contains an invalid disposition");
}
if (EXR_PAGE_CONSOLIDATION_PLAN.some((entry) => entry.priority === "P1_JOURNEY" && !EXR_EXR4_BACKLOG.some((item) => item.journey === entry.exr4Owner))) {
  errors.push("every P1 page must map to an EXR-4 backlog journey");
}
if (EXR_ALIAS_CONSOLIDATION_PLAN.some((entry) => entry.classification === "REDIRECT_CANDIDATE" && !entry.canonicalTarget)) {
  errors.push("redirect candidates require canonical targets");
}
if (EXR_PAGE_CONSOLIDATION_PLAN.some((entry) => entry.ncaIntegration === "NCA_INTEGRATION_REQUIRED" && /notification state|recipient|delivery/i.test(`${entry.targetSurface} ${entry.dependencies.join(" ")}`))) {
  errors.push("EXR consolidation records must not own notification behavior");
}

if (errors.length) {
  console.error("EXR page consolidation validation failed");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`EXR page consolidation validation passed: ${EXR_PAGE_CONSOLIDATION_PLAN.length} pages, ${EXR_DASHBOARD_RECLASSIFICATION.length} dashboards, ${EXR_ALIAS_CONSOLIDATION_PLAN.length} aliases, ${EXR_EXR4_BACKLOG.length} EXR-4 backlog items`);
