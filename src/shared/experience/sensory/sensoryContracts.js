// Phase 6.5 — Silicon Heartland Celebration, Audio & Sensory Experience Foundation (contracts only).
//
// Authoritative systems decide what happened. The Experience Layer decides how that event is presented,
// heard, celebrated, felt, and reflected in the world.
// Celebrations may present authoritative or verified events; they must never manufacture the underlying
// achievement.
//
// Pure, deterministic contracts shared by clients and the API. No audio assets, effects engine, WebAudio,
// spatial audio or UI. Nothing here creates mastery, Evidence, credentials, career readiness, employment,
// Mission success or world truth.

// Bounded canonical tiers. A tier comes from the registered celebration for an authoritative trigger,
// never from the caller and never from arbitrary browser events.
export const CELEBRATION_TIERS = Object.freeze([
  "TIER_0_FEEDBACK",
  "TIER_1_SMALL_WIN",
  "TIER_2_ACTIVITY_COMPLETE",
  "TIER_3_MISSION_SUCCESS",
  "TIER_4_MAJOR_MILESTONE",
  "TIER_5_INSTITUTIONAL_WORLD_EVENT",
]);
export const tierRank = (tier) => CELEBRATION_TIERS.indexOf(tier);

// Mapping from the existing client celebration policy (src/experience/celebrations/celebrationPolicy.js),
// which stays the live policy until it is adapted onto these contracts.
export const LEGACY_CELEBRATION_TIER_MAP = Object.freeze({
  ACKNOWLEDGEMENT: "TIER_1_SMALL_WIN",
  ACHIEVEMENT: "TIER_2_ACTIVITY_COMPLETE",
  MAJOR_MILESTONE: "TIER_4_MAJOR_MILESTONE",
});

// Authoritative sources and the highest tier each may present. "ui-interaction" is the learner's own input:
// TIER_0 feedback only, never a celebration. Client-side XP/"dopamine" stores are not sources.
export const SENSORY_AUTHORITY_SOURCES = Object.freeze({
  "ui-interaction": "TIER_0_FEEDBACK",
  curriculum: "TIER_4_MAJOR_MILESTONE",
  arcade: "TIER_2_ACTIVITY_COMPLETE",
  "mission-runtime": "TIER_3_MISSION_SUCCESS",
  "mission-team": "TIER_3_MISSION_SUCCESS",
  "verified-evidence": "TIER_4_MAJOR_MILESTONE",
  credentials: "TIER_4_MAJOR_MILESTONE",
  careers: "TIER_4_MAJOR_MILESTONE",
  "truth-spine": "TIER_5_INSTITUTIONAL_WORLD_EVENT",
  mol: "TIER_5_INSTITUTIONAL_WORLD_EVENT",
});

export const SOUND_CATEGORIES = Object.freeze([
  "UI", "MUSIC", "AMBIENCE", "VEHICLE", "WEATHER", "WATER", "INDUSTRIAL",
  "PUBLIC_SAFETY", "VOICE_PA", "CROWD", "MISSION", "CELEBRATION", "INFRASTRUCTURE",
]);
export const SOUND_VOLUME_CLASSES = Object.freeze(["QUIET", "NORMAL", "LOUD"]);
const AMBIENT_CATEGORIES = Object.freeze(["AMBIENCE", "VEHICLE", "WEATHER", "WATER", "INDUSTRIAL", "INFRASTRUCTURE", "CROWD"]);

