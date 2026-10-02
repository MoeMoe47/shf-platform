// Phase 6.5 — Celebration, Audio & Sensory Experience Foundation (contracts only).
// Authoritative systems decide what happened; the Experience Layer decides how it is presented.
import assert from "node:assert/strict";
import { test } from "node:test";
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import {
  ACCESSIBILITY_SENSORY_KEYS, CELEBRATION_REGISTRY, CELEBRATION_TIERS, ENVIRONMENT_AUDIO_PROFILES, EXPERIENCE_SENSORY_DIRECTOR_CONTRACT,
  LEGACY_CELEBRATION_TIER_MAP, PRESENTATION_CHANNELS, SENSORY_AUTHORITY_SOURCES, SENSORY_INTENSITIES, SENSORY_INTENSITY_PROFILES,
  SENSORY_PRESENTATION_POLICIES, SOUND_CATEGORIES, SOUND_REGISTRY, accessibilitySensoryProfileFromPreferences, arbitrateSensoryPlans,
  ALERT_PRIORITIES, PRESENTATION_PRIORITIES, SUBTLE_CHANNELS,
  buildSensoryRegistry, planSensoryPresentation, resolveSensoryReference, validateAccessibilitySensoryProfile, validateCelebration,
  validateEnvironmentAudioProfile, validatePresentationPolicy, validateSensoryEvent, validateSound,
} from "../src/shared/experience/sensory/index.js";
import { CELEBRATION_TIER } from "../src/experience/celebrations/celebrationPolicy.js";

