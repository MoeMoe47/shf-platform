// Phase 7 — Data Center sensory profile (first real use of the Phase 6.5 sensory contracts). References only.
//
// Authoritative systems decide what happened. The Experience Layer decides how that event is presented.
// Every sound is a REGISTERED SOUND with no audio file yet (source "asset:pending:<id>"); nothing here claims an
// existing asset. Celebration entries present authoritative events only:
//   MOL POWER_FAILURE / POWER_RESTORED (SIMULATED power-grid provider) — incident alert and recovery
//   Mission Runtime events of the canonical Data Center Mission — start, backup power, escalation, success
//   Arcade mastery of the canonical Data Center activity — activity completion
// No TIER_4 entry exists: there is no authoritative milestone source for this program yet.
// Safety/operational alerts always outrank celebrations (see arbitrateSensoryPlans).

const MISSION = "data-center-cooling-failure-response";
const ACTIVITY = "arcade_activity_data_center_cooling_incident_v1";

const sound = (soundId, category, caption, extra = {}) => Object.freeze({
  soundId, category, source: `asset:pending:${soundId}`, environment: null, looping: false, spatial: false, maxDistance: null,
  priority: 50, volumeClass: "NORMAL", occlusionSupported: false, caption, accessibilityLabel: caption, ...extra,
});

export const DATA_CENTER_SOUNDS = Object.freeze([
  sound("dc.ambience.server-room", "AMBIENCE", "Steady server room ambience", { environment: "main-data-center", looping: true, spatial: true, maxDistance: 30, priority: 10, volumeClass: "QUIET", occlusionSupported: true }),
  sound("dc.ambience.cooling-fans", "INDUSTRIAL", "Cooling fans running", { environment: "cooling-mechanical-plant", looping: true, spatial: true, maxDistance: 25, priority: 10, volumeClass: "QUIET", occlusionSupported: true }),
  sound("dc.ambience.electrical-hum", "INFRASTRUCTURE", "Low electrical hum", { environment: "power-electrical-facility", looping: true, spatial: true, maxDistance: 15, priority: 10, volumeClass: "QUIET", occlusionSupported: true }),
  sound("dc.alert.ups-warning", "INFRASTRUCTURE", "UPS warning tone", { priority: 90 }),
  sound("dc.event.generator-startup", "INFRASTRUCTURE", "Backup generator starting", { spatial: true, maxDistance: 60, priority: 70, volumeClass: "LOUD" }),
  sound("dc.alert.alarm", "PUBLIC_SAFETY", "Facility alarm", { priority: 100, volumeClass: "LOUD" }),
  sound("dc.cue.mission-start", "MISSION", "Exercise starting", { priority: 40 }),
  sound("dc.cue.incident-escalation", "MISSION", "Incident escalated", { priority: 85 }),
  sound("dc.cue.recovery", "MISSION", "Systems recovering", { priority: 60 }),
  sound("dc.cue.mission-success", "CELEBRATION", "Exercise complete", { priority: 50 }),
  sound("dc.music.success-restrained", "MUSIC", "Quiet success music", { priority: 30, volumeClass: "QUIET" }),
]);

const entry = (celebrationId, triggerEvent, authoritySource, tier, cues = {}, extra = {}) => ({
  celebrationId, triggerEvent, authoritySource, tier, soundCue: null, musicCue: null, particleEffect: null, lightingEffect: null, cameraBehavior: null,
  npcReaction: null, signageBehavior: null, hapticPattern: null, durationMs: 3000, repeatPolicy: "ONCE_PER_SOURCE", cooldownMs: 0,
  reducedMotionVariant: null, reducedSensoryVariant: null, silentVariant: null, environmentRestrictions: [], ...cues, ...extra,
});
const variants = (captionKey, lightingEffect, signageBehavior) => ({
  reducedMotionVariant: { soundCue: "dc.cue.mission-success", musicCue: null, particleEffect: null, lightingEffect, cameraBehavior: null, npcReaction: null, signageBehavior, hapticPattern: null, captionKey },
  reducedSensoryVariant: { soundCue: "dc.cue.mission-success", musicCue: null, particleEffect: null, lightingEffect: null, cameraBehavior: null, npcReaction: null, signageBehavior, hapticPattern: null, captionKey },
  silentVariant: { soundCue: null, musicCue: null, particleEffect: null, lightingEffect, cameraBehavior: null, npcReaction: null, signageBehavior, hapticPattern: null, captionKey },
});

