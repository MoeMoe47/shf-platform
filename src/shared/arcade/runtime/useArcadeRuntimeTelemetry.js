import React from "react";
import { appendRuntimeEvent, listRuntimeEvents } from "./arcadeRuntimeClient.js";

export const ARCADE_RUNTIME_EVENT_TYPES = [
  "SESSION_STARTED", "SESSION_RESUMED", "SESSION_PAUSED", "CHECKPOINT_REACHED",
  "LEVEL_STARTED", "LEVEL_COMPLETED", "INTERACTION", "SESSION_COMPLETED", "SESSION_ABANDONED",
];

export function useArcadeRuntimeTelemetry(sessionId, { onResponse } = {}) {
  const [events, setEvents] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [appending, setAppending] = React.useState(false);
  const [error, setError] = React.useState(null);

  const reload = React.useCallback(async () => {
    if (!sessionId) return [];
    setLoading(true);
    setError(null);
    try {
      const response = await listRuntimeEvents(sessionId, { limit: 200, onResponse });
      const nextEvents = response.items || [];
      setEvents(nextEvents);
      return nextEvents;
    } catch (nextError) {
      setError(nextError);
      throw nextError;
    } finally {
      setLoading(false);
    }
  }, [onResponse, sessionId]);

  React.useEffect(() => {
    setEvents([]);
    setError(null);
  }, [sessionId]);

  const append = React.useCallback(async (eventType, payload, occurredAt = new Date().toISOString(), sequenceOverride) => {
    if (!sessionId) throw new Error("Load or start a Runtime Session first.");
    const sequence = sequenceOverride ?? ((events.at(-1)?.sequence || 0) + 1);
    setAppending(true);
    setError(null);
    try {
      const result = await appendRuntimeEvent(sessionId, { sequence, eventType, occurredAt, payload }, { onResponse });
      setEvents((current) => [...current, result].sort((a, b) => a.sequence - b.sequence));
      return result;
    } catch (nextError) {
      setError(nextError);
      if (nextError.code === "RUNTIME_EVENT_SEQUENCE_CONFLICT") {
        try { await reload(); } catch { /* Keep the original sequence conflict visible. */ }
      }
      throw nextError;
    } finally {
      setAppending(false);
    }
  }, [events, onResponse, reload, sessionId]);

  return {
    events,
    nextSequence: (events.at(-1)?.sequence || 0) + 1,
    loading,
    appending,
    error,
    reload,
    append,
    clearError: () => setError(null),
  };
}
