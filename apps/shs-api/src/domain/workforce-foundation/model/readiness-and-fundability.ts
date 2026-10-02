// Phase 6.5 — deterministic integration readiness, lifecycle gates and the BUILD/HOLD/REJECT fundability gate.
// Pure rules over declared contracts and resolved references. No AI scoring, no numeric ranking, no claim of
// funding eligibility, employment, credential attainment or job readiness.
import {
  FUNDING_BUCKETS, INTEGRATION_READINESS_QUESTIONS, PROGRAM_LIFECYCLE, maturityRank,
  type IntegrationReadinessQuestion, type ProgramLifecycle, type ProgramPackage,
} from "./workforce-foundation.js";

// What the service learned from the owning authorities. Unknown is never treated as resolved.
export interface ProgramResolutionFacts {
  curriculumResolved: boolean;
  arcadeResolved: boolean;
  missionsResolved: boolean;
  careersResolved: boolean;
  molSystems: Record<string, { mode: string; maturity: string } | null>;
  fundingSourceTypes: Record<string, string | null>;
}

export type ReadinessStatus = "READY" | "DEGRADED" | "BLOCKED";

const NOT_APPLICABLE_FORBIDDEN: IntegrationReadinessQuestion[] = ["ACCESSIBILITY", "CAPABILITY_MATURITY", "BLOCKING_DEPENDENCIES"];

// Honest maturity: SIMULATED is not LIVE, a capability never outranks the systems that provide it,
// and PRODUCTION needs a passed acceptance reference (enforced by the validator).
export function capabilityMaturityIssues(pkg: ProgramPackage, facts: Pick<ProgramResolutionFacts, "molSystems">) {
  const issues: Array<{ capability: string; reason: string }> = [];
  for (const declaration of pkg.capabilityRefs) {
    for (const systemId of declaration.molSystemIds ?? []) {
      const system = facts.molSystems[systemId];
      if (!system) { issues.push({ capability: declaration.capability, reason: `MOL_SYSTEM_UNRESOLVED:${systemId}` }); continue; }
      if (maturityRank(declaration.maturity) > maturityRank(system.maturity)) issues.push({ capability: declaration.capability, reason: `MATURITY_EXCEEDS_SYSTEM:${systemId}` });
      if (maturityRank(declaration.maturity) >= maturityRank("LIVE") && system.mode !== "LIVE") issues.push({ capability: declaration.capability, reason: `SIMULATED_SYSTEM_CANNOT_BE_LIVE:${systemId}` });
    }
  }
  return issues;
}

export function fundingLanes(pkg: ProgramPackage, facts: Pick<ProgramResolutionFacts, "fundingSourceTypes">) {
  const lanes = new Set<string>();
  for (const relationship of pkg.fundingRefs) {
    const type = facts.fundingSourceTypes[relationship.fundingSourceId];
    if (type && relationship.alignment !== "UNKNOWN") lanes.add(type);
  }
  return [...lanes].sort();
}

function supported(question: IntegrationReadinessQuestion, pkg: ProgramPackage, facts: ProgramResolutionFacts): boolean {
  switch (question) {
    case "CURRICULUM": return pkg.curriculumRefs.length > 0 && facts.curriculumResolved;
    case "ARCADE": return pkg.arcadeExperienceRefs.length > 0 && facts.arcadeResolved;
    case "MISSIONS": return pkg.missionRefs.length > 0 && facts.missionsResolved;
    case "METAVERSE": return pkg.metaverseRefs.length > 0 && pkg.metaverseRefs.every((ref) => facts.molSystems[ref.molSystemId] != null);
    case "EVIDENCE": return pkg.evidenceRequirements.length > 0;
    case "CAREER": return pkg.careerRefs.length > 0 && facts.careersResolved;
    case "EXTERNAL_CREDENTIAL_AUTHORITY": return pkg.credentialAuthorityRefs.length > 0;
    case "ACCESSIBILITY": return pkg.accessibilityRequirements.length > 0;
    case "PARTNERS": return pkg.partnerRefs.length > 0;
    case "FUNDING_LANES": return fundingLanes(pkg, facts).length > 0;
    case "CAPABILITY_MATURITY": return pkg.capabilityRefs.length > 0 && capabilityMaturityIssues(pkg, facts).length === 0;
    case "BLOCKING_DEPENDENCIES": return Array.isArray(pkg.dependencyRefs);
  }
}

