import { randomUUID } from "crypto";
import { OpportunityRepo } from "../repo/opportunity-repo.js";
import { Opportunity, OpportunityType, OpportunityDeliveryMode } from "../model/opportunity.js";
import {
  AudienceScope,
  AudienceScopeError,
  EligibilityActor,
  isAdminTier,
  isEligibleForAudience,
  isStudentOnly,
  canManageAudienceScopedRecord,
  validateAudienceScopeForCreate,
} from "../../shared/audience-eligibility.js";
import { deriveLearnerPathway, isPathwayRelevant } from "../../career-pathways/service/career-pathway-service.js";
import { query } from "../../../db/client.js";

const repo = new OpportunityRepo();

async function assertCareerRelevanceInputValid(input: { careerId?: string; careerFamilyId?: string }): Promise<void> {
  if (input.careerId && input.careerFamilyId) {
    throw new OpportunityDomainError("CAREER_RELEVANCE_CONFLICT", "Set at most one of careerId or careerFamilyId, never both.", 400);
  }
  if (input.careerId) {
    const res = await query("SELECT 1 FROM careers WHERE career_id=$1 LIMIT 1", [input.careerId]);
    if (!res.rows[0]) throw new OpportunityDomainError("CAREER_NOT_FOUND", "Career not found.", 400);
  }
  if (input.careerFamilyId) {
    const res = await query("SELECT 1 FROM career_families WHERE career_family_id=$1 LIMIT 1", [input.careerFamilyId]);
    if (!res.rows[0]) throw new OpportunityDomainError("CAREER_FAMILY_NOT_FOUND", "Career family not found.", 400);
  }
}

async function withPathwayRelevance(actor: EligibilityActor, opportunities: Opportunity[]): Promise<Opportunity[]> {
  if (!isStudentOnly(actor.roles) || !opportunities.length) return opportunities;
  const pathway = await deriveLearnerPathway(actor);
  return opportunities.map((o) => ({ ...o, pathwayRelevant: isPathwayRelevant(pathway, { careerId: o.careerId, careerFamilyId: o.careerFamilyId }) }));
}

export class OpportunityDomainError extends Error {
  constructor(public code: string, message: string, public statusCode = 400) {
    super(message);
    this.name = "OpportunityDomainError";
  }
}

