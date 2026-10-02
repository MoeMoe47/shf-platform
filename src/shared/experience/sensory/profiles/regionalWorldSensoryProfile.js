// Phase 9 — regional world sensory profile (World Audio Engine content, references only).
//
// The World Audio Engine presents authoritative or simulated events. It does not create the underlying event.
// Every sound is a REGISTERED SOUND with no audio file yet (asset:pending). Presentation entries exist only for MOL
// world event types (authority "mol"); POWER_FAILURE / POWER_RESTORED keep their Phase 7 Data Center entries (one
// presentation per authoritative trigger). District profiles reference only existing places: the canonical
// destination central-plaza and the canonical regional scenes river, container-yard and oil-rig. Audio landmarks
// anchor to calibrated Quick Map locations or regional scenes — never to new coordinates.

const sound = (soundId, category, caption, extra = {}) => Object.freeze({
  soundId, category, source: `asset:pending:${soundId}`, environment: null, looping: false, spatial: false, maxDistance: null,
  priority: 50, volumeClass: "NORMAL", occlusionSupported: false, caption, accessibilityLabel: caption, ...extra,
});
const ambience = (soundId, category, caption, environment, maxDistance = 30) =>
  sound(soundId, category, caption, { environment, looping: true, spatial: true, maxDistance, priority: 10, volumeClass: "QUIET", occlusionSupported: true });

export const REGIONAL_WORLD_SOUNDS = Object.freeze([
  ambience("world.ambience.city-core", "CROWD", "City core crowd and traffic murmur", "central-plaza", 25),
  ambience("world.ambience.river-flow", "WATER", "River flowing", "river", 40),
  ambience("world.ambience.port-activity", "INDUSTRIAL", "Port cranes and container activity", "container-yard", 45),
  ambience("world.ambience.ocean-waves", "WATER", "Open ocean waves", "oil-rig", 60),
  ambience("world.ambience.oil-rig-machinery", "INDUSTRIAL", "Offshore platform machinery", "oil-rig", 20),
  sound("world.vehicle.port-horn", "VEHICLE", "Ship horn", { spatial: true, maxDistance: 70, priority: 55, volumeClass: "LOUD" }),
  sound("world.vehicle.emergency-siren", "PUBLIC_SAFETY", "Emergency vehicle siren", { spatial: true, maxDistance: 60, priority: 95, volumeClass: "LOUD" }),
  sound("world.alert.storm-warning", "WEATHER", "Storm warning tone", { priority: 85 }),
  sound("world.weather.storm", "WEATHER", "Heavy rain and wind", { looping: true, priority: 30 }),
  sound("world.alert.road-closed", "PUBLIC_SAFETY", "Road closure notice", { priority: 70 }),
  sound("world.alert.waterway-restricted", "WATER", "Waterway restriction notice", { priority: 70 }),
  sound("world.cue.all-clear", "INFRASTRUCTURE", "All clear", { priority: 50 }),
  sound("world.voice.pa-advisory", "VOICE_PA", "Public address advisory", { priority: 80 }),
]);

const entry = (celebrationId, triggerEvent, cues = {}, extra = {}) => ({
  celebrationId, triggerEvent, authoritySource: "mol", tier: "TIER_0_FEEDBACK", soundCue: null, musicCue: null, particleEffect: null, lightingEffect: null,
  cameraBehavior: null, npcReaction: null, signageBehavior: null, hapticPattern: null, durationMs: 4000, repeatPolicy: "EVERY_OCCURRENCE", cooldownMs: 0,
  reducedMotionVariant: null, reducedSensoryVariant: null, silentVariant: null, environmentRestrictions: [], ...cues, ...extra,
});

// Alerts carry no celebration significance (tier 0); priority comes from intent/severity in the trigger table.
export const REGIONAL_WORLD_CELEBRATIONS = Object.freeze([
  entry("world.alert.storm-started", "STORM_STARTED", { soundCue: "world.alert.storm-warning", lightingEffect: "lighting.world.storm-dim", signageBehavior: "signage.world.storm-warning" }),
  entry("world.recovery.storm-ended", "STORM_ENDED", { soundCue: "world.cue.all-clear", signageBehavior: "signage.world.all-clear" }),
  entry("world.alert.incident-opened", "INCIDENT_OPENED", { soundCue: "world.vehicle.emergency-siren", signageBehavior: "signage.world.incident-ahead", npcReaction: "npc.world.step-aside" }),
  entry("world.recovery.incident-closed", "INCIDENT_CLOSED", { soundCue: "world.cue.all-clear" }),
  entry("world.alert.vehicle-collision", "VEHICLE_COLLISION", { soundCue: "world.vehicle.emergency-siren", signageBehavior: "signage.world.incident-ahead" }),
  entry("world.alert.road-closed", "ROAD_CLOSED", { soundCue: "world.alert.road-closed", signageBehavior: "signage.world.road-closed" }),
  entry("world.recovery.road-reopened", "ROAD_REOPENED", { soundCue: "world.cue.all-clear" }),
  entry("world.alert.waterway-restricted", "WATERWAY_RESTRICTED", { soundCue: "world.alert.waterway-restricted", signageBehavior: "signage.world.waterway-restricted" }),
  entry("world.recovery.waterway-lifted", "WATERWAY_RESTRICTION_LIFTED", { soundCue: "world.cue.all-clear" }),
]);

