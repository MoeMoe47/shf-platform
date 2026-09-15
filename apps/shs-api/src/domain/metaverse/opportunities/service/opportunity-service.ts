import { randomUUID } from "crypto";
import { query } from "../../../../db/client.js";
import { OpportunityExchangeRepo } from "../repo/opportunity-exchange-repo.js";
import {
  StudentOpportunity,
  StudentOpportunityType,
  StudentOpportunitySourceType,
  OpportunityDifficultyTier,
  OpportunityParticipationMode,
  OpportunitySelectionMethod,
  OpportunityCompensationType,
  EligibilityRules,
  canTransitionOpportunity,
  StudentOpportunityStatus,
  toStudentFacingOpportunity,
  StudentFacingOpportunity,
  OPPORTUNITY_TYPES,
  OPPORTUNITY_SOURCE_TYPES,
  DIFFICULTY_TIERS,
  PARTICIPATION_MODES,
  SELECTION_METHODS,
  COMPENSATION_TYPES,
} from "../model/opportunity-contract.js";
import { evaluateEligibility } from "./opportunity-eligibility.js";
import { resolveMissionLinkForSponsor } from "./opportunity-mission-adapter.js";
import { isAdminTier, isStudentOnly, EligibilityActor } from "../../../shared/audience-eligibility.js";
import { EnrollmentRepo } from "../../../enrollments/repo/enrollment-repo.js";
import { getSiliconHeartlandCityRegistry } from "../../registry/city-registry.js";
import { getEnterpriseOrThrow } from "../../enterprise/service/enterprise-policy.js";

const repo = new OpportunityExchangeRepo();
const enrollmentRepo = new EnrollmentRepo();

export class OpportunityExchangeError extends Error {
  constructor(public code: string, message: string, public statusCode = 400) {
    super(message);
    this.name = "OpportunityExchangeError";
  }
}
export class OpportunityNotFoundError extends Error {
  constructor() { super("Opportunity not found."); this.name = "OpportunityNotFoundError"; }
}

function scope(actor: any) {
  const userId = String(actor?.user_id || "");
  const organizationId = String(actor?.active_organization_id || actor?.organization_id || "");
  const tenantId = String(actor?.tenant_id || `tenant:${organizationId}`);
  if (!userId || !organizationId) throw new OpportunityExchangeError("ORG_CONTEXT_REQUIRED", "Valid active organization context is required.", 403);
  return { userId, organizationId, tenantId, roles: actor?.roles || [] };
}

export interface CreateOpportunityInput {
  title: string;
  summary: string;
  description?: string;
  opportunityType: StudentOpportunityType;
  sourceType: StudentOpportunitySourceType;
  sourceRef?: string;
  districtId?: string;
  facilityId?: string;
  missionProjectionId?: string;
  programId?: string;
  careerId?: string;
  requiredSkills?: string[];
  preferredSkills?: string[];
  requiredEvidenceRefs?: string[];
  eligibilityRules?: EligibilityRules;
  difficultyTier: OpportunityDifficultyTier;
  participationMode: OpportunityParticipationMode;
  teamSizeMin?: number;
  teamSizeMax?: number;
  deliverables?: string[];
  deadline: string;
  applicationOpenAt?: string;
  applicationCloseAt: string;
  compensationType: OpportunityCompensationType;
  compensationAmount?: number;
  currencyType?: string;
  selectionMethod: OpportunitySelectionMethod;
  maxAwards?: number;
}

function requiredNonEmpty(value: string | undefined, field: string, max = 4000): string {
  const trimmed = String(value || "").trim();
  if (!trimmed) throw new OpportunityExchangeError("FIELD_REQUIRED", `${field} is required.`, 400);
  if (trimmed.length > max) throw new OpportunityExchangeError("FIELD_TOO_LONG", `${field} exceeds maximum length.`, 400);
  return trimmed;
}

