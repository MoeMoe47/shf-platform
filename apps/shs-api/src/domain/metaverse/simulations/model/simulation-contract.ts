// MET-13 — Activities, Simulations + District Depth: canonical contract.
//
// A MetaverseSimulationDefinition is a declarative catalog entry, exactly
// like a MET-2 MetaverseActivity (registry/city-registry.ts) — it owns no
// identity, curriculum, assignment, assessment, mission, evidence, career,
// project, team, or enterprise authority. Every simulation's `activityId`
// must resolve 1:1 to a real MET-2 MetaverseActivity so runtime entry keeps
// going through the existing MET-3 unlock projection and MET-5 protected
// entry service unmodified (see runtime/simulation-entry.ts). This file
// only adds the MET-13-specific task/retry/evidence/team/accessibility
// shape on top of that already-protected resource.
//
// `simulationId` and `activityId` are the same string by convention in
// this repository (see simulation-registry.ts) — both fields exist because
// the MET-13 build brief calls for them independently, and a future
// simulation could in principle be a facet of a shared activity, but no
// such split exists yet.

export const SIMULATION_TYPES = [
  "TECHNICAL_SIMULATION",
  "PROJECT_SIMULATION",
  "TEAM_CHALLENGE",
  "SCENARIO",
  "DESIGN_CHALLENGE",
  "OPERATIONS_SIMULATION",
  "CIVIC_SIMULATION",
  "BUSINESS_SIMULATION",
  "ARCADE_CHALLENGE",
  "PROGRAM_ACTIVITY",
  "SIDE_MISSION_ACTIVITY",
  "SHOWCASE_ACTIVITY",
] as const;
export type SimulationType = (typeof SIMULATION_TYPES)[number];

export const SIMULATION_SOURCE_TYPES = [
  "CURRICULUM_LESSON",
  "CURRICULUM_PROOF_ACTIVITY",
  "CAREER_PATHWAY_CONTENT",
  "PROGRAM_CONTENT",
  "SIDE_MISSION_CONTENT",
  "ENTERPRISE_OPERATIONS_CONTEXT",
  "ARCADE_PRACTICE_CONTEXT",
  "ORIGINAL_METAVERSE_SCENARIO",
] as const;
export type SimulationSourceType = (typeof SIMULATION_SOURCE_TYPES)[number];

export const SIMULATION_ASSESSMENT_BOUNDARIES = [
  "PRACTICE",
  "FORMATIVE",
  "SUMMATIVE",
  "PROJECT",
  "EVIDENCE_CANDIDATE_ONLY",
] as const;
export type SimulationAssessmentBoundary = (typeof SIMULATION_ASSESSMENT_BOUNDARIES)[number];

export const SIMULATION_RETRY_POLICIES = [
  "UNLIMITED_PRACTICE",
  "LIMITED_ATTEMPTS",
  "INSTRUCTOR_RELEASED_RETRY",
  "REVIEW_REQUIRED",
  "NO_RETRY",
] as const;
export type SimulationRetryPolicy = (typeof SIMULATION_RETRY_POLICIES)[number];

export const SIMULATION_TEAM_MODES = ["INDIVIDUAL", "TEAM", "EITHER"] as const;
export type SimulationTeamMode = (typeof SIMULATION_TEAM_MODES)[number];

export const SIMULATION_EVIDENCE_OUTPUT_KINDS = [
  "OPERATIONAL_COMPLETION_FACT",
  "ARTIFACT",
  "EVIDENCE_CANDIDATE",
  "REFLECTION_INPUT",
  "PORTFOLIO_CANDIDATE",
  "PROJECT_CONTRIBUTION",
] as const;
export type SimulationEvidenceOutputKind = (typeof SIMULATION_EVIDENCE_OUTPUT_KINDS)[number];

// A simulation may never itself claim these outcomes — canonical evidence /
// assessment / career / civic authority remains outside this domain.
export const SIMULATION_FORBIDDEN_EVIDENCE_OUTPUTS = [
  "VERIFIED_SKILL",
  "CREDENTIAL",
  "COURSE_COMPLETION",
  "CAREER_ELIGIBILITY",
  "JOB_READINESS",
  "CIVIC_AUTHORITY",
] as const;

export interface SimulationTaskStep {
  stepId: string;
  title: string;
  instructions: string;
  expectedAction: string;
  isOptional: boolean;
}

export interface SimulationRetryModel {
  policy: SimulationRetryPolicy;
  maxAttempts: number | null; // null = unlimited or not attempt-bounded (see policy)
  notes: string;
}

export interface SimulationCompletionRules {
  requiresAllRequiredSteps: boolean;
  requiresArtifactSubmission: boolean;
  requiresTeamConsensus: boolean; // only meaningful when teamMode !== INDIVIDUAL
  serverValidated: true; // MET-13 §24: frontend can never itself claim completion
}

export interface SimulationAccessibleAlternative {
  keyboardOperable: true;
  screenReaderEquivalent: true;
  reducedMotionSupported: true;
  colorIndependentState: true;
  nonSpatialAlternative: string; // description of the list/text equivalent for any spatial task
  mobileTabletSupported: true;
  timedInteractionAccommodation: string | null; // required when any step is timed
}

export interface SimulationCareerConnection {
  careerPathwayId: string | null;
  notes: string;
}

