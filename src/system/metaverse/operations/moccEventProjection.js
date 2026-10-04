const SOURCE_AUTHORITIES = {
  ARCADE: "ARCADE",
  CAREER: "CAREER_AUTHORITY",
  CIVIC: "SHF_CIVIC",
  COMMUNITY: "MET-7_SIDE_MISSION_PROJECTION",
  MARKET: "MET-9_STUDENT_MARKET",
  MISSION: "MET-7_MISSION_PROJECTION",
  OPPORTUNITY: "MET-8_OPPORTUNITY_EXCHANGE",
  PROGRAM: "MET-7_PROGRAM_MISSION",
  SYSTEM: "SYSTEM",
};

const EVENT_TYPES = {
  ARCADE: "ARCADE.CHALLENGE",
  CAREER: "CAREER.EVENT",
  CIVIC: "CIVIC.ACTIVITY",
  COMMUNITY: "COMMUNITY.ACTIVITY",
  MARKET: "MARKET.ACTIVITY",
  MISSION: "MISSION.ACTIVITY",
  OPPORTUNITY: "OPPORTUNITY.EVENT",
  PROGRAM: "MISSION.PROGRAM_ACTIVITY",
  SYSTEM: "SYSTEM.ACTIVITY",
};

export const MOCC_TIMELINE_WINDOW_MS = 24 * 60 * 60 * 1000;

export const MOCC_TIMELINE_CATEGORIES = Object.freeze([
  Object.freeze({ id: "event", label: "City Events" }),
  Object.freeze({ id: "mission", label: "Missions" }),
  Object.freeze({ id: "incident", label: "Incidents" }),
  Object.freeze({ id: "system", label: "System Activity" }),
  Object.freeze({ id: "simulation", label: "Simulations" }),
  Object.freeze({ id: "uncategorized", label: "Other" }),
]);

function optionalString(value) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function optionalReferences(value) {
  return Array.isArray(value) ? [...value] : [];
}

export function normalizeMoccEvent(sourceEvent) {
  if (!sourceEvent || typeof sourceEvent !== "object" || Array.isArray(sourceEvent)) return null;

  const source = optionalString(sourceEvent.source);
  const location = sourceEvent.location && typeof sourceEvent.location === "object"
    ? sourceEvent.location
    : {
      district_id: sourceEvent.district_id ?? null,
      facility_id: sourceEvent.facility_id ?? null,
    };
  const hasLocation = Boolean(location.district_id || location.facility_id);

  return {
    event_id: optionalString(sourceEvent.event_id ?? sourceEvent.id),
    event_type: optionalString(sourceEvent.event_type) || EVENT_TYPES[source] || null,
    title: optionalString(sourceEvent.title),
    timestamp: optionalString(sourceEvent.timestamp ?? sourceEvent.starts_at),
    source_authority: optionalString(sourceEvent.source_authority) || SOURCE_AUTHORITIES[source] || source,
    source_event_ref: optionalString(sourceEvent.source_ref ?? sourceEvent.source_event_ref),
    location: hasLocation ? {
      district_id: optionalString(location.district_id),
      facility_id: optionalString(location.facility_id),
    } : null,
    affected_entities: optionalReferences(sourceEvent.affected_entities),
    severity: optionalString(sourceEvent.severity),
    state: optionalString(sourceEvent.state ?? sourceEvent.status),
    dependencies: optionalReferences(sourceEvent.dependencies),
    parent_event: optionalString(sourceEvent.parent_event),
    child_events: optionalReferences(sourceEvent.child_events),
    scenario_id: optionalString(sourceEvent.scenario_id),
    mission_id: optionalString(sourceEvent.mission_id),
    initiated_by: optionalString(sourceEvent.initiated_by),
    approved_by: optionalString(sourceEvent.approved_by),
    evidence_refs: optionalReferences(sourceEvent.evidence_refs),
    audit_refs: optionalReferences(sourceEvent.audit_refs),
  };
}

export function projectMoccEvents(sourceEvents) {
  return (Array.isArray(sourceEvents) ? sourceEvents : [])
    .map(normalizeMoccEvent)
    .filter(Boolean);
}

export function projectMoccTimelineEvents(events, windowEnd = Date.now(), windowDuration = MOCC_TIMELINE_WINDOW_MS) {
  const end = windowEnd instanceof Date ? windowEnd.getTime() : Number(windowEnd);
  const duration = Number(windowDuration);
  if (!Number.isFinite(end) || !Number.isFinite(duration) || duration <= 0) return [];
  const start = end - duration;
  const timedEvents = (Array.isArray(events) ? events : [])
    .map((event, sourceIndex) => ({ event, sourceIndex, timestampValue: Date.parse(event?.timestamp || "") }))
    .filter(({ event, timestampValue }) => event && Number.isFinite(timestampValue) && timestampValue >= start && timestampValue <= end)
    .map(({ event, sourceIndex, timestampValue }) => ({
      ...event,
      timeline_key: `${event.source_authority || "source"}:${event.event_id || event.source_event_ref || `${event.event_type || "unknown"}:${timestampValue}`}:${sourceIndex}`,
      category: moccTimelineCategory(event),
      label: event.title || event.event_type || "Event",
      timelinePosition: ((timestampValue - start) / duration) * 100,
      timestampValue,
      sourceIndex,
    }))
    .sort((a, b) => a.timestampValue - b.timestampValue
      || String(a.event_id || a.source_event_ref || "").localeCompare(String(b.event_id || b.source_event_ref || ""))
      || String(a.source_authority || "").localeCompare(String(b.source_authority || ""))
      || a.sourceIndex - b.sourceIndex);

  const laneEnds = [];
  const positioned = timedEvents.map((event) => {
    const lane = laneEnds.findIndex((lastPosition) => event.timelinePosition - lastPosition >= 0.9);
    const assignedLane = lane === -1 ? laneEnds.length : lane;
    laneEnds[assignedLane] = event.timelinePosition;
    return { ...event, timelineLane: assignedLane };
  });
  return positioned.map(({ sourceIndex: _sourceIndex, timestampValue: _timestampValue, ...event }) => ({ ...event, timelineLaneCount: laneEnds.length }));
}

export function filterMoccTimelineEvents(events, enabledCategories = {}) {
  return (Array.isArray(events) ? events : []).filter((event) => enabledCategories[event.category] !== false);
}

export function moccTimelineCategory(event) {
  const type = String(event?.event_type || "");
  if (type.startsWith("MISSION.") || type.startsWith("PROGRAM.")) return "mission";
  if (type.startsWith("INCIDENT.")) return "incident";
  if (type.startsWith("SIMULATION.")) return "simulation";
  if (type.startsWith("SYSTEM.")) return "system";
  if (["CIVIC.", "OPPORTUNITY.", "ARCADE.", "CAREER.", "COMMUNITY.", "MARKET."].some((prefix) => type.startsWith(prefix))) return "event";
  return "uncategorized";
}