const sound = (soundId, category, extra = {}) => ({
  soundId, category, source: "asset:pending", environment: null, looping: false, spatial: false, maxDistance: null, priority: 50,
  volumeClass: "NORMAL", occlusionSupported: false, caption: `${soundId} caption`, accessibilityLabel: `${soundId} label`, ...extra,
});
const SOUNDS = [
  sound("ui.click", "UI"), sound("celebration.chime", "CELEBRATION"), sound("music.success-sting", "MUSIC"),
  sound("ambience.industrial-hum", "INDUSTRIAL", { looping: true, spatial: true, maxDistance: 40 }),
];
const variants = {
  reducedMotionVariant: { soundCue: "celebration.chime", musicCue: null, particleEffect: null, lightingEffect: "lighting.soft-glow", cameraBehavior: null, npcReaction: "npc.nod", signageBehavior: "signage.mission-complete", hapticPattern: null, captionKey: "caption.mission-success" },
  reducedSensoryVariant: { soundCue: "celebration.chime", musicCue: null, particleEffect: null, lightingEffect: null, cameraBehavior: null, npcReaction: null, signageBehavior: "signage.mission-complete", hapticPattern: null, captionKey: "caption.mission-success" },
  silentVariant: { soundCue: null, musicCue: null, particleEffect: "particles.sparkle", lightingEffect: "lighting.soft-glow", cameraBehavior: null, npcReaction: "npc.nod", signageBehavior: "signage.mission-complete", hapticPattern: "haptic.double-tap", captionKey: "caption.mission-success" },
};
const celebration = (extra = {}) => ({
  celebrationId: "celebration.mission-success", triggerEvent: "mission.runtime.succeeded", authoritySource: "mission-runtime", tier: "TIER_3_MISSION_SUCCESS",
  soundCue: "celebration.chime", musicCue: "music.success-sting", particleEffect: "particles.sparkle", lightingEffect: "lighting.flash-burst",
  cameraBehavior: "camera.orbit", npcReaction: "npc.cheer", signageBehavior: "signage.mission-complete", hapticPattern: "haptic.double-tap",
  durationMs: 8000, repeatPolicy: "ONCE_PER_SOURCE", cooldownMs: 30000, ...structuredClone(variants), environmentRestrictions: ["zone.hospital-icu"], ...extra,
});
const CELEBRATIONS = [
  celebration(),
  { celebrationId: "feedback.click", triggerEvent: "ui.button.pressed", authoritySource: "ui-interaction", tier: "TIER_0_FEEDBACK", soundCue: "ui.click", musicCue: null,
    particleEffect: null, lightingEffect: null, cameraBehavior: null, npcReaction: null, signageBehavior: null, hapticPattern: null, durationMs: 100,
    repeatPolicy: "EVERY_OCCURRENCE", cooldownMs: 0, reducedMotionVariant: null, reducedSensoryVariant: null, silentVariant: null, environmentRestrictions: [] },
  celebration({ celebrationId: "celebration.arcade-mastery", triggerEvent: "arcade.mastered", authoritySource: "arcade", tier: "TIER_1_SMALL_WIN", musicCue: null, durationMs: 2000 }),
];
const POLICIES = [
  { policyId: "policy.classroom", defaultIntensity: "STANDARD", allowedIntensities: ["CALM", "STANDARD"], maxTier: "TIER_3_MISSION_SUCCESS", allowCamera: false, allowHaptics: false, allowFlashing: false, requireCaptions: true },
  { policyId: "policy.metaverse", defaultIntensity: "ENERGETIC", allowedIntensities: ["CALM", "STANDARD", "ENERGETIC", "CINEMATIC"], maxTier: "TIER_5_INSTITUTIONAL_WORLD_EVENT", allowCamera: true, allowHaptics: true, allowFlashing: true, requireCaptions: false },
];
const registry = buildSensoryRegistry({
  sounds: SOUNDS, celebrations: CELEBRATIONS, presentationPolicies: POLICIES,
  soundProfiles: [{ profileId: "sound-profile.reference", soundIds: ["ui.click", "celebration.chime"] }],
  celebrationProfiles: [{ profileId: "celebration-profile.reference", celebrationIds: ["celebration.mission-success"] }],
  environmentAudioProfiles: [{ profileId: "environment.reference-plant", environmentRef: { kind: "MOL_SYSTEM", id: "power-grid" }, ambienceSoundIds: ["ambience.industrial-hum"], maxConcurrentSounds: 6, defaultVolumeClass: "QUIET", worldStateDriven: true }],
});
const NONE = Object.fromEntries(ACCESSIBILITY_SENSORY_KEYS.map((key) => [key, false]));
const event = (extra = {}) => ({
  sensoryEventId: "sensory.1", sourceEventType: "mission.runtime.succeeded", sourceAuthority: "mission-runtime", sourceRecordId: "mission_runtime_123",
  correlationId: "corr_123", presentationIntent: "CELEBRATE", celebrationTier: "TIER_3_MISSION_SUCCESS", environmentRefs: ["power-grid"],
  accessibleAlternative: "caption.mission-success", replayPolicy: "WITH_SOURCE_REPLAY", worldStateRequirement: null,
  createsTruth: false, createsEvidence: false, createsMastery: false, createsCredential: false, createsCareerReadiness: false,
  createsEmployment: false, createsMissionSuccess: false, createsWorldTruth: false, ...extra,
});
const plan = (overrides = {}, options = {}) => planSensoryPresentation(event(overrides), { registry, policyId: "policy.metaverse", accessibility: NONE, ...options });
const SENSORY_DIR = new URL("../src/shared/experience/sensory/", import.meta.url);
const sources = (dir = SENSORY_DIR, prefix = "") => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory()
  ? sources(new URL(`${entry.name}/`, dir), `${prefix}${entry.name}/`)
  : [[`${prefix}${entry.name}`, readFileSync(new URL(entry.name, dir), "utf8")]]);

test("registry: production sensory content (Phase 7: Data Center profile only) validates; the reference registry validates with no rejections", () => {
  const production = buildSensoryRegistry();
  assert.deepEqual(production.rejected, []);
  assert.ok([...SOUND_REGISTRY, ...CELEBRATION_REGISTRY, ...ENVIRONMENT_AUDIO_PROFILES, ...SENSORY_PRESENTATION_POLICIES]
    .every((item) => /^(dc\.|environment-audio\.main-data-center|policy\.data-center)/.test(item.soundId ?? item.celebrationId ?? item.profileId ?? item.policyId)), "only the Data Center profile is registered");
  assert.deepEqual(registry.rejected, []);
  assert.deepEqual([registry.sounds.length, registry.celebrations.length, registry.presentationPolicies.length], [4, 3, 2]);
});

