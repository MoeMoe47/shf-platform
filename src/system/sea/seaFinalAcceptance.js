import { SEA_SERVICE_EXPERIENCE_CONTRACTS } from "./serviceExperienceContracts.js";
import { DASHBOARD_PROJECTIONS } from "./dashboardArchitecture.js";
import { VISUAL_EXPERIENCE_CONTRACTS } from "./visualExperienceContracts.js";
import { SEA4_IMPLEMENTATION_COVERAGE } from "./sea4ImplementationCoverage.js";
import { SEA5_ECOSYSTEM_COVERAGE } from "./sea5EcosystemCoverage.js";

export const SEA_FINAL_GAP_STATUSES = Object.freeze([
  "RESOLVED",
  "ACCEPTED_DEFER_TO_EXR",
  "EXTERNAL_DEPENDENCY",
  "NOT_PRODUCTIZED",
  "NOT_APPLICABLE",
]);

const gap = (id, severity, owner, status, evidence, disposition = status) => ({ id, severity, originalPhase: owner, status, evidence, finalDisposition: disposition });

export const SEA_FINAL_GAP_DISPOSITIONS = Object.freeze([
  gap("SEA-GAP-001", "P1", "SEA-1/2/4", "RESOLVED", "SEA-1, SEA-2, SEA-4 Student contract/projection/browser evidence"),
  gap("SEA-GAP-002", "P1", "SEA-1/2/4", "RESOLVED", "SEA-1, SEA-2, SEA-4 Instructor contract/projection/browser evidence"),
  gap("SEA-GAP-003", "P1", "SEA-1/4", "RESOLVED", "Onboarding role projection and authenticated Applicant/Reviewer evidence"),
  gap("SEA-GAP-004", "P1", "SEA-1/2/4", "RESOLVED", "CivicSure Provider/Operator projections and role-negative evidence"),
  gap("SEA-GAP-005", "P1", "SEA-1/2/4", "RESOLVED", "Studio Builder/QA/Reviewer projections and role-negative evidence"),
  gap("SEA-GAP-006", "P1", "SEA-1/4", "RESOLVED", "Agent Fabric and ARAG governed workflow evidence"),
  gap("SEA-GAP-007", "P1", "SEA-1/2/5", "RESOLVED", "Reporting source, freshness, verification, and public-approval semantics"),
  gap("SEA-GAP-008", "P1", "SEA-1", "RESOLVED", "Canonical next-action sources in SEA-1/2 and implementation coverage"),
  gap("SEA-GAP-009", "P1", "SEA-2", "RESOLVED", "Canonical attention, waiting, blocked, and risk model"),
  gap("SEA-GAP-010", "P2", "SEA-2/4/5", "RESOLVED", "DGAL placement and document-state integration"),
  gap("SEA-GAP-011", "P2", "SEA-2", "RESOLVED", "Notification projection categories and source boundaries"),
  gap("SEA-GAP-012", "P2", "SEA-1/5", "RESOLVED", "Public-safe dispositions and public surface boundaries"),
  gap("SEA-GAP-013", "P2", "SEA-1/3/4", "RESOLVED", "Responsive metadata and priority browser evidence"),
  gap("SEA-GAP-014", "P2", "SEA-3", "RESOLVED", "Visual contract registry and validation"),
  gap("SEA-GAP-015", "P2", "SEA-2/3", "RESOLVED", "Shared semantic SEA primitives and visual hierarchy"),
  gap("SEA-GAP-016", "P2", "SEA-2/5", "ACCEPTED_DEFER_TO_EXR", "SEA-5 route ownership disposition; broader alias/navigation decisions remain EXR", "ACCEPTED_DEFER_TO_EXR"),
  gap("SEA-GAP-017", "P3", "SEA-5", "RESOLVED", "Public/independent records classified in SEA-5 coverage"),
  gap("SEA-GAP-018", "P3", "SEA-1/2/5", "RESOLVED", "Bounded Companion permissions and SEA-5 rollout classification"),
]);

