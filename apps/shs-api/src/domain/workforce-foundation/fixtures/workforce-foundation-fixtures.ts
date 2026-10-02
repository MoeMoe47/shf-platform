// Phase 6.5 — GENERIC reference fixture that proves the foundation. Test/reference only: it is never
// registered in WORKFORCE_PROGRAM_PACKAGES, carries no Data Center content, and every external authority,
// partner and funding relationship is a placeholder or POTENTIAL — nothing here is a real claim.
import type { FundingSource, ProgramPackage } from "../model/workforce-foundation.js";

export interface FoundationFixtureRefs {
  owningOrganizationId: string;
  operationalProgramId: string | null;
  courseId: string;
  experienceId: string;
  missionId: string;
  missionVersion: number;
  careerId: string;
  competencyId: string;
  partnerOrganizationId: string;
  fundingSourceIds: { grant: string; workforce: string; employer: string; philanthropy: string };
}

export function genericFundingSourceFixtures(ids: FoundationFixtureRefs["fundingSourceIds"]): FundingSource[] {
  const base = { jurisdiction: "Generic region", eligibleProgramTypes: ["workforce"], eligibleCostCategories: ["instruction"], matchRequired: "UNKNOWN" as const,
    reportingRequirements: ["participation"], status: "UNKNOWN" as const, evidenceRequirements: ["enrollment records"] };
  return [
    { ...base, fundingSourceId: ids.grant, name: "Generic public grant category", sourceType: "GRANT", authority: "Granting agency (placeholder)" },
    { ...base, fundingSourceId: ids.workforce, name: "Generic workforce funding category", sourceType: "WORKFORCE", authority: "Workforce board (placeholder)" },
    { ...base, fundingSourceId: ids.employer, name: "Generic employer contribution category", sourceType: "EMPLOYER", authority: "Employer (placeholder)" },
    { ...base, fundingSourceId: ids.philanthropy, name: "Generic philanthropy category", sourceType: "PHILANTHROPY", authority: "Foundation (placeholder)" },
  ];
}

