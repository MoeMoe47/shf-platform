import { SEA_SERVICE_EXPERIENCE_CONTRACTS } from "../src/system/sea/serviceExperienceContracts.js";
import { DASHBOARD_PROJECTIONS } from "../src/system/sea/dashboardArchitecture.js";
import { VISUAL_EXPERIENCE_CONTRACTS, VISUAL_PRIORITY_A_PROJECTION_IDS, VISUAL_AUTHORITY_STATES, PAGE_SHELL_TYPES, VISUAL_DENSITIES, VISUAL_STATUS_KEYS } from "../src/system/sea/visualExperienceContracts.js";

const errors = [];
const contracts = new Map(SEA_SERVICE_EXPERIENCE_CONTRACTS.map((item) => [item.serviceId, item]));
const projections = new Map(DASHBOARD_PROJECTIONS.map((item) => [item.projectionId, item]));
const seen = new Set();

for (const contract of VISUAL_EXPERIENCE_CONTRACTS) {
  if (seen.has(contract.visualContractId)) errors.push(`duplicate visual contract: ${contract.visualContractId}`);
  seen.add(contract.visualContractId);
  const projection = projections.get(contract.projectionId);
  const service = contracts.get(contract.serviceId);
  if (!projection) errors.push(`${contract.visualContractId}: unknown dashboard projection`);
  if (!service) errors.push(`${contract.visualContractId}: unknown service`);
  if (projection && (projection.serviceId !== contract.serviceId || projection.role !== contract.role)) errors.push(`${contract.visualContractId}: projection role/service mismatch`);
  if (service && !service.routes.includes(contract.route)) errors.push(`${contract.visualContractId}: route is not in SEA-1 contract`);
  if (!VISUAL_AUTHORITY_STATES.includes(contract.visualAuthority.status)) errors.push(`${contract.visualContractId}: invalid visual authority state`);
  if (!PAGE_SHELL_TYPES.includes(contract.pageShell)) errors.push(`${contract.visualContractId}: invalid page shell`);
  if (!VISUAL_DENSITIES.includes(contract.density)) errors.push(`${contract.visualContractId}: invalid density`);
  const requiredRegions = projection ? Object.entries(projection.sections).filter(([, value]) => value === "REQUIRED").map(([region]) => region.toUpperCase()) : ["CONTEXT", "ATTENTION", "WORK", "HELP"];
  for (const region of requiredRegions) if (!Array.isArray(contract.pageStructure.desktopOrder) || !contract.pageStructure.desktopOrder.includes(region)) errors.push(`${contract.visualContractId}: desktop order missing ${region}`);
  for (const region of requiredRegions) if (!Array.isArray(contract.pageStructure.mobileOrder) || !contract.pageStructure.mobileOrder.includes(region)) errors.push(`${contract.visualContractId}: mobile order missing ${region}`);
  if (!contract.actions.primary?.treatment || !contract.actions.primary?.source) errors.push(`${contract.visualContractId}: primary action treatment incomplete`);
  for (const status of VISUAL_STATUS_KEYS) if (!contract.statusSemantics[status]?.treatment || contract.statusSemantics[status].colorOnlyAllowed !== false) errors.push(`${contract.visualContractId}: unsafe status semantics for ${status}`);
  if (!contract.brand?.product || !contract.brand?.direction) errors.push(`${contract.visualContractId}: brand relationship missing`);
  if (!contract.acceptance.required.length || !contract.acceptance.allowed.length || !contract.acceptance.prohibited.length) errors.push(`${contract.visualContractId}: acceptance criteria incomplete`);
  if (!Array.isArray(contract.responsive.priorityOrder) || !contract.responsive.priorityOrder.length) errors.push(`${contract.visualContractId}: responsive priority missing`);
  if (contract.visualAuthority.status === "APPROVED_MOCK" && !contract.visualAuthority.mockRef) errors.push(`${contract.visualContractId}: approved mock reference missing`);
  if (contract.acceptance.prohibited.some((item) => /unrestricted|superuser|release bypass/i.test(item)) && !contract.acceptance.prohibited.some((item) => /authority|control|release/i.test(item))) errors.push(`${contract.visualContractId}: authority prohibition is not explicit`);
}

for (const projectionId of VISUAL_PRIORITY_A_PROJECTION_IDS) if (!VISUAL_EXPERIENCE_CONTRACTS.some((item) => item.projectionId === projectionId)) errors.push(`${projectionId}: Priority A visual contract missing`);
if (VISUAL_EXPERIENCE_CONTRACTS.length !== new Set(VISUAL_PRIORITY_A_PROJECTION_IDS).size) errors.push("Priority A projection list contains duplicates");
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(`SEA visual contract validation OK (${VISUAL_EXPERIENCE_CONTRACTS.length} Priority A contracts).`);
