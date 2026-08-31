// src/pages/career/calendar/demoFixtures.js
//
// DEMO DATA — not a live institutional record. As of SHF Ecosystem
// Phase 11.5 (Calendar Surface Unification), this file holds only the one
// source that remains genuinely, permanently frontend-only: Portfolio
// review (no canonical backend Portfolio scheduling producer exists —
// see docs/SHF_PROJECT_PORTFOLIO_CAPSTONE_JOURNEY_INTEGRATION.md).
//
// Every other demo fixture that used to live here — Assignments,
// Learning, Mentor check-ins, Career events, Opportunities — was removed
// in Phase 11.5: Career Calendar now consumes GET /calendar/events/me for
// all of those, the same canonical Calendar Projection Service Curriculum
// Calendar has used since Phase 9. Presenting those DEMO_* arrays as live
// schedule data with no "demo" label was Phase 11.5's own repository-wide
// census's central finding — see docs/SHF_CALENDAR_SURFACE_UNIFICATION.md.
//
// Dates are generated relative to "today" (fixed offsets in days) instead
// of hardcoded calendar dates, so the fixture never silently becomes
// "last year's demo data" — while staying deterministic run-to-run for a
// given day.

import { addDays } from "./dateUtils.js";

function iso(dayOffset, hour = 9, minute = 0) {
  const d = addDays(new Date(), dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

// -- Portfolio review --
export const DEMO_PORTFOLIO = [
  { id: "pf-1", title: "Portfolio Review — Module 1 Checkpoint", dayOffset: 6, hour: 11, minute: 0, route: "/portfolio" },
];

export { iso };
