// src/pages/curriculum/calendar/useLearningCalendarEvents.js
//
// SHF Ecosystem Phase 9 — Curriculum's Calendar event source. As of this
// phase, cross-domain aggregation (reading Assignments, Live Learning,
// Career Events, Opportunities, Projects, and Credentials; applying each
// domain's own entitlement; deduping by stable identity; ordering) is
// performed by the canonical backend Calendar Projection Service
// (GET /calendar/events/me — see apps/shs-api/src/domain/calendar/ and
// docs/SHF_CALENDAR_PROJECTION_SERVICE.md), not by this hook. This file's
// remaining job is thin: fetch the one already-entitled, already-ordered
// projection, translate each backend event's fine-grained `type`
// (ASSIGNMENT_DUE, LIVE_SESSION, CAREER_EVENT, OPPORTUNITY_DEADLINE,
// PROJECT_START/DUE/PRESENTATION, CREDENTIAL_RENEWAL/EXPIRATION) into this
// page's existing, unchanged `CalendarEventType` set (see
// career/calendar/eventContract.js — that registry, its filters, and its
// CSS were not touched this phase), and merge in the still-frontend-only
// demo sources (portfolio/personal — Portfolio has no backend domain; see
// docs/SHF_PROJECT_PORTFOLIO_CAPSTONE_JOURNEY_INTEGRATION.md).
//
// Ownership boundary (unchanged from every prior phase): this hook only
// ever *reads* and re-shapes projection records. It never writes back to
// any source domain and never marks anything "completed" or "applied" —
// per the Phase 9 brief's own non-negotiable principle, the backend
// Projection Service it now calls owns no institutional truth either; it
// is a read/orchestration layer over the same six real source domains.
//
// Failure isolation: the backend already isolates per-source failures
// (Promise.allSettled server-side) and reports exactly which producer(s)
// are down via `unavailableSources` — this hook passes that straight
// through. A hard failure (every producer down, or the Calendar endpoint
// itself unreachable) surfaces as `error`, matching the pre-Phase-9
// "nothing could be loaded" behavior exactly.
import React from "react";
import { listCalendarEvents } from "@/lib/calendar/api.js";
import { collectEvents } from "@/pages/career/calendar/adapters.js";
import { mapProjectionItems } from "@/pages/career/calendar/projectionAdapter.js";

const SHARED_SOURCES = ["portfolio", "personal"];

export function useLearningCalendarEvents(role) {
  const [state, setState] = React.useState({
    loading: true,
    error: null,
    events: [],
    partial: false,
    unavailableSources: [],
  });

  const refresh = React.useCallback(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true, error: null }));

    // Shared demo sources are synchronous/local (see adapters.js) — collect
    // them up front so either real source failing still leaves the rest of
    // the page populated (Phase I: partial data still renders).
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
        // The backend already dedupes by stable identity and orders
        // deterministically; sharedEvents are a distinct, still-local
        // source appended after, matching pre-Phase-9 ordering.
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
          // The backend Calendar endpoint is down, but the still-local
          // demo sources loaded fine — a real partial state, not a total
          // failure (Phase I: one producer's outage never blanks a page
          // that has other valid data to show).
          setState({ loading: false, error: null, events: sharedEvents, partial: true, unavailableSources: ["calendar"] });
          return;
        }
        setState({ loading: false, error, events: [], partial: false, unavailableSources: ["calendar"] });
      });

    return () => {
      active = false;
    };
  }, [role]);

  React.useEffect(() => refresh(), [refresh]);
  return { ...state, refresh };
}
