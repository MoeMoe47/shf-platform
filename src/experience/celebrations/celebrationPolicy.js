import { COMPANION_EVENTS } from "../../companion/companionEvents.js";

export const CELEBRATION_TIER = Object.freeze({
  ACKNOWLEDGEMENT: "ACKNOWLEDGEMENT",
  ACHIEVEMENT: "ACHIEVEMENT",
  MAJOR_MILESTONE: "MAJOR_MILESTONE",
});

export const CELEBRATION_EFFECT = Object.freeze({
  NONE: "none",
  ACKNOWLEDGEMENT: "acknowledgement",
  CONFETTI: "confetti",
  MAJOR: "major",
});

export const CELEBRATION_INTENSITY = Object.freeze({
  FULL: "FULL",
  SUBTLE: "SUBTLE",
  OFF: "OFF",
});

const VERIFIED_STATUSES = new Set(["completed", "accepted", "approved", "passed", "synchronized", "issued"]);
const NO_CELEBRATION_EVENT_TYPES = new Set([
  "calendar.click",
  "calendar.open",
  "calendar.view",
  "deadline.passed",
  "project.due",
  "capstone.due",
  // Phase 7 — a Credential's eligibility, exam registration, or evidence
  // submission is never a celebration trigger; only actual issuance is
  // (see "credential.issued" below). Expiration/revocation never
  // celebrate either — they have no policy entry at all, so
  // evaluateCelebration() already returns null for them regardless of
  // this list, but naming them here documents the invariant explicitly.
  "credential.eligible",
  "credential.registered",
  "credential.submitted",
  "credential.expired",
  "credential.revoked",
  // Phase 8 — an Arcade Attempt being started, a raw score below the
  // Activity's own threshold, or simply launching/replaying an Activity
  // is never a celebration trigger; only a stored
  // arcade_results.mastery_achieved=true row is (see "arcade.mastered"
  // below). No policy entry exists for these anyway, so
  // evaluateCelebration() already returns null — named here for the same
  // explicit-documentation reason as the Credential entries above.
  "arcade.activity_launched",
  "arcade.attempt_started",
  "arcade.attempt_abandoned",
  "arcade.result_below_threshold",
]);

const POLICY_BY_ACHIEVEMENT = Object.freeze({
  "curriculum.lesson.completed": {
    tier: CELEBRATION_TIER.ACKNOWLEDGEMENT,
    title: "Lesson completed",
    message: "Lesson completed.",
    effect: CELEBRATION_EFFECT.ACKNOWLEDGEMENT,
    companionReaction: { eventName: COMPANION_EVENTS.LESSON_COMPLETED },
  },
  "project.accepted": {
    tier: CELEBRATION_TIER.ACHIEVEMENT,
    title: "Project approved",
    message: "Project approved - great work.",
    effect: CELEBRATION_EFFECT.CONFETTI,
    companionReaction: { eventName: COMPANION_EVENTS.PORTFOLIO_COMPLETED },
  },
  "capstone.accepted": {
    tier: CELEBRATION_TIER.MAJOR_MILESTONE,
    title: "Capstone milestone completed",
    message: "Capstone milestone completed.",
    effect: CELEBRATION_EFFECT.MAJOR,
    companionReaction: { eventName: COMPANION_EVENTS.MAJOR_MILESTONE },
  },
  // Phase 7 — fires only from canonical Credential issuance
  // (learner_credentials.status = 'ISSUED'), never from eligibility, exam
  // registration, evidence submission, expiration, or revocation. See
  // achievementFromJourneyMilestone below for the one legitimate source.
  "credential.issued": {
    tier: CELEBRATION_TIER.MAJOR_MILESTONE,
    title: "Credential earned",
    message: "Credential earned.",
    effect: CELEBRATION_EFFECT.MAJOR,
    companionReaction: { eventName: COMPANION_EVENTS.MAJOR_MILESTONE },
  },
  "career-event.completed": {
    tier: CELEBRATION_TIER.ACKNOWLEDGEMENT,
    title: "Career milestone completed",
    message: "Career milestone completed.",
    effect: CELEBRATION_EFFECT.ACKNOWLEDGEMENT,
    companionReaction: null,
  },
  // Phase 8 — fires only from a stored arcade_results.mastery_achieved
  // row (server-derived from the Activity's own policy at submission
  // time — never a client-supplied "mastered" flag). Tier 1
  // (ACKNOWLEDGEMENT), matching the phase brief's own guidance that
  // routine individual-objective mastery stays below Project/Capstone/
  // Credential's ACHIEVEMENT/MAJOR_MILESTONE tiers — Tier 3 remains
  // reserved for rare institutional milestones.
  "arcade.mastered": {
    tier: CELEBRATION_TIER.ACKNOWLEDGEMENT,
    title: "Mastery achieved",
    message: "Mastery achieved.",
    effect: CELEBRATION_EFFECT.ACKNOWLEDGEMENT,
    companionReaction: { eventName: COMPANION_EVENTS.LESSON_COMPLETED },
  },
});

function clean(value) {
  return String(value || "").trim();
}

export function buildCelebrationKey({ sourceDomain, sourceRecordId, achievementType }) {
  const domain = clean(sourceDomain).toLowerCase();
  const recordId = clean(sourceRecordId);
  const type = normalizeAchievementType(achievementType);
  if (!domain || !recordId || !type) return "";
  return `${domain}:${recordId}:${type}`;
}

