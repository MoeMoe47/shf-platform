// Phase 8 — TEST-ONLY synthetic program shapes for the Workforce Program Integration Contract.
// These are generic shapes, not programs: they are never registered, carry no domain content, and exist only to prove
// that any program plugs into the same validation, resolution, readiness and lifecycle pipeline.
import { WORKFORCE_CAPABILITIES, type CapabilityDeclaration, type ProgramPackage, type WorkforceCapability } from "../../src/domain/workforce-foundation/model/workforce-foundation.js";

export interface SyntheticRefs {
  organizationId: string;
  courseStableKey: string;
  experienceId: string;
  missionId: string;
  careerId: string;
  competencyId: string;
  partnerOrganizationId: string;
  partnerRelationshipId: string;
  credentialDefinitionId: string;
  fundingSourceIds: [string, string, string];
  serviceKey: string;
  sensoryPolicyId: string;
}

const capability = (id: WorkforceCapability, required: boolean, maturity: string, extra: Partial<CapabilityDeclaration> = {}): CapabilityDeclaration => ({
  capability: id, required, maturity, minimumMaturity: maturity, providerAuthority: WORKFORCE_CAPABILITIES[id], allowedProviderModes: ["LIVE"],
  fallbackPolicy: required ? "NONE" : "OMIT", degradationPolicy: required ? "BLOCK" : "DEGRADE", acceptanceRef: null, fundingBucket: "SHARED_INFRASTRUCTURE", ...extra,
});

const ANSWERED = { answer: "ANSWERED" as const };

// A. COMPLETE — every reference resolves, no blocking dependency, three plausible funding lanes, a CONFIRMED partner
// backed by an ACTIVE organization relationship, an IDENTIFIED external credential authority, HYBRID execution.
export function completeGenericTestProgram(refs: SyntheticRefs, programId = "COMPLETE_GENERIC_TEST_PROGRAM"): ProgramPackage {
  return {
    schemaVersion: 2,
    program: {
      programId, name: "Complete generic test program", lifecycle: "PILOT_READY", programType: "workforce", owningOrganizationId: refs.organizationId,
      authorityOwner: "Test program office", geography: "Test region", audience: "Test learners", operationalProgramId: null, executionLevel: "HYBRID",
    },
    curriculumRefs: [{ courseStableKey: refs.courseStableKey }],
    arcadeExperienceRefs: [{ experienceId: refs.experienceId }],
    missionRefs: [{ missionId: refs.missionId, missionVersion: 1, roleRequirements: ["FACILITY_TECHNICIAN"], worldCapabilities: ["POWER_CONTEXT"] }],
    // mission-runtime is LIVE and power-grid is a SIMULATED stand-in: a HYBRID program.
    metaverseRefs: [{ molSystemId: "mission-runtime" }, { molSystemId: "power-grid" }],
    destinationRefs: [{ destinationId: "simulation-hall" }],
    careerRefs: [{ careerId: refs.careerId }],
    competencyRefs: [{ competencyId: refs.competencyId }],
    capabilityRefs: [
      capability("CURRICULUM_DELIVERY", true, "LIVE"),
      capability("LEARNING_ARCADE", true, "PARTIAL"),
      capability("MISSION_SIMULATION", true, "PARTIAL"),
      capability("METAVERSE_ENVIRONMENT", false, "CONTRACT_DEFINED", { molSystemIds: ["power-grid"], allowedProviderModes: ["SIMULATED"], fallbackPolicy: "SIMULATED_STAND_IN" }),
      capability("EVIDENCE_CAPTURE", true, "PARTIAL"),
      capability("CAREER_MAPPING", true, "LIVE"),
    ],
    evidenceRequirements: [
      { requirementType: "PERFORMANCE_EVENT", competencyId: refs.competencyId },
      { requirementType: "TEAM_PERFORMANCE_CONTEXT", competencyId: null },
      { requirementType: "INSTRUCTOR_VERIFICATION", competencyId: refs.competencyId },
    ],
    authorityRefs: [
      { domain: "program", owner: "Test program office", external: false, levels: ["ADVISE", "TEACH", "SUPERVISE"], mayRead: ["curriculum"], mayRequest: ["mission start"], mayVerify: [], mayNotControl: ["evidence", "credential issuance"] },
      { domain: "credential", owner: "External test credential issuer", external: true, levels: ["ISSUE"], issuanceBasis: { type: "LEGAL", reference: "test:external-issuer" }, mayRead: [], mayRequest: [], mayVerify: ["credential requirements"], mayNotControl: ["curriculum"] },
    ],
    credentialAuthorityRefs: [{ authorityType: "CREDENTIAL_ISSUER", name: "External test credential issuer", status: "IDENTIFIED", credentialDefinitionId: refs.credentialDefinitionId }],
    fundingRefs: refs.fundingSourceIds.map((fundingSourceId) => ({ fundingSourceId, alignment: "POTENTIAL" as const, verification: null, capabilityRefs: ["CURRICULUM_DELIVERY" as const] })),
    accessibilityRequirements: ["KEYBOARD", "CAPTIONS", "REDUCED_MOTION", "NO_FLASHING", "VISUAL_ALERTS"],
    partnerRefs: [{ organizationId: refs.partnerOrganizationId, role: "EMPLOYER", status: "CONFIRMED", relationshipRef: { kind: "ORGANIZATION_RELATIONSHIP", id: refs.partnerRelationshipId } }],
    reportingRequirements: [{ metric: "PARTICIPATION", kind: "OPERATIONAL_METRIC", reportProfileKey: null }],
    dependencyRefs: [{ dependencyId: "dep.curriculum", type: "CURRICULUM_PACKAGE", required: true, status: "AVAILABLE", owner: "curriculum", fallback: null, constraints: "" }],
    integrationReadiness: Object.fromEntries(["CURRICULUM", "ARCADE", "MISSIONS", "METAVERSE", "EVIDENCE", "CAREER", "EXTERNAL_CREDENTIAL_AUTHORITY", "ACCESSIBILITY",
      "PARTNERS", "FUNDING_LANES", "CAPABILITY_MATURITY", "BLOCKING_DEPENDENCIES"].map((question) => [question, ANSWERED])),
    sensoryRefs: { soundProfileRef: null, celebrationProfileRef: null, environmentAudioProfileRef: null, sensoryPolicyRef: refs.sensoryPolicyId },
    governanceRefs: [{ refType: "DOCUMENT", ref: "docs/workforce/WORKFORCE_PROGRAM_INTEGRATION_CONTRACT.md" }, { refType: "SERVICE_ENTITLEMENT", ref: refs.serviceKey }],
  };
}