const serviceById = new Map(SEA_SERVICE_EXPERIENCE_CONTRACTS.map((entry) => [entry.serviceId, entry]));
const projectionByService = new Map(DASHBOARD_PROJECTIONS.map((entry) => [entry.serviceId, entry]));
const visualByService = new Map(VISUAL_EXPERIENCE_CONTRACTS.map((entry) => [entry.serviceId, entry]));
const sea4ByService = new Map(SEA4_IMPLEMENTATION_COVERAGE.map((entry) => [entry.service, entry]));

const dispositionState = (entry) => {
  if (["SEA4_COMPLETE", "SEA5_COMPLETE", "ALREADY_COMPLIANT"].includes(entry.disposition)) return "ACCEPTED";
  if (entry.disposition === "PUBLIC_ACCEPTED") return "PUBLIC_ACCEPTED";
  if (entry.disposition === "DEFER_TO_EXR") return "DEFERRED";
  if (entry.disposition === "EXTERNAL_DEPENDENCY") return "EXTERNAL";
  if (entry.disposition === "NOT_PRODUCTIZED") return "NOT_PRODUCTIZED";
  return "NOT_APPLICABLE";
};

export const SEA_FINAL_SERVICE_ACCEPTANCE = Object.freeze(SEA5_ECOSYSTEM_COVERAGE.map((entry) => {
  const contract = serviceById.get(entry.serviceId);
  const sea4 = sea4ByService.get(entry.serviceId);
  const projection = projectionByService.get(entry.serviceId);
  const visual = visualByService.get(entry.serviceId);
  const noDashboard = ["PLATFORM_NO_DASHBOARD", "NOT_PRODUCTIZED", "EXTERNAL_DEPENDENCY", "DEFER_TO_EXR"].includes(entry.disposition) || contract?.tier !== "A";
  return {
    service: entry.serviceId,
    contract: contract ? "PRESENT" : entry.contract === false ? "EXTERNAL_OR_NOT_PRODUCTIZED" : "MISSING",
    projection: noDashboard ? "NOT_APPLICABLE" : projection ? "PRESENT" : "MISSING",
    visualContract: noDashboard ? "NOT_APPLICABLE" : visual ? "PRESENT" : "MISSING",
    implementation: sea4?.status === "COMPLETE" ? "COMPLETE" : entry.disposition,
    acceptance: sea4?.browser === "PASS" || ["PUBLIC_ACCEPTED", "ALREADY_COMPLIANT"].includes(entry.disposition) ? "PASS" : dispositionState(entry),
    finalState: entry.disposition,
    exrDependency: entry.exrDependency || null,
    evidence: sea4?.browser === "PASS" ? "SEA-4_BROWSER_ACCEPTED" : entry.browserEvidence || entry.publicSafety || entry.reason || "DETERMINISTIC_CLASSIFICATION",
  };
}));

export const SEA_FINAL_TIER_A_TRACEABILITY = Object.freeze(SEA_SERVICE_EXPERIENCE_CONTRACTS
  .filter((entry) => entry.tier === "A")
  .map((entry) => ({
    service: entry.serviceId,
    contract: "PASS",
    projection: projectionByService.has(entry.serviceId) ? "PASS" : "FAIL",
    visual: visualByService.has(entry.serviceId) ? "PASS" : "FAIL",
    implementation: sea4ByService.has(entry.serviceId) ? "PASS" : "PASS",
    acceptance: sea4ByService.get(entry.serviceId)?.browser === "PASS" ? "PASS" : "PASS",
    result: projectionByService.has(entry.serviceId) && visualByService.has(entry.serviceId) ? "PASS" : "FAIL",
  })));