export function normalizeAchievementType(value) {
  return clean(value).replace(/_/g, ".").toLowerCase();
}

export function isVerifiedAchievement(achievement) {
  if (!achievement || achievement.verified !== true) return false;
  const eventType = normalizeAchievementType(achievement.eventType || achievement.achievementType);
  if (NO_CELEBRATION_EVENT_TYPES.has(eventType)) return false;
  const status = clean(achievement.status).toLowerCase();
  return VERIFIED_STATUSES.has(status);
}

export function evaluateCelebration(achievement, options = {}) {
  if (!isVerifiedAchievement(achievement)) return null;
  const achievementType = normalizeAchievementType(achievement.achievementType);
  const policy = POLICY_BY_ACHIEVEMENT[achievementType];
  if (!policy) return null;
  const celebrationKey = buildCelebrationKey({
    sourceDomain: achievement.sourceDomain,
    sourceRecordId: achievement.sourceRecordId,
    achievementType,
  });
  if (!celebrationKey) return null;
  const title = clean(achievement.title) || policy.title;
  const descriptor = {
    celebrationKey,
    tier: policy.tier,
    title,
    message: clean(achievement.message) || policy.message,
    effect: policy.effect,
    companionReaction: policy.companionReaction,
    sourceDomain: clean(achievement.sourceDomain).toLowerCase(),
    sourceRecordId: clean(achievement.sourceRecordId),
    achievementType,
  };
  return applyPresentationPreferences(descriptor, options);
}

export function applyPresentationPreferences(descriptor, { reducedMotion = false, intensity = CELEBRATION_INTENSITY.FULL } = {}) {
  if (!descriptor) return null;
  const normalizedIntensity = Object.values(CELEBRATION_INTENSITY).includes(intensity) ? intensity : CELEBRATION_INTENSITY.FULL;
  if (normalizedIntensity === CELEBRATION_INTENSITY.OFF) {
    return { ...descriptor, effect: CELEBRATION_EFFECT.NONE };
  }
  if (reducedMotion || normalizedIntensity === CELEBRATION_INTENSITY.SUBTLE) {
    return { ...descriptor, effect: CELEBRATION_EFFECT.ACKNOWLEDGEMENT };
  }
  return descriptor;
}

export function achievementFromJourneyMilestone(item) {
  if (!item || item.status !== "completed") return null;
  const id = clean(item.id);
  const type = clean(item.type).toUpperCase();
  if (type === "PROJECT") {
    return {
      sourceDomain: "project",
      sourceRecordId: projectIdFromMilestoneId(id),
      achievementType: "project.accepted",
      status: "accepted",
      verified: true,
      title: clean(item.title) || "Project approved",
    };
  }
  if (type === "CAPSTONE") {
    return {
      sourceDomain: "project",
      sourceRecordId: projectIdFromMilestoneId(id),
      achievementType: "capstone.accepted",
      status: "accepted",
      verified: true,
      title: clean(item.title) || "Capstone milestone completed",
    };
  }
  if (type === "CREDENTIAL_EARNED") {
    return {
      sourceDomain: "credential",
      sourceRecordId: credentialIdFromMilestoneId(id),
      achievementType: "credential.issued",
      status: "issued",
      verified: true,
      title: clean(item.title) || "Credential earned",
    };
  }
  if (type === "ARCADE_MASTERY") {
    return {
      sourceDomain: "arcade",
      sourceRecordId: arcadeActivityIdFromMilestoneId(id),
      achievementType: "arcade.mastered",
      status: "completed",
      verified: true,
      title: clean(item.title) || "Mastery achieved",
    };
  }
  if (type === "CAREER_EVENT") {
    return {
      sourceDomain: "career-event",
      sourceRecordId: careerEventIdFromMilestoneId(id),
      achievementType: "career-event.completed",
      status: "completed",
      verified: true,
      title: clean(item.title) || "Career milestone completed",
    };
  }
  return null;
}

function projectIdFromMilestoneId(id) {
  const match = /^project:(.+):(due|presentation)$/.exec(id);
  return match?.[1] || id;
}

function careerEventIdFromMilestoneId(id) {
  const match = /^career-event:(.+):milestone$/.exec(id);
  return match?.[1] || id;
}

function credentialIdFromMilestoneId(id) {
  const match = /^credential:(.+):earned$/.exec(id);
  return match?.[1] || id;
}

function arcadeActivityIdFromMilestoneId(id) {
  const match = /^arcade:(.+):mastery$/.exec(id);
  return match?.[1] || id;
}

export function createCelebrationDeduper(storage, { key = "shf:celebrations:shown:v1" } = {}) {
  const memory = new Set();
  function read() {
    try {
      const parsed = JSON.parse(storage?.getItem?.(key) || "[]");
      return Array.isArray(parsed) ? new Set(parsed) : new Set();
    } catch {
      return new Set(memory);
    }
  }
  function write(set) {
    memory.clear();
    for (const value of set) memory.add(value);
    try {
      storage?.setItem?.(key, JSON.stringify([...set].slice(-250)));
    } catch {}
  }
  return {
    has(celebrationKey) {
      return read().has(celebrationKey);
    },
    mark(celebrationKey) {
      if (!celebrationKey) return;
      const set = read();
      set.add(celebrationKey);
      write(set);
    },
    reset() {
      memory.clear();
      try { storage?.removeItem?.(key); } catch {}
    },
  };
}
