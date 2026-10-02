// Phase 6.5 — code-backed Sound, Celebration, profile and policy registries. Nothing is registered yet:
// no audio assets, no program sensory content. Invalid entries are rejected and reported, never repaired.
import {
  tierRank, validateCelebration, validateEnvironmentAudioProfile, validatePresentationPolicy, validateSensoryProfile, validateSound,
} from "./sensoryContracts.js";
import {
  DATA_CENTER_CELEBRATIONS, DATA_CENTER_CELEBRATION_PROFILES, DATA_CENTER_ENVIRONMENT_AUDIO_PROFILES, DATA_CENTER_PRESENTATION_POLICIES,
  DATA_CENTER_SOUNDS, DATA_CENTER_SOUND_PROFILES,
} from "./profiles/dataCenterSensoryProfile.js";
import {
  REGIONAL_WORLD_CELEBRATIONS, REGIONAL_WORLD_CELEBRATION_PROFILES, REGIONAL_WORLD_ENVIRONMENT_AUDIO_PROFILES, REGIONAL_WORLD_PRESENTATION_POLICIES,
  REGIONAL_WORLD_SOUNDS, REGIONAL_WORLD_SOUND_PROFILES,
} from "./profiles/regionalWorldSensoryProfile.js";

// Phase 7: the Data Center profile is the first registered content; Phase 9 adds the regional world profile.
// References only, no audio files.
export const SOUND_REGISTRY = Object.freeze([...DATA_CENTER_SOUNDS, ...REGIONAL_WORLD_SOUNDS]);
export const CELEBRATION_REGISTRY = Object.freeze([...DATA_CENTER_CELEBRATIONS, ...REGIONAL_WORLD_CELEBRATIONS]);
export const SOUND_PROFILES = Object.freeze([...DATA_CENTER_SOUND_PROFILES, ...REGIONAL_WORLD_SOUND_PROFILES]);
export const CELEBRATION_PROFILES = Object.freeze([...DATA_CENTER_CELEBRATION_PROFILES, ...REGIONAL_WORLD_CELEBRATION_PROFILES]);
export const ENVIRONMENT_AUDIO_PROFILES = Object.freeze([...DATA_CENTER_ENVIRONMENT_AUDIO_PROFILES, ...REGIONAL_WORLD_ENVIRONMENT_AUDIO_PROFILES]);
export const SENSORY_PRESENTATION_POLICIES = Object.freeze([...DATA_CENTER_PRESENTATION_POLICIES, ...REGIONAL_WORLD_PRESENTATION_POLICIES]);

function collect(items, idKey, validate, rejected, kind) {
  const accepted = new Map();
  for (const item of items) {
    const id = String(item?.[idKey] ?? "unknown");
    const errors = validate(item);
    if (accepted.has(id)) errors.push(`duplicate ${idKey}`);
    if (errors.length) rejected.push({ kind, id, errors });
    else accepted.set(id, Object.freeze(structuredClone(item)));
  }
  return accepted;
}

const PRODUCTION_LISTS = Object.freeze({
  sounds: SOUND_REGISTRY, celebrations: CELEBRATION_REGISTRY, soundProfiles: SOUND_PROFILES, celebrationProfiles: CELEBRATION_PROFILES,
  environmentAudioProfiles: ENVIRONMENT_AUDIO_PROFILES, presentationPolicies: SENSORY_PRESENTATION_POLICIES,
});

// No argument builds the production registry. An explicit argument builds exactly those lists (missing ones are
// empty), so injected content is never silently mixed with production content.
export function buildSensoryRegistry(lists) {
  const {
    sounds = [], celebrations = [], soundProfiles = [], celebrationProfiles = [], environmentAudioProfiles = [], presentationPolicies = [],
  } = lists ?? PRODUCTION_LISTS;
  const rejected = [];
  const soundMap = collect(sounds, "soundId", validateSound, rejected, "SOUND");
  const triggers = new Set();
  const celebrationMap = collect(celebrations, "celebrationId", (item) => {
    const errors = validateCelebration(item);
    // One registered presentation per authoritative trigger, so two systems cannot fire conflicting celebrations.
    const trigger = `${item?.authoritySource}:${item?.triggerEvent}`;
    if (triggers.has(trigger)) errors.push(`trigger ${trigger} already has a celebration`);
    triggers.add(trigger);
    const cueChecks = [["soundCue", (sound) => sound.category !== "MUSIC"], ["musicCue", (sound) => sound.category === "MUSIC"]];
    for (const variant of [item, item?.reducedMotionVariant, item?.reducedSensoryVariant, item?.silentVariant]) {
      for (const [key, ok] of cueChecks) {
        const id = variant?.[key];
        if (id == null) continue;
        const sound = soundMap.get(id);
        if (!sound || !ok(sound)) errors.push(`${key} ${id} must reference a registered ${key === "musicCue" ? "MUSIC" : "non-MUSIC"} sound`);
      }
    }
    return errors;
  }, rejected, "CELEBRATION");
  const soundIds = [...soundMap.keys()];
  const celebrationIds = [...celebrationMap.keys()];
  const soundProfileMap = collect(soundProfiles, "profileId", (item) => validateSensoryProfile(item, "SOUND", { knownIds: soundIds }), rejected, "SOUND_PROFILE");
  const celebrationProfileMap = collect(celebrationProfiles, "profileId", (item) => validateSensoryProfile(item, "CELEBRATION", { knownIds: celebrationIds }), rejected, "CELEBRATION_PROFILE");
  const environmentMap = collect(environmentAudioProfiles, "profileId", (item) => validateEnvironmentAudioProfile(item, { sounds: [...soundMap.values()] }), rejected, "ENVIRONMENT_AUDIO_PROFILE");
  const policyMap = collect(presentationPolicies, "policyId", validatePresentationPolicy, rejected, "PRESENTATION_POLICY");
  return Object.freeze({
    sounds: [...soundMap.values()],
    celebrations: [...celebrationMap.values()].sort((a, b) => tierRank(a.tier) - tierRank(b.tier)),
    soundProfiles: [...soundProfileMap.values()],
    celebrationProfiles: [...celebrationProfileMap.values()],
    environmentAudioProfiles: [...environmentMap.values()],
    presentationPolicies: [...policyMap.values()],
    rejected,
  });
}

// Reference lookup used by consumers that point at sensory profiles (e.g. ProgramPackage). It reports
// whether a reference resolves; it never copies or owns the referenced profile.
export function resolveSensoryReference(registry, kind, id) {
  if (id == null) return null;
  const lists = {
    SOUND_PROFILE: registry.soundProfiles, CELEBRATION_PROFILE: registry.celebrationProfiles,
    ENVIRONMENT_AUDIO_PROFILE: registry.environmentAudioProfiles, PRESENTATION_POLICY: registry.presentationPolicies,
  };
  const idKey = kind === "PRESENTATION_POLICY" ? "policyId" : "profileId";
  return { kind, id, resolved: Boolean(lists[kind]?.some((item) => item[idKey] === id)) };
}
