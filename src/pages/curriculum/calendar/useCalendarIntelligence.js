// src/pages/curriculum/calendar/useCalendarIntelligence.js
//
// SHF Ecosystem Phase 10 — thin fetch wrapper around the canonical backend
// Calendar Intelligence Engine (GET /calendar/intelligence/me). This hook
// computes nothing itself: weekly load, conflicts, deadline concentration,
// and recommendations are all derived server-side from the same six
// canonical source domains the Calendar Projection Service already reads.
// A fetch failure here degrades quietly (intelligence stays null) — it
// never blanks the underlying Calendar page, which remains fully usable
// from useLearningCalendarEvents.js alone.
import React from "react";
import { getCalendarIntelligence } from "@/lib/calendar/api.js";

export function useCalendarIntelligence(role) {
  const [state, setState] = React.useState({ loading: true, intelligence: null });

  React.useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true }));
    getCalendarIntelligence(role)
      .then((intelligence) => {
        if (active) setState({ loading: false, intelligence });
      })
      .catch(() => {
        if (active) setState({ loading: false, intelligence: null });
      });
    return () => {
      active = false;
    };
  }, [role]);

  return state;
}
