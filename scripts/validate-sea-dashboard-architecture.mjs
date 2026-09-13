import { SEA_SERVICE_EXPERIENCE_CONTRACTS } from "../src/system/sea/serviceExperienceContracts.js";
import { DASHBOARD_ARCHITECTURE, DASHBOARD_PROJECTIONS, DASHBOARD_SECTIONS, ATTENTION_TYPES, SOURCE_STATUS, ACTION_HIERARCHY } from "../src/system/sea/dashboardArchitecture.js";

const errors = [];
const contracts = new Map(SEA_SERVICE_EXPERIENCE_CONTRACTS.map((contract) => [contract.serviceId, contract]));
const projectionIds = new Set();
const tierA = SEA_SERVICE_EXPERIENCE_CONTRACTS.filter((contract) => contract.tier === "A");
const validSources = new Set(["DOMAIN_SERVICE", "DOMAIN_PROJECTION", "OGL_RESOLVER", "WORKFLOW_STATE_MACHINE"]);
const validMetricVerification = new Set(["OPERATIONAL", "VERIFIED", "PUBLIC_APPROVED", "ESTIMATED", "UNKNOWN", "SOURCE_STATED"]);

for (const projection of DASHBOARD_PROJECTIONS) {
  if (projectionIds.has(projection.projectionId)) errors.push(`duplicate projection: ${projection.projectionId}`);
  projectionIds.add(projection.projectionId);
  const contract = contracts.get(projection.serviceId);
  if (!contract) errors.push(`${projection.projectionId}: unknown service`);
  if (!contract?.audience.roles.includes(projection.role)) errors.push(`${projection.projectionId}: role is not allowed by SEA-1 contract`);
  const pattern = DASHBOARD_ARCHITECTURE.patterns[projection.pattern];
  if (!pattern) errors.push(`${projection.projectionId}: unknown dashboard pattern`);
  for (const section of pattern?.required || []) if (projection.sections[section.toLowerCase()] !== "REQUIRED") errors.push(`${projection.projectionId}: required ${section} section is not REQUIRED`);
  for (const section of DASHBOARD_SECTIONS) if (!["REQUIRED", "OPTIONAL", "N/A"].includes(projection.sections[section.toLowerCase()])) errors.push(`${projection.projectionId}: invalid section obligation ${section}`);
  for (const type of projection.attention) if (!ATTENTION_TYPES.includes(type)) errors.push(`${projection.projectionId}: invalid attention type ${type}`);
  for (const status of projection.sourceStatus) if (!SOURCE_STATUS.includes(status)) errors.push(`${projection.projectionId}: invalid source status ${status}`);
  if (!validSources.has(projection.nextAction.source)) errors.push(`${projection.projectionId}: next action is not domain/OGL authorized`);
  if (!projection.nextAction.safeActionRef || projection.nextAction.priority !== "REQUIRED_ACTION") errors.push(`${projection.projectionId}: next action mapping incomplete`);
  if (projection.authorityNotes.evidenceWrite !== false || projection.authorityNotes.truthWrite !== false || projection.authorityNotes.companionReadOnly !== true) errors.push(`${projection.projectionId}: authority boundary violated`);
  if (!Array.isArray(projection.responsivePriority) || !projection.responsivePriority.includes("CONTEXT") || !projection.responsivePriority.includes("ATTENTION")) errors.push(`${projection.projectionId}: mobile priority incomplete`);
  if ((projection.sections.help === "REQUIRED") && projection.help.ogl !== true) errors.push(`${projection.projectionId}: OGL help missing`);
  for (const metric of projection.metrics || []) if (!validMetricVerification.has(metric.verification)) errors.push(`${projection.projectionId}: invalid metric verification class`);
}

for (const contract of tierA) {
  const matches = DASHBOARD_PROJECTIONS.filter((projection) => projection.serviceId === contract.serviceId);
  if (!matches.length) errors.push(`${contract.serviceId}: Tier A projection missing`);
}
if (DASHBOARD_ARCHITECTURE.actionHierarchy.join(",") !== ACTION_HIERARCHY.join(",")) errors.push("action hierarchy mismatch");
if (DASHBOARD_ARCHITECTURE.sections.join(",") !== DASHBOARD_SECTIONS.join(",")) errors.push("section schema mismatch");
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(`SEA dashboard architecture validation OK (${DASHBOARD_PROJECTIONS.length} projections; ${tierA.length} Tier A services covered).`);
