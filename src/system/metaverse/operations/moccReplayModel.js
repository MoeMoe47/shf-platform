import { normalizeMoccEvent } from "./moccEventProjection.js";
import { getMoccIntegrationStatus } from "./moccIntegrationStatusRegistry.js";

export const MOCC_REPLAY_SPEEDS = Object.freeze([1, 2, 4, 8]);
export const MOCC_REPLAY_DEFAULT_WINDOW_MS = 24 * 60 * 60 * 1000;
export const MOCC_REPLAY_RECORD_KINDS = Object.freeze(["OBSERVED_EVENT", "HISTORICAL_STATE", "STATIC_CONTEXT"]);

const REPLAY_SOURCES = Object.freeze([
  { id: "missions", label: "Missions", integrationDomain: "MISSIONS", prefixes: ["MISSION.", "PROGRAM."] },
  { id: "simulations", label: "Simulations", integrationDomain: "SIMULATION_RUNTIME_TELEMETRY", prefixes: ["SIMULATION."] },
  { id: "civic", label: "Civic", integrationDomain: "CIVIC", prefixes: ["CIVIC."] },
  { id: "traffic", label: "Traffic", integrationDomain: "TRAFFIC", prefixes: ["TRAFFIC."] },
  { id: "weather", label: "Weather", integrationDomain: "WEATHER_OBSERVATIONS", prefixes: ["WEATHER."] },
  { id: "fire-ems", label: "Fire / EMS", integrationDomain: "FIRE_EMS_INCIDENTS", prefixes: ["FIRE.", "EMS.", "INCIDENT."] },
  { id: "utilities", label: "Utilities", integrationDomain: "UTILITIES", prefixes: ["POWER.", "WATER.", "UTILITY."] },
  { id: "marine-aviation", label: "Marine / Aviation", integrationDomain: "MARINE_AVIATION", prefixes: ["PORT.", "MARINE.", "AVIATION."] },
  { id: "agents", label: "Agents", integrationDomain: "AGENT_ACTIONS", prefixes: ["AGENT."] },
  { id: "students", label: "Students / Multiplayer", integrationDomain: "STUDENT_MISSION_ENTRY_EVENTS", prefixes: ["STUDENT.", "MULTIPLAYER."] },
  { id: "shnn", label: "SHNN", integrationDomain: "SHNN", prefixes: ["SHNN."] },
  { id: "infrastructure", label: "Infrastructure context", integrationDomain: "LIVING_CITY", prefixes: [], staticContext: true },
]);

function replaySourceForEvent(event) {
  return REPLAY_SOURCES.find((source) => source.prefixes.some((prefix) => String(event.event_type || "").startsWith(prefix))) || null;
}

export function createMoccReplayState(now = Date.now()) {
  const end = Number(now);
  const safeEnd = Number.isFinite(end) ? end : Date.now();
  return {
    windowStart: safeEnd - MOCC_REPLAY_DEFAULT_WINDOW_MS,
    windowEnd: safeEnd,
    cursorTime: safeEnd,
    isPlaying: false,
    playbackSpeed: 1,
    selectedReplayEvent: null,
  };
}

export function projectMoccReplayEvents(events, windowStart, windowEnd) {
  const start = Number(windowStart);
  const end = Number(windowEnd);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end) return [];
  return (Array.isArray(events) ? events : [])
    .map((event, index) => ({ event, index, timestamp: Date.parse(event?.timestamp || "") }))
    .filter(({ event, timestamp }) => event && Number.isFinite(timestamp) && timestamp >= start && timestamp <= end)
    .sort((a, b) => a.timestamp - b.timestamp
      || String(a.event.event_id || a.event.source_event_ref || "").localeCompare(String(b.event.event_id || b.event.source_event_ref || ""))
      || a.index - b.index)
    .map(({ event }) => event);
}

export function projectMoccHistoricalEvents(sourceEvents) {
  return (Array.isArray(sourceEvents) ? sourceEvents : []).flatMap((sourceEvent) => {
    if (!sourceEvent || typeof sourceEvent !== "object" || Array.isArray(sourceEvent)) return [];
    const timestamp = typeof sourceEvent.timestamp === "string" ? sourceEvent.timestamp : null;
    if (!timestamp || !Number.isFinite(Date.parse(timestamp))) return [];
    const normalized = normalizeMoccEvent(sourceEvent);
    if (!normalized) return [];
    const source = replaySourceForEvent(normalized);
    if (source?.integrationDomain) {
      const integration = getMoccIntegrationStatus(source.integrationDomain);
      if (integration?.status === "PENDING" || integration?.status === "NOT_CONNECTED") return [];
    }
    return [{ ...normalized, timestamp, record_kind: "OBSERVED_EVENT" }];
  });
}

export function projectMoccStaticContext(facilities) {
  return (Array.isArray(facilities) ? facilities : [])
    .filter((facility) => facility?.id && facility?.destinationId)
    .map((facility) => ({
      record_id: `static-context:${facility.destinationId}`,
      record_kind: "STATIC_CONTEXT",
      title: facility.label,
      source_authority: "METAVERSE_CANONICAL_SPATIAL_REGISTRY",
      source_reference: facility.destinationId,
      timestamp: null,
      spatial_reference: { facility_id: facility.id, destination_id: facility.destinationId, district_id: facility.districtId || null },
    }));
}

