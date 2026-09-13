import { SEA_SERVICE_EXPERIENCE_CONTRACTS } from "./serviceExperienceContracts.js";
import { SEA4_IMPLEMENTATION_COVERAGE } from "./sea4ImplementationCoverage.js";

export const SEA5_DISPOSITIONS = Object.freeze([
  "SEA4_COMPLETE",
  "SEA5_COMPLETE",
  "ALREADY_COMPLIANT",
  "PLATFORM_NO_DASHBOARD",
  "PUBLIC_ACCEPTED",
  "NOT_PRODUCTIZED",
  "EXTERNAL_DEPENDENCY",
  "DEFER_TO_EXR",
  "NOT_APPLICABLE",
]);

const record = (serviceId, disposition, config = {}) => ({
  serviceId,
  disposition,
  activeSurface: config.activeSurface ?? null,
  contract: config.contract ?? true,
  sea4State: config.sea4State ?? "NOT_IN_SEA4_PRIORITY_SET",
  browserRequirement: config.browserRequirement ?? "DETERMINISTIC_OR_EXISTING_EVIDENCE",
  browserEvidence: config.browserEvidence ?? "NOT_REQUIRED_IN_SEA5",
  exrDependency: config.exrDependency ?? null,
  publicSafety: config.publicSafety ?? null,
  reason: config.reason,
  final: disposition,
});

