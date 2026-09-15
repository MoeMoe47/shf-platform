export const METAVERSE_UNLOCK_DECISIONS = [
  "AVAILABLE",
  "LOCKED",
  "HIDDEN",
  "RESTRICTED",
  "ASSIGNED",
  "COMPLETED_ACCESSIBLE",
  "TEMPORARILY_UNAVAILABLE",
] as const;

export type MetaverseUnlockDecision = (typeof METAVERSE_UNLOCK_DECISIONS)[number];

export const METAVERSE_ACCESS_LEVELS = [
  "CITY_ACCESS",
  "DISTRICT_ACCESS",
  "FACILITY_ACCESS",
  "ACTIVITY_ACCESS",
  "SIMULATION_ACCESS",
  "SOCIAL_SPACE_ACCESS",
  "CIVIC_SESSION_ACCESS",
  "JOB_SIMULATION_ACCESS",
  "CAREER_EXPERIENCE_ACCESS",
] as const;

export type MetaverseAccessLevel = (typeof METAVERSE_ACCESS_LEVELS)[number];

export const METAVERSE_UNLOCK_REASON_CODES = [
  "ENROLLED",
  "ASSIGNED",
  "COURSE_PROGRESS",
  "LESSON_COMPLETE",
  "MILESTONE_REACHED",
  "ASSESSMENT_PASSED",
  "VERIFIED_OUTCOME",
  "CREDENTIAL_VERIFIED",
  "CAREER_PATHWAY_ELIGIBLE",
  "COHORT_MEMBER",
  "TEAM_MEMBER",
  "INSTRUCTOR_GRANTED",
  "CIVIC_ELIGIBLE",
  "ROLE_ALLOWED",
  "SERVICE_ENTITLED",
  "ORGANIZATION_POLICY",
  "PREREQUISITE_MISSING",
  "NOT_ENROLLED",
  "CREDENTIAL_REQUIRED",
  "ASSIGNMENT_REQUIRED",
  "ROLE_RESTRICTED",
  "SERVICE_NOT_ENTITLED",
  "SUSPENDED",
  "REVOKED",
  "EXPIRED",
  "ACTIVITY_CLOSED",
  "CROSS_ORG_DENIED",
  "CLIENT_AUTHORITY_DENIED",
  "CAMERA_AUTHORITY_DENIED",
] as const;

export type MetaverseUnlockReasonCode = (typeof METAVERSE_UNLOCK_REASON_CODES)[number];

export const METAVERSE_RESOURCE_TYPES = [
  "CITY",
  "DISTRICT",
  "FACILITY",
  "ACTIVITY",
  "SIMULATION",
  "SOCIAL_SPACE",
  "CIVIC_SESSION",
  "JOB_SIMULATION",
  "CAREER_EXPERIENCE",
] as const;

export type MetaverseResourceType = (typeof METAVERSE_RESOURCE_TYPES)[number];

export const METAVERSE_DECISION_SEMANTICS = {
  AVAILABLE: "The learner may enter or use the resource now under canonical policy.",
  LOCKED: "The resource exists for the learner but prerequisites remain unsatisfied.",
  HIDDEN: "The resource should not be enumerated to the learner in this context.",
  RESTRICTED: "The resource is limited to authorized roles, civic state, staff, or policy scope.",
  ASSIGNED: "The learner may enter because a canonical instructor, assignment, team, or program context assigned it.",
  COMPLETED_ACCESSIBLE: "The learner may revisit a completed experience if policy allows; this does not mean verified mastery.",
  TEMPORARILY_UNAVAILABLE: "The resource is currently closed, expired, outside its time window, or operationally unavailable.",
} as const satisfies Record<MetaverseUnlockDecision, string>;

export type MetaverseSourceFact = {
  authority: string;
  fact_type: string;
  fact_id: string;
  status?: string;
  value?: unknown;
};

export type MetaverseNextActionProjection = {
  next_action_type: "START_LESSON" | "COMPLETE_ASSESSMENT" | "JOIN_TEAM" | "REQUEST_INSTRUCTOR_REVIEW" | "RETURN_WHEN_OPEN" | "OPEN_ASSIGNMENT";
  next_action_resource_id: string;
  next_action_label: string;
  route_reference: string | null;
};

export type MetaverseUnlockDecisionRecord = {
  unlock_id: string;
  user_id: string;
  organization_id: string;
  tenant_id: string | null;
  city_id: string;
  district_id?: string | null;
  facility_id?: string | null;
  activity_id?: string | null;
  resource_type: MetaverseResourceType;
  resource_id: string;
  access_level: MetaverseAccessLevel;
  decision: MetaverseUnlockDecision;
  reason_code: MetaverseUnlockReasonCode;
  reason_text: string;
  source_authorities: string[];
  source_facts: MetaverseSourceFact[];
  requirements: string[];
  requirements_satisfied: string[];
  requirements_remaining: string[];
  next_action: MetaverseNextActionProjection | null;
  computed_at: string;
  expires_at: string | null;
  revalidation_policy: string;
  projection_version: "MET-3";
};

export type CanonicalLearnerUnlockContext = {
  user_id: string | null;
  organization_id: string | null;
  tenant_id: string | null;
  roles: string[];
  permissions: string[];
  active_membership: boolean;
  user_suspended?: boolean;
  organization_suspended?: boolean;
  client_claimed_unlock?: boolean;
  camera_context?: { camera_level?: string; district_id?: string; facility_id?: string };
};

export function deterministicUnlockKey(input: {
  user_id: string;
  organization_id: string;
  resource_type: MetaverseResourceType;
  resource_id: string;
  access_level: MetaverseAccessLevel;
}): string {
  return [
    "met3_unlock",
    input.organization_id,
    input.user_id,
    input.resource_type.toLowerCase(),
    input.resource_id,
    input.access_level.toLowerCase(),
  ].join(":");
}

export function validateUnlockIdentityContext(context: Pick<CanonicalLearnerUnlockContext, "user_id" | "organization_id" | "tenant_id">): string[] {
  const errors: string[] = [];
  if (!context.user_id) errors.push("canonical_user_identity_required");
  if (!context.organization_id) errors.push("canonical_organization_context_required");
  if (context.tenant_id === undefined) errors.push("tenant_context_field_required");
  return errors;
}

export const METAVERSE_UNLOCK_AUTHORITY_BOUNDARY = {
  duplicateCurriculumAuthority: false,
  duplicateCareerAuthority: false,
  duplicateCivicAuthority: false,
  duplicateCredentialAuthority: false,
  duplicateIdentityAuthority: false,
  clientMayGrantUnlock: false,
  cameraMayGrantUnlock: false,
  simulationCreatesJobEligibility: false,
  taskCompletionCreatesVerifiedMastery: false,
} as const;

export const METAVERSE_VERIFIED_MASTERY_BOUNDARY = [
  "task completion != assessment pass",
  "assessment pass != verified outcome",
  "verified outcome != credential unless credential authority says so",
  "credential != employment eligibility",
  "simulation completion != professional qualification",
] as const;

export const METAVERSE_JOB_SIMULATION_BOUNDARY = {
  isEducationalSimulation: true,
  isEmployment: false,
  isJobPlacement: false,
  isPayrollEligibility: false,
  isRealHiring: false,
  isProfessionalLicensure: false,
  isEmploymentCertification: false,
} as const;
