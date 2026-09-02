import assert from "node:assert/strict";
import test from "node:test";
import {
  CELEBRATION_EFFECT,
  CELEBRATION_TIER,
  achievementFromJourneyMilestone,
  createCelebrationDeduper,
  evaluateCelebration,
} from "../src/experience/celebrations/celebrationPolicy.js";

function memoryStorage() {
  const map = new Map();
  return {
    getItem: (key) => map.has(key) ? map.get(key) : null,
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
  };
}

test("verified Tier 1 lesson completion returns acknowledgement policy", () => {
  const descriptor = evaluateCelebration({
    sourceDomain: "curriculum",
    sourceRecordId: "completion_1",
    achievementType: "curriculum.lesson.completed",
    status: "synchronized",
    verified: true,
  });
  assert.equal(descriptor.tier, CELEBRATION_TIER.ACKNOWLEDGEMENT);
  assert.equal(descriptor.effect, CELEBRATION_EFFECT.ACKNOWLEDGEMENT);
});

test("verified Tier 2 project acceptance returns confetti policy", () => {
  const descriptor = evaluateCelebration({
    sourceDomain: "project",
    sourceRecordId: "project_1",
    achievementType: "project.accepted",
    status: "accepted",
    verified: true,
  });
  assert.equal(descriptor.tier, CELEBRATION_TIER.ACHIEVEMENT);
  assert.equal(descriptor.effect, CELEBRATION_EFFECT.CONFETTI);
  assert.ok(descriptor.companionReaction?.eventName);
});

test("verified Tier 3 capstone acceptance returns major milestone policy", () => {
  const descriptor = evaluateCelebration({
    sourceDomain: "project",
    sourceRecordId: "capstone_1",
    achievementType: "capstone.accepted",
    status: "accepted",
    verified: true,
  });
  assert.equal(descriptor.tier, CELEBRATION_TIER.MAJOR_MILESTONE);
  assert.equal(descriptor.effect, CELEBRATION_EFFECT.MAJOR);
  assert.ok(descriptor.companionReaction?.eventName);
});

test("verified Tier 3 credential issuance returns major milestone policy", () => {
  const descriptor = evaluateCelebration({
    sourceDomain: "credential",
    sourceRecordId: "learner_credential_1",
    achievementType: "credential.issued",
    status: "issued",
    verified: true,
  });
  assert.equal(descriptor.tier, CELEBRATION_TIER.MAJOR_MILESTONE);
  assert.equal(descriptor.effect, CELEBRATION_EFFECT.MAJOR);
  assert.ok(descriptor.companionReaction?.eventName);
});

test("credential eligibility, registration, and submission never celebrate — only issuance does", () => {
  for (const achievementType of ["credential.eligible", "credential.registered", "credential.submitted"]) {
    assert.equal(evaluateCelebration({
      sourceDomain: "credential",
      sourceRecordId: "credential_definition_1",
      achievementType,
      eventType: achievementType,
      status: "issued",
      verified: true,
    }), null, `${achievementType} must never celebrate`);
  }
});

test("expired or revoked credentials never celebrate, and duplicate issuance does not repeatedly celebrate", () => {
  assert.equal(evaluateCelebration({
    sourceDomain: "credential",
    sourceRecordId: "learner_credential_1",
    achievementType: "credential.expired",
    eventType: "credential.expired",
    status: "issued",
    verified: true,
  }), null);
  assert.equal(evaluateCelebration({
    sourceDomain: "credential",
    sourceRecordId: "learner_credential_1",
    achievementType: "credential.revoked",
    eventType: "credential.revoked",
    status: "issued",
    verified: true,
  }), null);
  // Re-evaluating the identical issuance twice produces the identical
  // celebrationKey, which is exactly what createCelebrationDeduper exists
  // to suppress on the second occurrence (proven generically above) —
  // confirming here that a credential's key is stable/idempotent, not
  // regenerated per call.
  const first = evaluateCelebration({ sourceDomain: "credential", sourceRecordId: "learner_credential_1", achievementType: "credential.issued", status: "issued", verified: true });
  const second = evaluateCelebration({ sourceDomain: "credential", sourceRecordId: "learner_credential_1", achievementType: "credential.issued", status: "issued", verified: true });
  assert.equal(first.celebrationKey, second.celebrationKey);
});