export function moccReplayEventKey(event) {
  return [event?.source_authority || "source", event?.event_id || event?.source_event_ref || "", event?.event_type || "", event?.timestamp || "", event?.title || ""].join(":");
}

export function setMoccReplayWindow(state, windowStart, windowEnd) {
  let start = Number(windowStart);
  let end = Number(windowEnd);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return state;
  if (start > end) end = start;
  const cursorTime = Math.min(end, Math.max(start, state.cursorTime));
  const selectedTimestamp = Date.parse(state.selectedReplayEvent?.timestamp || "");
  const selectedReplayEvent = Number.isFinite(selectedTimestamp) && selectedTimestamp >= start && selectedTimestamp <= end
    ? state.selectedReplayEvent
    : null;
  return { ...state, windowStart: start, windowEnd: end, cursorTime, selectedReplayEvent, isPlaying: false };
}

export function selectMoccReplayEvent(state, event) {
  const timestamp = Date.parse(event?.timestamp || "");
  if (!event || !Number.isFinite(timestamp) || timestamp < state.windowStart || timestamp > state.windowEnd) return state;
  return { ...state, cursorTime: timestamp, selectedReplayEvent: event };
}

export function navigateMoccReplayEvent(state, events, direction) {
  const candidates = projectMoccReplayEvents(events, state.windowStart, state.windowEnd);
  const selectedKey = state.selectedReplayEvent ? moccReplayEventKey(state.selectedReplayEvent) : null;
  const selectedIndex = selectedKey ? candidates.findIndex((event) => moccReplayEventKey(event) === selectedKey) : -1;
  const candidate = selectedIndex >= 0
    ? candidates[selectedIndex + (direction < 0 ? -1 : 1)]
    : direction < 0
      ? candidates.filter((event) => Date.parse(event.timestamp) <= state.cursorTime).at(-1)
      : candidates.find((event) => Date.parse(event.timestamp) >= state.cursorTime);
  return candidate ? selectMoccReplayEvent(state, candidate) : state;
}

export function advanceMoccReplayCursor(state, elapsedMs) {
  if (!state.isPlaying || !Number.isFinite(Number(elapsedMs)) || Number(elapsedMs) < 0) return state;
  const cursorTime = Math.min(state.windowEnd, state.cursorTime + Number(elapsedMs) * state.playbackSpeed);
  return { ...state, cursorTime, isPlaying: cursorTime < state.windowEnd };
}

export function projectMoccReplayCoverage(events, windowStart, windowEnd, staticContext = []) {
  const allTimed = (Array.isArray(events) ? events : []).filter((event) => event?.record_kind === "OBSERVED_EVENT" && Number.isFinite(Date.parse(event?.timestamp || "")));
  const start = Number(windowStart);
  const end = Number(windowEnd);
  return REPLAY_SOURCES.map((source) => {
    const integration = source.integrationDomain ? getMoccIntegrationStatus(source.integrationDomain) : null;
    const sourceRecords = source.staticContext
      ? (Array.isArray(staticContext) ? staticContext : []).filter((record) => record.record_kind === "STATIC_CONTEXT")
      : ["PENDING", "NOT_CONNECTED"].includes(integration?.status)
        ? []
        : allTimed.filter((event) => source.prefixes.some((prefix) => String(event.event_type || "").startsWith(prefix)));
    const windowRecords = source.staticContext
      ? sourceRecords
      : Number.isFinite(start) && Number.isFinite(end)
        ? sourceRecords.filter((event) => Date.parse(event.timestamp) >= start && Date.parse(event.timestamp) <= end)
        : [];
    const status = source.staticContext
      ? (sourceRecords.length ? "AVAILABLE" : "UNAVAILABLE")
      : integration?.status === "PENDING"
          ? "PENDING"
          : integration?.status === "NOT_CONNECTED"
            ? "UNAVAILABLE"
            : integration?.status === "PARTIAL"
              ? "PARTIAL"
              : windowRecords.length
                ? "AVAILABLE"
                : integration?.status === "CONNECTED" || sourceRecords.length
                  ? "PARTIAL"
                  : "UNAVAILABLE";
    return {
      id: source.id,
      label: source.label,
      status,
      recordCount: windowRecords.length,
      record_kind: source.staticContext ? "STATIC_CONTEXT" : "OBSERVED_EVENT",
      source_reference: integration?.expected_interface || (source.staticContext ? "Canonical facility/destination registry" : "MOCC normalized city-event projection"),
      detail: source.staticContext
        ? "Canonical facility context only; not historical state."
        : integration?.status === "PENDING"
          ? "Historical event interface pending; no replay records are generated."
          : integration?.status === "NOT_CONNECTED"
            ? "No historical source interface is connected."
            : windowRecords.length
              ? "Timestamped source records are available in this window."
              : sourceRecords.length
                ? "Timestamped source records exist outside this window."
                : integration?.status === "CONNECTED"
                  ? "Read projection exists, but this page has no timestamped historical archive records."
                  : "No timestamped source records are available to this page.",
    };
  });
}

export function formatMoccReplayDateTime(timestamp, includeSeconds = false) {
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) return "";
  const pad = (value) => String(value).padStart(2, "0");
  const minute = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return includeSeconds ? `${minute}:${pad(date.getSeconds())}` : minute;
}

export function parseMoccReplayDateTime(value) {
  if (typeof value !== "string" || !value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}
