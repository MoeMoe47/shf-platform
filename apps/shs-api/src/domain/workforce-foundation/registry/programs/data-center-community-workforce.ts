// Phase 7 — Silicon Heartland Data Center Community & Workforce Initiative (first registered ProgramPackage).
//
// The Data Center reference implementation proves the shared workforce platform. It does not create a Data
// Center-specific software authority. Every reference below points at a canonical record owned elsewhere:
//   owning organization  org_shf_001 (seeded Silicon Heartland Foundation)
//   operational program  data-center-specialization-11 (the id already used by the programs domain; no programs row
//                        is seeded yet, so it is reported unresolved rather than invented)
//   curriculum           course stable key "data-center" (the import aggregate of all seven data-center-* folders)
//   Arcade               experience.learning.data-center-cooling-incident → arcade_activity_data_center_cooling_incident_v1
//   Mission              data-center-cooling-failure-response v1 (published through Mission Content)
//   MOL                  power-grid (SIMULATED, CONTRACT_DEFINED), data-center (UNAVAILABLE, PLANNED)
//   career / competency  career_data_center_technician, competency_prepare_prove_monitoring_finding (seeded)
//   reporting            foundation.data-center-ai-infrastructure-pathway (existing report profile)
//   sensory              Data Center sensory profile (Phase 7, references only)
// Honest gaps: no confirmed employer/partner organization (employer validation outreach is NOT REVIEWED), no
// external credential authority, no funding source records, no client Mission player. Lifecycle therefore stays
// INTEGRATION_READINESS.
// Simulation completion does not establish credential attainment, employment eligibility, or verified mastery.
import type { FundabilityComponent } from "../../model/readiness-and-fundability.js";
import type { WorkforceProgramModule } from "../program-module.js";
import { WORKFORCE_CAPABILITIES, type CapabilityDeclaration, type ProgramPackage, type WorkforceCapability } from "../../model/workforce-foundation.js";

// Capability requirement (schemaVersion 2). Required platform capabilities must be supplied LIVE and block when
// unmet; optional ones degrade. Provider authority is always the registered authority for the capability.
const capability = (id: WorkforceCapability, required: boolean, maturity: string, extra: Partial<CapabilityDeclaration> = {}): CapabilityDeclaration => ({
  capability: id, required, maturity, minimumMaturity: maturity, providerAuthority: WORKFORCE_CAPABILITIES[id], allowedProviderModes: ["LIVE"],
  fallbackPolicy: required ? "NONE" : "OMIT", degradationPolicy: required ? "BLOCK" : "DEGRADE", acceptanceRef: null,
  fundingBucket: "SHARED_INFRASTRUCTURE", ...extra,
});

export const DATA_CENTER_PROGRAM_ID = "DATA_CENTER_COMMUNITY_WORKFORCE";

