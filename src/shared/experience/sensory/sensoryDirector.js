// Phase 6.5 — Experience / Sensory Director contract.
//
// AUTHORITATIVE EVENT → EXPERIENCE / SENSORY DIRECTOR → PRESENTATION POLICY →
// AUDIO / MUSIC / PARTICLES / LIGHTING / CAMERA / HAPTICS / NPC / SIGNAGE / CEREMONY
//
// One coordinator so Mission Runtime, Arcade, MOL, Metaverse, UI, NPCs and a future MOCC never fire
// conflicting effects independently. The Director owns presentation only; it never owns domain truth.
// planSensoryPresentation is the deterministic reference contract: it returns a plan and runs nothing.
import {
  ALERT_PRIORITIES, PRESENTATION_CHANNELS, SENSORY_INTENSITIES, SENSORY_INTENSITY_PROFILES, SENSORY_NON_AUTHORITY,
  presentationPriorityFor, priorityRank, tierRank, validateAccessibilitySensoryProfile, validateSensoryEvent,
} from "./sensoryContracts.js";

export const EXPERIENCE_SENSORY_DIRECTOR_CONTRACT = Object.freeze({
  authority: "experience-layer",
  ownsPresentationOnly: true,
  ownsDomainTruth: false,
  inputs: Object.freeze(["SensoryEvent", "SensoryPresentationPolicy", "AccessibilitySensoryProfile", "SensoryIntensity"]),
  outputs: Object.freeze(["SensoryPresentationPlan"]),
  channels: PRESENTATION_CHANNELS,
  writes: Object.freeze([]),
  mayNotControl: Object.freeze(["mastery", "evidence", "credentials", "career readiness", "employment", "mission success", "world truth"]),
  // Future consumers of plans; none is built in Phase 6.5.
  futureConsumers: Object.freeze([
    "MOL authoritative world events", "MOCC read-only observation", "World Audio Engine", "City Mood System",
    "Dynamic Signage", "Ceremony Engine", "Environmental Storytelling",
  ]),
});

const DEFAULT_ACCESSIBILITY = Object.freeze({
  reducedMotion: false, reducedSensory: false, noAudio: false, noFlashing: false, hapticsOff: false,
  screenReaderAlternative: false, captions: false, visualSoundIndicators: false,
});

const rejected = (reasons) => Object.freeze({ status: "REJECTED", reasons, plan: null });

