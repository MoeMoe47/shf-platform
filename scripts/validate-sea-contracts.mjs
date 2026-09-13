import { SEA_SERVICE_EXPERIENCE_CONTRACTS as contracts, SEA_CONTRACT_SCHEMA_VERSION } from "../src/system/sea/serviceExperienceContracts.js";

const errors = [];
const ids = new Set();
const tiers = new Set(["A", "B", "C", "NOT_PRODUCTIZED"]);
const obligationValues = new Set(["REQUIRED", "OPTIONAL", "N/A"]);
const nextSources = new Set(["DOMAIN_SERVICE", "DOMAIN_PROJECTION", "OGL_RESOLVER", "WORKFLOW_STATE_MACHINE", "NONE"]);

for (const contract of contracts) {
  if (!contract.serviceId || ids.has(contract.serviceId)) errors.push(`duplicate or missing serviceId: ${contract.serviceId || "<missing>"}`);
  ids.add(contract.serviceId);
  if (!contract.canonicalName || !contract.domainOwner || !contract.destinationId) errors.push(`${contract.serviceId}: identity/owner incomplete`);
  if (!tiers.has(contract.tier)) errors.push(`${contract.serviceId}: invalid tier ${contract.tier}`);
  if (!Array.isArray(contract.routes) || contract.routes.some((route) => typeof route !== "string" || (!route.startsWith("/") && !route.startsWith("external:")))) errors.push(`${contract.serviceId}: unsafe or invalid route reference`);
  if (!Array.isArray(contract.roles) && !Array.isArray(contract.audience?.roles)) errors.push(`${contract.serviceId}: roles missing`);
  if (!Array.isArray(contract.capabilities) || !contract.capabilities.length) errors.push(`${contract.serviceId}: capabilities missing`);
  if (!Array.isArray(contract.explicitNonCapabilities) || !contract.explicitNonCapabilities.length) errors.push(`${contract.serviceId}: explicit non-capabilities missing`);
  if (!Array.isArray(contract.jobsToBeDone) || !contract.jobsToBeDone.length) errors.push(`${contract.serviceId}: jobs-to-be-done missing`);
  if (!contract.workflow?.canonical || !Array.isArray(contract.workflow.states) || !contract.workflow.transitionAuthority) errors.push(`${contract.serviceId}: workflow/state authority incomplete`);
  if (!nextSources.has(contract.nextAction?.source)) errors.push(`${contract.serviceId}: invalid next-action source`);
  for (const key of ["context", "attention", "work", "progress", "intelligence", "help"]) {
    if (!obligationValues.has(contract.dashboardObligations?.[key])) errors.push(`${contract.serviceId}: invalid dashboard obligation ${key}`);
  }
  if (!contract.companion?.readOnly || !Array.isArray(contract.companion?.prohibited) || !contract.companion.prohibited.includes("write Evidence/Truth")) errors.push(`${contract.serviceId}: Companion boundary is incomplete`);
  if (contract.truth?.writeAuthority !== false || contract.evidence?.notOwned !== true) errors.push(`${contract.serviceId}: Evidence/Truth authority must remain external`);
  for (const group of [contract.actions?.primary, contract.actions?.secondary, contract.actions?.reference]) {
    for (const item of group || []) {
      if (typeof item.route !== "string" || item.route.startsWith("http") || item.route.startsWith("javascript:")) errors.push(`${contract.serviceId}: unsafe action route`);
    }
  }
  if (contract.tier === "A") {
    for (const key of ["purpose", "audience", "workflow", "states", "nextAction", "dashboardObligations", "metrics", "dgal", "ogl", "companion", "notifications", "evidence", "truth", "responsive", "accessibility", "visualAuthority", "acceptance"]) {
      if (!contract[key]) errors.push(`${contract.serviceId}: Tier A field missing: ${key}`);
    }
  }
}

if (SEA_CONTRACT_SCHEMA_VERSION !== 1) errors.push(`unsupported schema version: ${SEA_CONTRACT_SCHEMA_VERSION}`);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const counts = Object.groupBy(contracts, (contract) => contract.tier);
console.log(`SEA contract validation OK (${contracts.length} services; A=${counts.A?.length || 0}, B=${counts.B?.length || 0}, C=${counts.C?.length || 0}, NOT_PRODUCTIZED=${counts.NOT_PRODUCTIZED?.length || 0}).`);
