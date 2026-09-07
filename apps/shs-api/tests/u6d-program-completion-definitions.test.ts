import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { definitionHash, validateDefinitionInput } from "../src/domain/programs/model/program-completion-definition.ts";

test("U6D accepts a bounded all-of definition and produces a stable snapshot hash", () => {
  const definition = validateDefinitionInput({
    canonicalProgramReference: "test-program-course-series",
    version: "course-series-v1",
    completionMode: "ALL_OF",
    authorityReference: "curriculum.program-owner",
    requirements: [
      { requirementId: "lesson-one", type: "LESSON_COMPLETION", canonicalReference: "lesson-one", label: "Lesson one", metadata: { curriculumId: "course-one" } },
      { requirementId: "lesson-two", type: "LESSON_COMPLETION", canonicalReference: "lesson-two", label: "Lesson two", metadata: { curriculumId: "course-one" } },
    ],
  });
  assert.equal(definition.requirements.length, 2);
  assert.equal(definitionHash(definition).length, 64);
});

test("U6D rejects caller formulas, evaluator injection, and unsupported types", () => {
  assert.throws(() => validateDefinitionInput({ canonicalProgramReference: "program-a", version: "v1", authorityReference: "owner", formula: "a && b", requirements: [{ requirementId: "r1", type: "LESSON_COMPLETION", canonicalReference: "l1", label: "L1" }] }), /untrusted/);
  assert.throws(() => validateDefinitionInput({ canonicalProgramReference: "program-a", version: "v1", authorityReference: "owner", requirements: [{ requirementId: "r1", type: "PROJECT_COMPLETION", canonicalReference: "p1", label: "P1" }] }), /unsupported/);
  assert.throws(() => validateDefinitionInput({ canonicalProgramReference: "program-a", version: "v1", authorityReference: "owner", requirements: [{ requirementId: "r1", type: "LESSON_COMPLETION", canonicalReference: "l1", label: "L1", group: "ARBITRARY" }] }), /group/);
});

test("U6D migration adds definition authority without creating a credential or reporting authority", async () => {
  const migration = await readFile(new URL("../migrations/110_program_completion_definitions.sql", import.meta.url), "utf8");
  assert.match(migration, /program_completion_definitions/);
  assert.match(migration, /completion_definition_version/);
  assert.doesNotMatch(migration, /issued_certificates|report_artifacts|report_payload_snapshots|certificate/);
});
