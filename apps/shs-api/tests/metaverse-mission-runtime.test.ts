// MET-7 — City Mission pure-logic tests. No database, no live server —
// mirrors tests/metaverse-runtime.test.ts's convention of exercising the
// mission builder/resolver/event-adapter directly with fabricated
// canonical inputs, so these run fast and deterministically in CI.
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolveMissionLocation } from "../src/domain/metaverse/missions/mission-location-resolver";
import { buildCityMission, deriveMissionProjectionId } from "../src/domain/metaverse/missions/mission-authority-adapter";
import { MISSION_OPERATIONAL_EVENTS, emitMetaverseMissionEvent, METAVERSE_OPERATIONAL_EVENT_BOUNDARY } from "../src/domain/metaverse/missions/mission-event-adapter";
import { describeMissionEvidenceExpectation, describeArcadePracticeEvidenceExpectation } from "../src/domain/metaverse/missions/mission-evidence-adapter";
import { resetOperationalTelemetryForTests, setOperationalTelemetrySink } from "../src/observability/operational-telemetry";
import { PORTFOLIO_SOURCE_TYPES } from "../src/domain/portfolio/model/portfolio-contract";
import { ASSIGNMENT_TARGET_TYPES } from "../src/domain/assignments/model/assignment";
import type { Assignment } from "../src/domain/assignments/model/assignment";
import type { ResolvedAssignmentWork } from "../src/domain/assignments/service/assignment-entitlement-service";
import type { RequirementResult } from "../src/domain/completion-policy/model/completion-policy";

function assignment(overrides: Partial<Assignment> = {}): Assignment {
  return {
    id: "asmt_1",
    organizationId: "org-a",
    cohortId: null,
    courseId: null,
    lessonId: null,
    title: "Data Center Foundations: What Is a Data Center?",
    description: "Read the introduction and complete the practice.",
    assignmentType: "assignment",
    visibilityScope: "targeted",
    createdBy: "instructor-1",
    availableAt: null,
    dueAt: "2026-09-20T00:00:00.000Z",
    closesAt: null,
    status: "published",
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    version: 1,
    curriculumReleaseId: "release-1",
    assignedContentType: "LESSON",
    assignedContentId: "unit-one:data-center-foundations-introduction",
    completionPolicyId: null,
    ...overrides,
  };
}

function work(overrides: Partial<ResolvedAssignmentWork> = {}, assignmentOverrides: Partial<Assignment> = {}): ResolvedAssignmentWork {
  return {
    assignment: assignment(assignmentOverrides),
    studioRequirement: null,
    curriculumRelease: { releaseId: "release-1", versionNumber: 1, courseTitle: "Data Center Foundations", courseStableKey: "data-center-foundations" },
    assignedContent: { type: "LESSON", title: "What Is a Data Center?" },
    scopeLessons: [{ unitStableKey: "unit-one", lessonStableKey: "data-center-foundations-introduction", title: "What Is a Data Center?", sequence: 1, completed: false }],
    completedCount: 0,
    totalCount: 1,
    nextLesson: { unitStableKey: "unit-one", lessonStableKey: "data-center-foundations-introduction", title: "What Is a Data Center?", sequence: 1, completed: false },
    accessState: "AVAILABLE",
    ...overrides,
  };
}

function requirement(overrides: Partial<RequirementResult> = {}): RequirementResult {
  return {
    requirementId: "req-1",
    type: "ARCADE",
    required: true,
    status: "UNSATISFIED",
    satisfied: false,
    authoritativeSource: "arcade_results",
    sourceRecordId: null,
    evaluatedAt: "2026-09-15T00:00:00.000Z",
    reason: "No mastered Arcade result exists for activity arcade_1.",
    ...overrides,
  };
}

test("MET-7 location resolver maps data-center curriculum to the Data Center District and matches the canonical registry activity", () => {
  const location = resolveMissionLocation({
    courseStableKey: "data-center-foundations",
    courseTitle: "Data Center Foundations",
    unitStableKey: "unit-one",
    lessonStableKey: "data-center-foundations-introduction",
    lessonTitle: "What Is a Data Center?",
    assignmentType: "assignment",
  });
  assert.equal(location.districtId, "data-center-district");
  assert.equal(location.facilityId, "data-center-training-lab");
  assert.equal(location.metaverseActivityId, "data-center-foundations-introduction");
});

test("MET-7 location resolver never invents a mapping — unrecognized content falls back to the generic Learning Center, never a fabricated district", () => {
  const location = resolveMissionLocation({
    courseStableKey: "some-unrelated-course",
    courseTitle: "Totally Unrelated Course",
    unitStableKey: null,
    lessonStableKey: null,
    lessonTitle: null,
    assignmentType: "assignment",
  });
  assert.equal(location.districtId, "career-education-district");
  assert.equal(location.facilityId, "learning-center");
  assert.equal(location.metaverseActivityId, null);
  assert.equal(location.matchedRule, "fallback:learning-center");
});