// B. PARTIAL — optional systems and dependencies unavailable: must degrade, not block.
export function partialGenericTestProgram(refs: SyntheticRefs): ProgramPackage {
  const value = completeGenericTestProgram(refs, "PARTIAL_GENERIC_TEST_PROGRAM");
  value.program.name = "Partial generic test program";
  value.capabilityRefs = value.capabilityRefs.map((cap) => cap.capability === "METAVERSE_ENVIRONMENT"
    ? { ...cap, maturity: "PLANNED", minimumMaturity: "PLANNED", molSystemIds: ["power-grid", "data-center"] } : cap);
  value.dependencyRefs.push({ dependencyId: "dep.optional-engine", type: "METAVERSE_ENGINE", required: false, status: "UNAVAILABLE", owner: "mol", fallback: "Runs without it.", constraints: "" });
  return value;
}

// C. BLOCKED — a required dependency is unavailable, a required capability is below its minimum maturity and no partner
// is confirmed: it must never become pilot-ready.
export function blockedGenericTestProgram(refs: SyntheticRefs): ProgramPackage {
  const value = completeGenericTestProgram(refs, "BLOCKED_GENERIC_TEST_PROGRAM");
  value.program.name = "Blocked generic test program";
  value.capabilityRefs = value.capabilityRefs.map((cap) => cap.capability === "MISSION_SIMULATION" ? { ...cap, minimumMaturity: "LIVE" } : cap);
  value.dependencyRefs.push({ dependencyId: "dep.required-authority", type: "EXTERNAL_AUTHORITY", required: true, status: "UNAVAILABLE", owner: "external", fallback: null, constraints: "" });
  value.partnerRefs = [{ organizationId: refs.partnerOrganizationId, role: "EMPLOYER", status: "DECLARED", relationshipRef: null }];
  return value;
}

// D. MALFORMED — each variant must fail validation (closed).
export function malformedGenericTestPrograms(refs: SyntheticRefs): Record<string, unknown> {
  const base = () => structuredClone(completeGenericTestProgram(refs, "MALFORMED_GENERIC_TEST_PROGRAM")) as any;
  const legacy = base(); delete legacy.schemaVersion; legacy.contractVersion = 1;
  const future = base(); future.schemaVersion = 3;
  const curriculum = base(); curriculum.curriculumRefs = [{ courseStableKey: refs.courseStableKey, lessonBody: "Copied lesson text." }];
  const runtime = base(); runtime.missionRefs = [{ missionId: refs.missionId, missionVersion: 1, runtimeState: { revision: 4 } }];
  const evidence = base(); evidence.evidenceRequirements = [{ requirementType: "PERFORMANCE_EVENT", competencyId: null, verifiedEvidence: { id: "ev_1" } }];
  const learner = base(); learner.program.learnerId = "user_123";
  const duplicates = base(); duplicates.careerRefs = [{ careerId: refs.careerId }, { careerId: refs.careerId }];
  const award = base(); award.fundingRefs[0].awardAmount = 50000;
  const accommodation = base(); accommodation.accessibilityRequirements = ["CAPTIONS", "extended time for learner 123"];
  const secret = base(); secret.governanceRefs = [{ refType: "DOCUMENT", ref: "docs/x.md", apiKey: "sk-123" }];
  const latest = base(); latest.missionRefs = [{ missionId: refs.missionId, missionVersion: "latest" }];
  return { legacy, future, curriculum, runtime, evidence, learner, duplicates, award, accommodation, secret, latest };
}
