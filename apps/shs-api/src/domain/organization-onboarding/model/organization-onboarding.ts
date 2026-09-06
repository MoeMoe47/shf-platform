export const ONBOARDING_STATUSES = {
  SUBMITTED: "SUBMITTED",
  UNDER_REVIEW: "UNDER_REVIEW",
  APPROVED: "APPROVED",
  DECLINED: "DECLINED",
  ACTIVATED: "ACTIVATED",
  SUSPENDED: "SUSPENDED",
  EXITED: "EXITED",
  GRADUATED: "GRADUATED",
} as const;

export const ONBOARDING_RELATIONSHIP_TYPES = [
  "INCUBATES",
  "NETWORK_MEMBER_OF",
  "SHARED_SERVICES_PROVIDER_FOR",
] as const;

export type OnboardingStatus = typeof ONBOARDING_STATUSES[keyof typeof ONBOARDING_STATUSES];

export class OrganizationOnboardingError extends Error {
  constructor(public readonly code: string, message = code, public readonly statusCode = 400) {
    super(message);
    this.name = "OrganizationOnboardingError";
  }
}

function camel(row: any) {
  if (!row) return row;
  return {
    onboardingCaseId: row.onboarding_case_id,
    status: row.status,
    existingOrganizationId: row.existing_organization_id,
    activatedOrganizationId: row.activated_organization_id,
    organizationName: row.organization_name,
    organizationType: row.organization_type,
    website: row.website,
    primaryContactName: row.primary_contact_name,
    primaryContactEmail: row.primary_contact_email,
    primaryContactPhone: row.primary_contact_phone,
    geography: row.geography,
    missionDescription: row.mission_description,
    requestedRelationshipType: row.requested_relationship_type,
    submittedByUserId: row.submitted_by_user_id,
    submittedByOrganizationId: row.submitted_by_organization_id,
    submittedAt: row.submitted_at,
    reviewedByUserId: row.reviewed_by_user_id,
    reviewedAt: row.reviewed_at,
    decisionReason: row.decision_reason,
    applicantFeedback: row.applicant_feedback,
    activationRelationshipId: row.activation_relationship_id,
    activatedByUserId: row.activated_by_user_id,
    activatedAt: row.activated_at,
    suspendedByUserId: row.suspended_by_user_id,
    suspendedAt: row.suspended_at,
    exitedByUserId: row.exited_by_user_id,
    exitedAt: row.exited_at,
    graduationRelationshipId: row.graduation_relationship_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    services: row.services || [],
    decisions: row.decisions || undefined,
  };
}

export function toOnboardingCaseResponse(row: any) {
  return camel(row);
}

export function toOnboardingDecisionResponse(row: any) {
  if (!row) return row;
  return {
    onboardingDecisionId: row.onboarding_decision_id,
    onboardingCaseId: row.onboarding_case_id,
    decision: row.decision,
    actorUserId: row.actor_user_id,
    decidedAt: row.decided_at,
    reason: row.reason,
    applicantFeedback: row.applicant_feedback,
    previousStatus: row.previous_status,
    newStatus: row.new_status,
  };
}
