// src/pages/admin/agent-fabric-command/overviewCoordinator.js
// One shared data coordinator for the Command Overview. Components never fetch
// on their own; they read the snapshot this produces. Each source settles
// independently, so one failed endpoint never blanks the others.
import { ADAPTERS } from "./commandAdapters.js";
import { fetchCommandSource } from "./commandClient.js";
import { COMMAND_ENDPOINTS, POLL_INTERVALS_MS, SOURCE_STATE } from "./commandContracts.js";

function loadingProjection(endpoint) {
  return {
    state: SOURCE_STATE.LOADING,
    source: { key: endpoint.key, endpoint: endpoint.path, authority: endpoint.authority, httpStatus: null, observedAt: null, message: "" },
    data: null,
  };
}

function rejectedProjection(endpoint) {
  return {
    state: SOURCE_STATE.AUTH_HARDENING_REQUIRED,
    source: { key: endpoint.key, endpoint: endpoint.path, authority: endpoint.authority, httpStatus: null, observedAt: null, message: endpoint.rejection },
    data: null,
  };
}

export function initialOverviewSnapshot(endpoints = COMMAND_ENDPOINTS) {
  const snapshot = {};
  for (const endpoint of Object.values(endpoints)) {
    snapshot[endpoint.key] = endpoint.admitted ? loadingProjection(endpoint) : rejectedProjection(endpoint);
  }
  return snapshot;
}

export function createOverviewCoordinator(options = {}) {
  const {
    endpoints = COMMAND_ENDPOINTS,
    intervals = POLL_INTERVALS_MS,
    fetchSource = fetchCommandSource,
    adapters = ADAPTERS,
    onUpdate = () => {},
    setIntervalImpl = globalThis.setInterval.bind(globalThis),
    clearIntervalImpl = globalThis.clearInterval.bind(globalThis),
    doc = globalThis.document,
  } = options;

  let snapshot = initialOverviewSnapshot(endpoints);
  const inFlight = new Set();
  const timers = [];
  let controller = null;
  let running = false;
  // Bumped on every start/stop so a response from a previous run (e.g. React
  // StrictMode's mount/unmount/mount) can never land in the current snapshot.
  let generation = 0;

  const admitted = Object.values(endpoints).filter((endpoint) => endpoint.admitted);
  const groups = [...new Set(admitted.map((endpoint) => endpoint.pollGroup))];

  function publish() {
    onUpdate(snapshot);
  }

  async function refreshEndpoint(endpoint) {
    if (!running || inFlight.has(endpoint.key)) return;
    const gen = generation;
    inFlight.add(endpoint.key);
    try {
      const result = await fetchSource(endpoint, { signal: controller?.signal });
      if (!running || gen !== generation) return;
      const adapt = adapters[endpoint.key];
      const previous = snapshot[endpoint.key];
      const next = adapt ? adapt(result) : { state: SOURCE_STATE.INVALID_RESPONSE, source: result, data: null };
      const wasData = previous && (previous.state === SOURCE_STATE.AVAILABLE || previous.state === SOURCE_STATE.EMPTY);
      next.lastAvailableAt = wasData ? previous.source.observedAt : previous?.lastAvailableAt || null;
      snapshot = { ...snapshot, [endpoint.key]: next };
      publish();
    } finally {
      if (gen === generation) inFlight.delete(endpoint.key);
    }
  }

  function refreshGroup(group) {
    return Promise.all(admitted.filter((e) => e.pollGroup === group).map(refreshEndpoint));
  }

  function refreshAll() {
    return Promise.all(admitted.map(refreshEndpoint));
  }

  function clearTimers() {
    while (timers.length) clearIntervalImpl(timers.pop());
  }

  function startTimers() {
    clearTimers();
    for (const group of groups) {
      const ms = intervals[group];
      if (ms > 0) timers.push(setIntervalImpl(() => refreshGroup(group), ms));
    }
  }

  function onVisibilityChange() {
    if (!running) return;
    if (doc?.hidden) {
      clearTimers();
    } else {
      refreshAll();
      startTimers();
    }
  }

  return {
    start() {
      if (running) return Promise.resolve();
      running = true;
      generation += 1;
      inFlight.clear();
      controller = new AbortController();
      publish();
      doc?.addEventListener?.("visibilitychange", onVisibilityChange);
      if (!doc?.hidden) startTimers();
      return refreshAll();
    },
    stop() {
      running = false;
      generation += 1;
      inFlight.clear();
      clearTimers();
      doc?.removeEventListener?.("visibilitychange", onVisibilityChange);
      controller?.abort();
      controller = null;
    },
    refreshAll,
    refreshGroup,
    getSnapshot: () => snapshot,
    get groups() {
      return groups;
    },
  };
}
