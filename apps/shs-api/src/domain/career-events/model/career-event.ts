// SHF Ecosystem Phase 4 — Career Event domain model.
// A Career Event is a scheduled, time-based career-development or
// employer-engagement activity (career fair, employer session, workshop,
// site visit, interview, hiring event, mentor session, apprenticeship
// info session, networking event). It is NOT an Opportunity — see
// opportunities/model/opportunity.ts and the phase doc for why these stay
// two separate domains despite both projecting into the same Calendar.

export const CAREER_EVENT_TYPES = [
  "CAREER_FAIR",
  "EMPLOYER_SESSION",
  "WORKSHOP",
  "SITE_VISIT",
  "INTERVIEW",
  "HIRING_EVENT",
  "MENTOR_SESSION",
  "APPRENTICESHIP_INFO",
  "NETWORKING",
] as const;
export type CareerEventType = typeof CAREER_EVENT_TYPES[number];

export const CAREER_EVENT_STATUSES = ["DRAFT", "PUBLISHED", "CANCELLED", "COMPLETED", "ARCHIVED"] as const;
export type CareerEventStatus = typeof CAREER_EVENT_STATUSES[number];

export const CAREER_EVENT_DELIVERY_MODES = ["IN_PERSON", "VIRTUAL", "HYBRID"] as const;
export type CareerEventDeliveryMode = typeof CAREER_EVENT_DELIVERY_MODES[number];

export interface CareerEvent {
  id: string;
  organizationId: string;
  tenantId: string;
  title: string;
  description: string | null;
  eventType: CareerEventType;
  status: CareerEventStatus;
  startsAt: string;
  endsAt: string;
  timezone: string;
  deliveryMode: CareerEventDeliveryMode;
  location: string | null;
  hostOrganizationId: string | null;
  capacity: number | null;
  registrationRequired: boolean;
  audienceScope: "ORGANIZATION" | "PROGRAM" | "COHORT";
  programId: string | null;
  cohortId: string | null;
  /** SHF Ecosystem Phase 5 — optional relevance/category metadata, never
   * an access-control rule. At most one of careerId/careerFamilyId is
   * ever set (enforced at the database level). */
  careerId: string | null;
  careerFamilyId: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  /** Populated only for student-tier reads (see career-event-service.ts) —
   * never present for admin/instructor reads, since it's a per-learner
   * derived signal, not a property of the event itself. */
  pathwayRelevant?: boolean;
}

/** Student-facing shape — never leaks tenantId, createdByUserId, or
 * program/cohort targeting internals (a student doesn't need to know
 * *which* cohort a cohort-scoped event targeted, only that they can see
 * it). Mirrors the Live Learning student DTO precedent. */
export interface StudentFacingCareerEvent {
  id: string;
  title: string;
  description: string | null;
  eventType: CareerEventType;
  status: CareerEventStatus;
  startsAt: string;
  endsAt: string;
  timezone: string;
  deliveryMode: CareerEventDeliveryMode;
  location: string | null;
  capacity: number | null;
  registrationRequired: boolean;
  careerId: string | null;
  careerFamilyId: string | null;
  /** Set by the service layer only (requires the actor's derived
   * pathway, which this pure model function has no access to) — never
   * true for an event with no careerId/careerFamilyId. */
  pathwayRelevant?: boolean;
}

export function toStudentFacingCareerEvent(e: CareerEvent): StudentFacingCareerEvent {
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    eventType: e.eventType,
    status: e.status,
    startsAt: e.startsAt,
    endsAt: e.endsAt,
    timezone: e.timezone,
    deliveryMode: e.deliveryMode,
    location: e.location,
    capacity: e.capacity,
    registrationRequired: e.registrationRequired,
    careerId: e.careerId,
    careerFamilyId: e.careerFamilyId,
    pathwayRelevant: e.pathwayRelevant,
  };
}
