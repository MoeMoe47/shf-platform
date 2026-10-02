// Phase 9 — World Audio Engine (foundation).
//
// The World Audio Engine presents authoritative or simulated events. It does not create the underlying event.
//
// Pipeline: authoritative MOL event → Experience/Sensory Director (planSensoryPresentation, arbitrateSensoryPlans)
// → World Audio Engine (sources, spatial gain, mixing, degradation). It reuses the Phase 6.5 Sound Registry, sensory
// policies, accessibility profile and alert-priority rules; it adds no second registry, preference store or policy
// engine. Domain contracts never expose browser audio nodes: the engine outputs a deterministic mix description.

import {
  ACCESSIBILITY_SENSORY_KEYS, arbitrateSensoryPlans, buildSensoryEvent, planSensoryPresentation,
} from "../sensory/index.js";
import { deriveCityMood, nextMusicState, signageForEvent, storytellingForEvent } from "./worldPresentation.js";

export const AUDIO_SOURCE_STATES = Object.freeze(["PLAYING", "DUCKED", "SUPPRESSED", "STOPPED"]);
export const OCCLUSION_CLASSES = Object.freeze({ NONE: 1, PARTIAL: 0.5, FULL: 0.15 });
// Degradation order: highest first. Critical alerts are never dropped.
export const AUDIO_PRIORITY_CLASSES = Object.freeze(["CRITICAL_ALERT", "PUBLIC_SAFETY", "MISSION_ALERT", "OPERATIONAL", "VEHICLE", "AMBIENCE", "MUSIC", "CELEBRATION"]);
export const WORLD_AUDIO_LIMITS = Object.freeze({ maxConcurrentSources: 12, maxSources: 64 });
export const WORLD_AUDIO_MIXER_CHANNELS = Object.freeze(["master", "music", "effects", "environment", "vehicles", "voicePa", "missionAlerts", "celebrations"]);
export const WORLD_AUDIO_TOGGLES = Object.freeze(["haptics", "particles", "cameraShake", "flashing", "backgroundMusic"]);
const CATEGORY_CHANNEL = Object.freeze({
  UI: "effects", MUSIC: "music", AMBIENCE: "environment", WEATHER: "environment", WATER: "environment", INDUSTRIAL: "environment",
  INFRASTRUCTURE: "environment", CROWD: "environment", VEHICLE: "vehicles", VOICE_PA: "voicePa", PUBLIC_SAFETY: "missionAlerts",
  MISSION: "missionAlerts", CELEBRATION: "celebrations",
});
const OPTIONAL_CHANNELS = Object.freeze(["music", "celebrations"]);

export function defaultMixer() {
  return Object.freeze({
    levels: Object.freeze(Object.fromEntries(WORLD_AUDIO_MIXER_CHANNELS.map((channel) => [channel, 1]))),
    toggles: Object.freeze(Object.fromEntries(WORLD_AUDIO_TOGGLES.map((toggle) => [toggle, true]))),
  });
}

const NO_ACCESSIBILITY = Object.freeze(Object.fromEntries(ACCESSIBILITY_SENSORY_KEYS.map((key) => [key, false])));

export function validateAudioSource(source, soundRegistry) {
  const errors = [];
  if (!source || typeof source !== "object") return ["audio source must be an object"];
  for (const key of Object.keys(source)) {
    if (!["sourceId", "soundId", "systemId", "environmentId", "spatialRef", "position", "looping", "priority", "priorityClass", "state", "volumeClass", "occlusionClass", "indoor", "worldEventRef", "startedAt"].includes(key)) {
      errors.push(`${key}: unsupported field (no browser/audio internals in the source contract)`);
    }
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,160}$/.test(String(source.sourceId ?? ""))) errors.push("sourceId is invalid");
  if (!soundRegistry.sounds.some((sound) => sound.soundId === source.soundId)) errors.push(`soundId ${source.soundId} is not in the Sound Registry`);
  if (!AUDIO_PRIORITY_CLASSES.includes(source.priorityClass)) errors.push("priorityClass is invalid");
  if (!AUDIO_SOURCE_STATES.includes(source.state)) errors.push("state is invalid");
  if (!(source.occlusionClass in OCCLUSION_CLASSES)) errors.push("occlusionClass is invalid");
  if (source.position !== null && !(Number.isFinite(source.position?.x) && Number.isFinite(source.position?.y))) errors.push("position must be null or {x, y}");
  return errors;
}

