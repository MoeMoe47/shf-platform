import { randomUUID } from "crypto";
import { CareerEventRepo } from "../repo/career-event-repo.js";
import { CareerEvent, CareerEventType, CareerEventDeliveryMode } from "../model/career-event.js";
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

const repo = new CareerEventRepo();

async function assertCareerRelevanceInputValid(input: { careerId?: string; careerFamilyId?: string }): Promise<void> {
  if (input.careerId && input.careerFamilyId) {
    throw new CareerEventDomainError("CAREER_RELEVANCE_CONFLICT", "Set at most one of careerId or careerFamilyId, never both.", 400);
  }
  if (input.careerId) {
    const res = await query("SELECT 1 FROM careers WHERE career_id=$1 LIMIT 1", [input.careerId]);
    if (!res.rows[0]) throw new CareerEventDomainError("CAREER_NOT_FOUND", "Career not found.", 400);
  }
  if (input.careerFamilyId) {
    const res = await query("SELECT 1 FROM career_families WHERE career_family_id=$1 LIMIT 1", [input.careerFamilyId]);
    if (!res.rows[0]) throw new CareerEventDomainError("CAREER_FAMILY_NOT_FOUND", "Career family not found.", 400);
  }
}

/** Attaches pathwayRelevant to each event for a student-only actor,
 * deriving the actor's pathway exactly once regardless of list size —
 * never a per-event query, and never true for an event with no Career/
 * Career Family linkage. */
async function withPathwayRelevance(actor: EligibilityActor, events: CareerEvent[]): Promise<CareerEvent[]> {
  if (!isStudentOnly(actor.roles) || !events.length) return events;
  const pathway = await deriveLearnerPathway(actor);
  return events.map((e) => ({ ...e, pathwayRelevant: isPathwayRelevant(pathway, { careerId: e.careerId, careerFamilyId: e.careerFamilyId }) }));
}

export class CareerEventDomainError extends Error {
  constructor(public code: string, message: string, public statusCode = 400) {
    super(message);
    this.name = "CareerEventDomainError";
  }
}

export class CareerEventNotFoundError extends Error {
  constructor() { super("Career event not found."); this.name = "CareerEventNotFoundError"; }
}

export interface CreateCareerEventInput {
  title: string;
  description?: string;
  eventType: CareerEventType;
  startsAt: string;
  endsAt: string;
  timezone?: string;
  deliveryMode: CareerEventDeliveryMode;
  location?: string;
  hostOrganizationId?: string;
  capacity?: number;
  registrationRequired?: boolean;
  audienceScope?: AudienceScope;
  programId?: string;
  cohortId?: string;
  careerId?: string;
  careerFamilyId?: string;
}

function asRecord(e: CareerEvent) {
  return {
    organizationId: e.organizationId,
    audienceScope: e.audienceScope,
    programId: e.programId,
    cohortId: e.cohortId,
    createdByUserId: e.createdByUserId,
  };
}

export async function createCareerEvent(actor: EligibilityActor, input: CreateCareerEventInput): Promise<CareerEvent> {
  const audienceScope = input.audienceScope || "ORGANIZATION";
  try {
    await validateAudienceScopeForCreate(actor, { audienceScope, programId: input.programId, cohortId: input.cohortId });
  } catch (err) {
    if (err instanceof AudienceScopeError) throw new CareerEventDomainError(err.code, err.message, err.statusCode);
    throw err;
  }

  if (!input.title?.trim()) throw new CareerEventDomainError("TITLE_REQUIRED", "title is required.", 400);
  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(input.endsAt);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt < startsAt) {
    throw new CareerEventDomainError("INVALID_DATE_RANGE", "endsAt must be at or after startsAt.", 400);
  }
  if (input.capacity !== undefined && (!Number.isInteger(input.capacity) || input.capacity <= 0)) {
    throw new CareerEventDomainError("INVALID_CAPACITY", "capacity must be a positive integer.", 400);
  }
  await assertCareerRelevanceInputValid(input);

  const id = `career_event_${randomUUID()}`;
  return repo.create({
    id,
    organizationId: actor.organization_id,
    tenantId: `tenant:${actor.organization_id}`,
    title: input.title.trim(),
    description: input.description ?? null,
    eventType: input.eventType,
    status: "DRAFT",
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    timezone: input.timezone || "UTC",
    deliveryMode: input.deliveryMode,
    location: input.location ?? null,
    hostOrganizationId: input.hostOrganizationId ?? null,
    capacity: input.capacity ?? null,
    registrationRequired: !!input.registrationRequired,
    audienceScope,
    programId: audienceScope === "PROGRAM" ? input.programId! : null,
    cohortId: audienceScope === "COHORT" ? input.cohortId! : null,
    careerId: input.careerId ?? null,
    careerFamilyId: input.careerFamilyId ?? null,
    createdByUserId: actor.user_id,
  });
}

export async function listCareerEventsForActor(actor: EligibilityActor): Promise<CareerEvent[]> {
  let events: CareerEvent[];
  if (isAdminTier(actor.roles)) events = await repo.listForOrganization(actor.organization_id);
  else if (isStudentOnly(actor.roles)) events = await repo.listVisibleForStudent(actor.organization_id, actor.user_id);
  else events = await repo.listVisibleForInstructor(actor.organization_id, actor.user_id);
  return withPathwayRelevance(actor, events);
}

async function canView(actor: EligibilityActor, event: CareerEvent): Promise<boolean> {
  if (event.organizationId !== actor.organization_id) return false;
  if (isAdminTier(actor.roles)) return true;
  if (event.createdByUserId === actor.user_id) return true;
  if (event.status === "DRAFT") return false;
  if (isStudentOnly(actor.roles)) return isEligibleForAudience(actor, asRecord(event));
  if (event.audienceScope === "ORGANIZATION") return true;
  return canManageAudienceScopedRecord(actor, asRecord(event));
}

export async function getCareerEventForActor(id: string, actor: EligibilityActor): Promise<CareerEvent | null> {
  const event = await repo.getById(id);
  if (!event) return null;
  if (!(await canView(actor, event))) return null;
  const [withRelevance] = await withPathwayRelevance(actor, [event]);
  return withRelevance;
}

export async function transitionCareerEventStatus(id: string, actor: EligibilityActor, status: string): Promise<CareerEvent> {
  const event = await repo.getById(id);
  if (!event) throw new CareerEventNotFoundError();
  if (!(await canManageAudienceScopedRecord(actor, asRecord(event)))) {
    throw new CareerEventDomainError("FORBIDDEN", "Only the event's creator, authorized cohort staff, or an admin may change its status.", 403);
  }
  const allowed: Record<string, string[]> = {
    DRAFT: ["PUBLISHED", "CANCELLED"],
    PUBLISHED: ["CANCELLED", "COMPLETED"],
    CANCELLED: ["ARCHIVED"],
    COMPLETED: ["ARCHIVED"],
    ARCHIVED: [],
  };
  if (!allowed[event.status]?.includes(status)) {
    throw new CareerEventDomainError("INVALID_STATUS_TRANSITION", `Cannot transition from ${event.status} to ${status}.`, 400);
  }
  const updated = await repo.updateStatus(id, status);
  return updated as CareerEvent;
}