// Presentation intensity. It changes presentation only, never an outcome.
export const SENSORY_INTENSITIES = Object.freeze(["CALM", "STANDARD", "ENERGETIC", "CINEMATIC"]);
export const SENSORY_INTENSITY_PROFILES = Object.freeze({
  CALM: Object.freeze({ intensity: "CALM", particleLevel: "NONE", musicAllowed: false, cameraAllowed: false, maxDurationMs: 1500, affectsOutcome: false }),
  STANDARD: Object.freeze({ intensity: "STANDARD", particleLevel: "LOW", musicAllowed: true, cameraAllowed: false, maxDurationMs: 3000, affectsOutcome: false }),
  ENERGETIC: Object.freeze({ intensity: "ENERGETIC", particleLevel: "MEDIUM", musicAllowed: true, cameraAllowed: true, maxDurationMs: 5000, affectsOutcome: false }),
  CINEMATIC: Object.freeze({ intensity: "CINEMATIC", particleLevel: "HIGH", musicAllowed: true, cameraAllowed: true, maxDurationMs: 12000, affectsOutcome: false }),
});

export const PRESENTATION_INTENTS = Object.freeze(["FEEDBACK", "ACKNOWLEDGE", "CELEBRATE", "AMBIENT", "ALERT", "CEREMONY"]);

// Celebration tier expresses celebration significance; it is not operational priority.
// Presentation priority is derived only from the declared intent (and, for ALERT, a bounded severity),
// never from a tier or a client-supplied number. Highest first.
export const PRESENTATION_PRIORITIES = Object.freeze(["CRITICAL_ALERT", "ALERT", "OPERATIONAL", "CEREMONY", "CELEBRATION", "FEEDBACK", "AMBIENT"]);
export const priorityRank = (priority) => PRESENTATION_PRIORITIES.indexOf(priority);
// Alert-class priorities: safety, emergency and operational alerts. Celebrations never preempt them.
export const ALERT_PRIORITIES = Object.freeze(["CRITICAL_ALERT", "ALERT", "OPERATIONAL"]);

export const ALERT_SEVERITIES = Object.freeze(["CRITICAL", "WARNING", "OPERATIONAL"]);
const SEVERITY_PRIORITY = Object.freeze({ CRITICAL: "CRITICAL_ALERT", WARNING: "ALERT", OPERATIONAL: "OPERATIONAL" });
// Highest alert severity each authority may raise. World and Mission authorities own safety/emergency state;
// the learner's own UI input can never raise an alert.
export const ALERT_SEVERITY_CEILING = Object.freeze({
  mol: "CRITICAL", "mission-runtime": "CRITICAL", "mission-team": "WARNING", "truth-spine": "WARNING",
  curriculum: "OPERATIONAL", arcade: "OPERATIONAL", "verified-evidence": "OPERATIONAL", credentials: "OPERATIONAL", careers: "OPERATIONAL",
});
const severityRank = (severity) => ["OPERATIONAL", "WARNING", "CRITICAL"].indexOf(severity);

export function presentationPriorityFor(presentationIntent, alertSeverity = null) {
  switch (presentationIntent) {
    case "ALERT": return SEVERITY_PRIORITY[alertSeverity] ?? null;
    case "CEREMONY": return "CEREMONY";
    case "CELEBRATE": case "ACKNOWLEDGE": return "CELEBRATION";
    case "FEEDBACK": return "FEEDBACK";
    case "AMBIENT": return "AMBIENT";
    default: return null;
  }
}
export const REPLAY_POLICIES = Object.freeze(["NEVER", "ON_REQUEST", "WITH_SOURCE_REPLAY"]);
export const REPEAT_POLICIES = Object.freeze(["ONCE_PER_SOURCE", "ONCE_PER_SESSION", "EVERY_OCCURRENCE"]);
export const PRESENTATION_CHANNELS = Object.freeze(["AUDIO", "MUSIC", "PARTICLES", "LIGHTING", "CAMERA", "HAPTICS", "NPC", "SIGNAGE", "CEREMONY"]);

// Presentation-only accessibility profile. It carries no accommodation, diagnosis or grant detail.
export const ACCESSIBILITY_SENSORY_KEYS = Object.freeze([
  "reducedMotion", "reducedSensory", "noAudio", "noFlashing", "hapticsOff", "screenReaderAlternative", "captions", "visualSoundIndicators",
]);

