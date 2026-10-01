import { test } from "node:test";
import assert from "node:assert/strict";
import { MISSION_DEFINITION_FIXTURES } from "../src/domain/mission-content/fixtures/mission-definition-fixtures.js";
import { validateMissionDefinition } from "../src/domain/mission-content/model/mission-definition.js";

const clone = <T>(value: T): T => structuredClone(value);

test("Mission Definition fixtures cover Learning, Classic, Public Safety, Healthcare, and Infrastructure", () => {
  assert.deepEqual(MISSION_DEFINITION_FIXTURES.map((mission) => mission.family), [
    "LEARNING", "CLASSIC", "PUBLIC_SAFETY", "HEALTHCARE", "INFRASTRUCTURE",
  ]);
  for (const mission of MISSION_DEFINITION_FIXTURES) assert.deepEqual(validateMissionDefinition(mission), []);
  const classic = MISSION_DEFINITION_FIXTURES.find((mission) => mission.family === "CLASSIC");
  assert.ok(classic);
  assert.equal("arcadeActivityId" in classic, false);
});

test("validator rejects duplicate objective and stage identities and invalid ordering", () => {
  const duplicateObjective = clone(MISSION_DEFINITION_FIXTURES[0]);
  duplicateObjective.objectives.push({ ...duplicateObjective.objectives[0], order: 2 });
  assert.ok(validateMissionDefinition(duplicateObjective).some((error) => error.includes("objectiveId is duplicated")));

  const duplicateStage = clone(MISSION_DEFINITION_FIXTURES[0]);
  duplicateStage.stages.push({ ...duplicateStage.stages[0], order: 2 });
  assert.ok(validateMissionDefinition(duplicateStage).some((error) => error.includes("stageId is duplicated")));

  const badOrder = clone(MISSION_DEFINITION_FIXTURES[0]);
  badOrder.stages[0].order = 4;
  assert.ok(validateMissionDefinition(badOrder).some((error) => error.includes("contiguous and one-based")));
});

test("validator rejects unknown objective/stage references, unsupported conditions, and negative time limits", () => {
  const mission = clone(MISSION_DEFINITION_FIXTURES[0]);
  mission.stages[0].objectiveIds = ["missing-objective"];
  mission.stages[0].timeLimitSeconds = -1;
  mission.successConditions = [{ type: "UNSUPPORTED" as any }];
  assert.ok(validateMissionDefinition(mission).some((error) => error.includes("unknown objective")));
  assert.ok(validateMissionDefinition(mission).some((error) => error.includes("timeLimitSeconds")));
  assert.ok(validateMissionDefinition(mission).some((error) => error.includes("unsupported condition")));

  const conditionRef = clone(MISSION_DEFINITION_FIXTURES[0]);
  conditionRef.successConditions = [{ type: "STAGE_COMPLETE", stageId: "missing-stage" }];
  assert.ok(validateMissionDefinition(conditionRef).some((error) => error.includes("unknown stage")));
});

test("validator rejects a condition declared as both success and failure", () => {
  const mission = clone(MISSION_DEFINITION_FIXTURES[0]);
  mission.failureConditions = clone(mission.successConditions);
  assert.ok(validateMissionDefinition(mission).some((error) => error.includes("both success and failure")));
});

test("validator rejects invalid taxonomy, unsafe executable content, and authority fields", () => {
  const invalid = clone(MISSION_DEFINITION_FIXTURES[0]);
  invalid.family = "ALIEN" as any;
  invalid.title = "<script>alert(1)</script>";
  (invalid as any).masteryAchieved = true;
  (invalid as any).xpReward = 10;
  const errors = validateMissionDefinition(invalid);
  assert.ok(errors.some((error) => error.includes("family is invalid")));
  assert.ok(errors.some((error) => error.includes("executable content")));
  assert.ok(errors.some((error) => error.includes("outside Mission authority")));
});