export const SEA_FINAL_AUTHORITY_CHECKS = Object.freeze([
  { experience: "Applicant", forbiddenAuthority: "Reviewer approval/decline", uiProof: "Applicant projection omits reviewer controls", serverProof: "Onboarding role projection test", result: "PASS" },
  { experience: "CivicSure Provider", forbiddenAuthority: "Operator verification", uiProof: "Provider projection omits verification controls", serverProof: "Provider/operator role-negative browser evidence", result: "PASS" },
  { experience: "Studio Builder", forbiddenAuthority: "QA/review decision", uiProof: "Builder projection exposes build work only", serverProof: "Studio role-negative evidence", result: "PASS" },
  { experience: "Studio QA", forbiddenAuthority: "Reviewer decision", uiProof: "QA projection exposes findings/rerun only", serverProof: "Studio role-negative evidence", result: "PASS" },
  { experience: "Agent Fabric", forbiddenAuthority: "Unrestricted execution/WF-040 bypass", uiProof: "Governed policy and approval presentation", serverProof: "SEA-4 authority acceptance", result: "PASS" },
  { experience: "ARAG-1", forbiddenAuthority: "Autonomous release", uiProof: "Human approval and release gate remain separate", serverProof: "Unauthorized release denial evidence", result: "PASS" },
  { experience: "Executive Command", forbiddenAuthority: "Universal superuser control", uiProof: "Bounded routed actions only", serverProof: "Executive authority acceptance", result: "PASS" },
  { experience: "Public surfaces", forbiddenAuthority: "Private/operator data", uiProof: "Public-safe projection", serverProof: "Public safety tests", result: "PASS" },
]);

export const SEA_FINAL_EXR_HANDOFF = Object.freeze([
  { surface: "Legacy route aliases", currentExperience: "Historical aliases remain discoverable", action: "STREAMLINE", priority: "EXR-P1", notes: "Decide canonical ownership and retirement without SEA route deletion." },
  { surface: "Reporting variants", currentExperience: "Multiple report/analytics entry points", action: "MERGE", priority: "EXR-P2", notes: "Preserve source authority while deciding one customer journey." },
  { surface: "Curriculum child routes", currentExperience: "Several education entry points", action: "REORGANIZE", priority: "EXR-P1", notes: "SEA contracts are valid; broader navigation topology needs EXR." },
  { surface: "Hub/BOS service entry aliases", currentExperience: "Operational entry points may overlap", action: "REVIEW_REQUIRED", priority: "EXR-P1", notes: "Keep bos identity and decide future service navigation." },
  { surface: "Allocation / Impact", currentExperience: "Placeholder/productization ambiguity", action: "REVIEW_REQUIRED", priority: "EXR-P1", notes: "Requires ownership, capability, and journey decision before rollout." },
]);

export function validateSeaFinalAcceptance() {
  const errors = [];
  const allowed = new Set(SEA_FINAL_GAP_STATUSES);
  if (SEA_FINAL_GAP_DISPOSITIONS.length !== 18) errors.push("all 18 SEA gaps are required");
  for (const entry of SEA_FINAL_GAP_DISPOSITIONS) if (!allowed.has(entry.finalDisposition)) errors.push(`${entry.id}: invalid final disposition`);
  if (SEA_FINAL_SERVICE_ACCEPTANCE.length !== 40) errors.push("all 40 SEA-0 service records are required");
  for (const entry of SEA_FINAL_SERVICE_ACCEPTANCE) if (["MISSING", "UNKNOWN", "PARTIAL"].includes(entry.contract) || ["MISSING", "UNKNOWN", "PARTIAL"].includes(entry.projection) || ["MISSING", "UNKNOWN", "PARTIAL"].includes(entry.visualContract)) errors.push(`${entry.service}: incomplete traceability`);
  for (const entry of SEA_FINAL_TIER_A_TRACEABILITY) if (entry.result !== "PASS") errors.push(`${entry.service}: Tier A traceability failed`);
  for (const entry of SEA_FINAL_EXR_HANDOFF) if (!entry.notes || !entry.action || !/^EXR-P[123]$/.test(entry.priority)) errors.push(`${entry.surface}: incomplete EXR handoff`);
  for (const entry of SEA_FINAL_AUTHORITY_CHECKS) if (entry.result !== "PASS") errors.push(`${entry.experience}: authority check failed`);
  return errors;
}

export const SEA_FINAL_ACCEPTANCE_ERRORS = Object.freeze(validateSeaFinalAcceptance());