export const SENSORY_NON_AUTHORITY = Object.freeze({
  createsTruth: false, createsEvidence: false, createsMastery: false, createsCredential: false,
  createsCareerReadiness: false, createsEmployment: false, createsMissionSuccess: false, createsWorldTruth: false,
});

// Fields a sensory contract may never carry: it references a source event, it does not copy it.
const COPIED_AUTHORITY_FIELDS = Object.freeze([
  "payload", "score", "maxScore", "masteryAchieved", "passed", "evidence", "evidenceId", "credential", "credentialId", "userId", "user_id",
  "learnerId", "learnerUserId", "participantId", "accommodation", "accommodationType", "diagnosis", "worldState", "result", "grade",
]);

const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const text = (value, max = 160) => typeof value === "string" && value.trim().length > 0 && value.length <= max;
const refOrNull = (value) => value === null || (typeof value === "string" && ID.test(value));

function onlyKeys(value, keys, path, errors) {
  for (const key of Object.keys(value)) {
    if (COPIED_AUTHORITY_FIELDS.includes(key)) errors.push(`${path}.${key}: sensory contracts reference events; they never copy authoritative data`);
    else if (!keys.includes(key)) errors.push(`${path}.${key}: unsupported field`);
  }
}

function nonAuthorityFlags(value, path, errors) {
  for (const [key, expected] of Object.entries(SENSORY_NON_AUTHORITY)) {
    if (value[key] !== expected) errors.push(`${path}.${key} must be false`);
  }
}

export function validateSound(value) {
  const errors = [];
  if (!isRecord(value)) return ["sound must be an object"];
  onlyKeys(value, ["soundId", "category", "source", "environment", "looping", "spatial", "maxDistance", "priority", "volumeClass",
    "occlusionSupported", "caption", "accessibilityLabel"], "sound", errors);
  if (!ID.test(String(value.soundId ?? ""))) errors.push("soundId is invalid");
  if (!SOUND_CATEGORIES.includes(value.category)) errors.push("category is not a canonical sound category");
  // An asset reference only (e.g. "asset:pending" or "synth:sfx.click"); no audio file is required.
  if (!text(value.source)) errors.push("source reference is required");
  if (!refOrNull(value.environment)) errors.push("environment must be a reference or null");
  for (const key of ["looping", "spatial", "occlusionSupported"]) if (typeof value[key] !== "boolean") errors.push(`${key} must be boolean`);
  if (value.spatial === true ? !(Number.isFinite(value.maxDistance) && value.maxDistance > 0 && value.maxDistance <= 10000) : value.maxDistance !== null) {
    errors.push("maxDistance is required (bounded) for spatial sounds and must be null otherwise");
  }
  if (!Number.isInteger(value.priority) || value.priority < 0 || value.priority > 100) errors.push("priority must be an integer 0-100");
  if (!SOUND_VOLUME_CLASSES.includes(value.volumeClass)) errors.push("volumeClass is invalid");
  // Every sound has a text equivalent so it can be captioned or shown as a visual sound indicator.
  if (!text(value.caption)) errors.push("caption is required");
  if (!text(value.accessibilityLabel)) errors.push("accessibilityLabel is required");
  return errors;
}

const VARIANT_KEYS = ["soundCue", "musicCue", "particleEffect", "lightingEffect", "cameraBehavior", "npcReaction", "signageBehavior", "hapticPattern"];

function validateVariant(value, path, errors, rule) {
  if (!isRecord(value)) return void errors.push(`${path} must be an object`);
  onlyKeys(value, [...VARIANT_KEYS, "captionKey"], path, errors);
  for (const key of VARIANT_KEYS) if (!refOrNull(value[key] ?? null)) errors.push(`${path}.${key} must be a reference or null`);
  if (!text(value.captionKey)) errors.push(`${path}.captionKey is required (text alternative)`);
  rule(value);
}

