// src/pages/career/calendar/adapters.js
//
// Source-neutral registry for the two sources that remain genuinely
// frontend-only after SHF Ecosystem Phase 11.5 (Calendar Surface
// Unification): Portfolio (no canonical backend Portfolio scheduling
// producer exists — see docs/SHF_PROJECT_PORTFOLIO_CAPSTONE_JOURNEY_
// INTEGRATION.md) and Personal reminders (genuinely local, user-owned).
// Every other source this registry used to hold — assignments, learning,
// mentor, career, opportunity — was DEMO_* fixture data presented with no
// "demo" label, indistinguishable from live schedule facts. Phase 11.5's
// repository-wide Calendar census identified this as the one real
// duplicate-truth gap left after Phase 9 (which had already migrated
// Curriculum's own copy of the same demo sources to canonical data).
// Career now consumes GET /calendar/events/me directly (see
// useCalendarEvents.js + projectionAdapter.js) — the collectAllEvents()
// aggregator that used to run all seven adapters together no longer has
// any caller and was removed rather than left as reachable dead code that
// could be re-wired back in by accident.
import { createCalendarEvent } from "./eventContract.js";
import { DEMO_PORTFOLIO, iso } from "./demoFixtures.js";
import { listReminders } from "./reminders.js";

const registry = new Map();

export function registerAdapter(sourceKey, fn) {
  registry.set(sourceKey, fn);
}

/** Runs only the caller-chosen subset of registered sources — both
 * Curriculum's and Career's Calendar hooks call this with
 * ["portfolio", "personal"] after fetching canonical data, so demo
 * Portfolio and real local reminders merge in without pulling in a
 * duplicate/fake copy of anything the backend already provides. */
export function collectEvents(sourceKeys) {
  const out = [];
  for (const sourceKey of sourceKeys) {
    const fn = registry.get(sourceKey);
    if (!fn) continue;
    try {
      out.push(...(fn() || []));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`[Calendar] adapter "${sourceKey}" threw`, err);
    }
  }
  return out;
}

// ---------------------------------------------------------------------
// Portfolio review — DEMO DATA, explicitly and permanently local (see
// module header). Never enters canonical Calendar Intelligence — it is
// merged into the frontend event list only, after the real projection has
// already been fetched.
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
