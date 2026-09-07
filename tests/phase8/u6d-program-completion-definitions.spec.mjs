import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

const api = process.env.SHS_TEST_API_URL;
const fixture = JSON.parse(readFileSync(process.env.SHS_PHASE8_FIXTURE_MANIFEST, "utf8"));
const token = (userId) => `Bearer dev-token:${userId}`;

async function call(request, userId, path, options = {}) {
  const response = await request.fetch(`${api}${path}`, { ...options, headers: { Authorization: token(userId), ...(options.headers || {}) } });
  return { response, body: await response.json().catch(() => ({})) };
}

test("U6D test-only program definition evaluates through canonical lesson completion", async ({ request }) => {
  const definitionInput = {
    version: "test-course-series-v1",
    completionMode: "ALL_OF",
    authorityReference: "test-fixture.program-owner",
    requirements: [{ requirementId: "lesson-a", type: "LESSON_COMPLETION", canonicalReference: fixture.lessonA, label: "Fixture lesson", metadata: { curriculumId: fixture.courseA } }],
  };
  const draft = await call(request, fixture.adminA, `/programs/${fixture.programA}/completion-definitions`, { method: "POST", data: definitionInput });
  expect(draft.response.status()).toBe(201);
  expect(draft.body.data.status).toBe("DRAFT");
  const activated = await call(request, fixture.adminA, `/programs/${fixture.programA}/completion-definitions/${draft.body.data.definitionId}/activate`, { method: "POST", data: {} });
  expect(activated.response.status()).toBe(200);
  expect(activated.body.data.status).toBe("ACTIVE");

  const before = await call(request, fixture.adminA, `/credentials/programs/${fixture.programA}/completion?learner_id=${fixture.learnerA1}`);
  expect(before.body.data.status).toBe("IN_PROGRESS");
  const lesson = await call(request, fixture.learnerA1, `/curriculum/lessons/${fixture.lessonA}/complete`, { method: "POST", data: { curriculum: fixture.courseA } });
  expect(lesson.response.status()).toBe(200);
  const after = await call(request, fixture.adminA, `/credentials/programs/${fixture.programA}/completion?learner_id=${fixture.learnerA1}`);
  expect(after.body.data.status).toBe("COMPLETED");
  expect(after.body.data.completionDefinitionId).toBe(draft.body.data.definitionId);
  expect(after.body.data.requirementsVersion).toBe("test-course-series-v1");

  const second = await call(request, fixture.adminA, `/credentials/programs/${fixture.programA}/completion?learner_id=${fixture.learnerA1}`);
  expect(second.body.data.programCompletionId).toBe(after.body.data.programCompletionId);
});

test("U6D blocks Summer STEM without an active authored definition", async ({ request }) => {
  const result = await call(request, fixture.adminA, "/credentials/programs/program_seed_001/completion?learner_id=learner_A1");
  expect(result.response.status()).toBe(200);
  expect(result.body.data.status).toBe("BLOCKED");
  expect(result.body.data.reason).toBe("PROGRAM_COMPLETION_DEFINITION_UNAVAILABLE");
});