export function validateCelebration(value) {
  const errors = [];
  if (!isRecord(value)) return ["celebration must be an object"];
  onlyKeys(value, ["celebrationId", "triggerEvent", "authoritySource", "tier", ...VARIANT_KEYS, "durationMs", "repeatPolicy", "cooldownMs",
    "reducedMotionVariant", "reducedSensoryVariant", "silentVariant", "environmentRestrictions"], "celebration", errors);
  if (!ID.test(String(value.celebrationId ?? ""))) errors.push("celebrationId is invalid");
  if (!ID.test(String(value.triggerEvent ?? ""))) errors.push("triggerEvent must be an authoritative event type");
  const ceiling = SENSORY_AUTHORITY_SOURCES[value.authoritySource];
  if (!ceiling) errors.push("authoritySource is not a recognized authoritative source");
  if (!CELEBRATION_TIERS.includes(value.tier)) errors.push("tier is not a canonical celebration tier");
  else if (ceiling && tierRank(value.tier) > tierRank(ceiling)) errors.push(`${value.authoritySource} cannot present ${value.tier}`);
  for (const key of VARIANT_KEYS) if (!refOrNull(value[key] ?? null)) errors.push(`${key} must be a reference or null`);
  if (!Number.isInteger(value.durationMs) || value.durationMs < 0 || value.durationMs > SENSORY_INTENSITY_PROFILES.CINEMATIC.maxDurationMs) errors.push("durationMs is out of bounds");
  if (!REPEAT_POLICIES.includes(value.repeatPolicy)) errors.push("repeatPolicy is invalid");
  if (!Number.isInteger(value.cooldownMs) || value.cooldownMs < 0 || value.cooldownMs > 3_600_000) errors.push("cooldownMs is out of bounds");
  if (!Array.isArray(value.environmentRestrictions) || !value.environmentRestrictions.every((item) => ID.test(String(item)))) errors.push("environmentRestrictions must be references");
  // Every celebration above feedback must be presentable without motion, at low sensory load, and silently.
  const major = tierRank(value.tier) >= tierRank("TIER_1_SMALL_WIN");
  const variants = [
    ["reducedMotionVariant", (variant) => { if (variant.particleEffect || variant.cameraBehavior) errors.push("reducedMotionVariant cannot use particles or camera motion"); }],
    ["reducedSensoryVariant", (variant) => { if (variant.musicCue || variant.particleEffect || variant.cameraBehavior || variant.hapticPattern) errors.push("reducedSensoryVariant must drop music, particles, camera and haptics"); }],
    ["silentVariant", (variant) => { if (variant.soundCue || variant.musicCue) errors.push("silentVariant cannot play sound or music"); }],
  ];
  for (const [key, rule] of variants) {
    if (value[key] == null) { if (major) errors.push(`${key} is required for ${value.tier}`); }
    else validateVariant(value[key], key, errors, rule);
  }
  return errors;
}

