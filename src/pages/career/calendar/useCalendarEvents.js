// src/pages/career/calendar/useCalendarEvents.js
//
// SHF Ecosystem Phase 11.5 — Calendar Surface Unification. Cross-domain
// aggregation (Assignments, Live Learning, Career Events, Opportunities,
// Projects, Credentials) is performed by the canonical backend Calendar
// Projection Service (GET /calendar/events/me — see apps/shs-api/.../
// calendar/ and docs/SHF_CALENDAR_PROJECTION_SERVICE.md), exactly as
// already established for the Curriculum Calendar in Phase 9. This hook
// no longer runs the local demo adapter registry
// (assignments/learning/portfolio/mentor/career/opportunity in
// adapters.js's DEMO_* fixtures) — those were presented as live schedule
// data with no "demo" label, which Phase 11.5's census identified as the
// one real duplicate-truth gap in this codebase. Portfolio (still
// frontend-only — no canonical backend Portfolio scheduling producer
// exists; see docs/SHF_PROJECT_PORTFOLIO_CAPSTONE_JOURNEY_INTEGRATION.md)
// and Personal reminders (genuinely local, user-owned) remain merged in
// unchanged — the same two sources Curriculum's own hook already merges.
import { useCallback, useEffect, useState } from "react";
import { useUser } from "@/context/UserContext.jsx";
import { listCalendarEvents } from "@/lib/calendar/api.js";
import { collectEvents } from "./adapters.js";
import { mapProjectionItems } from "./projectionAdapter.js";
import { subscribeReminders } from "./reminders.js";

const SHARED_SOURCES = ["portfolio", "personal"];

export function useCalendarEvents() {
  const { role } = useUser();
  const [state, setState] = useState({ loading: true, error: null, events: [], partial: false, unavailableSources: [] });

  const load = useCallback(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));

    let sharedEvents = [];
    let sharedError = null;
    try {
      sharedEvents = collectEvents(SHARED_SOURCES);
    } catch (err) {
      sharedError = err;
    }

    listCalendarEvents(role)
      .then((projection) => {
        if (!active) return;
        const mapped = mapProjectionItems(projection?.items);
        setState({
          loading: false,
          error: null,
          events: [...mapped, ...sharedEvents],
          partial: (projection?.unavailableSources || []).length > 0 || !!sharedError,
          unavailableSources: projection?.unavailableSources || [],
        });
      })
      .catch((error) => {
        if (!active) return;
        if (sharedEvents.length > 0) {
          setState({ loading: false, error: null, events: sharedEvents, partial: true, unavailableSources: ["calendar"] });
          return;
        }
        setState({ loading: false, error, events: [], partial: false, unavailableSources: ["calendar"] });
      });

    return () => { active = false; };
  }, [role]);

  useEffect(() => load(), [load]);

  // Personal reminders can change (create/edit/delete) without a full
  // reload of every other source.
  useEffect(() => subscribeReminders(load), [load]);

  return { ...state, refresh: load };
}