export const DATA_CENTER_COMMUNITY_WORKFORCE_PACKAGE: ProgramPackage = {
  schemaVersion: 2,
  program: {
    programId: DATA_CENTER_PROGRAM_ID,
    name: "Silicon Heartland Data Center Community & Workforce Initiative",
    lifecycle: "INTEGRATION_READINESS",
    programType: "workforce",
    owningOrganizationId: "org_shf_001",
    authorityOwner: "Silicon Heartland Foundation — Data Center Community & Workforce Initiative",
    geography: "Central Ohio (Silicon Heartland region)",
    audience: "Grades 7-12 learners, adult learners and community members",
    operationalProgramId: "data-center-specialization-11",
    // Every world capability it uses is a SIMULATED stand-in (power-grid) or unavailable (data-center).
    executionLevel: "STANDALONE",
  },
  curriculumRefs: [{ courseStableKey: "data-center" }],
  arcadeExperienceRefs: [{ experienceId: "experience.learning.data-center-cooling-incident" }],
  missionRefs: [{ missionId: "data-center-cooling-failure-response", missionVersion: 1, roleRequirements: ["FACILITY_TECHNICIAN", "ELECTRICAL_TECHNICIAN"], worldCapabilities: ["POWER_CONTEXT"] }],
  metaverseRefs: [{ molSystemId: "power-grid" }, { molSystemId: "data-center" }],
  destinationRefs: [{ destinationId: "main-data-center" }, { destinationId: "cooling-mechanical-plant" }, { destinationId: "power-electrical-facility" }],
  careerRefs: [{ careerId: "career_data_center_technician" }],
  competencyRefs: [{ competencyId: "competency_prepare_prove_monitoring_finding" }],
  capabilityRefs: [
    capability("CURRICULUM_DELIVERY", true, "PARTIAL"),
    capability("LEARNING_ARCADE", true, "PARTIAL"),
    capability("MISSION_SIMULATION", true, "PARTIAL"),
    capability("MULTIPLAYER", true, "PARTIAL"),
    // The Data Center environment is PLANNED in MOL; power context is a SIMULATED provider. Never above PLANNED here.
    capability("METAVERSE_ENVIRONMENT", false, "PLANNED", { molSystemIds: ["power-grid", "data-center"], allowedProviderModes: ["SIMULATED"],
      fallbackPolicy: "SIMULATED_STAND_IN", fundingBucket: "DESTINATION_PROGRAM" }),
    capability("EVIDENCE_CAPTURE", true, "PARTIAL"),
    capability("CAREER_MAPPING", true, "LIVE"),
    capability("EMPLOYER_CONNECTION", false, "PLANNED", { fundingBucket: "DESTINATION_PROGRAM" }),
    capability("CREDENTIAL_BRIDGE", false, "PLANNED", { fundingBucket: "DESTINATION_PROGRAM" }),
    capability("ACCESSIBILITY", true, "PARTIAL"),
    capability("REPORTING", true, "PARTIAL"),
    capability("MOCC_VISIBILITY", false, "CONTRACT_DEFINED"),
  ],
  evidenceRequirements: [
    { requirementType: "INDIVIDUAL_DEMONSTRATION", competencyId: "competency_prepare_prove_monitoring_finding" },
    { requirementType: "TEAM_PERFORMANCE_CONTEXT", competencyId: null },
    { requirementType: "SUPERVISOR_VERIFICATION", competencyId: "competency_prepare_prove_monitoring_finding" },
  ],
  authorityRefs: [
    { domain: "program", owner: "Silicon Heartland Foundation — Data Center Community & Workforce Initiative", external: false, levels: ["ADVISE", "TEACH", "SUPERVISE"],
      mayRead: ["curriculum", "careers", "arcade", "missions", "reporting"], mayRequest: ["mission start", "curriculum import"], mayVerify: [],
      mayNotControl: ["evidence", "truth", "credential issuance", "hiring", "funding eligibility"] },
    { domain: "evidence", owner: "verified-evidence", external: false, levels: ["VERIFY"],
      mayRead: ["arcade results", "mission evidence candidates"], mayRequest: [], mayVerify: ["institutional evidence"], mayNotControl: ["certification", "employment"] },
    { domain: "career", owner: "careers", external: false, levels: ["ADVISE"],
      mayRead: ["career pathways"], mayRequest: [], mayVerify: [], mayNotControl: ["hiring", "job eligibility"] },
    { domain: "hiring", owner: "Employer (not yet identified)", external: true, levels: ["VERIFY"],
      mayRead: ["career pathway"], mayRequest: [], mayVerify: ["employer qualification"], mayNotControl: ["learner evidence", "credentials", "curriculum"] },
  ],
  // No external credential authority is identified in canonical data; none is invented.
  credentialAuthorityRefs: [],
  // No funding source records exist for this program; none is invented. See docs for the owner decision needed.
  fundingRefs: [],
  accessibilityRequirements: ["KEYBOARD", "CAPTIONS", "VISUAL_ALERTS", "REDUCED_MOTION", "NO_FLASHING", "SCREEN_READER"],
  // Employer validation outreach exists in docs but is NOT REVIEWED and no organization record exists.
  partnerRefs: [],
  reportingRequirements: [
    { metric: "PARTICIPATION", kind: "OPERATIONAL_METRIC", reportProfileKey: "foundation.data-center-ai-infrastructure-pathway" },
    { metric: "COMPLETION", kind: "OPERATIONAL_METRIC", reportProfileKey: "foundation.data-center-ai-infrastructure-pathway" },
    { metric: "DEMONSTRATION", kind: "VERIFIED_INSTITUTIONAL_TRUTH", reportProfileKey: "foundation.data-center-ai-infrastructure-pathway" },
    { metric: "EVIDENCE", kind: "VERIFIED_INSTITUTIONAL_TRUTH", reportProfileKey: "foundation.data-center-ai-infrastructure-pathway" },
    { metric: "CAREER_CONNECTION", kind: "OPERATIONAL_METRIC", reportProfileKey: "foundation.data-center-ai-infrastructure-pathway" },
    { metric: "CREDENTIAL_PROGRESSION", kind: "VERIFIED_INSTITUTIONAL_TRUTH", reportProfileKey: "foundation.data-center-ai-infrastructure-pathway" },
  ],
  dependencyRefs: [
    { dependencyId: "dep.curriculum-import", type: "CURRICULUM_PACKAGE", required: true, status: "AVAILABLE", owner: "curriculum",
      fallback: null, constraints: "Course stable key data-center must be imported in the owning organization." },
    { dependencyId: "dep.mol-power-grid", type: "METAVERSE_ENGINE", required: true, status: "AVAILABLE", owner: "mol",
      fallback: null, constraints: "SIMULATED provider only; the Mission explicitly allows simulated context." },
    { dependencyId: "dep.mol-data-center", type: "METAVERSE_ENGINE", required: false, status: "UNAVAILABLE", owner: "mol",
      fallback: "Mission runs on simulated power context; data-center context is reported unavailable.", constraints: "MOL data-center system is PLANNED with no provider." },
    { dependencyId: "dep.cooling-context", type: "CAPABILITY", required: false, status: "UNAVAILABLE", owner: "mol",
      fallback: "Cooling state is Mission-declared scenario content.", constraints: "No MOL cooling system exists." },
    { dependencyId: "dep.employer-validation", type: "EMPLOYER", required: true, status: "PLANNED", owner: "employer",
      fallback: null, constraints: "Employer validation outreach is prepared but NOT REVIEWED." },
    { dependencyId: "dep.client-mission-player", type: "SYSTEM", required: true, status: "PLANNED", owner: "arcade",
      fallback: null, constraints: "Launch works through the Arcade Integration Fabric API; no client Mission player exists yet." },
    { dependencyId: "dep.credential-authority", type: "CREDENTIALING_BODY", required: false, status: "UNKNOWN", owner: "external",
      fallback: "Program completes without a credential bridge.", constraints: "No external credential authority identified." },
    { dependencyId: "dep.funding", type: "FUNDING_SOURCE", required: false, status: "UNKNOWN", owner: "funding",
      fallback: "Program design proceeds without funding claims.", constraints: "No funding source records exist." },
  ],
  integrationReadiness: {
    CURRICULUM: { answer: "ANSWERED" }, ARCADE: { answer: "ANSWERED" }, MISSIONS: { answer: "ANSWERED" }, METAVERSE: { answer: "ANSWERED" },
    EVIDENCE: { answer: "ANSWERED" }, CAREER: { answer: "ANSWERED" }, ACCESSIBILITY: { answer: "ANSWERED" },
    CAPABILITY_MATURITY: { answer: "ANSWERED" }, BLOCKING_DEPENDENCIES: { answer: "ANSWERED" },
    EXTERNAL_CREDENTIAL_AUTHORITY: { answer: "GAP" }, PARTNERS: { answer: "GAP" }, FUNDING_LANES: { answer: "GAP" },
  },
  governanceRefs: [{ refType: "DOCUMENT", ref: "docs/workforce/DATA_CENTER_REFERENCE_IMPLEMENTATION.md" }],
  sensoryRefs: {
    soundProfileRef: "sound-profile.data-center",
    celebrationProfileRef: "celebration-profile.data-center",
    environmentAudioProfileRef: "environment-audio.main-data-center",
    sensoryPolicyRef: "policy.data-center-training",
  },
};