test("verified Arcade mastery returns a Tier 1 (never Tier 3) policy", () => {
  const descriptor = evaluateCelebration({
    sourceDomain: "arcade",
    sourceRecordId: "arcade_activity_1",
    achievementType: "arcade.mastered",
    status: "completed",
    verified: true,
  });
  assert.equal(descriptor.tier, CELEBRATION_TIER.ACKNOWLEDGEMENT);
  assert.notEqual(descriptor.tier, CELEBRATION_TIER.MAJOR_MILESTONE, "routine Arcade mastery must never use Tier 3 — that stays reserved for Capstone/Credential");
  assert.ok(descriptor.companionReaction?.eventName);
});

test("Arcade launch, attempt start/abandon, and a below-threshold result never celebrate — only mastery does", () => {
  for (const achievementType of ["arcade.activity_launched", "arcade.attempt_started", "arcade.attempt_abandoned", "arcade.result_below_threshold"]) {
    assert.equal(evaluateCelebration({
      sourceDomain: "arcade",
      sourceRecordId: "arcade_activity_1",
      achievementType,
      eventType: achievementType,
      status: "completed",
      verified: true,
    }), null, `${achievementType} must never celebrate`);
  }
});

test("unknown or unverified statuses return no celebration", () => {
  assert.equal(evaluateCelebration({
    sourceDomain: "project",
    sourceRecordId: "project_1",
    achievementType: "project.accepted",
    status: "submitted",
    verified: true,
  }), null);
  assert.equal(evaluateCelebration({
    sourceDomain: "project",
    sourceRecordId: "project_1",
    achievementType: "project.accepted",
    status: "accepted",
    verified: false,
  }), null);
});

test("date passage and Calendar clicks do not create celebrations", () => {
  assert.equal(evaluateCelebration({
    sourceDomain: "calendar",
    sourceRecordId: "project_1",
    achievementType: "deadline.passed",
    eventType: "deadline.passed",
    status: "completed",
    verified: true,
  }), null);
  assert.equal(evaluateCelebration({
    sourceDomain: "calendar",
    sourceRecordId: "event_1",
    achievementType: "calendar.click",
    eventType: "calendar.click",
    status: "completed",
    verified: true,
  }), null);
});

test("dedupe suppresses duplicate identity and keeps different achievements independent", () => {
  const deduper = createCelebrationDeduper(memoryStorage());
  const first = "project:project_1:project.accepted";
  const second = "project:project_2:project.accepted";
  assert.equal(deduper.has(first), false);
  deduper.mark(first);
  assert.equal(deduper.has(first), true);
  assert.equal(deduper.has(second), false);
});

test("reduced motion keeps text acknowledgement and suppresses full effects", () => {
  const descriptor = evaluateCelebration({
    sourceDomain: "project",
    sourceRecordId: "project_1",
    achievementType: "project.accepted",
    status: "accepted",
    verified: true,
  }, { reducedMotion: true });
  assert.equal(descriptor.tier, CELEBRATION_TIER.ACHIEVEMENT);
  assert.equal(descriptor.effect, CELEBRATION_EFFECT.ACKNOWLEDGEMENT);
  assert.match(descriptor.message, /Project approved/);
});

