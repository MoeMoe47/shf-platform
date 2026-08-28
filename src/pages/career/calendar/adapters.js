// src/pages/career/calendar/adapters.js
//
// Source-neutral registry: the Calendar page never reaches into Assignments,
// Learning, Portfolio, Arcade, Credentials, etc. directly. Each source
// registers a small adapter function that returns an array of
// createCalendarEvent() objects. A confirmed future source can register
// here without the Calendar view changing at all.
//
// Where a source has no dated data model in this repository today (Arcade
// challenges, Credential badges — checked src/data/arcade.js and
// portfolio-sections/CredentialsBadges.jsx, neither has a due/scheduled
// date field), the adapter is registered as an explicit EMPTY provider
// with a comment, per the build brief: don't invent an endpoint, don't
// fabricate fake institutional records to fill the space.

import { createCalendarEvent } from "./eventContract.js";
import {
  DEMO_ASSIGNMENTS,
  DEMO_LEARNING,
  DEMO_PORTFOLIO,
  DEMO_MENTOR,
  DEMO_CAREER,
  iso,
  dateKey,
} from "./demoFixtures.js";
import { listReminders } from "./reminders.js";

const registry = new Map();

export function registerAdapter(sourceKey, fn) {
  registry.set(sourceKey, fn);
}

export function listAdapterSources() {
  return Array.from(registry.keys());
}

/** Runs every registered adapter and flattens the result. Adapters are
 * synchronous today (all current sources are local); an async source can
 * still register here — callers already treat this as loading-then-ready
 * via useCalendarEvents.js, so adding `await` later is a non-breaking
 * change to this one function. */
export function collectAllEvents() {
  const out = [];
  for (const [sourceKey, fn] of registry.entries()) {
    let items = [];
    try {
      items = fn() || [];
    } catch (err) {
      // A single misbehaving source must not blank the whole calendar.
      // eslint-disable-next-line no-console
      console.warn(`[CareerCalendar] adapter "${sourceKey}" threw`, err);
      items = [];
    }
    out.push(...items);
  }
  return out;
}

// ---------------------------------------------------------------------
// Assignments — demo data mirrors src/pages/Assignments.jsx exactly (see
// demoFixtures.js). Real wiring point: once Assignments.jsx reads from a
// shared store/API instead of local component state, point this adapter
// at that same store.
// ---------------------------------------------------------------------
registerAdapter("assignments", () =>
  DEMO_ASSIGNMENTS.map((a) =>
    createCalendarEvent({
      id: `assignment-${a.id}`,
      title: a.title,
      type: "assignment",
      start: dateKey(a.dayOffset),
      allDay: true,
      dueDate: dateKey(a.dayOffset),
      route: "/assignments",
      priority: "medium",
      source: "assignments-demo",
    })
  )
);

// ---------------------------------------------------------------------
// Learning — live classes / workshops.
// ---------------------------------------------------------------------
registerAdapter("learning", () =>
  DEMO_LEARNING.map((l) =>
    createCalendarEvent({
      id: `learning-${l.id}`,
      title: l.title,
      type: "lesson",
      start: iso(l.dayOffset, l.hour, l.minute),
      route: l.route || "/learn",
      source: "learning-demo",
    })
  )
);

// ---------------------------------------------------------------------
// Portfolio review.
// ---------------------------------------------------------------------
registerAdapter("portfolio", () =>
  DEMO_PORTFOLIO.map((p) =>
    createCalendarEvent({
      id: `portfolio-${p.id}`,
      title: p.title,
      type: "portfolio",
      start: iso(p.dayOffset, p.hour, p.minute),
      route: p.route || "/portfolio",
      source: "portfolio-demo",
    })
  )
);

// ---------------------------------------------------------------------
// Mentor check-ins.
// ---------------------------------------------------------------------
registerAdapter("mentor", () =>
  DEMO_MENTOR.map((m) =>
    createCalendarEvent({
      id: `mentor-${m.id}`,
      title: m.title,
      type: "mentor",
      start: iso(m.dayOffset, m.hour, m.minute),
      organizer: m.organizer,
      route: "/coach",
      source: "mentor-demo",
    })
  )
);

// ---------------------------------------------------------------------
// Career events (office hours, career fair, etc.)
// ---------------------------------------------------------------------
registerAdapter("career", () =>
  DEMO_CAREER.map((c) =>
    createCalendarEvent({
      id: `career-${c.id}`,
      title: c.title,
      type: "career",
      start: dateKey(c.dayOffset),
      allDay: !!c.allDay,
      route: c.route || null,
      source: "career-demo",
    })
  )
);

// ---------------------------------------------------------------------
// Arcade — EMPTY PROVIDER. src/data/arcade.js is a static game catalog
// (title/tag/art/hue) with no date, schedule, or challenge-window field of
// any kind. No "Arcade Challenge" event can be honestly generated from it,
// so this adapter deliberately returns nothing rather than fabricating
// dates. Registering it (instead of omitting it) keeps "Arcade" wired as a
// real, empty source so a future scheduled-challenge feature can populate
// it without any Calendar code changing.
// ---------------------------------------------------------------------
registerAdapter("arcade", () => []);

// ---------------------------------------------------------------------
// Credentials — EMPTY PROVIDER. CredentialsBadges.jsx's BADGES array is a
// static earned/unearned badge list with no due date or milestone date
// field (confirmed in its own comment: "No canonical credentials/badge
// catalog exists for this student in the repo"). Same reasoning as Arcade.
// ---------------------------------------------------------------------
registerAdapter("credential", () => []);

// ---------------------------------------------------------------------
// Personal reminders — the one source this Calendar can genuinely create
// and persist, editable by the student. See reminders.js.
// ---------------------------------------------------------------------
registerAdapter("personal", () =>
  listReminders().map((r) =>
    createCalendarEvent({
      id: r.id,
      title: r.title,
      description: r.note || "",
      type: "personal",
      start: r.allDay ? r.date : `${r.date}T${r.time || "09:00"}:00`,
      allDay: !!r.allDay,
      reminder: r.reminderMinutes || null,
      editable: true,
      source: "personal",
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })
  )
);
