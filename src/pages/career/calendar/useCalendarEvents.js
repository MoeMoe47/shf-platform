// src/pages/career/calendar/useCalendarEvents.js
import { useCallback, useEffect, useState } from "react";
import { collectAllEvents } from "./adapters.js";
import { subscribeReminders } from "./reminders.js";

/**
 * Loads events from every registered adapter. All current sources are
 * synchronous/local, but this still models loading/error explicitly (a
 * brief setTimeout, matching the same pattern as useDashboardData.js) so
 * the page's loading state is real and testable, and so a future
 * network-backed adapter is a drop-in, not a rewrite.
 */
export function useCalendarEvents() {
  const [state, setState] = useState({ loading: true, error: null, events: [] });

  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const t = setTimeout(() => {
      try {
        const events = collectAllEvents();
        setState({ loading: false, error: null, events });
      } catch (err) {
        setState({ loading: false, error: err, events: [] });
      }
    }, 250);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => load(), [load]);

  // Personal reminders can change (create/edit/delete) without a full
  // reload of every other source.
  useEffect(() => subscribeReminders(load), [load]);

  return { ...state, refresh: load };
}