export interface SimulationProgramConnection {
  programId: string | null;
  packageIds: string[]; // program packages this simulation may appear in (see program-packages.ts)
  notes: string;
}

export interface SimulationDefinition {
  simulationId: string;
  activityId: string; // must equal a MET-2 MetaverseActivity id
  title: string;
  summary: string;
  districtId: string;
  facilityId: string;
  simulationType: SimulationType;
  sourceType: SimulationSourceType;
  sourceRef: string; // canonical content/path this simulation is grounded in; never fabricated
  isFlagship: boolean;
  programId: string | null; // MET-13 §2: never required
  careerPathwayId: string | null; // MET-13 §2: never required
  lessonId: string | null;
  assignmentId: string | null;
  missionProjectionId: string | null;
  difficulty: "INTRODUCTORY" | "STANDARD" | "ADVANCED";
  participationMode: SimulationTeamMode;
  prerequisites: string[]; // human-readable; real gating lives in unlock-policy.ts
  objective: string;
  instructions: string;
  taskSteps: SimulationTaskStep[];
  retryPolicy: SimulationRetryModel;
  completionRules: SimulationCompletionRules;
  evidenceOutputs: SimulationEvidenceOutputKind[];
  assessmentBoundary: SimulationAssessmentBoundary;
  careerConnection: SimulationCareerConnection;
  programConnection: SimulationProgramConnection;
  teamMode: SimulationTeamMode;
  accessibleAlternative: SimulationAccessibleAlternative;
  estimatedMinutes: number;
  status: "ACTIVE" | "PLANNED" | "CLOSED";
  tags: string[];
}

const REQUIRED_CONTRACT_ITEMS = [
  "objective",
  "prerequisites",
  "task",
  "retryBehavior",
  "completionCondition",
  "evidenceOutput",
  "assessmentBoundary",
  "teamMode",
  "accessibleAlternative",
  "sourceAuthority",
] as const;

export function validateSimulationDefinition(sim: SimulationDefinition): string[] {
  const errors: string[] = [];
  const where = sim.simulationId || "(unknown simulation)";

  if (!sim.simulationId) errors.push("simulation_id is required");
  if (sim.simulationId !== sim.activityId) errors.push(`${where}: simulation_id must equal activity_id in this repository's convention`);
  if (!sim.objective) errors.push(`${where}: objective is required`);
  if (!Array.isArray(sim.taskSteps) || sim.taskSteps.length === 0) errors.push(`${where}: at least one task step is required`);
  if (sim.taskSteps?.some((step) => !step.stepId || !step.instructions)) errors.push(`${where}: every task step requires stepId and instructions`);
  if (!SIMULATION_RETRY_POLICIES.includes(sim.retryPolicy?.policy)) errors.push(`${where}: retry policy is invalid`);
  if (sim.retryPolicy?.policy === "LIMITED_ATTEMPTS" && !(sim.retryPolicy.maxAttempts && sim.retryPolicy.maxAttempts > 0)) {
    errors.push(`${where}: LIMITED_ATTEMPTS retry policy requires a positive maxAttempts`);
  }
  if (!sim.completionRules?.serverValidated) errors.push(`${where}: completion must be server validated`);
  if (!Array.isArray(sim.evidenceOutputs) || sim.evidenceOutputs.length === 0) errors.push(`${where}: at least one evidence output kind is required`);
  if (!SIMULATION_ASSESSMENT_BOUNDARIES.includes(sim.assessmentBoundary)) errors.push(`${where}: assessment boundary is invalid`);
  if (!SIMULATION_TEAM_MODES.includes(sim.teamMode)) errors.push(`${where}: team mode is invalid`);
  if (sim.teamMode !== "INDIVIDUAL" && !sim.completionRules) errors.push(`${where}: team simulations still require completion rules`);
  if (!sim.accessibleAlternative?.nonSpatialAlternative) errors.push(`${where}: accessible alternative (non-spatial equivalent) is required`);
  if (sim.accessibleAlternative && !sim.accessibleAlternative.keyboardOperable) errors.push(`${where}: accessible alternative must be keyboard operable`);
  if (!sim.sourceType || !sim.sourceRef) errors.push(`${where}: source authority (sourceType + sourceRef) is required`);
  if (!SIMULATION_TYPES.includes(sim.simulationType)) errors.push(`${where}: simulation type is invalid`);
  if (sim.isFlagship && sim.taskSteps.length < 3) errors.push(`${where}: flagship simulations require a real multi-step task (>= 3 steps)`);

  return errors;
}

export const SIMULATION_REQUIRED_CONTRACT_ITEMS = REQUIRED_CONTRACT_ITEMS;

export const SIMULATION_AUTHORITY_BOUNDARY = {
  simulationOwnsTaskDefinition: true,
  simulationOwnsSessionState: true,
  simulationOwnsOperationalEvents: true,
  simulationMayOwnVerifiedSkill: false,
  simulationMayOwnCredential: false,
  simulationMayOwnCourseCompletion: false,
  simulationMayOwnCareerEligibility: false,
  simulationMayOwnJobReadiness: false,
  simulationMayOwnCivicAuthority: false,
  simulationMayMutateRealBalance: false,
  simulationMayAutoAwardOpportunity: false,
  simulationMaySelfDeclareTeamMembership: false,
  simulationMaySelfCertifyCompletion: false,
} as const;