export function evaluateIntegrationReadiness(pkg: ProgramPackage, facts: ProgramResolutionFacts) {
  const questions = INTEGRATION_READINESS_QUESTIONS.map((question) => {
    const declared = pkg.integrationReadiness[question];
    if (!declared || declared.answer === "GAP") return { question, status: "GAP" as const, reason: declared ? "DECLARED_GAP" : "UNANSWERED" };
    if (declared.answer === "NOT_APPLICABLE") {
      return NOT_APPLICABLE_FORBIDDEN.includes(question)
        ? { question, status: "GAP" as const, reason: "NOT_APPLICABLE_NOT_ALLOWED" }
        : { question, status: "NOT_APPLICABLE" as const, reason: null };
    }
    // A declared answer must be backed by resolvable references, not just asserted.
    return supported(question, pkg, facts) ? { question, status: "ANSWERED" as const, reason: null } : { question, status: "GAP" as const, reason: "DECLARED_ANSWER_UNSUPPORTED" };
  });
  const blockingDependencies = pkg.dependencyRefs.filter((dep) => dep.required && dep.status !== "AVAILABLE").map((dep) => dep.dependencyId);
  // Optional dependencies degrade readiness; they never block it.
  const degradedDependencies = pkg.dependencyRefs.filter((dep) => !dep.required && dep.status !== "AVAILABLE").map((dep) => ({ dependencyId: dep.dependencyId, fallback: dep.fallback }));
  const maturityIssues = capabilityMaturityIssues(pkg, facts);
  const gaps = questions.filter((item) => item.status === "GAP");
  const status: ReadinessStatus = gaps.length || blockingDependencies.length || maturityIssues.length ? "BLOCKED" : degradedDependencies.length ? "DEGRADED" : "READY";
  return { status, questions, gaps: gaps.map((item) => item.question), blockingDependencies, degradedDependencies, maturityIssues };
}

const PATH: ProgramLifecycle[] = ["PLANNED", "DESIGN", "AUTHORITY_REVIEW", "INTEGRATION_READINESS", "PARTNER_VALIDATION", "PILOT_READY", "PILOT", "ACTIVE"];

// Bounded lifecycle: one forward step at a time (Integration Readiness always precedes Partner Validation),
// SUSPENDED from validated/pilot/active states, resume only when not blocked, RETIRED from anywhere.
export function evaluateLifecycleTransition(from: ProgramLifecycle, to: ProgramLifecycle, readiness: ReturnType<typeof evaluateIntegrationReadiness>) {
  const reasons: string[] = [];
  if (!PROGRAM_LIFECYCLE.includes(from) || !PROGRAM_LIFECYCLE.includes(to)) return { allowed: false, reasons: ["LIFECYCLE_UNKNOWN"] };
  if (from === "RETIRED") return { allowed: false, reasons: ["RETIRED_IS_TERMINAL"] };
  if (to === "RETIRED") return { allowed: true, reasons };
  if (to === "SUSPENDED") return ["PARTNER_VALIDATION", "PILOT_READY", "PILOT", "ACTIVE"].includes(from) ? { allowed: true, reasons } : { allowed: false, reasons: ["NOT_SUSPENDABLE"] };
  if (from === "SUSPENDED") {
    if (!["PILOT", "ACTIVE"].includes(to)) reasons.push("RESUME_TARGET_INVALID");
    if (readiness.status === "BLOCKED") reasons.push("READINESS_BLOCKED");
    return { allowed: reasons.length === 0, reasons };
  }
  if (PATH.indexOf(to) !== PATH.indexOf(from) + 1) return { allowed: false, reasons: ["STEP_NOT_ALLOWED"] };
  if (to === "PARTNER_VALIDATION" && readiness.gaps.length) reasons.push("INTEGRATION_READINESS_GAPS");
  if (to === "PILOT_READY" || to === "PILOT" || to === "ACTIVE") {
    if (readiness.gaps.length) reasons.push("INTEGRATION_READINESS_GAPS");
    if (readiness.blockingDependencies.length) reasons.push("REQUIRED_DEPENDENCIES_BLOCKING");
    if (readiness.maturityIssues.length) reasons.push("CAPABILITY_MATURITY_OVERSTATED");
  }
  return { allowed: reasons.length === 0, reasons };
}