test("MET-7 mission projection id is deterministic and organization/user/assignment-scoped — no client input, no storage", () => {
  const a = deriveMissionProjectionId("org-a", "student-1", "asmt_1");
  const b = deriveMissionProjectionId("org-a", "student-1", "asmt_1");
  const differentStudent = deriveMissionProjectionId("org-a", "student-2", "asmt_1");
  const differentOrg = deriveMissionProjectionId("org-b", "student-1", "asmt_1");
  assert.equal(a, b);
  assert.notEqual(a, differentStudent);
  assert.notEqual(a, differentOrg);
  assert.match(a, /^miss_[0-9a-f]{32}$/);
});

test("MET-7 an unsatisfied required ARCADE prerequisite blocks the mission's next action with the real requirement reason", () => {
  const mission = buildCityMission({
    work: work(),
    organizationId: "org-a",
    studentId: "student-1",
    requirements: [requirement()],
    arcadeCandidates: [{ arcadeActivityId: "arcade_1", title: "Cabling Basics", lessonId: "data-center-foundations-introduction", requiredByPolicy: true, masteryAchieved: false }],
    studio: null,
    careerContext: null,
    now: new Date("2026-09-15T00:00:00.000Z"),
  });
  assert.equal(mission.nextAction.kind, "PLAY_ARCADE_CHALLENGE");
  assert.equal(mission.nextAction.blockingRequirementType, "ARCADE");
  assert.equal(mission.arcadeRelations[0].requiredOrRecommended, "REQUIRED");
  assert.equal(mission.arcadeRelations[0].masteryAchieved, false);
  // Missing prerequisite must never be silently promoted to a locked
  // mission that doesn't exist in canonical assignment access-state —
  // the real DerivedAccessState (AVAILABLE) is preserved honestly.
  assert.equal(mission.missionStatus, "AVAILABLE");
});

test("MET-7 a satisfied prerequisite clears the blocking next action and surfaces real mastery on the Arcade relation", () => {
  const mission = buildCityMission({
    work: work(),
    organizationId: "org-a",
    studentId: "student-1",
    requirements: [requirement({ status: "SATISFIED", satisfied: true, reason: "Learner has a canonical mastered Arcade result." })],
    arcadeCandidates: [{ arcadeActivityId: "arcade_1", title: "Cabling Basics", lessonId: "data-center-foundations-introduction", requiredByPolicy: true, masteryAchieved: true }],
    studio: null,
    careerContext: null,
    now: new Date("2026-09-15T00:00:00.000Z"),
  });
  assert.notEqual(mission.nextAction.blockingRequirementType, "ARCADE");
  assert.equal(mission.nextAction.kind, "CONTINUE_LESSON");
  assert.equal(mission.arcadeRelations[0].masteryAchieved, true);
});

test("MET-7 LOCKED assignment access-state produces a LOCKED mission with no actionable next step, regardless of prerequisites", () => {
  const mission = buildCityMission({
    work: work({ accessState: "LOCKED" }, { availableAt: "2026-10-01T00:00:00.000Z" }),
    organizationId: "org-a",
    studentId: "student-1",
    requirements: [],
    arcadeCandidates: [],
    studio: null,
    careerContext: null,
    now: new Date("2026-09-15T00:00:00.000Z"),
  });
  assert.equal(mission.missionStatus, "LOCKED");
  assert.equal(mission.nextAction.kind, "NONE");
});

test("MET-7 a completed assignment access-state maps to COMPLETED_SOURCE_PENDING_VERIFICATION, never a fabricated verified/credential state", () => {
  const mission = buildCityMission({
    work: work({ accessState: "COMPLETED", completedCount: 1 }),
    organizationId: "org-a",
    studentId: "student-1",
    requirements: [],
    arcadeCandidates: [],
    studio: null,
    careerContext: null,
    now: new Date("2026-09-15T00:00:00.000Z"),
  });
  assert.equal(mission.missionStatus, "COMPLETED_SOURCE_PENDING_VERIFICATION");
  assert.equal(mission.evidenceExpectations.isVerifiedEvidence, false);
});

test("MET-7 a Studio-reviewed artifact assignment reflects Studio's own canonical review/delivery status honestly", () => {
  const artifactWork = work({}, { assignmentType: "artifact", assignedContentType: null, assignedContentId: null, curriculumReleaseId: null });
  const submitted = buildCityMission({
    work: { ...artifactWork, curriculumRelease: null, assignedContent: null, scopeLessons: [], nextLesson: null, totalCount: 0 },
    organizationId: "org-a",
    studentId: "student-1",
    requirements: [],
    arcadeCandidates: [],
    studio: { hasProject: true, studioStatus: "READY_FOR_REVIEW", reviewStatus: "PENDING", deliveryStatus: "NOT_READY" },
    careerContext: null,
    now: new Date("2026-09-15T00:00:00.000Z"),
  });
  assert.equal(submitted.missionStatus, "SUBMITTED");
  assert.equal(submitted.nextAction.kind, "AWAIT_INSTRUCTOR_REVIEW");

  const delivered = buildCityMission({
    work: { ...artifactWork, curriculumRelease: null, assignedContent: null, scopeLessons: [], nextLesson: null, totalCount: 0 },
    organizationId: "org-a",
    studentId: "student-1",
    requirements: [],
    arcadeCandidates: [],
    studio: { hasProject: true, studioStatus: "DELIVERED", reviewStatus: "APPROVED", deliveryStatus: "DELIVERED" },
    careerContext: null,
    now: new Date("2026-09-15T00:00:00.000Z"),
  });
  assert.equal(delivered.missionStatus, "COMPLETED_VERIFIED_SOURCE");
});