function validEnum<T extends readonly string[]>(value: unknown, values: T, field: string): T[number] {
  if (!values.includes(value as T[number])) {
    throw new OpportunityExchangeError("INVALID_ENUM_VALUE", `${field} must be one of: ${values.join(", ")}.`, 400);
  }
  return value as T[number];
}

function validDate(value: string | undefined, field: string, required: boolean): string | null {
  if (!value) {
    if (required) throw new OpportunityExchangeError("INVALID_DATE", `${field} is required.`, 400);
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new OpportunityExchangeError("INVALID_DATE", `${field} must be a valid date.`, 400);
  return parsed.toISOString();
}

async function validateSourceProvenance(input: CreateOpportunityInput, s: { organizationId: string; userId: string }): Promise<string | null> {
  // §3: every opportunity must have a legitimate, checkable source — no anonymous creation.
  const sourceRef = input.sourceRef?.trim() || null;
  switch (input.sourceType) {
    case "INSTRUCTOR":
      if (sourceRef && sourceRef !== s.userId) throw new OpportunityExchangeError("SOURCE_PROVENANCE_INVALID", "INSTRUCTOR source_ref must be the sponsoring user.", 400);
      return s.userId;
    case "ORGANIZATION":
      if (sourceRef && sourceRef !== s.organizationId) throw new OpportunityExchangeError("SOURCE_PROVENANCE_INVALID", "ORGANIZATION source_ref must be the sponsoring organization.", 400);
      return s.organizationId;
    case "PROGRAM_MISSION":
    case "SIDE_MISSION": {
      if (!input.programId) throw new OpportunityExchangeError("PROGRAM_REQUIRED", `${input.sourceType} requires programId.`, 400);
      const exists = await enrollmentRepo.programExistsInOrganization(input.programId, s.organizationId);
      if (!exists) throw new OpportunityExchangeError("PROGRAM_NOT_FOUND", "Program not found in organization.", 400);
      if (sourceRef && sourceRef !== input.programId) throw new OpportunityExchangeError("SOURCE_PROVENANCE_INVALID", `${input.sourceType} source_ref must match programId.`, 400);
      return input.programId;
    }
    case "CAREER_PATHWAY": {
      if (!input.careerId) throw new OpportunityExchangeError("CAREER_REQUIRED", "CAREER_PATHWAY source requires careerId.", 400);
      const res = await query("SELECT 1 FROM careers WHERE career_id=$1 LIMIT 1", [input.careerId]);
      if (!res.rows[0]) throw new OpportunityExchangeError("CAREER_NOT_FOUND", "Career not found.", 400);
      return input.careerId;
    }
    case "PROJECT": {
      if (!sourceRef) throw new OpportunityExchangeError("SOURCE_REF_REQUIRED", "PROJECT source requires source_ref (a project_id).", 400);
      const res = await query("SELECT 1 FROM projects WHERE project_id=$1 AND organization_id=$2 LIMIT 1", [sourceRef, s.organizationId]);
      if (!res.rows[0]) throw new OpportunityExchangeError("SOURCE_NOT_FOUND", "Referenced project not found in organization.", 400);
      return sourceRef;
    }
    case "STUDENT_ENTERPRISE": {
      // MET-12 — source_ref must be a real, ACTIVE enterprise in this
      // organization, not an orphan string (build brief §Phase C: "must
      // stop being orphan strings and become source-backed").
      if (!sourceRef) throw new OpportunityExchangeError("SOURCE_REF_REQUIRED", "STUDENT_ENTERPRISE source requires a source_ref (an enterpriseId).", 400);
      try {
        await getEnterpriseOrThrow(sourceRef, s.organizationId, `tenant:${s.organizationId}`);
      } catch {
        throw new OpportunityExchangeError("SOURCE_NOT_FOUND", "Referenced Student Enterprise not found in organization.", 400);
      }
      return sourceRef;
    }
    case "EVENT":
    case "CIVIC":
    case "COMMUNITY":
    case "ARCADE":
      if (!sourceRef) throw new OpportunityExchangeError("SOURCE_REF_REQUIRED", `${input.sourceType} source requires a source_ref.`, 400);
      return sourceRef;
    default:
      throw new OpportunityExchangeError("INVALID_SOURCE_TYPE", "Unsupported source_type.", 400);
  }
}

function validateDistrictFacility(districtId?: string, facilityId?: string) {
  if (!districtId && !facilityId) return;
  const registry = getSiliconHeartlandCityRegistry();
  if (districtId && !registry.districts.some((d) => d.id === districtId)) {
    throw new OpportunityExchangeError("DISTRICT_NOT_FOUND", "Unknown district_id.", 400);
  }
  if (facilityId) {
    const facility = registry.facilities.find((f: any) => f.id === facilityId);
    if (!facility) throw new OpportunityExchangeError("FACILITY_NOT_FOUND", "Unknown facility_id.", 400);
    if (districtId && facility.district_id && facility.district_id !== districtId) {
      throw new OpportunityExchangeError("FACILITY_DISTRICT_MISMATCH", "facility_id does not belong to district_id.", 400);
    }
  }
}

export async function createOpportunity(actor: any, input: CreateOpportunityInput): Promise<StudentOpportunity> {
  const s = scope(actor);
  if (isStudentOnly(s.roles)) {
    throw new OpportunityExchangeError("SPONSOR_AUTHORITY_REQUIRED", "Students cannot publish Opportunities directly.", 403);
  }

  const opportunityType = validEnum(input.opportunityType, OPPORTUNITY_TYPES, "opportunityType");
  const sourceType = validEnum(input.sourceType, OPPORTUNITY_SOURCE_TYPES, "sourceType");
  const difficultyTier = validEnum(input.difficultyTier, DIFFICULTY_TIERS, "difficultyTier");
  const participationModeValue = validEnum(input.participationMode, PARTICIPATION_MODES, "participationMode");
  const selectionMethod = validEnum(input.selectionMethod, SELECTION_METHODS, "selectionMethod");
  const compensationTypeValue = validEnum(input.compensationType, COMPENSATION_TYPES, "compensationType");

  const title = requiredNonEmpty(input.title, "title", 200);
  const summary = requiredNonEmpty(input.summary, "summary", 500);
  const description = input.description?.trim() || null;

  const deadline = validDate(input.deadline, "deadline", true) as string;
  const applicationOpenAt = validDate(input.applicationOpenAt, "applicationOpenAt", false);
  const applicationCloseAt = validDate(input.applicationCloseAt, "applicationCloseAt", true) as string;
  if (applicationOpenAt && applicationOpenAt > applicationCloseAt) {
    throw new OpportunityExchangeError("INVALID_DATE_RANGE", "applicationOpenAt must be at or before applicationCloseAt.", 400);
  }
  if (applicationCloseAt > deadline) {
    throw new OpportunityExchangeError("INVALID_DATE_RANGE", "applicationCloseAt must be at or before deadline.", 400);
  }

  validateDistrictFacility(input.districtId, input.facilityId);
  if (input.missionProjectionId) {
    try {
      await resolveMissionLinkForSponsor(actor, input.missionProjectionId);
    } catch (error: any) {
      throw new OpportunityExchangeError("MISSION_NOT_FOUND", "Referenced mission_projection_id was not found or is not visible to you.", 400);
    }
  }

  const resolvedSourceRef = await validateSourceProvenance({ ...input, sourceType }, s);

  const participationMode = participationModeValue;
  const teamSizeMin = participationMode === "INDIVIDUAL" ? null : (input.teamSizeMin ?? null);
  const teamSizeMax = participationMode === "INDIVIDUAL" ? null : (input.teamSizeMax ?? null);
  if (participationMode !== "INDIVIDUAL" && teamSizeMin != null && teamSizeMax != null && teamSizeMax < teamSizeMin) {
    throw new OpportunityExchangeError("INVALID_TEAM_SIZE", "team_size_max must be at or above team_size_min.", 400);
  }

  // §7: BEGINNER tier is a structural fairness floor, never left to a
  // sponsor's eligibility_rules choice.
  const eligibilityRules: EligibilityRules = { ...(input.eligibilityRules || {}) };
  if (difficultyTier === "BEGINNER") {
    eligibilityRules.noReputationRequired = true;
    delete eligibilityRules.minPriorCompletedAwards;
  }

  const compensationType = compensationTypeValue;
  if (compensationType === "NONE" && (input.compensationAmount || input.currencyType)) {
    throw new OpportunityExchangeError("COMPENSATION_MISMATCH", "compensation_amount/currency_type must be empty when compensation_type is NONE.", 400);
  }

  const opportunityId = `student_opportunity_${randomUUID()}`;
  return repo.createOpportunity({
    opportunityId,
    organizationId: s.organizationId,
    tenantId: s.tenantId,
    sponsorOrgId: s.organizationId,
    sponsorUserId: s.userId,
    title,
    summary,
    description,
    opportunityType,
    sourceType,
    sourceRef: resolvedSourceRef,
    districtId: input.districtId || null,
    facilityId: input.facilityId || null,
    missionProjectionId: input.missionProjectionId || null,
    programId: input.programId || null,
    careerId: input.careerId || null,
    requiredSkills: input.requiredSkills || [],
    preferredSkills: input.preferredSkills || [],
    requiredEvidenceRefs: input.requiredEvidenceRefs || [],
    eligibilityRules,
    difficultyTier,
    participationMode,
    teamSizeMin,
    teamSizeMax,
    deliverables: input.deliverables || [],
    deadline,
    applicationOpenAt,
    applicationCloseAt,
    status: "DRAFT",
    compensationType,
    compensationAmount: compensationType === "NONE" ? null : (input.compensationAmount ?? null),
    currencyType: compensationType === "NONE" ? null : (input.currencyType ?? null),
    selectionMethod,
    maxAwards: input.maxAwards ?? 1,
    createdByUserId: s.userId,
  });
}

function canManageOpportunity(actor: EligibilityActor, opportunity: StudentOpportunity): boolean {
  if (opportunity.organizationId !== actor.organization_id) return false;
  if (isAdminTier(actor.roles)) return true;
  return opportunity.createdByUserId === actor.user_id;
}

async function computeEligibilityFor(actor: any, opportunity: StudentOpportunity): Promise<{ result: any; reasons: string[]; requirementsRemaining: string[]; bidCount: number }> {
  const s = scope(actor);
  const now = new Date();
  const applicationWindowOpen = (!opportunity.applicationOpenAt || new Date(opportunity.applicationOpenAt) <= now) && new Date(opportunity.applicationCloseAt) >= now;
  const [activeAwardsCount, priorCompletedAwardsCount, activeEnrollments] = await Promise.all([
    repo.countActiveAwardsForOpportunity(opportunity.opportunityId),
    repo.countCompletedAwardsForStudent(s.organizationId, s.userId),
    enrollmentRepo.listActiveEnrollmentsForLearner(s.organizationId, s.userId),
  ]);
  const [individualBid, bidCount] = await Promise.all([
    repo.findActiveBidByStudent(opportunity.opportunityId, s.userId),
    repo.countBidsForOpportunity(opportunity.opportunityId),
  ]);
  const evaluation = evaluateEligibility(opportunity.eligibilityRules, {
    opportunityStatus: opportunity.status,
    applicationWindowOpen,
    bidCount,
    maxAwards: opportunity.maxAwards,
    activeAwardsCount,
    alreadyHasActiveBid: Boolean(individualBid),
    difficultyTier: opportunity.difficultyTier,
    isActiveEnrollment: activeEnrollments.length > 0,
    enrolledProgramIds: activeEnrollments.map((e) => e.programId).filter(Boolean) as string[],
    enrolledCohortIds: activeEnrollments.map((e) => e.cohortId).filter(Boolean) as string[],
    priorCompletedAwardsCount,
  });
  return { ...evaluation, bidCount } as any;
}

/** Reused by bid-service so bid-time eligibility enforcement is always the
 * exact same computation the student was shown, never a second copy. */
export async function getEligibilityForActor(actor: any, opportunity: StudentOpportunity) {
  return computeEligibilityFor(actor, opportunity);
}

export async function getOpportunityByIdOrThrow(id: string): Promise<StudentOpportunity> {
  const opportunity = await repo.getOpportunityById(id);
  if (!opportunity) throw new OpportunityNotFoundError();
  return opportunity;
}

export function assertCanManageOpportunity(actor: any, opportunity: StudentOpportunity) {
  const s = scope(actor);
  if (!canManageOpportunity({ user_id: s.userId, organization_id: s.organizationId, roles: s.roles }, opportunity)) {
    throw new OpportunityExchangeError("FORBIDDEN", "Only the sponsor or an admin may act on this opportunity.", 403);
  }
}

export async function listOpportunitiesForActor(actor: any): Promise<StudentOpportunity[] | StudentFacingOpportunity[]> {
  const s = scope(actor);
  if (!isStudentOnly(s.roles)) {
    return repo.listOpportunitiesForOrganization(s.organizationId);
  }
  const open = await repo.listOpenOpportunitiesForOrganization(s.organizationId);
  const shaped: StudentFacingOpportunity[] = [];
  for (const opportunity of open) {
    const { bidCount, ...evaluation } = await computeEligibilityFor(actor, opportunity);
    shaped.push(toStudentFacingOpportunity(opportunity, evaluation, bidCount));
  }
  return shaped;
}

export async function getOpportunityForActor(id: string, actor: any): Promise<StudentOpportunity | StudentFacingOpportunity | null> {
  const s = scope(actor);
  const opportunity = await repo.getOpportunityById(id);
  if (!opportunity || opportunity.organizationId !== s.organizationId) return null;
  if (isStudentOnly(s.roles)) {
    if (opportunity.status === "DRAFT") return null;
    const { bidCount, ...evaluation } = await computeEligibilityFor(actor, opportunity);
    return toStudentFacingOpportunity(opportunity, evaluation, bidCount);
  }
  if (opportunity.status === "DRAFT" && !canManageOpportunity({ user_id: s.userId, organization_id: s.organizationId, roles: s.roles }, opportunity)) return null;
  return opportunity;
}

export async function transitionOpportunityStatus(id: string, actor: any, status: StudentOpportunityStatus, expectedVersion: number): Promise<StudentOpportunity> {
  const s = scope(actor);
  const opportunity = await repo.getOpportunityById(id);
  if (!opportunity || opportunity.organizationId !== s.organizationId) throw new OpportunityNotFoundError();
  if (!canManageOpportunity({ user_id: s.userId, organization_id: s.organizationId, roles: s.roles }, opportunity)) {
    throw new OpportunityExchangeError("FORBIDDEN", "Only the sponsor or an admin may change this opportunity's status.", 403);
  }
  if (!canTransitionOpportunity(opportunity.status, status)) {
    throw new OpportunityExchangeError("INVALID_STATUS_TRANSITION", `Cannot transition from ${opportunity.status} to ${status}.`, 400);
  }
  const updated = await repo.updateOpportunityStatus(id, status, expectedVersion);
  if (!updated) throw new OpportunityExchangeError("VERSION_CONFLICT", "Opportunity was modified concurrently; reload and retry.", 409);
  return updated;
}

export function statusForOpportunityError(error: any): number {
  if (error instanceof OpportunityExchangeError) return error.statusCode;
  if (error instanceof OpportunityNotFoundError) return 404;
  return 500;
}

export { repo as opportunityExchangeRepo };