export function validateSensoryEvent(value) {
  const errors = [];
  if (!isRecord(value)) return ["sensory event must be an object"];
  onlyKeys(value, ["sensoryEventId", "sourceEventType", "sourceAuthority", "sourceRecordId", "correlationId", "presentationIntent", "alertSeverity", "celebrationTier",
    "environmentRefs", "accessibleAlternative", "replayPolicy", "worldStateRequirement", ...Object.keys(SENSORY_NON_AUTHORITY)], "sensoryEvent", errors);
  if (!ID.test(String(value.sensoryEventId ?? ""))) errors.push("sensoryEventId is invalid");
  if (!ID.test(String(value.sourceEventType ?? ""))) errors.push("sourceEventType is required");
  const ceiling = SENSORY_AUTHORITY_SOURCES[value.sourceAuthority];
  if (!ceiling) errors.push("sourceAuthority must be a recognized authoritative source");
  if (!ID.test(String(value.sourceRecordId ?? ""))) errors.push("sourceRecordId is required (the authoritative record this presents)");
  if (!ID.test(String(value.correlationId ?? ""))) errors.push("correlationId is required");
  if (!PRESENTATION_INTENTS.includes(value.presentationIntent)) errors.push("presentationIntent is invalid");
  if (value.celebrationTier !== null) {
    if (!CELEBRATION_TIERS.includes(value.celebrationTier)) errors.push("celebrationTier is not canonical");
    else if (ceiling && tierRank(value.celebrationTier) > tierRank(ceiling)) errors.push(`${value.sourceAuthority} cannot present ${value.celebrationTier}`);
  }
  if (value.sourceAuthority === "ui-interaction" && value.presentationIntent !== "FEEDBACK") errors.push("ui-interaction may only produce FEEDBACK");
  if (value.presentationIntent === "ALERT") {
    const ceilingSeverity = ALERT_SEVERITY_CEILING[value.sourceAuthority];
    if (!ALERT_SEVERITIES.includes(value.alertSeverity)) errors.push("ALERT requires alertSeverity CRITICAL, WARNING or OPERATIONAL");
    else if (!ceilingSeverity) errors.push(`${value.sourceAuthority} cannot raise alerts`);
    else if (severityRank(value.alertSeverity) > severityRank(ceilingSeverity)) errors.push(`${value.sourceAuthority} cannot raise ${value.alertSeverity} alerts`);
  } else if (value.alertSeverity !== null && value.alertSeverity !== undefined) errors.push("alertSeverity is only valid with ALERT");
  if (!Array.isArray(value.environmentRefs) || value.environmentRefs.length > 8 || !value.environmentRefs.every((item) => ID.test(String(item)))) errors.push("environmentRefs must be up to 8 references");
  if (!text(value.accessibleAlternative)) errors.push("accessibleAlternative (text/caption key) is required");
  if (!REPLAY_POLICIES.includes(value.replayPolicy)) errors.push("replayPolicy is invalid");
  const world = value.worldStateRequirement;
  if (world !== null && !(isRecord(world) && Object.keys(world).every((key) => ["molSystemId", "stateKey"].includes(key)) && ID.test(String(world.molSystemId ?? "")) && ID.test(String(world.stateKey ?? "")))) {
    errors.push("worldStateRequirement must be null or a MOL {molSystemId, stateKey} reference");
  }
  nonAuthorityFlags(value, "sensoryEvent", errors);
  return errors;
}

export function validateEnvironmentAudioProfile(value, { sounds = [] } = {}) {
  const errors = [];
  if (!isRecord(value)) return ["environment audio profile must be an object"];
  onlyKeys(value, ["profileId", "environmentRef", "ambienceSoundIds", "maxConcurrentSounds", "defaultVolumeClass", "worldStateDriven"], "environmentAudioProfile", errors);
  if (!ID.test(String(value.profileId ?? ""))) errors.push("profileId is invalid");
  const env = value.environmentRef;
  if (!isRecord(env) || !["MOL_SYSTEM", "ZONE"].includes(env.kind) || !ID.test(String(env.id ?? ""))) errors.push("environmentRef must be {kind: MOL_SYSTEM|ZONE, id}");
  const byId = new Map(sounds.map((sound) => [sound.soundId, sound]));
  if (!Array.isArray(value.ambienceSoundIds) || value.ambienceSoundIds.length > 24) errors.push("ambienceSoundIds must be up to 24 references");
  else for (const id of value.ambienceSoundIds) {
    const sound = byId.get(id);
    if (!sound) errors.push(`ambience sound ${id} is not registered`);
    else if (!AMBIENT_CATEGORIES.includes(sound.category)) errors.push(`ambience sound ${id} has non-ambient category ${sound.category}`);
  }
  if (!Number.isInteger(value.maxConcurrentSounds) || value.maxConcurrentSounds < 1 || value.maxConcurrentSounds > 32) errors.push("maxConcurrentSounds must be 1-32");
  if (!SOUND_VOLUME_CLASSES.includes(value.defaultVolumeClass)) errors.push("defaultVolumeClass is invalid");
  // World-state-driven audio reacts to MOL world events; it never writes world state.
  if (typeof value.worldStateDriven !== "boolean") errors.push("worldStateDriven must be boolean");
  return errors;
}