test("1/2/3 celebrations cannot create Evidence, mastery or credentials", () => {
  const result = plan();
  assert.equal(result.status, "PRESENT");
  for (const key of ["createsTruth", "createsEvidence", "createsMastery", "createsCredential", "createsCareerReadiness", "createsEmployment", "createsMissionSuccess", "createsWorldTruth", "affectsOutcome"]) {
    assert.equal(result.plan[key], false, key);
  }
  for (const key of ["createsEvidence", "createsMastery", "createsCredential"]) {
    assert.ok(validateSensoryEvent(event({ [key]: true })).includes(`sensoryEvent.${key} must be false`), key);
  }
  for (const field of ["masteryAchieved", "evidenceId", "credentialId"]) {
    assert.ok(validateCelebration(celebration({ [field]: "x" })).some((error) => /never copy authoritative data/.test(error)), field);
  }
  for (const [name, source] of sources()) {
    assert.doesNotMatch(source, /fetch\(|localStorage|XMLHttpRequest|INSERT INTO|verified-evidence\/|credential-service|truth-spine\//, `${name} must not reach authorities`);
  }
});

test("4/5 sensory events require a recognized authoritative source; unknown sources are rejected", () => {
  assert.ok(validateSensoryEvent(event({ sourceAuthority: undefined })).includes("sourceAuthority must be a recognized authoritative source"));
  assert.ok(validateSensoryEvent(event({ sourceRecordId: "" })).some((error) => /sourceRecordId is required/.test(error)));
  for (const unknown of ["browser", "dopamine", "client-xp", "window.click"]) {
    assert.equal(plan({ sourceAuthority: unknown }).status, "REJECTED", unknown);
  }
  assert.ok(validateCelebration(celebration({ authoritySource: "dopamine" })).includes("authoritySource is not a recognized authoritative source"));
  // The learner's own input is feedback only; Arcade cannot present a Mission-success tier.
  assert.ok(validateSensoryEvent(event({ sourceAuthority: "ui-interaction", presentationIntent: "CELEBRATE", celebrationTier: null })).includes("ui-interaction may only produce FEEDBACK"));
  assert.ok(validateCelebration(celebration({ authoritySource: "arcade" })).includes("arcade cannot present TIER_3_MISSION_SUCCESS"));
  assert.equal(plan({ sourceEventType: "mission.runtime.started", celebrationTier: null }).reasons[0], "NO_REGISTERED_CELEBRATION_FOR_AUTHORITATIVE_TRIGGER");
  assert.equal(Object.keys(SENSORY_AUTHORITY_SOURCES).includes("dopamine"), false);
});

test("6 celebration tiers are bounded; the tier comes from the registry, never the caller", () => {
  assert.deepEqual([...CELEBRATION_TIERS], ["TIER_0_FEEDBACK", "TIER_1_SMALL_WIN", "TIER_2_ACTIVITY_COMPLETE", "TIER_3_MISSION_SUCCESS", "TIER_4_MAJOR_MILESTONE", "TIER_5_INSTITUTIONAL_WORLD_EVENT"]);
  assert.ok(validateCelebration(celebration({ tier: "TIER_9_EPIC" })).includes("tier is not a canonical celebration tier"));
  assert.ok(validateSensoryEvent(event({ celebrationTier: "LEGENDARY" })).includes("celebrationTier is not canonical"));
  assert.deepEqual(plan({ celebrationTier: "TIER_2_ACTIVITY_COMPLETE" }).reasons, ["TIER_MISMATCH"]);
  assert.equal(plan({ celebrationTier: null }).plan.tier, "TIER_3_MISSION_SUCCESS");
  // The existing client policy's tiers map explicitly onto the canonical vocabulary.
  assert.deepEqual(Object.keys(LEGACY_CELEBRATION_TIER_MAP).sort(), Object.values(CELEBRATION_TIER).sort());
  assert.ok(Object.values(LEGACY_CELEBRATION_TIER_MAP).every((tier) => CELEBRATION_TIERS.includes(tier)));
  assert.equal(plan({}, { policyId: "policy.classroom" }).status, "PRESENT");
  assert.deepEqual(planSensoryPresentation(event(), { registry: buildSensoryRegistry({ sounds: SOUNDS, celebrations: CELEBRATIONS, presentationPolicies: [{ ...POLICIES[0], maxTier: "TIER_1_SMALL_WIN" }] }), policyId: "policy.classroom", accessibility: NONE }).reasons, ["TIER_ABOVE_POLICY"]);
});

test("7 sound categories are bounded; sounds always carry captions and accessibility labels", () => {
  assert.deepEqual([...SOUND_CATEGORIES], ["UI", "MUSIC", "AMBIENCE", "VEHICLE", "WEATHER", "WATER", "INDUSTRIAL", "PUBLIC_SAFETY", "VOICE_PA", "CROWD", "MISSION", "CELEBRATION", "INFRASTRUCTURE"]);
  assert.ok(validateSound(sound("x", "DUBSTEP")).includes("category is not a canonical sound category"));
  assert.ok(validateSound(sound("x", "UI", { caption: "" })).includes("caption is required"));
  assert.ok(validateSound(sound("x", "VEHICLE", { spatial: true, maxDistance: null })).some((error) => /maxDistance is required/.test(error)));
  assert.ok(validateEnvironmentAudioProfile({ profileId: "env.bad", environmentRef: { kind: "MOL_SYSTEM", id: "power-grid" }, ambienceSoundIds: ["ui.click"], maxConcurrentSounds: 2, defaultVolumeClass: "QUIET", worldStateDriven: false }, { sounds: SOUNDS })
    .includes("ambience sound ui.click has non-ambient category UI"));
  const misuse = buildSensoryRegistry({ sounds: SOUNDS, celebrations: [celebration({ musicCue: "celebration.chime" })] });
  assert.ok(misuse.rejected[0].errors.some((error) => /musicCue celebration.chime must reference a registered MUSIC sound/.test(error)));
});

test("8 intensity is CALM/STANDARD/ENERGETIC/CINEMATIC only and changes presentation, never outcomes", () => {
  assert.deepEqual([...SENSORY_INTENSITIES], ["CALM", "STANDARD", "ENERGETIC", "CINEMATIC"]);
  assert.ok(Object.values(SENSORY_INTENSITY_PROFILES).every((profile) => profile.affectsOutcome === false));
  assert.ok(validatePresentationPolicy({ ...POLICIES[0], defaultIntensity: "FULL" }).some((error) => /defaultIntensity must be/.test(error)));
  const calm = plan({}, { intensity: "CALM" }).plan;
  const cinematic = plan({}, { intensity: "CINEMATIC" }).plan;
  assert.deepEqual([calm.channels.PARTICLES, calm.channels.MUSIC, calm.channels.CAMERA, calm.durationMs], [null, null, null, 1500]);
  assert.deepEqual([cinematic.channels.PARTICLES, cinematic.channels.MUSIC, cinematic.channels.CAMERA, cinematic.durationMs], ["particles.sparkle", "music.success-sting", "camera.orbit", 8000]);
  for (const key of ["sourceAuthority", "sourceRecordId", "tier", "celebrationId", "createsMissionSuccess"]) assert.equal(calm[key], cinematic[key], key);
  assert.equal(plan({}, { policyId: "policy.classroom", intensity: "CINEMATIC" }).plan.intensity, "STANDARD", "a disallowed intensity falls back to the policy default");
});

test("9/10 reduced-motion and silent variants can be declared and are honored", () => {
  const reduced = plan({}, { accessibility: { ...NONE, reducedMotion: true } }).plan;
  assert.deepEqual([reduced.variant, reduced.channels.PARTICLES, reduced.channels.CAMERA, reduced.channels.LIGHTING], ["reducedMotionVariant", null, null, "lighting.soft-glow"]);
  assert.ok(validateCelebration(celebration({ reducedMotionVariant: { ...variants.reducedMotionVariant, particleEffect: "particles.sparkle" } })).includes("reducedMotionVariant cannot use particles or camera motion"));
  const silent = plan({}, { accessibility: { ...NONE, noAudio: true } }).plan;
  assert.deepEqual([silent.variant, silent.channels.AUDIO, silent.channels.MUSIC, silent.captionKey], ["silentVariant", null, null, "caption.mission-success"]);
  assert.ok(validateCelebration(celebration({ silentVariant: { ...variants.silentVariant, soundCue: "celebration.chime" } })).includes("silentVariant cannot play sound or music"));
  assert.ok(validateCelebration(celebration({ silentVariant: null })).includes("silentVariant is required for TIER_3_MISSION_SUCCESS"));
  // Combined needs never reintroduce a removed channel.
  const both = plan({}, { accessibility: { ...NONE, noAudio: true, reducedSensory: true, hapticsOff: true } }).plan;
  assert.deepEqual([both.channels.PARTICLES, both.channels.HAPTICS, both.channels.AUDIO], [null, null, null]);
});

test("11 sensory profiles and events reference authoritative data without copying it", () => {
  for (const field of ["payload", "score", "userId", "learnerId", "result"]) {
    assert.ok(validateSensoryEvent(event({ [field]: "copied" })).some((error) => new RegExp(`${field}: sensory contracts reference events`).test(error)), field);
  }
  assert.ok(buildSensoryRegistry({ sounds: SOUNDS, soundProfiles: [{ profileId: "p", soundIds: ["ui.click"], score: 9 }] }).rejected.length === 1);
  assert.deepEqual(resolveSensoryReference(registry, "CELEBRATION_PROFILE", "celebration-profile.reference"), { kind: "CELEBRATION_PROFILE", id: "celebration-profile.reference", resolved: true });
  assert.deepEqual(resolveSensoryReference(registry, "SOUND_PROFILE", "missing"), { kind: "SOUND_PROFILE", id: "missing", resolved: false });
  const output = plan().plan;
  assert.deepEqual(Object.keys(output.channels), [...PRESENTATION_CHANNELS]);
  for (const key of ["payload", "score", "maxScore", "masteryAchieved", "passed", "evidence", "credential", "userId", "user_id", "learnerId", "result"]) assert.equal(key in output, false, key);
  assert.doesNotMatch(JSON.stringify(output), /"score"|"payload"|learner|user_?id/i);
});

test("13 the Sensory Director owns presentation only and arbitrates conflicting effects", () => {
  assert.equal(EXPERIENCE_SENSORY_DIRECTOR_CONTRACT.ownsPresentationOnly, true);
  assert.equal(EXPERIENCE_SENSORY_DIRECTOR_CONTRACT.ownsDomainTruth, false);
  assert.deepEqual(EXPERIENCE_SENSORY_DIRECTOR_CONTRACT.writes, []);
  assert.ok(["mastery", "evidence", "credentials", "mission success", "world truth"].every((item) => EXPERIENCE_SENSORY_DIRECTOR_CONTRACT.mayNotControl.includes(item)));
  const mission = plan().plan;
  const duplicate = plan({ sensoryEventId: "sensory.dup" }).plan;
  const arcade = plan({ sourceAuthority: "arcade", sourceEventType: "arcade.mastered", sourceRecordId: "arcade_result_1", celebrationTier: null }).plan;
  const arbitration = arbitrateSensoryPlans([arcade, mission, duplicate]);
  assert.equal(arbitration.foreground.dedupeKey, mission.dedupeKey, "the highest tier plays in the foreground");
  assert.deepEqual(arbitration.background.map((item) => item.tier), ["TIER_1_SMALL_WIN"], "duplicates of one authoritative event collapse");
  assert.deepEqual(plan({}, { policyId: "policy.unknown" }).reasons, ["PRESENTATION_POLICY_NOT_REGISTERED"]);
});

test("14 no world truth is invented: world state is a requirement to check, never a write", () => {
  const required = plan({ worldStateRequirement: { molSystemId: "power-grid", stateKey: "power.restored" } }).plan;
  assert.deepEqual([required.worldStateRequirement, required.worldStateWrites, required.createsWorldTruth], [{ molSystemId: "power-grid", stateKey: "power.restored" }, [], false]);
  assert.ok(validateSensoryEvent(event({ worldState: { power: "restored" } })).some((error) => /worldState: sensory contracts reference events/.test(error)));
  assert.ok(validateSensoryEvent(event({ worldStateRequirement: { molSystemId: "power-grid", stateKey: "x", setTo: "on" } })).some((error) => /worldStateRequirement must be null/.test(error)));
  assert.equal(plan({ environmentRefs: ["zone.hospital-icu"] }).plan.environmentRestricted, true);
  for (const [name, source] of sources()) assert.doesNotMatch(source, /metaverse\/mol|publishMolEvent|applyWorld|setWorldState/, `${name} must not touch MOL state`);
});

test("15 accessibility: presentation booleans only; no learner accommodation detail is exposed", () => {
  const profile = accessibilitySensoryProfileFromPreferences({
    sensory: { motionPreference: "REDUCED", celebrationIntensity: "OFF", captions: true, diagnosis: "private clinical detail" },
    accommodation: { type: "EXTENDED_ASSESSMENT_TIME", multiplier: 1.5 },
  });
  assert.deepEqual(Object.keys(profile).sort(), [...ACCESSIBILITY_SENSORY_KEYS].sort());
  assert.ok(Object.values(profile).every((value) => typeof value === "boolean"));
  assert.deepEqual([profile.reducedMotion, profile.reducedSensory, profile.noAudio, profile.captions], [true, true, true, true]);
  assert.ok(validateAccessibilitySensoryProfile({ ...NONE, diagnosis: "x" }).includes("accessibilitySensoryProfile.diagnosis: sensory contracts reference events; they never copy authoritative data"));
  assert.ok(validateAccessibilitySensoryProfile({ ...NONE, accommodationType: "x" }).some((error) => /accommodationType/.test(error)));
  const output = JSON.stringify(plan({}, { accessibility: profile }));
  assert.doesNotMatch(output, /diagnosis|accommodation|EXTENDED_ASSESSMENT_TIME|multiplier/);
  assert.equal(accessibilitySensoryProfileFromPreferences({}, { systemReducedMotion: true }).reducedMotion, true);
});

test("existing client celebration policy is untouched by the contract foundation", () => {
  const changed = execFileSync("git", ["diff", "--name-only", "HEAD", "--", "src/experience/celebrations", "src/context", "src/shared/sfx", "src/shared/dopamine"], { cwd: new URL("..", import.meta.url), encoding: "utf8" }).trim();
  assert.equal(changed, "");
});

// ---------------------------------------------------------------- arbitration: alerts outrank celebrations

const ALERT_SOUNDS = [...SOUNDS, sound("alarm.evacuation", "PUBLIC_SAFETY", { priority: 100, volumeClass: "LOUD" }), sound("voice.pa-warning", "VOICE_PA")];
const plain = (celebrationId, triggerEvent, authoritySource, tier, cues = {}) => ({
  celebrationId, triggerEvent, authoritySource, tier, soundCue: null, musicCue: null, particleEffect: null, lightingEffect: null, cameraBehavior: null,
  npcReaction: null, signageBehavior: null, hapticPattern: null, durationMs: 4000, repeatPolicy: "EVERY_OCCURRENCE", cooldownMs: 0,
  reducedMotionVariant: null, reducedSensoryVariant: null, silentVariant: null, environmentRestrictions: [], ...cues,
});
const arbitrationRegistry = buildSensoryRegistry({
  sounds: ALERT_SOUNDS, presentationPolicies: POLICIES,
  celebrations: [
    ...CELEBRATIONS,
    // Alert presentations: tier 0 because an alert carries no celebration significance.
    plain("alert.evacuation", "mol.incident.evacuation-ordered", "mol", "TIER_0_FEEDBACK", { soundCue: "alarm.evacuation", signageBehavior: "signage.evacuate", hapticPattern: "haptic.alarm", npcReaction: "npc.evacuate" }),
    plain("alert.power-warning", "mission.runtime.hazard-detected", "mission-runtime", "TIER_0_FEEDBACK", { soundCue: "voice.pa-warning", signageBehavior: "signage.hazard", lightingEffect: "lighting.amber-beacon" }),
    plain("ambient.plant-hum", "mol.environment.shift-changed", "mol", "TIER_0_FEEDBACK", { soundCue: "ambience.industrial-hum" }),
    celebration({ celebrationId: "celebration.city-festival", triggerEvent: "mol.city.milestone-reached", authoritySource: "mol", tier: "TIER_5_INSTITUTIONAL_WORLD_EVENT", durationMs: 12000 }),
    celebration({ celebrationId: "ceremony.program-graduation", triggerEvent: "curriculum.program.graduated", authoritySource: "curriculum", tier: "TIER_4_MAJOR_MILESTONE" }),
  ],
});
const present = (overrides, options = {}) => {
  const result = planSensoryPresentation(event({ celebrationTier: null, ...overrides }), { registry: arbitrationRegistry, policyId: "policy.metaverse", accessibility: NONE, ...options });
  assert.equal(result.status, "PRESENT", JSON.stringify(result.reasons));
  return result.plan;
};
const evacuation = (extra = {}, options) => present({ sourceAuthority: "mol", sourceEventType: "mol.incident.evacuation-ordered", sourceRecordId: "incident_42", presentationIntent: "ALERT", alertSeverity: "CRITICAL", ...extra }, options);
const hazard = (extra = {}) => present({ sourceAuthority: "mission-runtime", sourceEventType: "mission.runtime.hazard-detected", sourceRecordId: "hazard_7", presentationIntent: "ALERT", alertSeverity: "WARNING", ...extra });
const festival = (extra = {}) => present({ sourceAuthority: "mol", sourceEventType: "mol.city.milestone-reached", sourceRecordId: "milestone_1", presentationIntent: "CELEBRATE", ...extra });
const graduation = () => present({ sourceAuthority: "curriculum", sourceEventType: "curriculum.program.graduated", sourceRecordId: "program_9", presentationIntent: "CEREMONY" });
const missionWin = (extra = {}, options) => present({ presentationIntent: "CELEBRATE", ...extra }, options);
const feedback = () => present({ sourceAuthority: "ui-interaction", sourceEventType: "ui.button.pressed", sourceRecordId: "button_1", presentationIntent: "FEEDBACK" });
const ambient = () => present({ sourceAuthority: "mol", sourceEventType: "mol.environment.shift-changed", sourceRecordId: "shift_3", presentationIntent: "AMBIENT" });
const role = (result, plan) => result.assignments.find((item) => item.dedupeKey === plan.dedupeKey);

test("A0 priority is a bounded vocabulary derived from intent; intent survives into the plan", () => {
  assert.deepEqual([...PRESENTATION_PRIORITIES], ["CRITICAL_ALERT", "ALERT", "OPERATIONAL", "CEREMONY", "CELEBRATION", "FEEDBACK", "AMBIENT"]);
  assert.deepEqual([...ALERT_PRIORITIES], ["CRITICAL_ALERT", "ALERT", "OPERATIONAL"]);
  assert.deepEqual([evacuation().presentationPriority, hazard().presentationPriority, festival().presentationPriority, graduation().presentationPriority, feedback().presentationPriority, ambient().presentationPriority],
    ["CRITICAL_ALERT", "ALERT", "CELEBRATION", "CEREMONY", "FEEDBACK", "AMBIENT"]);
  assert.deepEqual([evacuation().presentationIntent, evacuation().alertSeverity, festival().alertSeverity], ["ALERT", "CRITICAL", null]);
  // No client numbers; severity is bounded and ceilinged by authority.
  assert.ok(validateSensoryEvent(event({ presentationIntent: "ALERT", alertSeverity: 99 })).includes("ALERT requires alertSeverity CRITICAL, WARNING or OPERATIONAL"));
  assert.ok(validateSensoryEvent(event({ presentationIntent: "ALERT" })).includes("ALERT requires alertSeverity CRITICAL, WARNING or OPERATIONAL"));
  assert.ok(validateSensoryEvent(event({ sourceAuthority: "arcade", presentationIntent: "ALERT", alertSeverity: "CRITICAL", celebrationTier: null })).includes("arcade cannot raise CRITICAL alerts"));
  assert.ok(validateSensoryEvent(event({ sourceAuthority: "ui-interaction", presentationIntent: "ALERT", alertSeverity: "OPERATIONAL", celebrationTier: null })).includes("ui-interaction cannot raise alerts"));
  assert.ok(validateSensoryEvent(event({ alertSeverity: "CRITICAL" })).includes("alertSeverity is only valid with ALERT"));
  // A celebration-tier policy cap never suppresses an alert.
  const capped = planSensoryPresentation(event({ sourceAuthority: "mol", sourceEventType: "mol.incident.evacuation-ordered", sourceRecordId: "incident_42", presentationIntent: "ALERT", alertSeverity: "CRITICAL", celebrationTier: null }),
    { registry: buildSensoryRegistry({ sounds: ALERT_SOUNDS, celebrations: arbitrationRegistry.celebrations, presentationPolicies: [{ ...POLICIES[1], maxTier: "TIER_0_FEEDBACK" }] }), policyId: "policy.metaverse", accessibility: NONE });
  assert.equal(capped.status, "PRESENT");
});

test("A1 ALERT + TIER_5 celebration: the alert keeps foreground and interruptive priority", () => {
  const alert = evacuation();
  const world = festival();
  const result = arbitrateSensoryPlans([world, alert]);
  assert.equal(result.foreground.dedupeKey, alert.dedupeKey);
  assert.deepEqual(role(result, alert).channels, { AUDIO: "alarm.evacuation", MUSIC: null, PARTICLES: null, LIGHTING: null, CAMERA: null, HAPTICS: "haptic.alarm", NPC: "npc.evacuate", SIGNAGE: "signage.evacuate", CEREMONY: null });
  const celebrationRole = role(result, world);
  assert.equal(celebrationRole.role, "SUBDUED", "a non-conflicting subtle channel may remain");
  assert.deepEqual(Object.entries(celebrationRole.channels).filter(([, cue]) => cue).map(([channel]) => channel), ["LIGHTING"]);
  assert.ok(SUBTLE_CHANNELS.includes("LIGHTING"));
});

test("A2 ALERT + CEREMONY: the alert wins operational priority", () => {
  const alert = hazard();
  const ceremony = graduation();
  const result = arbitrateSensoryPlans([ceremony, alert]);
  assert.equal(result.foreground.dedupeKey, alert.dedupeKey);
  assert.deepEqual([role(result, alert).channels.AUDIO, role(result, alert).channels.SIGNAGE, role(result, alert).channels.LIGHTING], ["voice.pa-warning", "signage.hazard", "lighting.amber-beacon"]);
  // The alert owns LIGHTING, so the ceremony has no free subtle channel and is deferred (captions only).
  assert.equal(role(result, ceremony).role, "DEFERRED");
  assert.ok(Object.values(role(result, ceremony).channels).every((cue) => cue === null));
  assert.equal(role(result, ceremony).captionKey !== undefined, true);
});

test("A3 ALERT + ordinary CELEBRATE: the alert is never reduced to caption-only", () => {
  const alert = hazard();
  const win = missionWin();
  for (const input of [[alert, win], [win, alert]]) {
    const result = arbitrateSensoryPlans(input);
    const alertRole = role(result, alert);
    assert.equal(alertRole.role, "FOREGROUND");
    assert.ok(alertRole.channels.AUDIO && alertRole.channels.SIGNAGE, "alert keeps its interruptive channels");
    assert.equal(role(result, win).channels.AUDIO, null);
    assert.equal(role(result, win).channels.MUSIC, null);
  }
});

test("A4 two celebrations: the higher valid celebration tier wins as designed", () => {
  const win = missionWin();
  const world = festival();
  const result = arbitrateSensoryPlans([win, world]);
  assert.equal(result.foreground.dedupeKey, world.dedupeKey);
  assert.deepEqual(result.background.map((item) => [item.dedupeKey, item.role]), [[win.dedupeKey, "BACKGROUND"]]);
  assert.ok(Object.values(role(result, win).channels).every((cue) => cue === null));
});

test("A5 duplicate plans for the same authoritative event still collapse", () => {
  const alert = evacuation();
  const duplicateFromAnotherConsumer = evacuation({ sensoryEventId: "sensory.dup", correlationId: "corr_dup" });
  const result = arbitrateSensoryPlans([alert, duplicateFromAnotherConsumer, missionWin(), missionWin({ sensoryEventId: "sensory.dup2" })]);
  assert.equal(result.assignments.length, 2);
  assert.equal(result.assignments.filter((item) => item.dedupeKey === alert.dedupeKey).length, 1);
});

test("A6/A7 FEEDBACK and AMBIENT cannot preempt an ALERT", () => {
  const alert = evacuation();
  for (const other of [feedback(), ambient()]) {
    const result = arbitrateSensoryPlans([other, alert]);
    assert.equal(result.foreground.dedupeKey, alert.dedupeKey);
    assert.equal(role(result, alert).channels.AUDIO, "alarm.evacuation");
    assert.equal(role(result, other).channels.AUDIO, null);
    assert.equal(role(result, other).role, "DEFERRED");
  }
});

test("A8 accessibility constraints still apply after arbitration", () => {
  const silentAlert = evacuation({}, { accessibility: { ...NONE, noAudio: true, hapticsOff: true } });
  const result = arbitrateSensoryPlans([silentAlert, festival()]);
  const alertRole = role(result, silentAlert);
  assert.deepEqual([alertRole.channels.AUDIO, alertRole.channels.HAPTICS, alertRole.channels.SIGNAGE], [null, null, "signage.evacuate"], "arbitration never re-adds removed channels");
  assert.equal(alertRole.visualAlert, true, "an alert that cannot be heard is shown visually");
  assert.equal(silentAlert.variant, "constrainedStandard", "the plan reports the variant actually applied");
  assert.ok(alertRole.captionKey, "alerts are always captioned");
  const calm = arbitrateSensoryPlans([missionWin({}, { accessibility: { ...NONE, reducedMotion: true } })]);
  assert.deepEqual([calm.assignments[0].channels.PARTICLES, calm.assignments[0].channels.CAMERA], [null, null]);
});

test("A9 arbitration creates no authority and does not mutate plans", () => {
  const alert = evacuation();
  const world = festival();
  const before = JSON.stringify([alert, world]);
  const result = arbitrateSensoryPlans([alert, world]);
  assert.equal(JSON.stringify([alert, world]), before);
  for (const plan of [alert, world]) for (const key of ["createsTruth", "createsEvidence", "createsMastery", "createsCredential", "createsWorldTruth", "affectsOutcome"]) assert.equal(plan[key], false);
  assert.doesNotMatch(JSON.stringify(result.assignments), /"creates[A-Za-z]+":true|worldStateWrites":\[[^\]]/);
  assert.deepEqual(EXPERIENCE_SENSORY_DIRECTOR_CONTRACT.writes, []);
});