const trigger = (triggerEvent, presentationIntent, accessibleAlternative, alertSeverity = null) =>
  Object.freeze({ triggerEvent, authoritySource: "mol", presentationIntent, alertSeverity, accessibleAlternative });
// Declared presentation of MOL world events. POWER_* reuse the Phase 7 Data Center entries.
export const REGIONAL_WORLD_SENSORY_TRIGGERS = Object.freeze({
  POWER_FAILURE: trigger("POWER_FAILURE", "ALERT", "caption.world.power-failure", "CRITICAL"),
  POWER_RESTORED: trigger("POWER_RESTORED", "ACKNOWLEDGE", "caption.world.power-restored"),
  STORM_STARTED: trigger("STORM_STARTED", "ALERT", "caption.world.storm-warning", "WARNING"),
  STORM_ENDED: trigger("STORM_ENDED", "ACKNOWLEDGE", "caption.world.storm-ended"),
  INCIDENT_OPENED: trigger("INCIDENT_OPENED", "ALERT", "caption.world.incident", "WARNING"),
  INCIDENT_CLOSED: trigger("INCIDENT_CLOSED", "ACKNOWLEDGE", "caption.world.incident-closed"),
  VEHICLE_COLLISION: trigger("VEHICLE_COLLISION", "ALERT", "caption.world.collision", "WARNING"),
  ROAD_CLOSED: trigger("ROAD_CLOSED", "ALERT", "caption.world.road-closed", "OPERATIONAL"),
  ROAD_REOPENED: trigger("ROAD_REOPENED", "ACKNOWLEDGE", "caption.world.road-reopened"),
  WATERWAY_RESTRICTED: trigger("WATERWAY_RESTRICTED", "ALERT", "caption.world.waterway-restricted", "OPERATIONAL"),
  WATERWAY_RESTRICTION_LIFTED: trigger("WATERWAY_RESTRICTION_LIFTED", "ACKNOWLEDGE", "caption.world.waterway-lifted"),
});

const district = (profileId, kind, id, ambienceSoundIds, maxConcurrentSounds = 6) => Object.freeze({
  profileId, environmentRef: { kind, id }, ambienceSoundIds, maxConcurrentSounds, defaultVolumeClass: "QUIET", worldStateDriven: true,
});
export const REGIONAL_WORLD_ENVIRONMENT_AUDIO_PROFILES = Object.freeze([
  district("environment-audio.city-core", "ZONE", "central-plaza", ["world.ambience.city-core"]),
  district("environment-audio.river", "ZONE", "river", ["world.ambience.river-flow"]),
  district("environment-audio.port", "ZONE", "container-yard", ["world.ambience.port-activity"]),
  district("environment-audio.oil-rig", "ZONE", "oil-rig", ["world.ambience.ocean-waves", "world.ambience.oil-rig-machinery"]),
]);

// Spatially anchored landmarks. Quick Map anchors use calibrated (PROVISIONAL) Quick Map locations only.
export const REGIONAL_AUDIO_LANDMARKS = Object.freeze([
  Object.freeze({ landmarkId: "landmark.port-horn", soundId: "world.vehicle.port-horn", anchor: Object.freeze({ coordinateSpaceId: "metaverse.quick-map", locationId: "marina-harbor" }) }),
  Object.freeze({ landmarkId: "landmark.fire-station", soundId: "world.vehicle.emergency-siren", anchor: Object.freeze({ coordinateSpaceId: "metaverse.quick-map", locationId: "fire" }) }),
  Object.freeze({ landmarkId: "landmark.hospital", soundId: "world.voice.pa-advisory", anchor: Object.freeze({ coordinateSpaceId: "metaverse.quick-map", locationId: "hospital" }) }),
  Object.freeze({ landmarkId: "landmark.river", soundId: "world.ambience.river-flow", anchor: Object.freeze({ coordinateSpaceId: "metaverse.regional-scene", sceneId: "river" }) }),
  Object.freeze({ landmarkId: "landmark.oil-rig-machinery", soundId: "world.ambience.oil-rig-machinery", anchor: Object.freeze({ coordinateSpaceId: "metaverse.regional-scene", sceneId: "oil-rig" }) }),
]);

export const REGIONAL_WORLD_SOUND_PROFILES = Object.freeze([{ profileId: "sound-profile.regional-world", soundIds: REGIONAL_WORLD_SOUNDS.map((item) => item.soundId) }]);
export const REGIONAL_WORLD_CELEBRATION_PROFILES = Object.freeze([{ profileId: "celebration-profile.regional-world", celebrationIds: REGIONAL_WORLD_CELEBRATIONS.map((item) => item.celebrationId) }]);
// World presentation policy: alerts must reach everyone; no camera, no flashing, captions always.
export const REGIONAL_WORLD_PRESENTATION_POLICIES = Object.freeze([{
  policyId: "policy.regional-world", defaultIntensity: "STANDARD", allowedIntensities: ["CALM", "STANDARD"], maxTier: "TIER_3_MISSION_SUCCESS",
  allowCamera: false, allowHaptics: true, allowFlashing: false, requireCaptions: true,
}]);
