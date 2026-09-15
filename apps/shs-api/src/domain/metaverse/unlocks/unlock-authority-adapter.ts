export const METAVERSE_UNLOCK_AUTHORITY_AUDIT = [
  { fact: "identity", canonicalSource: "apps/shs-api/src/auth/current-user.ts and production identity middleware", status: "FOUND" },
  { fact: "organization / tenant", canonicalSource: "apps/shs-api/src/auth/organization-context.ts and tenant-context.ts", status: "FOUND" },
  { fact: "membership", canonicalSource: "apps/shs-api/src/domain/enrollments/repo/enrollment-repo.ts userExistsInOrganization plus auth memberships", status: "FOUND" },
  { fact: "role / permission", canonicalSource: "apps/shs-api/src/auth/security-permissions.ts", status: "FOUND" },
  { fact: "service entitlement", canonicalSource: "apps/shs-api/src/auth/service-entitlement-guard.ts and service-catalog service", status: "FOUND" },
  { fact: "program enrollment", canonicalSource: "apps/shs-api/src/domain/enrollments/repo/enrollment-repo.ts", status: "FOUND" },
  { fact: "cohort", canonicalSource: "apps/shs-api/src/domain/enrollments/model/enrollment.ts and repo", status: "FOUND" },
  { fact: "assignments", canonicalSource: "apps/shs-api/src/domain/assignments", status: "FOUND" },
  { fact: "curriculum progress / outcomes", canonicalSource: "apps/shs-api/src/domain/curriculum/model/learner-result.ts", status: "FOUND" },
  { fact: "assessments", canonicalSource: "curriculum learner outcomes and completion-policy assessment adapters", status: "FOUND" },
  { fact: "evidence", canonicalSource: "apps/shs-api/src/domain/verified-evidence and prepare-prove services", status: "FOUND" },
  { fact: "credentials", canonicalSource: "apps/shs-api/src/domain/credentials/model/credential.ts", status: "FOUND" },
  { fact: "career pathway / milestones", canonicalSource: "apps/shs-api/src/domain/career-pathways and journey milestone services", status: "FOUND" },
  { fact: "SHF Civic", canonicalSource: "Civic route/domain surfaces exist; dedicated eligibility adapter unresolved", status: "UNRESOLVED" },
  { fact: "project/team membership", canonicalSource: "apps/shs-api/src/domain/studio-team/service/studio-team-service.ts and projects", status: "FOUND" },
  { fact: "accessibility accommodation", canonicalSource: "apps/shs-api/src/domain/accessibility-profile and accessibility-accommodations", status: "FOUND" },
] as const;

export const METAVERSE_UNLOCK_CACHE_REVALIDATION_EVENTS = [
  "enrollment_changed",
  "assignment_changed",
  "lesson_completed",
  "assessment_result_changed",
  "evidence_verification_changed",
  "outcome_verification_changed",
  "credential_issued",
  "credential_revoked",
  "role_changed",
  "cohort_changed",
  "team_changed",
  "entitlement_changed",
  "organization_suspended",
  "user_suspended",
  "civic_eligibility_changed",
] as const;

export const METAVERSE_UNLOCK_OPERATIONAL_EVENTS = [
  "metaverse.resource.viewed",
  "metaverse.resource.entered",
  "metaverse.activity.started",
  "metaverse.activity.completed",
  "metaverse.unlock.denied",
  "metaverse.next_action.selected",
] as const;

export const METAVERSE_OPERATIONAL_EVENT_BOUNDARY = {
  createsVerifiedMastery: false,
  createsOutcome: false,
  createsCredential: false,
  createsEmploymentEligibility: false,
  createsCivicAuthority: false,
} as const;