export const SEA5_ECOSYSTEM_COVERAGE = Object.freeze([
  record("student-learning", "SEA4_COMPLETE", { activeSurface: "/curriculum.html#/dashboard", sea4State: "COMPLETE", browserEvidence: "SEA-4_ACCEPTED" }),
  record("instructor", "SEA4_COMPLETE", { activeSurface: "/curriculum.html#/instructor/operations", sea4State: "COMPLETE", browserEvidence: "SEA-4_ACCEPTED" }),
  record("parent", "ALREADY_COMPLIANT", { activeSurface: "/curriculum.html#/parent", reason: "Bounded authorized learner-summary surface; no Student completion controls." }),
  record("curriculum", "ALREADY_COMPLIANT", { activeSurface: "/curriculum.html#/dashboard", reason: "Existing curriculum route and management projections remain domain-owned." }),
  record("career", "SEA4_COMPLETE", { activeSurface: "/career.html#/dashboard", sea4State: "COMPLETE", browserEvidence: "SEA-4_ACCEPTED" }),
  record("projects-portfolio", "ALREADY_COMPLIANT", { activeSurface: "/curriculum.html#/portfolio", reason: "Existing artifact/portfolio surface is bounded and does not duplicate Studio authority." }),
  record("credentials-progress", "ALREADY_COMPLIANT", { activeSurface: "/curriculum.html#/progress", reason: "Existing progress/credential presentation preserves earned versus pending semantics." }),
  record("calendar-live-learning", "ALREADY_COMPLIANT", { activeSurface: "/curriculum.html#/calendar", reason: "Calendar and live-session routes are active; event/attendance authority remains domain-owned." }),
  record("learning-arcade", "ALREADY_COMPLIANT", { activeSurface: "/arcade.html#/dashboard", reason: "Arcade remains a bounded learning/play surface with no invented mastery authority." }),
  record("shf-public-impact", "PUBLIC_ACCEPTED", { activeSurface: "/foundation.html#/impact", publicSafety: "PUBLIC_APPROVED_PROJECTIONS_ONLY", reason: "Foundation public impact is public-safe and preserves SHF visual direction." }),
  record("organization-onboarding", "SEA4_COMPLETE", { activeSurface: "/civic.html#/operator/onboarding", sea4State: "COMPLETE", browserEvidence: "SEA-4_ACCEPTED" }),
  record("shared-services-network", "ALREADY_COMPLIANT", { activeSurface: "/admin.html#/hub/network", reason: "Existing shared-services/network operator surface remains organization-scoped." }),
  record("civicsure-provider", "SEA4_COMPLETE", { activeSurface: "/civic.html#/civicsure/provider", sea4State: "COMPLETE", browserEvidence: "SEA-4_ACCEPTED" }),
  record("civicsure-operator", "SEA4_COMPLETE", { activeSurface: "/admin.html#/verification-audit", sea4State: "COMPLETE", browserEvidence: "SEA-4_ACCEPTED" }),
  record("civicsure-public", "PUBLIC_ACCEPTED", { activeSurface: "/civic.html#/civicsure", publicSafety: "PUBLIC_PROJECTION_ONLY", reason: "Public CivicSure surface is bounded separately from provider/operator authority." }),
  record("bos-hub", "SEA4_COMPLETE", { activeSurface: "/admin.html#/hub", sea4State: "COMPLETE", browserEvidence: "SEA-4_ACCEPTED" }),
  record("studio", "SEA4_COMPLETE", { activeSurface: "/curriculum.html#/studio", sea4State: "COMPLETE", browserEvidence: "SEA-4_ACCEPTED" }),
  record("service-catalog", "ALREADY_COMPLIANT", { activeSurface: "/admin.html#/registry", reason: "Registry/entitlement administration is bounded platform capability, not a new dashboard authority." }),
  record("agent-fabric", "SEA4_COMPLETE", { activeSurface: "/admin.html#/agent-fabric", sea4State: "COMPLETE", browserEvidence: "SEA-4_ACCEPTED" }),
  record("arag-1", "SEA4_COMPLETE", { activeSurface: "/admin.html#/release-assurance", sea4State: "COMPLETE", browserEvidence: "SEA-4_ACCEPTED" }),
  record("oas", "PUBLIC_ACCEPTED", { activeSurface: "/oas.html", publicSafety: "PUBLIC_DOCUMENTATION_ONLY", reason: "Locked OAS Venus direction is preserved; no service dashboard is invented." }),
  record("autonomous-registry", "EXTERNAL_DEPENDENCY", { activeSurface: "external:autonomous-registry", contract: false, browserRequirement: "EXTERNAL_SURFACE", reason: "No repository-local product surface is available to roll out." }),
  record("trust-bureau", "NOT_PRODUCTIZED", { contract: false, browserRequirement: "NOT_APPLICABLE", reason: "SEA-0 found no active productized Trust Bureau surface." }),
  record("dgal", "ALREADY_COMPLIANT", { activeSurface: "/admin.html#/documentation", reason: "DGAL owns document, requirement, acknowledgment, signature, packet, and retention semantics." }),
  record("ogl", "SEA4_COMPLETE", { activeSurface: "/admin.html#/orientation", sea4State: "COMPLETE", browserEvidence: "OGL_COMPLETE" }),
  record("legal", "PLATFORM_NO_DASHBOARD", { activeSurface: "/admin.html#/documentation", reason: "Legal authority is platform/governance capability; SEA does not create a Legal dashboard." }),
  record("truth-spine", "PLATFORM_NO_DASHBOARD", { activeSurface: "/admin.html#/truth-spine", reason: "Truth Spine semantics remain frozen; SEA only preserves source-qualified display." }),
  record("oracle", "PLATFORM_NO_DASHBOARD", { activeSurface: "/admin.html#/oracle", reason: "Oracle remains an authority/infrastructure capability, not a generic dashboard candidate." }),
  record("reporting-metric-registry", "ALREADY_COMPLIANT", { activeSurface: "/admin.html#/reporting", reason: "Reporting and Metric Registry surfaces preserve source, freshness, verification, and public-approval semantics." }),
  record("executive-command", "SEA4_COMPLETE", { activeSurface: "/admin.html#/ops/executive-command", sea4State: "COMPLETE", browserEvidence: "SEA-4_ACCEPTED" }),
  record("treasury-funding", "ALREADY_COMPLIANT", { activeSurface: "/treasury.html#/dashboard", reason: "Existing Treasury surface remains bounded to source-qualified funding/obligation context; no accounting or payment authority is added." }),
  record("employer", "ALREADY_COMPLIANT", { activeSurface: "/employer.html#/dashboard", reason: "Employer remains a bounded supported experience; unsupported aspirational recruiting authority is not exposed." }),
  record("sales-pipeline", "ALREADY_COMPLIANT", { activeSurface: "/sales.html#/dashboard", reason: "Sales remains a bounded pipeline/work surface; SEA does not expand CRM authority." }),
  record("store-marketplace", "ALREADY_COMPLIANT", { activeSurface: "/store.html#/catalog", reason: "Store/Catalog preserves packaged add-on distinction without inventing payment authority." }),
  record("credit-debt", "ALREADY_COMPLIANT", { activeSurface: "/credit.html#/dashboard", reason: "Credit/Debt remains an educational/support surface with honest source states." }),
  record("ai-job-compass", "ALREADY_COMPLIANT", { activeSurface: "/ai.html#/job-compass", reason: "AI Job Compass remains exploratory and does not claim labor-market authority or verified job outcomes." }),
  record("external-proof-verifier", "PUBLIC_ACCEPTED", { activeSurface: "/verifier.html", publicSafety: "PUBLIC_PROOF_SCOPE_ONLY", reason: "External proof verification is bounded to its public verification purpose." }),
  record("universe", "PUBLIC_ACCEPTED", { activeSurface: "/universe", publicSafety: "PUBLIC_REGISTRY_PROJECTIONS_ONLY", reason: "Universe cinematic direction and destination relationships are preserved." }),
  record("allocation-impact", "DEFER_TO_EXR", { activeSurface: "/allocation.html", exrDependency: "Requires broader ownership, journey, and productization decision before dashboard rollout.", reason: "SEA-0 classified the surface as placeholder/operator concept; SEA-5 does not manufacture institutional authority." }),
  record("lord-of-outcomes", "PLATFORM_NO_DASHBOARD", { activeSurface: "/lord-outcomes.html", reason: "Outcomes authority remains platform/concept infrastructure; no SEA dashboard is created without canonical domain state." }),
]);