test("Journey Milestones adapt only completed canonical projection records", () => {
  assert.deepEqual(achievementFromJourneyMilestone({
    id: "project:project_1:due",
    type: "PROJECT",
    title: "Build a monitoring plan",
    status: "completed",
  }), {
    sourceDomain: "project",
    sourceRecordId: "project_1",
    achievementType: "project.accepted",
    status: "accepted",
    verified: true,
    title: "Build a monitoring plan",
  });
  assert.equal(achievementFromJourneyMilestone({
    id: "program-start:enrollment_1",
    type: "PROGRAM_START",
    title: "Started program",
    status: "completed",
  }), null);
});

test("curriculum and verified Evidence milestones map to shared presentation policy", () => {
  const lesson = achievementFromJourneyMilestone({
    id: "lesson:completion_1:completed", type: "LESSON_COMPLETED", title: "Lesson A", status: "completed",
    sourceRecordId: "completion_1",
  });
  assert.equal(lesson.achievementType, "curriculum.lesson.completed");
  assert.equal(evaluateCelebration(lesson).tier, CELEBRATION_TIER.ACKNOWLEDGEMENT);

  const unit = achievementFromJourneyMilestone({
    id: "unit:release_1:unit_a:assignment_a:completed", type: "UNIT_COMPLETED", title: "Unit A", status: "completed",
    sourceRecordId: "release_1:unit_a",
  });
  assert.equal(evaluateCelebration(unit).tier, CELEBRATION_TIER.ACHIEVEMENT);

  const course = achievementFromJourneyMilestone({
    id: "course:release_1:assignment_a:completed", type: "COURSE_COMPLETED", title: "Course A", status: "completed",
    sourceRecordId: "release_1",
  });
  assert.equal(evaluateCelebration(course).tier, CELEBRATION_TIER.MAJOR_MILESTONE);

  const evidence = achievementFromJourneyMilestone({
    id: "evidence:evidence_1:verified", type: "EVIDENCE_VERIFIED", title: "Evidence verified", status: "completed",
    sourceRecordId: "evidence_1",
  });
  assert.equal(evaluateCelebration(evidence).tier, CELEBRATION_TIER.ACHIEVEMENT);
});

test("a CREDENTIAL_EARNED milestone adapts to a Tier 3 achievement only when its own status is completed", () => {
  assert.deepEqual(achievementFromJourneyMilestone({
    id: "credential:learner_credential_1:earned",
    type: "CREDENTIAL_EARNED",
    title: "Data Center Technician Certificate",
    status: "completed",
  }), {
    sourceDomain: "credential",
    sourceRecordId: "learner_credential_1",
    achievementType: "credential.issued",
    status: "issued",
    verified: true,
    title: "Data Center Technician Certificate",
  });
  // The Journey Milestone service never emits a non-"completed" status
  // for CREDENTIAL_EARNED (see journey-milestone-service.ts), but the
  // adapter's own guard is asserted directly here regardless.
  assert.equal(achievementFromJourneyMilestone({
    id: "credential:learner_credential_1:earned",
    type: "CREDENTIAL_EARNED",
    title: "Data Center Technician Certificate",
    status: "upcoming",
  }), null);
});

test("an ARCADE_MASTERY milestone adapts to a Tier 1 achievement only when its own status is completed", () => {
  assert.deepEqual(achievementFromJourneyMilestone({
    id: "arcade:arcade_activity_1:mastery",
    type: "ARCADE_MASTERY",
    title: "Mastered Circuit Diagnostics",
    status: "completed",
  }), {
    sourceDomain: "arcade",
    sourceRecordId: "arcade_activity_1",
    achievementType: "arcade.mastered",
    status: "completed",
    verified: true,
    title: "Mastered Circuit Diagnostics",
  });
  // journey-milestone-service.ts never emits a non-"completed" ARCADE_MASTERY
  // status (mastery is inherently a completed fact), but the adapter's own
  // guard is asserted directly regardless.
  assert.equal(achievementFromJourneyMilestone({
    id: "arcade:arcade_activity_1:mastery",
    type: "ARCADE_MASTERY",
    title: "Mastered Circuit Diagnostics",
    status: "upcoming",
  }), null);
});