export const FUNDABILITY_CRITERION_VALUES = Object.freeze(["MET", "PARTIAL", "NOT_MET", "UNKNOWN"] as const);
export const IMPLEMENTATION_RISKS = Object.freeze(["LOW", "MEDIUM", "HIGH", "UNKNOWN"] as const);
type Criterion = (typeof FUNDABILITY_CRITERION_VALUES)[number];

export interface FundabilityComponent {
  componentId: string;
  bucket: (typeof FUNDING_BUCKETS)[number];
  workforceRelevance: Criterion;
  measurableOutcomes: Criterion;
  evidencePathway: Criterion;
  employerRelevance: Criterion;
  authorityClarity: Criterion;
  implementationRisk: (typeof IMPLEMENTATION_RISKS)[number];
  reuseProgramCount: number;
}

// Conservative: BUILD needs 3+ plausible funding lanes for every bucket. There is no shared-infrastructure exception.
export const FUNDABILITY_RULES = Object.freeze({ buildMinimumLanes: 3 });

// BUILD / HOLD / REJECT with explicit reason codes. The decision is a design gate, never funding odds.
export function evaluateFundabilityGate(component: FundabilityComponent, derived: { fundingLaneCount: number; blockingDependencyCount: number; readinessStatus: ReadinessStatus }) {
  const reasons: string[] = [];
  const qualitative = ["workforceRelevance", "measurableOutcomes", "evidencePathway", "employerRelevance", "authorityClarity"] as const;
  for (const key of qualitative) if (!FUNDABILITY_CRITERION_VALUES.includes(component[key])) reasons.push(`INVALID_${key}`);
  if (!FUNDING_BUCKETS.includes(component.bucket) || !IMPLEMENTATION_RISKS.includes(component.implementationRisk) || !Number.isInteger(component.reuseProgramCount) || component.reuseProgramCount < 0) reasons.push("INVALID_COMPONENT");
  if (reasons.length) return { decision: "REJECT" as const, reasons, eligibilityEstablished: false as const, fundingGuaranteed: false as const };

  const reject: string[] = [];
  if (component.workforceRelevance === "NOT_MET") reject.push("NO_WORKFORCE_NEED");
  if (component.measurableOutcomes === "NOT_MET") reject.push("NO_MEASURABLE_OUTCOME");
  if (component.authorityClarity === "NOT_MET") reject.push("AUTHORITY_UNCLEAR");
  if (component.evidencePathway === "NOT_MET" && component.employerRelevance === "NOT_MET") reject.push("NO_EVIDENCE_OR_EMPLOYER_PATH");
  if (component.implementationRisk === "HIGH" && derived.fundingLaneCount === 0) reject.push("HIGH_RISK_WITHOUT_FUNDING_LANE");
  if (reject.length) return { decision: "REJECT" as const, reasons: reject, eligibilityEstablished: false as const, fundingGuaranteed: false as const };

  const hold: string[] = [];
  for (const key of qualitative) if (component[key] !== "MET") hold.push(`${key.toUpperCase()}_${component[key]}`);
  if (derived.fundingLaneCount < FUNDABILITY_RULES.buildMinimumLanes) hold.push("INSUFFICIENT_FUNDING_LANES");
  if (derived.blockingDependencyCount > 0) hold.push("DEPENDENCIES_NOT_MATURE");
  if (derived.readinessStatus === "BLOCKED") hold.push("INTEGRATION_NOT_READY");
  if (component.implementationRisk === "HIGH" || component.implementationRisk === "UNKNOWN") hold.push(`IMPLEMENTATION_RISK_${component.implementationRisk}`);
  return { decision: hold.length ? "HOLD" as const : "BUILD" as const, reasons: hold, eligibilityEstablished: false as const, fundingGuaranteed: false as const };
}