test("validator rejects unknown schema keys and unbounded nested metadata", () => {
  const unknownField = clone(MISSION_DEFINITION_FIXTURES[0]) as any;
  unknownField.objectives[0].completionRule.expression = "return true";
  assert.ok(validateMissionDefinition(unknownField).some((error) => error.includes("unsupported field")));

  const oversizedMetadata = clone(MISSION_DEFINITION_FIXTURES[0]);
  oversizedMetadata.objectives[0].metadata = Object.fromEntries(Array.from({ length: 33 }, (_, index) => [`key-${index}`, index]));
  assert.ok(validateMissionDefinition(oversizedMetadata).some((error) => error.includes("at most 32 fields")));
});

test("condition operands are closed by condition type", () => {
  const cases = [
    { type: "OBJECTIVE_COMPLETE", objectiveId: "primary-objective", seconds: 10 },
    { type: "TIME_ELAPSED", seconds: 10, objectiveId: "primary-objective" },
    { type: "EVENT_OCCURRED", eventType: "observed", stateKey: "state" },
  ];
  for (const condition of cases) {
    const mission = clone(MISSION_DEFINITION_FIXTURES[0]);
    mission.successConditions = [condition as any];
    assert.ok(validateMissionDefinition(mission).some((error) => error.includes("unsupported field")));
  }

  const objectiveCount = clone(MISSION_DEFINITION_FIXTURES[0]);
  objectiveCount.successConditions = [{ type: "OBJECTIVE_COUNT", count: 1 }];
  assert.equal(validateMissionDefinition(objectiveCount).length, 0);
});

test("Activity binding is optional, and a supplied reference remains explicit", () => {
  const unbound = clone(MISSION_DEFINITION_FIXTURES[1]);
  assert.equal(validateMissionDefinition(unbound).length, 0);

  const bound = clone(MISSION_DEFINITION_FIXTURES[0]);
  bound.arcadeActivityId = "canonical-activity-reference";
  assert.equal(validateMissionDefinition(bound).length, 0);

  const malformed = clone(MISSION_DEFINITION_FIXTURES[0]);
  malformed.arcadeActivityId = "not a stable id";
  assert.ok(validateMissionDefinition(malformed).some((error) => error.includes("arcadeActivityId")));
});

test("mission success is runtime content semantics, not mastery or evidence authority", () => {
  const mission = MISSION_DEFINITION_FIXTURES[0];
  assert.deepEqual(mission.successConditions, [{ type: "OBJECTIVE_COMPLETE", objectiveId: "primary-objective" }]);
  assert.ok(!("masteryAchieved" in mission));
  assert.ok(!("evidenceId" in mission));
  assert.ok(!("credentialId" in mission));
  assert.ok(!("reward" in mission));
});

test("AI flags are declarative permissions only and environment references are validated", () => {
  const mission = clone(MISSION_DEFINITION_FIXTURES[0]);
  assert.ok(Object.values(mission.aiCapabilities).every((flag) => flag === false));
  mission.environmentRefs = [{ system: "metaverse", environmentId: "" }];
  assert.ok(validateMissionDefinition(mission).some((error) => error.includes("environmentId is invalid")));

  mission.environmentRefs = [{ system: "metaverse", environmentId: "example", arbitraryField: "not-allowed" } as any];
  assert.ok(validateMissionDefinition(mission).some((error) => error.includes("environmentRefs[0].arbitraryField: unsupported field")));
});

test("version identity is independent of slug and publication does not mutate fixture identity", () => {
  const first = MISSION_DEFINITION_FIXTURES[0];
  const nextVersion = { ...clone(first), version: 2, status: "DRAFT" as const };
  assert.equal(nextVersion.missionId, first.missionId);
  assert.equal(nextVersion.slug, first.slug);
  assert.equal(validateMissionDefinition(nextVersion).length, 0);
});

test("Mission definitions expose no Curriculum, Career, Metaverse-map, reward, or institutional authority fields", () => {
  for (const mission of MISSION_DEFINITION_FIXTURES) {
    const serialized = JSON.stringify(mission);
    assert.doesNotMatch(serialized, /lessonId|courseId|unitId|careerReadiness|truthSpine|masteryAchieved|evidenceId|credentialId|xpReward|wallet|mapGeometry/i);
  }
});