export function planSensoryPresentation(event, { registry, policyId, intensity = null, accessibility = DEFAULT_ACCESSIBILITY } = {}) {
  const eventErrors = validateSensoryEvent(event);
  if (eventErrors.length) return rejected(eventErrors);
  const accessErrors = validateAccessibilitySensoryProfile(accessibility);
  if (accessErrors.length) return rejected(accessErrors);
  const policy = registry?.presentationPolicies?.find((item) => item.policyId === policyId);
  if (!policy) return rejected(["PRESENTATION_POLICY_NOT_REGISTERED"]);
  // The tier comes from the registered celebration for this authoritative trigger, never from the caller.
  const celebration = registry.celebrations.find((item) => item.authoritySource === event.sourceAuthority && item.triggerEvent === event.sourceEventType);
  if (!celebration) return rejected(["NO_REGISTERED_CELEBRATION_FOR_AUTHORITATIVE_TRIGGER"]);
  if (event.celebrationTier !== null && event.celebrationTier !== celebration.tier) return rejected(["TIER_MISMATCH"]);
  const presentationPriority = presentationPriorityFor(event.presentationIntent, event.alertSeverity ?? null);
  const isAlert = ALERT_PRIORITIES.includes(presentationPriority);
  // The policy's tier cap limits celebration significance only; it can never suppress an alert.
  if (!isAlert && tierRank(celebration.tier) > tierRank(policy.maxTier)) return Object.freeze({ status: "SUPPRESSED", reasons: ["TIER_ABOVE_POLICY"], plan: null });

  const chosenIntensity = SENSORY_INTENSITIES.includes(intensity) && policy.allowedIntensities.includes(intensity) ? intensity : policy.defaultIntensity;
  const profile = SENSORY_INTENSITY_PROFILES[chosenIntensity];
  const variant = accessibility.noAudio ? "silentVariant"
    : accessibility.reducedSensory ? "reducedSensoryVariant"
      : accessibility.reducedMotion ? "reducedMotionVariant" : null;
  // An entry without the variant (allowed at TIER_0, e.g. alerts) keeps its main cues; the constraints below
  // still strip every channel the accessibility profile forbids, so nothing is lost that should remain.
  const cues = { ...(variant ? celebration[variant] ?? celebration : celebration) };
  // Constraints always apply on top of the variant, so no combination can reintroduce a removed channel.
  if (accessibility.noAudio) { cues.soundCue = null; cues.musicCue = null; }
  if (accessibility.reducedSensory) { cues.musicCue = null; cues.particleEffect = null; cues.cameraBehavior = null; cues.hapticPattern = null; }
  if (accessibility.reducedMotion || profile.particleLevel === "NONE") cues.particleEffect = null;
  if (accessibility.reducedMotion || !policy.allowCamera || !profile.cameraAllowed) cues.cameraBehavior = null;
  if (accessibility.hapticsOff || !policy.allowHaptics) cues.hapticPattern = null;
  if (!profile.musicAllowed) cues.musicCue = null;
  const hasAudio = Boolean(cues.soundCue || cues.musicCue);
  const ceremony = event.presentationIntent === "CEREMONY" && tierRank(celebration.tier) >= tierRank("TIER_4_MAJOR_MILESTONE") ? celebration.celebrationId : null;

  return Object.freeze({
    status: "PRESENT",
    reasons: [],
    plan: Object.freeze({
      // Identity of what is being presented: references only, no copied authoritative data.
      dedupeKey: `${event.sourceAuthority}:${event.sourceRecordId}:${event.sourceEventType}`,
      sourceAuthority: event.sourceAuthority, sourceEventType: event.sourceEventType, sourceRecordId: event.sourceRecordId, correlationId: event.correlationId,
      celebrationId: celebration.celebrationId, tier: celebration.tier, intensity: chosenIntensity, variant: variant ? (celebration[variant] ? variant : "constrainedStandard") : "standard",
      // Intent survives into the plan; arbitration never infers it from the celebration id or tier.
      presentationIntent: event.presentationIntent, alertSeverity: isAlert ? event.alertSeverity : null, presentationPriority,
      channels: Object.freeze({
        AUDIO: cues.soundCue ?? null, MUSIC: cues.musicCue ?? null, PARTICLES: cues.particleEffect ?? null, LIGHTING: cues.lightingEffect ?? null,
        CAMERA: cues.cameraBehavior ?? null, HAPTICS: cues.hapticPattern ?? null, NPC: cues.npcReaction ?? null, SIGNAGE: cues.signageBehavior ?? null, CEREMONY: ceremony,
      }),
      flashingAllowed: policy.allowFlashing && !accessibility.noFlashing,
      // Alerts are always captioned, and are shown visually when they cannot be heard.
      captionKey: (isAlert || policy.requireCaptions || accessibility.captions || !hasAudio) ? (cues.captionKey ?? event.accessibleAlternative) : null,
      visualSoundIndicator: hasAudio && accessibility.visualSoundIndicators,
      visualAlert: isAlert && (!hasAudio || accessibility.visualSoundIndicators),
      screenReaderText: accessibility.screenReaderAlternative ? event.accessibleAlternative : null,
      durationMs: Math.min(celebration.durationMs, profile.maxDurationMs),
      repeatPolicy: celebration.repeatPolicy, cooldownMs: celebration.cooldownMs, replayPolicy: event.replayPolicy,
      environmentRefs: [...event.environmentRefs],
      environmentRestricted: event.environmentRefs.some((ref) => celebration.environmentRestrictions.includes(ref)),
      // A requirement for an engine to check against MOL; the plan never asserts or writes world state.
      worldStateRequirement: event.worldStateRequirement ? { ...event.worldStateRequirement } : null,
      worldStateWrites: Object.freeze([]),
      affectsOutcome: false,
      ...SENSORY_NON_AUTHORITY,
    }),
  });
}