export function validatePresentationPolicy(value) {
  const errors = [];
  if (!isRecord(value)) return ["presentation policy must be an object"];
  onlyKeys(value, ["policyId", "defaultIntensity", "allowedIntensities", "maxTier", "allowCamera", "allowHaptics", "allowFlashing", "requireCaptions"], "presentationPolicy", errors);
  if (!ID.test(String(value.policyId ?? ""))) errors.push("policyId is invalid");
  if (!SENSORY_INTENSITIES.includes(value.defaultIntensity)) errors.push("defaultIntensity must be CALM, STANDARD, ENERGETIC or CINEMATIC");
  if (!Array.isArray(value.allowedIntensities) || !value.allowedIntensities.length || !value.allowedIntensities.every((item) => SENSORY_INTENSITIES.includes(item))) errors.push("allowedIntensities are invalid");
  else if (!value.allowedIntensities.includes(value.defaultIntensity)) errors.push("defaultIntensity must be allowed");
  if (!CELEBRATION_TIERS.includes(value.maxTier)) errors.push("maxTier is invalid");
  for (const key of ["allowCamera", "allowHaptics", "allowFlashing", "requireCaptions"]) if (typeof value[key] !== "boolean") errors.push(`${key} must be boolean`);
  return errors;
}

export function validateAccessibilitySensoryProfile(value) {
  const errors = [];
  if (!isRecord(value)) return ["accessibility sensory profile must be an object"];
  onlyKeys(value, ACCESSIBILITY_SENSORY_KEYS, "accessibilitySensoryProfile", errors);
  for (const key of ACCESSIBILITY_SENSORY_KEYS) if (typeof value[key] !== "boolean") errors.push(`${key} must be boolean`);
  return errors;
}

// Derives the presentation profile from the learner's existing accessibility preferences
// (preferences.sensory.motionPreference / celebrationIntensity). Only booleans leave this function.
export function accessibilitySensoryProfileFromPreferences(preferences = {}, { systemReducedMotion = false } = {}) {
  const sensory = isRecord(preferences?.sensory) ? preferences.sensory : {};
  const motion = sensory.motionPreference || "AUTO";
  const celebration = sensory.celebrationIntensity || "FULL";
  const flag = (key) => sensory[key] === true;
  return Object.freeze({
    reducedMotion: motion === "REDUCED" || (motion === "AUTO" && systemReducedMotion === true),
    reducedSensory: celebration === "SUBTLE" || celebration === "OFF" || flag("reducedSensory"),
    noAudio: celebration === "OFF" || flag("noAudio"),
    noFlashing: flag("noFlashing"),
    hapticsOff: flag("hapticsOff"),
    screenReaderAlternative: flag("screenReaderAlternative"),
    captions: flag("captions"),
    visualSoundIndicators: flag("visualSoundIndicators"),
  });
}

export function validateSensoryProfile(value, kind, { knownIds = [] } = {}) {
  // Sound and celebration profiles are named collections of registered ids; they own nothing else.
  const key = kind === "SOUND" ? "soundIds" : "celebrationIds";
  const errors = [];
  if (!isRecord(value)) return [`${kind.toLowerCase()} profile must be an object`];
  onlyKeys(value, ["profileId", key], `${kind.toLowerCase()}Profile`, errors);
  if (!ID.test(String(value.profileId ?? ""))) errors.push("profileId is invalid");
  if (!Array.isArray(value[key]) || value[key].length > 64) errors.push(`${key} must be up to 64 references`);
  else for (const id of value[key]) if (!knownIds.includes(id)) errors.push(`${key}: ${id} is not registered`);
  return errors;
}