export class OpportunityNotFoundError extends Error {
  constructor() { super("Opportunity not found."); this.name = "OpportunityNotFoundError"; }
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function validateDate(value: string | undefined, field: string, required: boolean): string | null {
  if (!value) {
    if (required) throw new OpportunityDomainError("INVALID_DATE", `${field} is required.`, 400);
    return null;
  }
  if (!DATE_ONLY.test(value) || Number.isNaN(new Date(value).getTime())) {
    throw new OpportunityDomainError("INVALID_DATE", `${field} must be a YYYY-MM-DD date.`, 400);
  }
  return value;
}

export interface CreateOpportunityInput {
  title: string;
  description?: string;
  opportunityType: OpportunityType;
  opensAt?: string;
  applicationDeadline: string;
  startsAt?: string;
  endsAt?: string;
  deliveryMode?: OpportunityDeliveryMode;
  location?: string;
  sourceOrganizationId?: string;
  actionUrl?: string;
  actionRoute?: string;
  audienceScope?: AudienceScope;
  programId?: string;
  cohortId?: string;
  careerId?: string;
  careerFamilyId?: string;
}

function asRecord(o: Opportunity) {
  return {
    organizationId: o.organizationId,
    audienceScope: o.audienceScope,
    programId: o.programId,
    cohortId: o.cohortId,
    createdByUserId: o.createdByUserId,
  };
}

export async function createOpportunity(actor: EligibilityActor, input: CreateOpportunityInput): Promise<Opportunity> {
  const audienceScope = input.audienceScope || "ORGANIZATION";
  try {
    await validateAudienceScopeForCreate(actor, { audienceScope, programId: input.programId, cohortId: input.cohortId });
  } catch (err) {
    if (err instanceof AudienceScopeError) throw new OpportunityDomainError(err.code, err.message, err.statusCode);
    throw err;
  }

  if (!input.title?.trim()) throw new OpportunityDomainError("TITLE_REQUIRED", "title is required.", 400);

  const opensAt = validateDate(input.opensAt, "opensAt", false);
  const applicationDeadline = validateDate(input.applicationDeadline, "applicationDeadline", true) as string;
  const startsAt = validateDate(input.startsAt, "startsAt", false);
  const endsAt = validateDate(input.endsAt, "endsAt", false);
  if (opensAt && opensAt > applicationDeadline) {
    throw new OpportunityDomainError("INVALID_DATE_RANGE", "opensAt must be at or before applicationDeadline.", 400);
  }
  if (startsAt && endsAt && endsAt < startsAt) {
    throw new OpportunityDomainError("INVALID_DATE_RANGE", "endsAt must be at or after startsAt.", 400);
  }

  const actionUrl = input.actionUrl?.trim() || null;
  const actionRoute = input.actionRoute?.trim() || null;
  if (!actionUrl && !actionRoute) {
    throw new OpportunityDomainError("ACTION_DESTINATION_REQUIRED", "Either actionUrl or actionRoute is required.", 400);
  }
  if (actionUrl && !/^https?:\/\//i.test(actionUrl)) {
    throw new OpportunityDomainError("INVALID_ACTION_URL", "actionUrl must be an http(s) URL.", 400);
  }
  if (actionRoute && !actionRoute.startsWith("/")) {
    throw new OpportunityDomainError("INVALID_ACTION_ROUTE", "actionRoute must be an internal path starting with '/'.", 400);
  }
  await assertCareerRelevanceInputValid(input);

  const id = `opportunity_${randomUUID()}`;
  return repo.create({
    id,
    organizationId: actor.organization_id,
    tenantId: `tenant:${actor.organization_id}`,
    title: input.title.trim(),
    description: input.description ?? null,
    opportunityType: input.opportunityType,
    status: "DRAFT",
    opensAt,
    applicationDeadline,
    startsAt,
    endsAt,
    deliveryMode: input.deliveryMode ?? null,
    location: input.location ?? null,
    sourceOrganizationId: input.sourceOrganizationId ?? null,
    actionUrl,
    actionRoute,
    audienceScope,
    programId: audienceScope === "PROGRAM" ? input.programId! : null,
    cohortId: audienceScope === "COHORT" ? input.cohortId! : null,
    careerId: input.careerId ?? null,
    careerFamilyId: input.careerFamilyId ?? null,
    createdByUserId: actor.user_id,
  });
}

export async function listOpportunitiesForActor(actor: EligibilityActor): Promise<Opportunity[]> {
  let opportunities: Opportunity[];
  if (isAdminTier(actor.roles)) opportunities = await repo.listForOrganization(actor.organization_id);
  else if (isStudentOnly(actor.roles)) opportunities = await repo.listVisibleForStudent(actor.organization_id, actor.user_id);
  else opportunities = await repo.listVisibleForInstructor(actor.organization_id, actor.user_id);
  return withPathwayRelevance(actor, opportunities);
}

async function canView(actor: EligibilityActor, opportunity: Opportunity): Promise<boolean> {
  if (opportunity.organizationId !== actor.organization_id) return false;
  if (isAdminTier(actor.roles)) return true;
  if (opportunity.createdByUserId === actor.user_id) return true;
  if (opportunity.status === "DRAFT") return false;
  if (isStudentOnly(actor.roles)) {
    return opportunity.status === "OPEN" && (await isEligibleForAudience(actor, asRecord(opportunity)));
  }
  if (opportunity.audienceScope === "ORGANIZATION") return true;
  return canManageAudienceScopedRecord(actor, asRecord(opportunity));
}

export async function getOpportunityForActor(id: string, actor: EligibilityActor): Promise<Opportunity | null> {
  const opportunity = await repo.getById(id);
  if (!opportunity) return null;
  if (!(await canView(actor, opportunity))) return null;
  const [withRelevance] = await withPathwayRelevance(actor, [opportunity]);
  return withRelevance;
}

export async function transitionOpportunityStatus(id: string, actor: EligibilityActor, status: string): Promise<Opportunity> {
  const opportunity = await repo.getById(id);
  if (!opportunity) throw new OpportunityNotFoundError();
  if (!(await canManageAudienceScopedRecord(actor, asRecord(opportunity)))) {
    throw new OpportunityDomainError("FORBIDDEN", "Only the opportunity's creator, authorized cohort staff, or an admin may change its status.", 403);
  }
  const allowed: Record<string, string[]> = {
    DRAFT: ["OPEN", "CANCELLED"],
    OPEN: ["CLOSED", "CANCELLED"],
    CLOSED: ["ARCHIVED"],
    CANCELLED: ["ARCHIVED"],
    ARCHIVED: [],
  };
  if (!allowed[opportunity.status]?.includes(status)) {
    throw new OpportunityDomainError("INVALID_STATUS_TRANSITION", `Cannot transition from ${opportunity.status} to ${status}.`, 400);
  }
  const updated = await repo.updateStatus(id, status);
  return updated as Opportunity;
}
