import React from "react";
import {
  abandonRuntimeSession,
  completeRuntimeSession,
  getRuntimeSession,
  pauseRuntimeSession,
  resumeRuntimeSession,
  startRuntimeSession,
} from "./arcadeRuntimeClient.js";

function sessionFromActionResponse(response) {
  return response?.session || response;
}

function sessionFromGetResponse(response) {
  return response;
}

export function useArcadeRuntimeSession({ onResponse } = {}) {
  const [session, setSession] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [busy, setBusy] = React.useState(false);

  const run = React.useCallback(async (operation) => {
    setBusy(true);
    setError(null);
    try {
      const result = await operation({ onResponse });
      const nextSession = sessionFromActionResponse(result);
      setSession(nextSession);
      return nextSession;
    } catch (nextError) {
      setError(nextError);
      throw nextError;
    } finally {
      setBusy(false);
    }
  }, [onResponse]);

  const start = React.useCallback((input) => run((options) => startRuntimeSession(input, options)), [run]);
  const reload = React.useCallback(async (sessionId = session?.id) => {
    if (!sessionId) return null;
    setLoading(true);
    setError(null);
    try {
      const result = await getRuntimeSession(sessionId, { onResponse });
      const nextSession = sessionFromGetResponse(result);
      setSession(nextSession);
      return nextSession;
    } catch (nextError) {
      setError(nextError);
      throw nextError;
    } finally {
      setLoading(false);
    }
  }, [onResponse, session?.id]);

  const transition = React.useCallback((action) => {
    if (!session?.id) throw new Error("Load or start a Runtime Session first.");
    const actions = {
      pause: pauseRuntimeSession,
      resume: resumeRuntimeSession,
      complete: completeRuntimeSession,
      abandon: abandonRuntimeSession,
    };
    return run((options) => actions[action](session.id, options));
  }, [run, session?.id]);

  return {
    session, loading, busy, error, start, reload,
    pause: () => transition("pause"),
    resume: () => transition("resume"),
    complete: () => transition("complete"),
    abandon: () => transition("abandon"),
    clearError: () => setError(null),
  };
}