export const DATA_CENTER_CELEBRATIONS = Object.freeze([
  // INCIDENT — MOL's simulated power event. Alerts carry no celebration significance (tier 0).
  entry("dc.alert.power-failure", "POWER_FAILURE", "mol", "TIER_0_FEEDBACK",
    { soundCue: "dc.alert.alarm", lightingEffect: "lighting.dc.amber-beacon", signageBehavior: "signage.dc.power-event", hapticPattern: "haptic.dc.alert", npcReaction: "npc.dc.supervisor-alert" },
    { repeatPolicy: "EVERY_OCCURRENCE", durationMs: 6000 }),
  // RECOVERY — the alert resolves.
  entry("dc.recovery.power-restored", "POWER_RESTORED", "mol", "TIER_0_FEEDBACK",
    { soundCue: "dc.cue.recovery", lightingEffect: "lighting.dc.normal", signageBehavior: "signage.dc.power-restored" }),
  entry("dc.cue.exercise-start", "mission.runtime.started", "mission-runtime", "TIER_0_FEEDBACK",
    { soundCue: "dc.cue.mission-start", signageBehavior: "signage.dc.exercise-active" }, { durationMs: 1500 }),
  entry("dc.cue.backup-power", `${MISSION}:backup-power-confirmed`, "mission-runtime", "TIER_0_FEEDBACK",
    { soundCue: "dc.event.generator-startup", signageBehavior: "signage.dc.backup-power" }),
  // ESCALATION — a stronger operational alert raised by the team's declared escalation event.
  entry("dc.alert.incident-escalated", `${MISSION}:incident-escalated`, "mission-runtime", "TIER_0_FEEDBACK",
    { soundCue: "dc.cue.incident-escalation", lightingEffect: "lighting.dc.red-beacon", signageBehavior: "signage.dc.escalated", hapticPattern: "haptic.dc.alert" },
    { repeatPolicy: "EVERY_OCCURRENCE", durationMs: 5000 }),
  // MISSION SUCCESS — restrained: quiet music, soft lighting, no camera or particles.
  entry("dc.celebration.mission-success", `${MISSION}:SUCCEEDED`, "mission-runtime", "TIER_3_MISSION_SUCCESS",
    { soundCue: "dc.cue.mission-success", musicCue: "dc.music.success-restrained", lightingEffect: "lighting.dc.soft-green", signageBehavior: "signage.dc.exercise-complete", npcReaction: "npc.dc.supervisor-nod" },
    { durationMs: 4000, ...variants("caption.dc.exercise-complete", "lighting.dc.soft-green", "signage.dc.exercise-complete") }),
  // ACTIVITY COMPLETE — authoritative Arcade mastery of the canonical activity.
  entry("dc.celebration.activity-mastered", `${ACTIVITY}:MASTERED`, "arcade", "TIER_2_ACTIVITY_COMPLETE",
    { soundCue: "dc.cue.mission-success", lightingEffect: "lighting.dc.soft-green" },
    { durationMs: 2500, ...variants("caption.dc.activity-mastered", "lighting.dc.soft-green", null) }),
]);

// Declared trigger table: which authoritative event presents with which intent/severity.
const trigger = (triggerEvent, authoritySource, presentationIntent, accessibleAlternative, alertSeverity = null) =>
  Object.freeze({ triggerEvent, authoritySource, presentationIntent, alertSeverity, accessibleAlternative });
export const DATA_CENTER_SENSORY_TRIGGERS = Object.freeze({
  INCIDENT: trigger("POWER_FAILURE", "mol", "ALERT", "caption.dc.power-event", "CRITICAL"),
  RECOVERY: trigger("POWER_RESTORED", "mol", "ACKNOWLEDGE", "caption.dc.power-restored"),
  EXERCISE_START: trigger("mission.runtime.started", "mission-runtime", "ACKNOWLEDGE", "caption.dc.exercise-active"),
  BACKUP_POWER: trigger(`${MISSION}:backup-power-confirmed`, "mission-runtime", "ACKNOWLEDGE", "caption.dc.backup-power"),
  ESCALATION: trigger(`${MISSION}:incident-escalated`, "mission-runtime", "ALERT", "caption.dc.escalated", "WARNING"),
  MISSION_SUCCESS: trigger(`${MISSION}:SUCCEEDED`, "mission-runtime", "CELEBRATE", "caption.dc.exercise-complete"),
  ACTIVITY_MASTERED: trigger(`${ACTIVITY}:MASTERED`, "arcade", "CELEBRATE", "caption.dc.activity-mastered"),
});

export const DATA_CENTER_SOUND_PROFILES = Object.freeze([{ profileId: "sound-profile.data-center", soundIds: DATA_CENTER_SOUNDS.map((item) => item.soundId) }]);
export const DATA_CENTER_CELEBRATION_PROFILES = Object.freeze([{ profileId: "celebration-profile.data-center", celebrationIds: DATA_CENTER_CELEBRATIONS.map((item) => item.celebrationId) }]);
// NORMAL — ambient server room, cooling fans and electrical hum, reacting to MOL world events only.
export const DATA_CENTER_ENVIRONMENT_AUDIO_PROFILES = Object.freeze([{
  profileId: "environment-audio.main-data-center", environmentRef: { kind: "ZONE", id: "main-data-center" },
  ambienceSoundIds: ["dc.ambience.server-room", "dc.ambience.cooling-fans", "dc.ambience.electrical-hum"], maxConcurrentSounds: 6, defaultVolumeClass: "QUIET", worldStateDriven: true,
}]);
// Training presentation: calm by default, no flashing, captions always, celebrations capped at Mission success.
export const DATA_CENTER_PRESENTATION_POLICIES = Object.freeze([{
  policyId: "policy.data-center-training", defaultIntensity: "STANDARD", allowedIntensities: ["CALM", "STANDARD"], maxTier: "TIER_3_MISSION_SUCCESS",
  allowCamera: false, allowHaptics: true, allowFlashing: false, requireCaptions: true,
}]);
