import React from "react";
import { getRuntimeSaveState, putRuntimeSaveState } from "./arcadeRuntimeClient.js";

export function useArcadeRuntimeSaveState(sessionId, { onResponse } = {}) {
  const [saveState, setSaveState] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(null);

  const reload = React.useCallback(async () => {
    if (!sessionId) return null;
    setLoading(true);
    setError(null);
    try {
      const response = await getRuntimeSaveState(sessionId, { onResponse });
      setSaveState(response.saveState ?? null);
      return response.saveState ?? null;
    } catch (nextError) {
      setError(nextError);
      throw nextError;
    } finally {
      setLoading(false);
    }
  }, [onResponse, sessionId]);

  React.useEffect(() => {
    setSaveState(null);
    setError(null);
  }, [sessionId]);

  const save = React.useCallback(async (payload, expectedRevision = saveState?.revision ?? 0) => {
    if (!sessionId) throw new Error("Load or start a Runtime Session first.");
    setSaving(true);
    setError(null);
    try {
      const result = await putRuntimeSaveState(sessionId, { expectedRevision, payload }, { onResponse });
      setSaveState(result);
      return result;
    } catch (nextError) {
      setError(nextError);
      throw nextError;
    } finally {
      setSaving(false);
    }
  }, [onResponse, saveState?.revision, sessionId]);

  return { saveState, revision: saveState?.revision ?? 0, loading, saving, error, reload, save, clearError: () => setError(null) };
}
