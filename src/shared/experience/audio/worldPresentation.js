// Phase 9 — world presentation foundations: City Mood, dynamic signage, environmental storytelling, dynamic music.
//
// Presentation only. Every output is derived from authoritative or simulated events and cites them; none of these
// functions can create, change or hide world state (affectsWorldState: false). No NPC simulation, no assets.

export const CITY_MOODS = Object.freeze(["CALM", "ACTIVE", "BUSY", "ALERT", "EMERGENCY", "RECOVERY", "CELEBRATION"]);
const MOOD_PRESENTATION = Object.freeze({
  CALM: { ambienceIntensity: "LOW", lighting: "NORMAL", crowdDensity: "LIGHT", signageTone: "INFORMATIONAL", musicIntensity: "LOW" },
  ACTIVE: { ambienceIntensity: "MEDIUM", lighting: "NORMAL", crowdDensity: "MODERATE", signageTone: "INFORMATIONAL", musicIntensity: "MEDIUM" },
  BUSY: { ambienceIntensity: "HIGH", lighting: "NORMAL", crowdDensity: "DENSE", signageTone: "INFORMATIONAL", musicIntensity: "MEDIUM" },
  ALERT: { ambienceIntensity: "MEDIUM", lighting: "ADVISORY", crowdDensity: "MODERATE", signageTone: "ADVISORY", musicIntensity: "LOW" },
  EMERGENCY: { ambienceIntensity: "LOW", lighting: "EMERGENCY", crowdDensity: "LIGHT", signageTone: "URGENT", musicIntensity: "NONE" },
  RECOVERY: { ambienceIntensity: "LOW", lighting: "RESTORING", crowdDensity: "LIGHT", signageTone: "ADVISORY", musicIntensity: "LOW" },
  CELEBRATION: { ambienceIntensity: "HIGH", lighting: "FESTIVE", crowdDensity: "DENSE", signageTone: "CELEBRATORY", musicIntensity: "HIGH" },
});
const RESOLUTION_TYPES = Object.freeze(["POWER_RESTORED", "STORM_ENDED", "INCIDENT_CLOSED", "ROAD_REOPENED", "WATERWAY_RESTRICTION_LIFTED"]);

// Derived from regional simulation state and recent events. Emergency and alert moods always win over celebration.
export function deriveCityMood({ state, recentEvents = [], celebrating = false, activeScenarioCount = 0 } = {}) {
  const flags = state?.worldFlags ?? {};
  const impacted = state?.infrastructureSummary?.impacted?.length ?? 0;
  const closures = (state?.mobilitySummary?.closedCorridors?.length ?? 0) + (state?.mobilitySummary?.restrictedWaterways?.length ?? 0);
  const recent = recentEvents.slice(-10);
  let mood = "CALM";
  if (flags.powerDisruption || (flags.incidentsOpen && impacted > 0)) mood = "EMERGENCY";
  else if (flags.stormActive || flags.incidentsOpen || closures > 0) mood = "ALERT";
  else if (recent.some((event) => RESOLUTION_TYPES.includes(event.eventType))) mood = "RECOVERY";
  else if (celebrating) mood = "CELEBRATION";
  else if (activeScenarioCount > 1) mood = "BUSY";
  else if (activeScenarioCount > 0 || recent.length) mood = "ACTIVE";
  return Object.freeze({
    mood, presentation: Object.freeze({ ...MOOD_PRESENTATION[mood] }), affectsWorldState: false,
    derivedFrom: Object.freeze(recent.map((event) => event.eventId)),
  });
}

export const SIGNAGE_MESSAGES = Object.freeze(["ROAD_CLOSED", "INCIDENT_AHEAD", "MISSION_ACTIVE", "PORT_DELAY", "POWER_OUTAGE", "POWER_RESTORED", "STORM_WARNING", "WATERWAY_RESTRICTED", "EVENT_TONIGHT"]);
const SIGNAGE_BY_EVENT = Object.freeze({
  ROAD_CLOSED: "ROAD_CLOSED", VEHICLE_COLLISION: "INCIDENT_AHEAD", INCIDENT_OPENED: "INCIDENT_AHEAD", POWER_FAILURE: "POWER_OUTAGE",
  POWER_RESTORED: "POWER_RESTORED", STORM_STARTED: "STORM_WARNING", WATERWAY_RESTRICTED: "WATERWAY_RESTRICTED",
});

