// MET-8 — Student Opportunity Exchange canonical model.
//
// This is a governed student work/project bid marketplace. It is NOT the
// same domain as apps/shs-api/src/domain/opportunities (SHF Ecosystem
// Phase 4 "Opportunity" — an external internship/scholarship/job board
// that links out via actionUrl/actionRoute). That domain has no bidding,
// no award, no work handoff, and stays untouched. Naming here is
// deliberately distinct ("StudentOpportunity", table prefix
// `student_opportunity_*`) to avoid ever conflating the two.
//
// Winning a Student Opportunity does NOT by itself create employment,
// payroll, a legal employment relationship, professional licensure, a
// credential, or verified skill. Those facts, if they ever exist, are
// established solely by their own canonical authority (credentials,
// verified-evidence, a future employment/legal workflow).

export const OPPORTUNITY_TYPES = [
  "PROJECT",
  "CITY_MISSION",
  "PROGRAM_MISSION",
  "SIDE_MISSION",
  "EVENT",
  "CAREER_EXPERIENCE",
  "STUDENT_ENTERPRISE_CONTRACT",
  "COMMUNITY_PROJECT",
  "ARCADE_CHALLENGE_CONTRACT",
] as const;
export type StudentOpportunityType = typeof OPPORTUNITY_TYPES[number];

export const OPPORTUNITY_SOURCE_TYPES = [
  "CAREER_PATHWAY",
  "PROGRAM_MISSION",
  "SIDE_MISSION",
  "PROJECT",
  "EVENT",
  "INSTRUCTOR",
  "ORGANIZATION",
  "STUDENT_ENTERPRISE",
  "ARCADE",
  "CIVIC",
  "COMMUNITY",
] as const;
export type StudentOpportunitySourceType = typeof OPPORTUNITY_SOURCE_TYPES[number];

export const DIFFICULTY_TIERS = ["BEGINNER", "DEVELOPING", "ADVANCED", "VERIFIED_SKILL"] as const;
export type OpportunityDifficultyTier = typeof DIFFICULTY_TIERS[number];

export const PARTICIPATION_MODES = ["INDIVIDUAL", "TEAM", "EITHER"] as const;
export type OpportunityParticipationMode = typeof PARTICIPATION_MODES[number];

export const SELECTION_METHODS = [
  "BEST_FIT",
  "SPONSOR_SELECTS",
  "ROTATION",
  "LOTTERY",
  "FIRST_TIME_PRIORITY",
  "INSTRUCTOR_ASSIGNMENT",
  "TEAM_SELECTION",
] as const;
export type OpportunitySelectionMethod = typeof SELECTION_METHODS[number];

export const COMPENSATION_TYPES = [
  "SHF_CREDITS",
  "PROGRAM_POINTS",
  "NON_MONETARY",
  "NONE",
  "FUTURE_EXTERNAL_PAYMENT_REFERENCE",
] as const;
export type OpportunityCompensationType = typeof COMPENSATION_TYPES[number];

export const OPPORTUNITY_STATUSES = [
  "DRAFT",
  "OPEN",
  "PAUSED",
  "CLOSED",
  "AWARD_PENDING",
  "AWARDED",
  "COMPLETED",
  "CANCELLED",
  "ARCHIVED",
] as const;
export type StudentOpportunityStatus = typeof OPPORTUNITY_STATUSES[number];

export const OPPORTUNITY_TRANSITIONS: Readonly<Record<StudentOpportunityStatus, readonly StudentOpportunityStatus[]>> = {
  DRAFT: ["OPEN", "CANCELLED"],
  OPEN: ["PAUSED", "CLOSED", "AWARD_PENDING", "CANCELLED"],
  PAUSED: ["OPEN", "CLOSED", "CANCELLED"],
  CLOSED: ["AWARD_PENDING", "ARCHIVED", "CANCELLED"],
  AWARD_PENDING: ["AWARDED", "CLOSED", "CANCELLED"],
  AWARDED: ["COMPLETED", "CANCELLED", "ARCHIVED"],
  COMPLETED: ["ARCHIVED"],
  CANCELLED: ["ARCHIVED"],
  ARCHIVED: [],
};
export function canTransitionOpportunity(from: StudentOpportunityStatus, to: StudentOpportunityStatus): boolean {
  return OPPORTUNITY_TRANSITIONS[from]?.includes(to) ?? false;
}

export const BID_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "SHORTLISTED",
  "ACCEPTED",
  "DECLINED",
  "WITHDRAWN",
  "EXPIRED",
] as const;
export type BidStatus = typeof BID_STATUSES[number];

export const AWARD_STATUSES = ["AWARDED", "ACTIVE", "SUBMITTED", "UNDER_REVIEW", "COMPLETED", "CANCELLED", "EXPIRED"] as const;
export type AwardStatus = typeof AWARD_STATUSES[number];

export const SUBMISSION_STATUSES = ["SUBMITTED", "NEEDS_REVISION", "ACCEPTED", "DECLINED"] as const;
export type SubmissionStatus = typeof SUBMISSION_STATUSES[number];

export const ELIGIBILITY_RESULTS = ["ELIGIBLE", "NOT_ELIGIBLE", "CONDITIONALLY_ELIGIBLE", "CLOSED", "FULL", "RESTRICTED"] as const;
export type EligibilityResult = typeof ELIGIBILITY_RESULTS[number];