// Deterministic, bounded spatial model: distance in the shared coordinate space, linear rolloff to maxDistance,
// stereo pan, and a single occlusion factor when listener and source are on different sides of an indoor boundary.
// Spatial audio never crosses coordinate spaces (the Spatial Command Center isolation rule).
export function computeSpatialGain({ source, listener, sound }) {
  if (!sound.spatial || !source.position || !listener?.position) return Object.freeze({ spatial: false, distance: null, gain: 1, pan: 0, audible: true });
  if (source.spatialRef?.coordinateSpaceId !== listener.coordinateSpaceId) return Object.freeze({ spatial: true, distance: null, gain: 0, pan: 0, audible: false, reason: "CROSS_COORDINATE_SPACE" });
  const dx = source.position.x - listener.position.x;
  const dy = source.position.y - listener.position.y;
  const distance = Math.hypot(dx, dy);
  if (distance > sound.maxDistance) return Object.freeze({ spatial: true, distance, gain: 0, pan: 0, audible: false, reason: "BEYOND_MAX_DISTANCE" });
  const occluded = sound.occlusionSupported && Boolean(listener.indoor) !== Boolean(source.indoor);
  const occlusion = occluded ? OCCLUSION_CLASSES[source.occlusionClass] : 1;
  const gain = Math.round((1 - distance / sound.maxDistance) * occlusion * 1000) / 1000;
  const pan = Math.max(-1, Math.min(1, Math.round((dx / sound.maxDistance) * 1000) / 1000));
  return Object.freeze({ spatial: true, distance: Math.round(distance * 1000) / 1000, gain, pan, audible: gain > 0, occluded });
}

function priorityClassFor({ plan, sound }) {
  if (plan) {
    if (plan.presentationPriority === "CRITICAL_ALERT") return "CRITICAL_ALERT";
    if (plan.presentationPriority === "ALERT") return plan.sourceAuthority === "mission-runtime" ? "MISSION_ALERT" : "PUBLIC_SAFETY";
    if (plan.presentationPriority === "OPERATIONAL") return "OPERATIONAL";
    if (["CELEBRATION", "CEREMONY"].includes(plan.presentationPriority)) return sound?.category === "MUSIC" ? "MUSIC" : "CELEBRATION";
  }
  if (sound?.category === "VEHICLE") return "VEHICLE";
  if (sound?.category === "MUSIC") return "MUSIC";
  return "AMBIENCE";
}