// A sign always cites its source event; without one there is no sign.
export function signageForEvent(event) {
  const message = SIGNAGE_BY_EVENT[event?.eventType];
  if (!message || !event.eventId || !event.authority) return null;
  return Object.freeze({
    signId: `sign:${event.eventId}`, message, sourceEventId: event.eventId, sourceEventType: event.eventType, sourceAuthority: event.authority,
    sourceSystem: event.sourceSystem, correlationId: event.correlationId, location: event.location ? { ...event.location } : null,
    simulated: event.providerMode !== "LIVE", affectsWorldState: false,
  });
}

export function validateSign(sign) {
  const errors = [];
  if (!sign || typeof sign !== "object") return ["sign must be an object"];
  if (!SIGNAGE_MESSAGES.includes(sign.message)) errors.push("message is not a canonical signage message");
  for (const key of ["sourceEventId", "sourceAuthority", "correlationId"]) if (!sign[key]) errors.push(`${key} is required: signage must cite its source event`);
  return errors;
}

export const STORYTELLING_CUES = Object.freeze(["REPAIR_CREW", "CONES", "NEWS_VAN", "EMERGENCY_STAGING", "BANNER", "RECOVERY_OPERATIONS"]);
const STORYTELLING_BY_EVENT = Object.freeze({
  POWER_FAILURE: ["REPAIR_CREW", "EMERGENCY_STAGING"], POWER_RESTORED: ["RECOVERY_OPERATIONS"], ROAD_CLOSED: ["CONES"],
  VEHICLE_COLLISION: ["CONES", "EMERGENCY_STAGING"], INCIDENT_OPENED: ["EMERGENCY_STAGING", "NEWS_VAN"], INCIDENT_CLOSED: ["RECOVERY_OPERATIONS"],
});

// Event-to-presentation contract only; no NPC simulation is created.
export function storytellingForEvent(event) {
  return Object.freeze((STORYTELLING_BY_EVENT[event?.eventType] ?? []).map((cue) => Object.freeze({
    cueId: `${cue}:${event.eventId}`, cue, sourceEventId: event.eventId, location: event.location ? { ...event.location } : null, affectsWorldState: false,
  })));
}

// Dynamic music: a bounded, deterministic state machine. Stems are references for later layered assets.
export const MUSIC_STATES = Object.freeze(["EXPLORATION", "MISSION_START", "PROBLEM", "ESCALATION", "RECOVERY", "SUCCESS"]);
export const MUSIC_SIGNALS = Object.freeze(["MISSION_STARTED", "PROBLEM_DETECTED", "ESCALATED", "RESOLVED", "MISSION_SUCCEEDED", "SETTLED"]);
export const MUSIC_STEM_LAYERS = Object.freeze({
  EXPLORATION: ["stem.base"], MISSION_START: ["stem.base", "stem.pulse"], PROBLEM: ["stem.base", "stem.tension"],
  ESCALATION: ["stem.base", "stem.tension", "stem.percussion"], RECOVERY: ["stem.base", "stem.resolve"], SUCCESS: ["stem.base", "stem.resolve", "stem.lift"],
});
const MUSIC_TRANSITIONS = Object.freeze({
  EXPLORATION: { MISSION_STARTED: "MISSION_START", PROBLEM_DETECTED: "PROBLEM", ESCALATED: "ESCALATION" },
  MISSION_START: { PROBLEM_DETECTED: "PROBLEM", ESCALATED: "ESCALATION", MISSION_SUCCEEDED: "SUCCESS" },
  PROBLEM: { ESCALATED: "ESCALATION", RESOLVED: "RECOVERY", MISSION_SUCCEEDED: "SUCCESS" },
  // Recovery is the only exit from escalation: a resolution clears it.
  ESCALATION: { RESOLVED: "RECOVERY" },
  RECOVERY: { SETTLED: "EXPLORATION", PROBLEM_DETECTED: "PROBLEM", ESCALATED: "ESCALATION", MISSION_SUCCEEDED: "SUCCESS" },
  SUCCESS: { SETTLED: "EXPLORATION", PROBLEM_DETECTED: "PROBLEM", ESCALATED: "ESCALATION" },
});

export function nextMusicState(state, signal) {
  if (!MUSIC_STATES.includes(state) || !MUSIC_SIGNALS.includes(signal)) return { state, changed: false, reason: "UNKNOWN_STATE_OR_SIGNAL" };
  const next = MUSIC_TRANSITIONS[state][signal];
  return next ? { state: next, changed: true, stems: [...MUSIC_STEM_LAYERS[next]] } : { state, changed: false, stems: [...MUSIC_STEM_LAYERS[state]] };
}