export interface EligibilityRules {
  /** true = the org's default rotation/lottery/fair-access rules apply and prior reputation/awards are never a gate. Required true for BEGINNER tier (build brief §7). */
  noReputationRequired?: boolean;
  requiresActiveEnrollment?: boolean;
  requiresProgramId?: string | null;
  requiresCohortId?: string | null;
  /** Minimum count of the student's own COMPLETED Student Opportunity Awards in this organization. Server-derived only — never client-supplied at read time. */
  minPriorCompletedAwards?: number;
  /** A student who has never completed an awarded opportunity in this org gets priority under FIRST_TIME_PRIORITY selection. */
  firstTimePriorityEligible?: boolean;
}

export interface StudentOpportunity {
  opportunityId: string;
  organizationId: string;
  tenantId: string;
  /** Always equal to organizationId today — see docs/metaverse/MET-8 §Sponsor Authority for the single-org boundary and its P1 lift path. */
  sponsorOrgId: string;
  sponsorUserId: string;
  title: string;
  summary: string;
  description: string | null;
  opportunityType: StudentOpportunityType;
  sourceType: StudentOpportunitySourceType;
  sourceRef: string | null;
  districtId: string | null;
  facilityId: string | null;
  missionProjectionId: string | null;
  programId: string | null;
  careerId: string | null;
  requiredSkills: string[];
  preferredSkills: string[];
  requiredEvidenceRefs: string[];
  eligibilityRules: EligibilityRules;
  difficultyTier: OpportunityDifficultyTier;
  participationMode: OpportunityParticipationMode;
  teamSizeMin: number | null;
  teamSizeMax: number | null;
  deliverables: string[];
  deadline: string;
  applicationOpenAt: string | null;
  applicationCloseAt: string;
  status: StudentOpportunityStatus;
  compensationType: OpportunityCompensationType;
  compensationAmount: number | null;
  currencyType: string | null;
  selectionMethod: OpportunitySelectionMethod;
  maxAwards: number;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

/** Student-facing shape — never exposes sponsorUserId identity beyond org tier, never exposes other bidders. */
export interface StudentFacingOpportunity extends Pick<StudentOpportunity,
  "opportunityId" | "title" | "summary" | "description" | "opportunityType" | "sourceType" | "sourceRef" |
  "districtId" | "facilityId" | "missionProjectionId" | "programId" | "careerId" | "requiredSkills" |
  "preferredSkills" | "difficultyTier" | "participationMode" | "teamSizeMin" | "teamSizeMax" | "deliverables" |
  "deadline" | "applicationOpenAt" | "applicationCloseAt" | "status" | "compensationType" | "compensationAmount" |
  "currencyType" | "selectionMethod" | "maxAwards"
> {
  eligibility: {
    result: EligibilityResult;
    reasons: string[];
    requirementsRemaining: string[];
  };
  /** Real, runtime-computed count — never a placeholder. */
  bidCount: number;
}

export interface StudentOpportunityBid {
  bidId: string;
  opportunityId: string;
  organizationId: string;
  tenantId: string;
  bidderType: "INDIVIDUAL" | "TEAM";
  studentId: string | null;
  teamId: string | null;
  proposalSummary: string;
  approach: string | null;
  requestedCompensationAmount: number | null;
  requestedCompensationType: OpportunityCompensationType | null;
  estimatedCompletionDays: number | null;
  portfolioEvidenceRefs: string[];
  skillEvidenceRefs: string[];
  availability: string | null;
  submittedAt: string | null;
  status: BidStatus;
  revision: number;
  withdrawnAt: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentOpportunityAward {
  awardId: string;
  opportunityId: string;
  bidId: string;
  organizationId: string;
  tenantId: string;
  studentId: string | null;
  teamId: string | null;
  sponsorUserId: string;
  awardedAt: string;
  workScopeSnapshot: { title: string; summary: string; description: string | null; requiredSkills: string[] };
  deliverablesSnapshot: string[];
  compensationSnapshot: { type: OpportunityCompensationType; amount: number | null; currencyType: string | null; isIntentOnly: true };
  dueDate: string;
  status: AwardStatus;
  projectRef: string | null;
  paymentIntentRef: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudentOpportunitySubmission {
  submissionId: string;
  awardId: string;
  organizationId: string;
  tenantId: string;
  submittedByUserId: string;
  artifactRefs: string[];
  studentComment: string | null;
  submittedAt: string;
  status: SubmissionStatus;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  reviewFeedback: string | null;
  version: number;
  createdAt: string;
}

export function toStudentFacingOpportunity(
  o: StudentOpportunity,
  eligibility: { result: EligibilityResult; reasons: string[]; requirementsRemaining: string[] },
  bidCount: number,
): StudentFacingOpportunity {
  return {
    opportunityId: o.opportunityId,
    title: o.title,
    summary: o.summary,
    description: o.description,
    opportunityType: o.opportunityType,
    sourceType: o.sourceType,
    sourceRef: o.sourceRef,
    districtId: o.districtId,
    facilityId: o.facilityId,
    missionProjectionId: o.missionProjectionId,
    programId: o.programId,
    careerId: o.careerId,
    requiredSkills: o.requiredSkills,
    preferredSkills: o.preferredSkills,
    difficultyTier: o.difficultyTier,
    participationMode: o.participationMode,
    teamSizeMin: o.teamSizeMin,
    teamSizeMax: o.teamSizeMax,
    deliverables: o.deliverables,
    deadline: o.deadline,
    applicationOpenAt: o.applicationOpenAt,
    applicationCloseAt: o.applicationCloseAt,
    status: o.status,
    compensationType: o.compensationType,
    compensationAmount: o.compensationAmount,
    currencyType: o.currencyType,
    selectionMethod: o.selectionMethod,
    maxAwards: o.maxAwards,
    eligibility,
    bidCount,
  };
}
