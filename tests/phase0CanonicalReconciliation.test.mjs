import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const assignments = fs.readFileSync(new URL("../src/pages/Assignments.jsx", import.meta.url), "utf8");
const completionPanel = fs.readFileSync(new URL("../src/components/curriculum/lesson/CompletionCheckPanel.jsx", import.meta.url), "utf8");
const lessonBody = fs.readFileSync(new URL("../src/components/lessons/LessonBody.jsx", import.meta.url), "utf8");
const progressClient = fs.readFileSync(new URL("../src/shared/progress/progressClient.js", import.meta.url), "utf8");
const ingestionClient = fs.readFileSync(new URL("../src/shared/progress/curriculumIngestionClient.js", import.meta.url), "utf8");
const assessment = fs.readFileSync(new URL("../src/components/lessons/AssessmentRenderer.jsx", import.meta.url), "utf8");

test("Phase 0 assignment surface has no client completion or credit path", () => {
  assert.match(assignments, /listAssignments\(role\)/);
  assert.doesNotMatch(assignments, /setCompleted|assignment_completed|credit\?\.earn|Mark complete/);
});

test("Phase 0 lesson completion waits for backend synchronization", () => {
  assert.match(completionPanel, /status === "synchronized"/);
  assert.match(completionPanel, /setCompleted\(true\)/);
  assert.match(lessonBody, /status === "synchronized"/);
  assert.match(lessonBody, /disabled=\{completed \|\| syncPending\}/);
  assert.doesNotMatch(completionPanel, /setCompleted\(true\);\s*\}/);
});

test("Phase 0 assessment and reflection feedback cannot enter trusted event transport", () => {
  assert.match(assessment, /not institutionally verified assessment results/);
  assert.match(progressClient, /recordQuizSubmitted/);
  assert.match(progressClient, /recordReflectionSaved/);
  assert.doesNotMatch(progressClient, /enqueueAndSync/);
  assert.match(ingestionClient, /CANONICAL_BROWSER_EVENT_TYPES/);
  assert.match(ingestionClient, /not an approved canonical transport event/);
});
