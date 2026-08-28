// src/pages/career/calendar/demoFixtures.js
//
// DEMO DATA — not a live institutional record. Mirrors the existing
// codebase convention of clearly-labeled placeholder content (see
// src/pages/Assignments.jsx "// Placeholder data (swap when API is ready)"
// and src/hooks/useDashboardData.js's SAMPLE object) rather than inventing
// a new pattern. Kept in its own module, out of any presentation component,
// per the build brief's data-separation requirement.
//
// Dates are generated relative to "today" (fixed offsets in days) instead
// of hardcoded calendar dates, so the fixture never silently becomes
// "last year's demo data" — while staying deterministic run-to-run for a
// given day: the same offsets always produce the same relative structure,
// which is what the calendar tests assert against.

import { toDateKey, addDays } from "./dateUtils.js";

function iso(dayOffset, hour = 9, minute = 0) {
  const d = addDays(new Date(), dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function dateKey(dayOffset) {
  return toDateKey(addDays(new Date(), dayOffset));
}

// -- Assignments (mirrors src/pages/Assignments.jsx's demo items so the
//    Calendar and Assignments page agree on the same "reality" instead of
//    each inventing their own, as the old duplicated placeholders did) --
export const DEMO_ASSIGNMENTS = [
  { id: "ref-1",  title: "Lesson 3 Reflection", dayOffset: 2,  type: "reflection" },
  { id: "quiz-2", title: "Quiz 2",              dayOffset: 4,  type: "quiz" },
  { id: "art-1",  title: "Portfolio Artifact",  dayOffset: 10, type: "artifact" },
];

// -- Learning / class sessions --
export const DEMO_LEARNING = [
  { id: "live-1", title: "Live Class — Module 1", dayOffset: 1, hour: 9,  minute: 0,  route: "/learn" },
  { id: "ws-1",   title: "Workshop: Resume Polishing", dayOffset: 3, hour: 13, minute: 0, route: "/resume" },
];

// -- Portfolio review --
export const DEMO_PORTFOLIO = [
  { id: "pf-1", title: "Portfolio Review — Module 1 Checkpoint", dayOffset: 6, hour: 11, minute: 0, route: "/portfolio" },
];

// -- Mentor check-in --
export const DEMO_MENTOR = [
  { id: "mn-1", title: "Mentor Check-In", dayOffset: 5, hour: 15, minute: 30, organizer: "Career Coach" },
];

// -- Career events --
export const DEMO_CAREER = [
  { id: "cf-1", title: "Office Hours (Drop-in)", dayOffset: 8, allDay: true, route: "/coach" },
];

export { iso, dateKey };