test("MET-7 evidence expectations never claim verified evidence — isVerifiedEvidence is always false from this domain", () => {
  const lessonExpectation = describeMissionEvidenceExpectation({ assignmentType: "assignment", assignedContentType: "LESSON", hasStudioProject: false });
  const artifactExpectation = describeMissionEvidenceExpectation({ assignmentType: "artifact", assignedContentType: null, hasStudioProject: true });
  const arcadeExpectation = describeArcadePracticeEvidenceExpectation();
  assert.equal(lessonExpectation.isVerifiedEvidence, false);
  assert.equal(artifactExpectation.isVerifiedEvidence, false);
  assert.equal(arcadeExpectation.isVerifiedEvidence, false);
  assert.equal(lessonExpectation.possibleSourceType, "LESSON_COMPLETION");
  assert.equal(artifactExpectation.possibleSourceType, "STUDIO_DELIVERY");
  assert.equal(arcadeExpectation.possibleSourceType, "ARCADE_RESULT");
});

test("MET-7 mission operational events never assert verified mastery, an outcome, a credential, or employment eligibility", () => {
  assert.deepEqual(METAVERSE_OPERATIONAL_EVENT_BOUNDARY, {
    createsVerifiedMastery: false,
    createsOutcome: false,
    createsCredential: false,
    createsEmploymentEligibility: false,
    createsCivicAuthority: false,
  });
  resetOperationalTelemetryForTests();
  const seen: string[] = [];
  setOperationalTelemetrySink((event) => seen.push(event.event_name));
  for (const name of MISSION_OPERATIONAL_EVENTS) {
    emitMetaverseMissionEvent(name, { missionProjectionId: "miss_x", assignmentId: "asmt_1", missionStatus: "AVAILABLE" });
  }
  assert.deepEqual(seen, [...MISSION_OPERATIONAL_EVENTS]);
  resetOperationalTelemetryForTests();
});

test("MET-7 portfolio integration boundary: the canonical portfolio domain still only accepts STUDIO_EVIDENCE — missions never add a second source type", () => {
  assert.deepEqual(PORTFOLIO_SOURCE_TYPES, ["STUDIO_EVIDENCE"]);
});

test("MET-7 team assignment authority gap is explicit: no TEAM-distinct assignment target type exists beyond COHORT — this repo has no canonical team-assignment authority to reuse (documented UNRESOLVED, not fabricated)", () => {
  assert.deepEqual([...ASSIGNMENT_TARGET_TYPES].sort(), ["COHORT", "LEARNER", "ORGANIZATION", "PROGRAM"].sort());
});

test("MET-7 real Arcade mastery never flips evidenceExpectations.isVerifiedEvidence — mastery and verification are different authorities even when mastery is true", () => {
  const masteredMission = buildCityMission({
    work: work(),
    organizationId: "org-a",
    studentId: "student-1",
    requirements: [requirement({ status: "SATISFIED", satisfied: true })],
    arcadeCandidates: [{ arcadeActivityId: "arcade_1", title: "Cabling Basics", lessonId: "data-center-foundations-introduction", requiredByPolicy: true, masteryAchieved: true }],
    studio: null,
    careerContext: null,
    now: new Date("2026-09-15T00:00:00.000Z"),
  });
  assert.equal(masteredMission.arcadeRelations[0].masteryAchieved, true);
  assert.equal(masteredMission.evidenceExpectations.isVerifiedEvidence, false);
});

test("MET-7 no duplicate authority: mission-projection-service.ts performs no writes into assignment/Arcade/evidence/portfolio/career tables or services — reads only", () => {
  const source = readFileSync(new URL("../src/domain/metaverse/missions/mission-projection-service.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /INSERT INTO|UPDATE\s+\w+\s+SET|DELETE FROM/i);
  assert.doesNotMatch(source, /createAssignment|updateAssignment\(/);
  assert.doesNotMatch(source, /submitResult|createActivity\(/);
  assert.doesNotMatch(source, /projectAuthoritativeFact|projectAuthoritativeOutboxEvent/);
  assert.doesNotMatch(source, /PortfolioService|portfolio-service/i);
  assert.doesNotMatch(source, /linkProgramCareer|unlinkProgramCareer/);
  // it also never rooms/presences on the learner's behalf yet — MET-6
  // reuse for mission-context rooms is a documented P1, not silently
  // fabricated here.
  assert.doesNotMatch(source, /MetaverseRoomService|MetaversePresenceService/);
});
