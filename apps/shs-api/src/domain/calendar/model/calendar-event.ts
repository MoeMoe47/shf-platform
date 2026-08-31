// SHF Ecosystem Phase 9 — Canonical Calendar Projection contract.
//
// NON-NEGOTIABLE: this domain owns no institutional truth. It only reads,
// normalizes, filters, dedupes, orders, and projects facts that already
// belong to Assignments, Live Learning, Career Events, Opportunities,
// Projects, and Credentials. A CalendarEventProjection existing, or its
// date having passed, is never completion/attendance/approval/mastery —
// see each field's own comment below and
// docs/SHF_CALENDAR_PROJECTION_SERVICE.md.
//
// Type registry is intentionally bounded and fine-grained (one entry per
// projection *kind*, not one per source domain) — PROJECT_START/DUE/
// PRESENTATION are three distinct types from one Project record, not one
// "project" type with a metadata sub-field, so a consumer can filter/
// reason about them individually. The existing frontend event contract
// (src/pages/career/calendar/eventContract.js) keeps its own, older,
// coarser type set unchanged — the frontend adapter that consumes this
// API translates these backend types down to the existing frontend types
// it already renders, so no Calendar UI/filter/CSS changes were needed.
export const CALENDAR_EVENT_TYPES = [
  "ASSIGNMENT_DUE",
  "LIVE_SESSION",
  "CAREER_EVENT",
  "OPPORTUNITY_DEADLINE",
  "PROJECT_START",
  "PROJECT_DUE",
  "PROJECT_PRESENTATION",
  "CREDENTIAL_RENEWAL",
  "CREDENTIAL_EXPIRATION",
] as const;
export type CalendarEventType = typeof CALENDAR_EVENT_TYPES[number];

export const CALENDAR_SOURCE_DOMAINS = [
  "assignment", "live-learning", "career-event", "opportunity", "project", "credential",
] as const;
export type CalendarSourceDomain = typeof CALENDAR_SOURCE_DOMAINS[number];

// Deterministic identity — never title/date/array-index/random. Reuses
// the exact `${sourceDomain}:${sourceRecordId}` shape the existing
// frontend contract's own createCalendarEventId() already uses, so a
// projected event's id is stable whether generated here or (during the
// Phase 9 transition) still generated client-side from the same source
// record.
export function createProjectionId(sourceDomain: CalendarSourceDomain, sourceRecordId: string): string {
  return `${sourceDomain}:${sourceRecordId}`;
}

export interface CalendarEventProjection {
  id: string;
  sourceDomain: CalendarSourceDomain;
  sourceRecordId: string;
  type: CalendarEventType;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string | null;
  // Only set for genuinely deadline-shaped projections (Assignment due,
  // Opportunity application deadline, Credential renewal/expiration) —
  // never invented for a timed event that merely has a start.
  dueAt: string | null;
  allDay: boolean;
  // The source record's own raw status string, untouched (e.g.
  // "PUBLISHED", "ACTIVE", "ISSUED") — never collapsed into one universal
  // meaning across domains.
  sourceStatus: string;
  // A normalized, presentation-safe status derived per-domain
  // (confirmed/cancelled/tentative) — mirrors exactly what the pre-Phase-9
  // frontend mappers already computed, preserved here for continuity.
  status: "confirmed" | "cancelled" | "tentative";
  priority: "low" | "medium" | "high" | null;
  // In-app route back to the source domain's own detail surface — never a
  // second Calendar-owned detail datastore. Entitlement is rechecked by
  // that destination itself, not assumed from inclusion here.
  actionUrl: string | null;
  pathwayRelevant: boolean | null;
  metadata: Record<string, unknown>;
}