const contractIds = new Set(SEA_SERVICE_EXPERIENCE_CONTRACTS.map((contract) => contract.serviceId));
const sea4Ids = new Set(SEA4_IMPLEMENTATION_COVERAGE.map((entry) => entry.service));

export function validateSea5Coverage() {
  const errors = [];
  const ids = SEA5_ECOSYSTEM_COVERAGE.map((entry) => entry.serviceId);
  if (new Set(ids).size !== ids.length) errors.push("duplicate service_id");
  for (const entry of SEA5_ECOSYSTEM_COVERAGE) {
    if (!contractIds.has(entry.serviceId) && !["autonomous-registry", "trust-bureau"].includes(entry.serviceId)) errors.push(`${entry.serviceId}: unknown service`);
    if (!SEA5_DISPOSITIONS.includes(entry.disposition)) errors.push(`${entry.serviceId}: invalid disposition`);
    if (entry.disposition === "DEFER_TO_EXR" && !entry.exrDependency) errors.push(`${entry.serviceId}: missing EXR dependency`);
    if (entry.disposition === "NOT_PRODUCTIZED" && !entry.reason) errors.push(`${entry.serviceId}: missing not-productized reason`);
    if (entry.disposition === "PUBLIC_ACCEPTED" && !entry.publicSafety) errors.push(`${entry.serviceId}: missing public safety classification`);
    if (entry.disposition === "SEA4_COMPLETE" && !sea4Ids.has(entry.serviceId) && entry.serviceId !== "ogl") errors.push(`${entry.serviceId}: invalid SEA-4 reference`);
  }
  if (SEA5_ECOSYSTEM_COVERAGE.length !== SEA_SERVICE_EXPERIENCE_CONTRACTS.length) errors.push("coverage does not account for all SEA contracts");
  return errors;
}

export const SEA5_COVERAGE_VALIDATION_ERRORS = Object.freeze(validateSea5Coverage());
