// src/pages/admin/agent-fabric-command/useLiveOperations.js
// AFCC-3 Phase 7 — data hooks for Live Operations. Read-only; polls the run list
// while the tab is visible and loads run views lazily when a run is focused.
import React from "react";
import { POLL_INTERVALS_MS, SOURCE_STATE } from "./commandContracts.js";
import { artifactEndpoint, fetchLive, LIVE_ENDPOINTS, runEndpoint } from "./liveOperationsClient.js";
import { normalizeRun } from "./liveOperationsModel.js";

const LOADING = Object.freeze({ state: SOURCE_STATE.LOADING, payload: null, source: null });

function useSource(load, deps, { pollMs } = {}) {
  const [result, setResult] = React.useState(LOADING);
  const [tick, setTick] = React.useState(0);
  const subject = JSON.stringify(deps);
  // A new subject (another run / view) starts from LOADING; a poll tick keeps
  // the current data on screen until the refreshed response arrives.
  React.useEffect(() => setResult(LOADING), [subject]);
  React.useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    load(controller.signal).then((r) => {
      if (alive) setResult(r);
    });
    return () => {
      alive = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, tick]);
  React.useEffect(() => {
    if (!pollMs) return undefined;
    const id = setInterval(() => {
      if (typeof document === "undefined" || document.visibilityState === "visible") setTick((t) => t + 1);
    }, pollMs);
    return () => clearInterval(id);
  }, [pollMs]);
  const refresh = React.useCallback(() => setTick((t) => t + 1), []);
  return { result, refresh };
}

const toSource = (r) => ({
  state: r.state,
  message: r.message || "",
  failedLayer: r.failedLayer || null,
  endpoint: r.endpoint || null,
  authority: r.authority || null,
  observedAt: r.observedAt || null,
});

export function useLiveRuns() {
  const { result, refresh } = useSource((signal) => fetchLive(LIVE_ENDPOINTS.runs, { signal }), [], { pollMs: POLL_INTERVALS_MS.runs });
  const payload = result.state === SOURCE_STATE.AVAILABLE ? result.payload : null;
  const runs = React.useMemo(() => (payload ? payload.runs.map(normalizeRun) : []), [payload]);
  return {
    state: result.state,
    source: toSource(result),
    runs,
    supportedStates: payload?.lifecycle?.supported_states || [],
    executionSafety: payload?.execution_safety || null,
    projectionSource: payload?.source || null,
    freshness: payload?.freshness || null,
    refresh,
  };
}

export function useRunView(view, runId) {
  const { result } = useSource(
    (signal) => (runId ? fetchLive(runEndpoint(view, runId), { signal }) : Promise.resolve({ state: SOURCE_STATE.EMPTY, payload: null })),
    [view, runId],
  );
  return { state: result.state, source: toSource(result), payload: result.state === SOURCE_STATE.AVAILABLE ? result.payload : null };
}

export function useRunArtifact(runId, artifactId) {
  const { result } = useSource(
    (signal) => (runId && artifactId ? fetchLive(artifactEndpoint(runId, artifactId), { signal }) : Promise.resolve({ state: SOURCE_STATE.EMPTY, payload: null })),
    [runId, artifactId],
  );
  return { state: result.state, source: toSource(result), payload: result.state === SOURCE_STATE.AVAILABLE ? result.payload : null };
}
