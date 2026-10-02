// Phase 6.5 — deterministic integration readiness, lifecycle gates and the BUILD/HOLD/REJECT fundability gate.
// Pure rules over declared contracts and resolved references. No AI scoring, no numeric ranking, no claim of
// funding eligibility, employment, credential attainment or job readiness.
import {
  FUNDING_BUCKETS, INTEGRATION_READINESS_QUESTIONS, PROGRAM_LIFECYCLE, executionLevelRank, maturityRank,
  type ExecutionLevel, type IntegrationReadinessQuestion, type ProgramLifecycle, type ProgramPackage,
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

// Phase 8 — capability requirement contract. Effective maturity is the declared maturity capped by every providing
// MOL system; each providing system must supply the capability in an allowed provider mode. Unmet requirements
// block when the capability is required with a BLOCK policy, and degrade otherwise.
export function capabilityRequirementIssues(pkg: ProgramPackage, facts: Pick<ProgramResolutionFacts, "molSystems">) {
  const issues: Array<{ capability: string; reason: string; effect: "BLOCKING" | "DEGRADED" }> = [];
  for (const declaration of pkg.capabilityRefs) {
    const effect = declaration.required && declaration.degradationPolicy === "BLOCK" ? "BLOCKING" as const : "DEGRADED" as const;
    const systems = (declaration.molSystemIds ?? []).map((id) => [id, facts.molSystems[id]] as const);
    const ranks = [maturityRank(declaration.maturity), ...systems.map(([, system]) => (system ? maturityRank(system.maturity) : -1))];
    if (Math.min(...ranks) < maturityRank(declaration.minimumMaturity)) issues.push({ capability: declaration.capability, reason: "MINIMUM_MATURITY_UNMET", effect });
    for (const [id, system] of systems) {
      if (!system) issues.push({ capability: declaration.capability, reason: `MOL_SYSTEM_UNRESOLVED:${id}`, effect });
      else if (system.mode === "UNAVAILABLE") issues.push({ capability: declaration.capability, reason: `PROVIDER_UNAVAILABLE:${id}`, effect });
      else if (!declaration.allowedProviderModes.includes(system.mode)) issues.push({ capability: declaration.capability, reason: `PROVIDER_MODE_NOT_ALLOWED:${id}:${system.mode}`, effect });
    }
  }
  return issues;
}

// Execution level is evaluated from how MOL actually supplies the referenced systems; it is never upgraded.
// Phase 9: LIVING_WORLD requires the Regional Simulation Authority. The authority existing is not enough: the program
// must reference it, the authority must have reached at least PARTIAL maturity, and every referenced system must be
// available. Today the authority is SIMULATED, so no program can honestly evaluate to LIVING_WORLD.
export const REGIONAL_SIMULATION_SYSTEM_ID = "regional-simulation";
export const LIVING_WORLD_MINIMUM_AUTHORITY_MATURITY = "PARTIAL";
export function evaluateExecutionLevel(pkg: ProgramPackage, facts: Pick<ProgramResolutionFacts, "molSystems">) {
  const ids = [...new Set([...pkg.metaverseRefs.map((ref) => ref.molSystemId), ...pkg.capabilityRefs.flatMap((cap) => cap.molSystemIds ?? [])])].sort();
  const modes = ids.map((id) => facts.molSystems[id]?.mode ?? "UNAVAILABLE").filter((mode) => mode !== "UNAVAILABLE");
  const authority = ids.includes(REGIONAL_SIMULATION_SYSTEM_ID) ? facts.molSystems[REGIONAL_SIMULATION_SYSTEM_ID] ?? null : null;
  const livingWorldBlockers = [
    ...(authority ? [] : ["LIVING_WORLD_REQUIRES_REGIONAL_SIMULATION"]),
    ...(authority && maturityRank(authority.maturity) < maturityRank(LIVING_WORLD_MINIMUM_AUTHORITY_MATURITY) ? ["LIVING_WORLD_AUTHORITY_IMMATURE"] : []),
    ...(ids.some((id) => (facts.molSystems[id]?.mode ?? "UNAVAILABLE") === "UNAVAILABLE") ? ["LIVING_WORLD_SYSTEMS_UNAVAILABLE"] : []),
  ];
  const evaluated: ExecutionLevel = !livingWorldBlockers.length ? "LIVING_WORLD" : modes.includes("LIVE") || modes.includes("HYBRID") ? "HYBRID" : "STANDALONE";
  const issues: string[] = [];
  if (executionLevelRank(pkg.program.executionLevel) > executionLevelRank(evaluated)) issues.push("EXECUTION_LEVEL_OVERSTATED");
  if (pkg.program.executionLevel === "LIVING_WORLD") issues.push(...livingWorldBlockers);
  return { declared: pkg.program.executionLevel, evaluated, systems: ids, issues, livingWorldBlockers };
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
  const requirementIssues = capabilityRequirementIssues(pkg, facts);
  const executionLevel = evaluateExecutionLevel(pkg, facts);
  const gaps = questions.filter((item) => item.status === "GAP");
  const blocked = gaps.length || blockingDependencies.length || maturityIssues.length || executionLevel.issues.length
    || requirementIssues.some((issue) => issue.effect === "BLOCKING");
  const degraded = degradedDependencies.length || requirementIssues.some((issue) => issue.effect === "DEGRADED");
  const status: ReadinessStatus = blocked ? "BLOCKED" : degraded ? "DEGRADED" : "READY";
  return { status, questions, gaps: gaps.map((item) => item.question), blockingDependencies, degradedDependencies, maturityIssues, requirementIssues, executionLevel };
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

// Phase 8 — requested vs evaluated lifecycle. A package's declared lifecycle is a request; the evaluated state is the
// highest canonical state its resolved readiness supports, never above the request. PILOT and ACTIVE need an
// activation record, which configuration alone can never provide. SUSPENDED/RETIRED are administrative.
const LIFECYCLE_PATH: ProgramLifecycle[] = ["PLANNED", "DESIGN", "AUTHORITY_REVIEW", "INTEGRATION_READINESS", "PARTNER_VALIDATION", "PILOT_READY", "PILOT", "ACTIVE"];

export function evaluateProgramLifecycle(pkg: ProgramPackage, readiness: ReturnType<typeof evaluateIntegrationReadiness>, context: {
  confirmedPartners: number; internalIssuerUnresolved: boolean; activationRecord?: boolean;
}) {
  const requestedState = pkg.program.lifecycle;
  if (requestedState === "SUSPENDED" || requestedState === "RETIRED") {
    return { requestedState, evaluatedState: requestedState, allowed: true, blockingReasons: [] as string[], gates: [] as Array<{ state: ProgramLifecycle; reasons: string[] }> };
  }
  const reasonsFor = (state: ProgramLifecycle): string[] => {
    switch (state) {
      case "AUTHORITY_REVIEW":
        return pkg.authorityRefs.some((ref) => ref.domain === "program") ? [] : ["PROGRAM_AUTHORITY_NOT_DECLARED"];
      case "INTEGRATION_READINESS":
        return context.internalIssuerUnresolved ? ["INTERNAL_ISSUER_UNRESOLVED"] : [];
      case "PARTNER_VALIDATION":
        return [
          ...(readiness.gaps.length ? ["INTEGRATION_READINESS_GAPS"] : []),
          ...(readiness.maturityIssues.length ? ["CAPABILITY_MATURITY_OVERSTATED"] : []),
          ...readiness.executionLevel.issues,
        ];
      case "PILOT_READY":
        return [
          ...(readiness.blockingDependencies.length ? ["REQUIRED_DEPENDENCIES_BLOCKING"] : []),
          ...(readiness.requirementIssues.some((issue) => issue.effect === "BLOCKING") ? ["CAPABILITY_REQUIREMENTS_UNMET"] : []),
          ...(context.confirmedPartners > 0 ? [] : ["PARTNER_VALIDATION_INCOMPLETE"]),
        ];
      case "PILOT":
      case "ACTIVE":
        return context.activationRecord ? [] : ["ACTIVATION_RECORD_REQUIRED"];
      default:
        return [];
    }
  };
  const gates = LIFECYCLE_PATH.map((state) => ({ state, reasons: reasonsFor(state) }));
  let highest = 0;
  while (highest + 1 < gates.length && gates[highest + 1].reasons.length === 0) highest += 1;
  const requestedIndex = LIFECYCLE_PATH.indexOf(requestedState);
  const allowed = requestedIndex <= highest;
  const blockingReasons = allowed ? [] : [...new Set(gates.slice(highest + 1, requestedIndex + 1).flatMap((gate) => gate.reasons))];
  return { requestedState, evaluatedState: LIFECYCLE_PATH[Math.min(requestedIndex, highest)], allowed, blockingReasons, gates };
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
