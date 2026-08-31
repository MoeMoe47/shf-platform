// SHF Ecosystem Phase 4 — Opportunity domain model.
// An Opportunity is something a learner may pursue (internship,
// apprenticeship, scholarship, job, fellowship, training, sponsored
// program) — distinct from a Career Event. An Opportunity does not
// automatically imply a scheduled event; it has a deadline, not
// necessarily a start/end time. See career-events/model/career-event.ts
// and the phase doc for why these stay separate domains.

export const OPPORTUNITY_TYPES = [
  "INTERNSHIP",
  "APPRENTICESHIP",
  "SCHOLARSHIP",
  "JOB",
  "FELLOWSHIP",
  "TRAINING",
  "SPONSORED_PROGRAM",
  "OTHER",
] as const;
export type OpportunityType = typeof OPPORTUNITY_TYPES[number];

export const OPPORTUNITY_STATUSES = ["DRAFT", "OPEN", "CLOSED", "CANCELLED", "ARCHIVED"] as const;
export type OpportunityStatus = typeof OPPORTUNITY_STATUSES[number];

export const OPPORTUNITY_DELIVERY_MODES = ["IN_PERSON", "VIRTUAL", "HYBRID"] as const;
export type OpportunityDeliveryMode = typeof OPPORTUNITY_DELIVERY_MODES[number];

export interface Opportunity {
  id: string;
  organizationId: string;
  tenantId: string;
  title: string;
  description: string | null;
  opportunityType: OpportunityType;
  status: OpportunityStatus;
  opensAt: string | null;
  applicationDeadline: string;
  startsAt: string | null;
  endsAt: string | null;
  deliveryMode: OpportunityDeliveryMode | null;
  location: string | null;
  sourceOrganizationId: string | null;
  actionUrl: string | null;
  actionRoute: string | null;
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
  /** Populated only for student-tier reads — never true for an
   * Opportunity with no Career/Career Family linkage. */
  pathwayRelevant?: boolean;
}

/** Student-facing shape — no tenantId/createdByUserId/targeting internals. */
export interface StudentFacingOpportunity {
  id: string;
  title: string;
  description: string | null;
  opportunityType: OpportunityType;
  status: OpportunityStatus;
  opensAt: string | null;
  applicationDeadline: string;
  startsAt: string | null;
  endsAt: string | null;
  deliveryMode: OpportunityDeliveryMode | null;
  location: string | null;
  actionUrl: string | null;
  actionRoute: string | null;
  careerId: string | null;
  careerFamilyId: string | null;
  pathwayRelevant?: boolean;
}

export function toStudentFacingOpportunity(o: Opportunity): StudentFacingOpportunity {
  return {
    id: o.id,
    title: o.title,
    description: o.description,
    opportunityType: o.opportunityType,
    status: o.status,
    opensAt: o.opensAt,
    applicationDeadline: o.applicationDeadline,
    startsAt: o.startsAt,
    endsAt: o.endsAt,
    deliveryMode: o.deliveryMode,
    location: o.location,
    actionUrl: o.actionUrl,
    actionRoute: o.actionRoute,
    careerId: o.careerId,
    careerFamilyId: o.careerFamilyId,
    pathwayRelevant: o.pathwayRelevant,
  };
}
