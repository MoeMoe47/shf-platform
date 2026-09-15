// MET-10 — Work Passport + Capability Graph + Reputation projection.
//
// This contract is presentation/projection only. It never creates source
// authority for skills, evidence, credentials, completion, employment,
// SHF Credits, enrollment, or reputation.

export const PASSPORT_CLAIM_TYPES = [
  "VERIFIED_SKILL",
  "VERIFIED_EVIDENCE",
  "ASSESSMENT_OUTCOME",
  "CREDENTIAL",
  "PROJECT_COMPLETION",
  "MISSION_COMPLETION",
  "OPPORTUNITY_COMPLETION",
  "ARCADE_MASTERY_SIGNAL",
  "PORTFOLIO_ARTIFACT",
  "CAREER_PROGRESS",
  "TEAM_EXPERIENCE",
  "RELIABILITY_FACT",
  "PROGRAM_COMPLETION",
  // MET-12 — projection only; membership/roles alone are never
  // VERIFIED_SKILL (see projectPassportFromSources enterprise loop).
  "ENTERPRISE_EXPERIENCE",
  // MET-13 — projection only; a completed simulation session is never
  // VERIFIED_SKILL by itself (see projectPassportFromSources simulation
  // loop). Real skill verification, if any, still flows through the
  // VERIFIED_EVIDENCE loop above from evidence an instructor/reviewer
  // separately confirmed.
  "SIMULATION_EXPERIENCE",
] as const;
export type PassportClaimType = typeof PASSPORT_CLAIM_TYPES[number];

export const PASSPORT_VERIFICATION_LEVELS = [
  "VERIFIED",
  "SOURCE_CONFIRMED",
  "EVIDENCE_CANDIDATE",
  "ACTIVITY_COMPLETED",
  "UNVERIFIED",
] as const;
export type PassportVerificationLevel = typeof PASSPORT_VERIFICATION_LEVELS[number];

export const PASSPORT_SOURCE_AUTHORITIES = [
  "VERIFIED_EVIDENCE",
  "ASSESSMENT",
  "CREDENTIAL",
  "CURRICULUM",
  "CAREER",
  "METAVERSE_MISSION",
  "OPPORTUNITY_EXCHANGE",
  "LEARNING_ARCADE",
  "PORTFOLIO",
  "STUDIO_PROJECT",
  "PROGRAM",
  "STUDIO_TEAM",
  "MARKET",
  "STUDENT_ENTERPRISE",
  "METAVERSE_SIMULATION",
] as const;
export type PassportSourceAuthority = typeof PASSPORT_SOURCE_AUTHORITIES[number];

export const PASSPORT_VISIBILITIES = [
  "SELF",
  "INSTRUCTOR",
  "AUTHORIZED_SPONSOR",
  "ORGANIZATION",
  "PUBLIC_PORTFOLIO",
] as const;
export type PassportVisibility = typeof PASSPORT_VISIBILITIES[number];

export interface PassportClaim {
  passportClaimId: string;
  learnerUserId: string;
  organizationId: string;
  claimType: PassportClaimType;
  title: string;
  summary: string;
  sourceType: string;
  sourceRef: string;
  sourceAuthority: PassportSourceAuthority;
  status: string;
  verificationLevel: PassportVerificationLevel;
  issuedAt: string;
  completedAt: string | null;
  expiresAt: string | null;
  evidenceRefs: string[];
  artifactRefs: string[];
  skillRefs: string[];
  careerRefs: string[];
  programRefs: string[];
  missionRefs: string[];
  projectRefs: string[];
  opportunityRefs: string[];
  metadata: Record<string, unknown>;
  visibility: PassportVisibility;
  createdAt: string;
}

export const CAPABILITY_GRAPH_NODE_TYPES = [
  "LEARNER",
  "SKILL",
  "EVIDENCE",
  "PROJECT",
  "MISSION",
  "ASSESSMENT",
  "CREDENTIAL",
  "CAREER_PATHWAY",
  "OPPORTUNITY",
  "TEAM_EXPERIENCE",
  "PROGRAM",
] as const;
export type CapabilityGraphNodeType = typeof CAPABILITY_GRAPH_NODE_TYPES[number];

export const CAPABILITY_GRAPH_RELATIONSHIPS = [
  "DEMONSTRATED_BY",
  "VERIFIED_BY",
  "EVIDENCED_BY",
  "APPLIED_IN",
  "COMPLETED_IN",
  "CONNECTED_TO",
  "REQUIRED_BY",
  "CONTRIBUTED_TO",
  "PREPARED_BY",
  "PROGRESSED_TOWARD",
] as const;
export type CapabilityGraphRelationship = typeof CAPABILITY_GRAPH_RELATIONSHIPS[number];

export interface CapabilityGraphNode {
  id: string;
  type: CapabilityGraphNodeType;
  label: string;
  sourceAuthority: PassportSourceAuthority | "PASSPORT_PROJECTION";
  sourceRef: string;
  verificationLevel: PassportVerificationLevel | "PROJECTION_ONLY";
}

export interface CapabilityGraphEdge {
  from: string;
  to: string;
  relationship: CapabilityGraphRelationship;
  sourceClaimId: string;
  sourceAuthority: PassportSourceAuthority;
}

export interface ReliabilityFact {
  reliabilityFactId: string;
  learnerUserId: string;
  organizationId: string;
  dimension:
    | "COMPLETION_RELIABILITY"
    | "ON_TIME_DELIVERY"
    | "TEAM_PARTICIPATION"
    | "REVISION_RESPONSIVENESS"
    | "OPPORTUNITY_FOLLOW_THROUGH"
    | "PROJECT_CONSISTENCY"
    | "MARKET_FULFILLMENT"
    | "ATTENDANCE_RELIABILITY"
    | "PROGRAM_PARTICIPATION";
  label: string;
  valueText: string;
  sourceAuthority: PassportSourceAuthority;
  sourceRefs: string[];
  visibility: Exclude<PassportVisibility, "PUBLIC_PORTFOLIO">;
  computedAt: string;
}

export interface WorkPassportProjection {
  projectionVersion: "MET-10";
  learnerUserId: string;
  organizationId: string;
  view: "SELF" | "SPONSOR" | "PUBLIC";
  generatedAt: string;
  claims: PassportClaim[];
  capabilityGraph: {
    nodes: CapabilityGraphNode[];
    edges: CapabilityGraphEdge[];
    accessibleTree: Array<{ label: string; details: string[]; sourceClaimId: string }>;
  };
  reliabilityFacts: ReliabilityFact[];
  boundaries: {
    creditsAreCapability: false;
    reputationIsSkill: false;
    arcadeIsSkillAuthority: false;
    missionIsSkillAuthority: false;
    opportunityAwardIsEmployment: false;
    marketIsCredentialAuthority: false;
    noGlobalRanking: true;
  };
  eligibilityProjection: {
    verifiedRequiredSkillsCount: number;
    relevantProjectsCount: number;
    beginnerEligibleWithoutReputation: true;
    safeForOpportunityExchange: true;
  };
}

export interface PassportProjectionSources {
  verifiedEvidence?: any[];
  evidenceCandidates?: any[];
  credentials?: any[];
  projects?: any[];
  portfolioArtifacts?: any[];
  missions?: any[];
  opportunities?: any[];
  arcadeSignals?: any[];
  careerProgress?: any[];
  teamExperience?: any[];
  marketHistory?: any[];
  programCompletions?: any[];
  enterpriseExperience?: any[];
  simulationActivity?: any[];
}