export function infrastructureTechFoundationFixture(refs: FoundationFixtureRefs): ProgramPackage {
  return {
    contractVersion: 1,
    program: {
      programId: "PROGRAM_INFRASTRUCTURE_TECH_FOUNDATION", name: "Infrastructure Technician Foundation (generic reference)", lifecycle: "INTEGRATION_READINESS",
      programType: "workforce", owningOrganizationId: refs.owningOrganizationId, authorityOwner: "Owning organization program office",
      geography: "Generic region", audience: "Adult and secondary learners", operationalProgramId: refs.operationalProgramId,
    },
    curriculumRefs: [{ courseId: refs.courseId }],
    arcadeExperienceRefs: [{ experienceId: refs.experienceId }],
    missionRefs: [{ missionId: refs.missionId, missionVersion: refs.missionVersion }],
    metaverseRefs: [{ molSystemId: "power-grid" }],
    careerRefs: [{ careerId: refs.careerId }],
    competencyRefs: [{ competencyId: refs.competencyId }],
    capabilityRefs: [
      { capability: "CURRICULUM_DELIVERY", required: true, maturity: "LIVE", acceptanceRef: null, fundingBucket: "SHARED_INFRASTRUCTURE" },
      { capability: "LEARNING_ARCADE", required: true, maturity: "PARTIAL", acceptanceRef: null, fundingBucket: "SHARED_INFRASTRUCTURE" },
      { capability: "MISSION_SIMULATION", required: true, maturity: "PARTIAL", acceptanceRef: null, fundingBucket: "SHARED_INFRASTRUCTURE" },
      // Simulated infrastructure capability: MOL provides power-grid only through a SIMULATED provider at
      // CONTRACT_DEFINED maturity, so the program cannot honestly declare more than CONTRACT_DEFINED.
      { capability: "METAVERSE_ENVIRONMENT", required: false, maturity: "CONTRACT_DEFINED", acceptanceRef: null, molSystemIds: ["power-grid"], fundingBucket: "DESTINATION_PROGRAM" },
      { capability: "EVIDENCE_CAPTURE", required: true, maturity: "PARTIAL", acceptanceRef: null, fundingBucket: "SHARED_INFRASTRUCTURE" },
      { capability: "CAREER_MAPPING", required: true, maturity: "LIVE", acceptanceRef: null, fundingBucket: "SHARED_INFRASTRUCTURE" },
      { capability: "CREDENTIAL_BRIDGE", required: false, maturity: "CONTRACT_DEFINED", acceptanceRef: null, fundingBucket: "DESTINATION_PROGRAM" },
    ],
    evidenceRequirements: [
      { requirementType: "INDIVIDUAL_DEMONSTRATION", competencyId: refs.competencyId },
      { requirementType: "TEAM_PERFORMANCE_CONTEXT", competencyId: null },
      { requirementType: "EXTERNAL_CREDENTIAL_VERIFICATION", competencyId: null },
    ],
    authorityRefs: [
      { domain: "program", owner: "Owning organization program office", external: false, levels: ["ADVISE", "TEACH", "SUPERVISE"],
        mayRead: ["curriculum", "careers", "arcade", "missions"], mayRequest: ["mission start"], mayVerify: [], mayNotControl: ["evidence", "truth", "credential issuance", "hiring"] },
      { domain: "evidence", owner: "verified-evidence", external: false, levels: ["VERIFY"],
        mayRead: ["arcade results", "mission evidence candidates"], mayRequest: [], mayVerify: ["institutional evidence"], mayNotControl: ["certification"] },
      { domain: "credential", owner: "External credential issuer (placeholder)", external: true, levels: ["ISSUE"], issuanceBasis: { type: "LEGAL", reference: "placeholder:external-issuer-statute" },
        mayRead: ["verified evidence summaries"], mayRequest: [], mayVerify: ["credential requirements"], mayNotControl: ["curriculum", "program design"] },
      { domain: "hiring", owner: "Employer", external: true, levels: ["VERIFY"],
        mayRead: ["career pathway"], mayRequest: [], mayVerify: ["employer qualification"], mayNotControl: ["learner evidence", "credentials"] },
    ],
    credentialAuthorityRefs: [{ authorityType: "CREDENTIAL_ISSUER", name: "External credential issuer (placeholder)", status: "PLACEHOLDER", credentialDefinitionId: null }],
    fundingRefs: [
      { fundingSourceId: refs.fundingSourceIds.grant, alignment: "POTENTIAL", verification: null, capabilityRefs: ["CURRICULUM_DELIVERY", "LEARNING_ARCADE"] },
      { fundingSourceId: refs.fundingSourceIds.workforce, alignment: "POTENTIAL", verification: null, capabilityRefs: ["CAREER_MAPPING"] },
      { fundingSourceId: refs.fundingSourceIds.employer, alignment: "POTENTIAL", verification: null, capabilityRefs: ["MISSION_SIMULATION"] },
      { fundingSourceId: refs.fundingSourceIds.philanthropy, alignment: "UNKNOWN", verification: null, capabilityRefs: ["ACCESSIBILITY"] },
    ],
    accessibilityRequirements: ["keyboard operable", "captions for media", "reduced motion option"],
    partnerRefs: [{ organizationId: refs.partnerOrganizationId, role: "EMPLOYER_PARTNER", status: "DECLARED", agreementRef: null }],
    reportingRequirements: [
      { metric: "PARTICIPATION", kind: "OPERATIONAL_METRIC", reportProfileKey: null },
      { metric: "DEMONSTRATION", kind: "VERIFIED_INSTITUTIONAL_TRUTH", reportProfileKey: null },
      { metric: "EMPLOYMENT_OUTCOME", kind: "VERIFIED_INSTITUTIONAL_TRUTH", reportProfileKey: null },
    ],
    dependencyRefs: [
      { dependencyId: "dep.curriculum-course", type: "CURRICULUM_PACKAGE", required: true, status: "AVAILABLE", owner: "curriculum", fallback: null, constraints: "Course published in the owning organization." },
      { dependencyId: "dep.power-grid-simulation", type: "METAVERSE_ENGINE", required: false, status: "DEGRADED", owner: "mol", fallback: "Mission runs with simulated world context.", constraints: "No live power-grid engine." },
      { dependencyId: "dep.credential-issuer", type: "CREDENTIALING_BODY", required: false, status: "UNKNOWN", owner: "external", fallback: "Program completes without credential bridge.", constraints: "Issuer not yet identified." },
    ],
    integrationReadiness: {
      CURRICULUM: { answer: "ANSWERED" }, ARCADE: { answer: "ANSWERED" }, MISSIONS: { answer: "ANSWERED" }, METAVERSE: { answer: "ANSWERED" },
      EVIDENCE: { answer: "ANSWERED" }, CAREER: { answer: "ANSWERED" }, EXTERNAL_CREDENTIAL_AUTHORITY: { answer: "ANSWERED" },
      ACCESSIBILITY: { answer: "ANSWERED" }, PARTNERS: { answer: "ANSWERED" }, FUNDING_LANES: { answer: "ANSWERED" },
      CAPABILITY_MATURITY: { answer: "ANSWERED" }, BLOCKING_DEPENDENCIES: { answer: "ANSWERED" },
    },
  };
}