export function createWorldAudioEngine({ sensoryRegistry, policyId, accessibility = NO_ACCESSIBILITY, mixer = defaultMixer(), limits = WORLD_AUDIO_LIMITS,
  resolveAnchor = () => null, triggers = {} } = {}) {
  if (!sensoryRegistry?.sounds) throw new Error("sensoryRegistry is required");
  const soundById = new Map(sensoryRegistry.sounds.map((sound) => [sound.soundId, sound]));
  let listener = { coordinateSpaceId: "metaverse.quick-map", position: null, indoor: false, environmentId: null };
  let sources = [];
  let plans = [];
  let musicState = "EXPLORATION";
  let sequence = 0;
  const captions = [];
  const signs = [];
  const storytelling = [];
  const recentEvents = [];

  function addSource({ soundId, plan = null, worldEventRef = null, anchor = null, systemId = null, environmentId = null, looping }) {
    const sound = soundById.get(soundId);
    if (!sound) return { ok: false, reason: "UNKNOWN_SOUND" };
    if (sources.length >= limits.maxSources) sources = sources.filter((item) => item.state !== "STOPPED").slice(-(limits.maxSources - 1));
    sequence += 1;
    const resolved = anchor ? resolveAnchor(anchor) : null;
    const source = {
      sourceId: `src-${sequence}`, soundId, systemId, environmentId, spatialRef: resolved ? { coordinateSpaceId: resolved.coordinateSpaceId, anchor: { ...anchor } } : null,
      position: resolved?.x !== undefined && resolved?.x !== null ? { x: resolved.x, y: resolved.y } : null,
      looping: looping ?? sound.looping, priority: sound.priority, priorityClass: priorityClassFor({ plan, sound }), state: "PLAYING",
      volumeClass: sound.volumeClass, occlusionClass: "PARTIAL", indoor: false, worldEventRef, startedAt: sequence,
    };
    const errors = validateAudioSource(source, sensoryRegistry);
    if (errors.length) return { ok: false, reason: "INVALID_SOURCE", errors };
    sources.push(source);
    return { ok: true, source };
  }

  // Presents an authoritative/simulated MOL event through the Sensory Director. Unknown triggers present nothing.
  function handleWorldEvent(event) {
    recentEvents.push(event);
    if (recentEvents.length > 50) recentEvents.shift();
    const sign = signageForEvent(event);
    if (sign) signs.push(sign);
    storytelling.push(...storytellingForEvent(event));
    const trigger = triggers[event.eventType];
    if (!trigger) return { presented: false, reason: "NO_PRESENTATION_FOR_EVENT" };
    const sensoryEvent = buildSensoryEvent(trigger, { sensoryEventId: `sensory:${event.eventId}`, sourceRecordId: event.eventId, correlationId: event.correlationId });
    const result = planSensoryPresentation(sensoryEvent, { registry: sensoryRegistry, policyId, accessibility });
    if (result.status !== "PRESENT") return { presented: false, reason: result.reasons[0] ?? result.status };
    plans.push(result.plan);
    const anchor = event.location?.destinationId ? { coordinateSpaceId: "metaverse.quick-map", destinationId: event.location.destinationId } : null;
    for (const channel of ["AUDIO", "MUSIC"]) {
      const soundId = result.plan.channels[channel];
      if (soundId) addSource({ soundId, plan: result.plan, worldEventRef: event.eventId, anchor, systemId: event.sourceSystem, looping: false });
    }
    if (result.plan.captionKey) captions.push({ captionKey: result.plan.captionKey, sourceEventId: event.eventId, visualAlert: result.plan.visualAlert === true });
    const signal = result.plan.presentationPriority === "CRITICAL_ALERT" ? "ESCALATED"
      : ["ALERT", "OPERATIONAL"].includes(result.plan.presentationPriority) ? "PROBLEM_DETECTED"
        : trigger.presentationIntent === "ACKNOWLEDGE" ? "RESOLVED" : result.plan.tier === "TIER_3_MISSION_SUCCESS" ? "MISSION_SUCCEEDED" : null;
    if (signal) musicState = nextMusicState(musicState, signal).state;
    return { presented: true, plan: result.plan };
  }

  // District ambience from an EnvironmentAudioProfile in the shared sensory registry.
  function setDistrict(profileId) {
    const profile = sensoryRegistry.environmentAudioProfiles.find((item) => item.profileId === profileId);
    if (!profile) return { ok: false, reason: "UNKNOWN_ENVIRONMENT_PROFILE" };
    for (const item of sources) if (item.priorityClass === "AMBIENCE" && item.environmentId !== profileId) item.state = "STOPPED";
    const started = profile.ambienceSoundIds.map((soundId) => addSource({ soundId, environmentId: profileId, looping: true,
      anchor: { coordinateSpaceId: profile.environmentRef.kind === "ZONE" ? "zone" : "mol", zoneId: profile.environmentRef.id } }));
    return { ok: true, profileId, started: started.filter((item) => item.ok).length };
  }

  function addLandmark(landmark) {
    return addSource({ soundId: landmark.soundId, anchor: landmark.anchor, environmentId: landmark.landmarkId, looping: true });
  }

  // Deterministic mix: arbitrate plans (alerts over celebrations), apply accessibility and mixer, then keep the
  // highest-priority sources within the concurrency limit. Critical alerts are never suppressed by the limit.
  function getMix() {
    const arbitration = arbitrateSensoryPlans(plans);
    const foregroundAlerts = arbitration.assignments.filter((item) => ["CRITICAL_ALERT", "ALERT", "OPERATIONAL"].includes(item.presentationPriority)).map((item) => item.dedupeKey);
    const live = sources.filter((item) => item.state !== "STOPPED");
    const ranked = [...live].sort((a, b) => AUDIO_PRIORITY_CLASSES.indexOf(a.priorityClass) - AUDIO_PRIORITY_CLASSES.indexOf(b.priorityClass) || b.priority - a.priority || a.startedAt - b.startedAt);
    const kept = new Set();
    for (const item of ranked) if (item.priorityClass === "CRITICAL_ALERT" || kept.size < limits.maxConcurrentSources) kept.add(item.sourceId);
    const alertActive = foregroundAlerts.length > 0;
    const mixed = ranked.map((item) => {
      const sound = soundById.get(item.soundId);
      const channel = CATEGORY_CHANNEL[sound.category] ?? "effects";
      const spatial = computeSpatialGain({ source: item, listener, sound });
      let state = kept.has(item.sourceId) ? "PLAYING" : "SUPPRESSED";
      let reason = state === "SUPPRESSED" ? "CONCURRENCY_LIMIT" : null;
      if (accessibility.reducedSensory && (OPTIONAL_CHANNELS.includes(channel) || item.priorityClass === "CELEBRATION")) { state = "SUPPRESSED"; reason = "REDUCED_SENSORY"; }
      if (!mixer.toggles.backgroundMusic && channel === "music") { state = "SUPPRESSED"; reason = "BACKGROUND_MUSIC_OFF"; }
      // Celebrations never take audio from an active alert; they duck instead.
      if (state === "PLAYING" && alertActive && item.priorityClass === "CELEBRATION") { state = "DUCKED"; reason = "ALERT_ACTIVE"; }
      const level = accessibility.noAudio ? 0 : mixer.levels.master * mixer.levels[channel];
      const gain = state === "PLAYING" ? Math.round(spatial.gain * level * 1000) / 1000 : state === "DUCKED" ? Math.round(spatial.gain * level * 0.2 * 1000) / 1000 : 0;
      return { sourceId: item.sourceId, soundId: item.soundId, priorityClass: item.priorityClass, channel, state, reason, gain, pan: spatial.pan, worldEventRef: item.worldEventRef };
    });
    return Object.freeze({
      sources: mixed,
      // No-audio never hides an alert: captions and visual alerts remain.
      captions: captions.map((item) => ({ ...item })),
      visualAlerts: captions.filter((item) => item.visualAlert || accessibility.noAudio).map((item) => item.sourceEventId),
      effects: { particles: mixer.toggles.particles && !accessibility.reducedMotion && !accessibility.reducedSensory, cameraShake: mixer.toggles.cameraShake && !accessibility.reducedMotion,
        flashing: mixer.toggles.flashing && !accessibility.noFlashing, haptics: mixer.toggles.haptics && !accessibility.hapticsOff },
      musicState,
      createsEvents: false, affectsWorldState: false,
    });
  }

  return Object.freeze({
    setListener: (next) => { listener = { ...listener, ...next }; return listener; },
    handleWorldEvent, setDistrict, addLandmark, addSource, getMix,
    getSignage: () => signs.map((item) => ({ ...item })),
    getStorytelling: () => storytelling.map((item) => ({ ...item })),
    getMusicState: () => musicState,
    getCityMood: (state, extra = {}) => deriveCityMood({ state, recentEvents, ...extra }),
    stopAll: () => { for (const item of sources) item.state = "STOPPED"; },
  });
}