// Channels a non-alert presentation may keep while an alert is active: subtle, non-interruptive only.
export const SUBTLE_CHANNELS = Object.freeze(["LIGHTING"]);

const order = (a, b) => priorityRank(a.presentationPriority) - priorityRank(b.presentationPriority)
  || tierRank(b.tier) - tierRank(a.tier) || a.dedupeKey.localeCompare(b.dedupeKey);

// Channel-aware, deterministic arbitration (not a scheduler).
// 1. Duplicates of one authoritative event collapse to one plan (the highest-priority copy).
// 2. Alert-class plans (CRITICAL_ALERT, ALERT, OPERATIONAL) claim their channels first, in priority order.
//    Celebration tier never enters this ordering, so no celebration or ceremony can preempt an alert.
// 3. Without an active alert, the highest-priority non-alert plan plays in the foreground (ties broken by
//    celebration tier); the rest are captions only, as before.
// 4. While an alert is active, non-alert plans may keep only a free subtle channel (LIGHTING) and captions;
//    every interruptive channel is withheld from them, never taken from the alert.
// Arbitration only removes channels; it never adds one, so accessibility removals made in the plan hold.
export function arbitrateSensoryPlans(plans) {
  const unique = new Map();
  for (const plan of plans) {
    if (!plan) continue;
    const existing = unique.get(plan.dedupeKey);
    if (!existing || order(plan, existing) < 0) unique.set(plan.dedupeKey, plan);
  }
  const ordered = [...unique.values()].sort(order);
  const owned = new Map();
  const grant = (plan, allowed) => {
    const channels = {};
    for (const channel of PRESENTATION_CHANNELS) {
      const cue = plan.channels[channel];
      if (cue && allowed(channel) && !owned.has(channel)) { channels[channel] = cue; owned.set(channel, plan.dedupeKey); }
      else channels[channel] = null;
    }
    return Object.freeze(channels);
  };
  const alerts = ordered.filter((plan) => ALERT_PRIORITIES.includes(plan.presentationPriority));
  const others = ordered.filter((plan) => !ALERT_PRIORITIES.includes(plan.presentationPriority));
  const assignments = [];
  for (const plan of alerts) {
    assignments.push({ plan, role: "FOREGROUND", channels: grant(plan, () => true) });
  }
  others.forEach((plan, index) => {
    if (alerts.length) {
      const channels = index === 0 ? grant(plan, (channel) => SUBTLE_CHANNELS.includes(channel)) : grant(plan, () => false);
      const keeps = Object.values(channels).some(Boolean);
      assignments.push({ plan, role: keeps ? "SUBDUED" : "DEFERRED", channels });
    } else if (index === 0) {
      assignments.push({ plan, role: "FOREGROUND", channels: grant(plan, () => true) });
    } else {
      assignments.push({ plan, role: "BACKGROUND", channels: grant(plan, () => false) });
    }
  });
  const summary = ({ plan, role, channels }) => Object.freeze({
    dedupeKey: plan.dedupeKey, presentationIntent: plan.presentationIntent, presentationPriority: plan.presentationPriority, alertSeverity: plan.alertSeverity,
    tier: plan.tier, role, channels, captionKey: plan.captionKey, visualAlert: plan.visualAlert === true,
  });
  const foreground = assignments.find((item) => item.role === "FOREGROUND") ?? null;
  return Object.freeze({
    assignments: assignments.map(summary),
    foreground: foreground ? foreground.plan : null,
    background: assignments.filter((item) => item.role !== "FOREGROUND").map(({ plan, role }) => ({ dedupeKey: plan.dedupeKey, tier: plan.tier, role, captionKey: plan.captionKey })),
  });
}
