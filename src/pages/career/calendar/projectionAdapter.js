// src/pages/career/calendar/projectionAdapter.js
//
// SHF Ecosystem Phase 11.5 — Calendar Surface Unification. The one
// translation from the canonical backend Calendar Projection's 9-value
// type registry (apps/shs-api/.../calendar/model/calendar-event.ts) into
// this shared frontend event contract's existing type set
// (eventContract.js). Every SHF surface that consumes
// GET /calendar/events/me — Curriculum and Career alike — must use this
// exact mapping so the same canonical event carries the same frontend
// type, color, icon, and filter group no matter which app renders it.
// Do not fork a second copy of this mapping per app.
import { createCalendarEvent } from "./eventContract.js";

export const PROJECTION_TYPE_TO_EVENT_TYPE = {
  ASSIGNMENT_DUE: "assignment",
  LIVE_SESSION: "instructor",
  CAREER_EVENT: "career",
  OPPORTUNITY_DEADLINE: "opportunity",
  PROJECT_START: "project",
  PROJECT_DUE: "project",
  PROJECT_PRESENTATION: "project",
  CREDENTIAL_RENEWAL: "credential",
  CREDENTIAL_EXPIRATION: "credential",
};

// Presentation-only labels (never source-domain truth).
const ORGANIZER_BY_SOURCE_DOMAIN = {
  "live-learning": "Curriculum instruction",
  "career-event": "Career Events",
};

export function mapProjectionToCalendarEvent(projection) {
  const type = PROJECTION_TYPE_TO_EVENT_TYPE[projection.type];
  if (!type) return null; // unknown future backend type: skip rather than guess a presentation
  return createCalendarEvent({
    id: projection.id,
    title: projection.title,
    description: projection.description || "",
    type,
    start: projection.startsAt,
    end: projection.endsAt || null,
    allDay: !!projection.allDay,
    dueDate: projection.dueAt || undefined,
    route: projection.actionUrl || null,
    priority: projection.priority || undefined,
    status: projection.status,
    organizer: ORGANIZER_BY_SOURCE_DOMAIN[projection.sourceDomain] || undefined,
    source: `${projection.sourceDomain}-real`,
    metadata: { ...projection.metadata, pathwayRelevant: projection.pathwayRelevant ?? false },
  });
}

export function mapProjectionItems(items) {
  return (items || []).map(mapProjectionToCalendarEvent).filter(Boolean);
}

// SHF Ecosystem Phase 11.5 — truthful, source-specific wording for the
// compact status bar (see calendar-projection-service.ts's own
// `unavailableSources` vocabulary: assignments, live-learning,
// career-events, opportunities, projects, credentials, plus this frontend
// layer's own "calendar" for a hard failure of the endpoint itself).
// Shared by every Calendar surface so a source outage reads identically
// no matter which app is showing it.
export const SOURCE_LABELS = {
  "live-learning": "Live sessions",
  assignments: "Assignments",
  projects: "Projects",
  credentials: "Credentials",
  "career-events": "Career events",
  opportunities: "Opportunities",
  calendar: "Calendar",
};

export function unavailableSourcesMessage(unavailableSources) {
  const labels = (unavailableSources || []).map((key) => SOURCE_LABELS[key] || key);
  if (labels.length === 0) return "Some calendar data is unavailable. Showing everything else that loaded.";
  return `${labels.join(" and ")} unavailable. Showing all other available calendar data.`;
}