// Explicit fundability assessment inputs for the Phase 6.5 gate, with the basis for each criterion.
// Derived values (funding lanes, blocking dependencies, readiness) are computed by the gate, not asserted here.
export const DATA_CENTER_FUNDABILITY_ASSESSMENT: { component: FundabilityComponent; basis: Record<string, string> } = {
  component: {
    componentId: "data-center-community-workforce", bucket: "DESTINATION_PROGRAM",
    workforceRelevance: "PARTIAL", measurableOutcomes: "MET", evidencePathway: "MET", employerRelevance: "PARTIAL", authorityClarity: "PARTIAL",
    implementationRisk: "MEDIUM", reuseProgramCount: 1,
  },
  basis: {
    workforceRelevance: "Canonical career record exists; no regional labor-market evidence is recorded in canonical data.",
    measurableOutcomes: "Existing report profile defines participation, progress, evidence and career-outcome sections.",
    evidencePathway: "Seeded competency requires review; Mission and Arcade produce non-verified candidates for the Evidence authority.",
    employerRelevance: "Employer validation outreach is prepared but NOT REVIEWED; no employer organization record exists.",
    authorityClarity: "Program, evidence and career authorities are declared; no external credential issuer is identified.",
    implementationRisk: "Platform paths exist; the Data Center MOL environment and a client Mission player are not built.",
    reuseProgramCount: "Only this program uses the package today.",
  },
};

// Program module (Phase 8): the package, its assessment, and references to authority-owned artifacts only.
export const DATA_CENTER_PROGRAM_MODULE: WorkforceProgramModule = {
  package: DATA_CENTER_COMMUNITY_WORKFORCE_PACKAGE,
  fundabilityAssessment: DATA_CENTER_FUNDABILITY_ASSESSMENT,
  artifactRefs: {
    arcadeActivityIds: ["arcade_activity_data_center_cooling_incident_v1"],
    arcadeExperienceIds: ["experience.learning.data-center-cooling-incident"],
    missionSources: [{ missionId: "data-center-cooling-failure-response", missionVersion: 1 }],
    sensoryProfileIds: ["sound-profile.data-center", "celebration-profile.data-center", "environment-audio.main-data-center", "policy.data-center-training"],
  },
};
