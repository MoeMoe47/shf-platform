import test from "node:test";
import assert from "node:assert/strict";
import { STUDIO_EXPERIENCE_MODES, STUDIO_TERMINOLOGY, deriveStudioProgress, resolveStudioNextAction, toStudioCompanionContext } from "../src/pages/studio/experience.js";

test("next action is derived without mutating canonical project data", () => {
  const project = { projectId: "p1", projectType: "WEBSITE", status: "DRAFT" };
  const before = JSON.stringify(project);
  assert.equal(resolveStudioNextAction(project).key, "describe");
  assert.equal(JSON.stringify(project), before);
});

test("Website and AI Agent receive distinct context", () => {
  assert.equal(toStudioCompanionContext({ project: { projectId: "w", projectType: "WEBSITE", title: "Site", status: "DRAFT" } }).project.type, "Website");
  assert.equal(toStudioCompanionContext({ project: { projectId: "a", projectType: "AI_AGENT", title: "Agent", status: "DRAFT" } }).project.type, "AI Agent");
});

test("assignment context is canonical and independent projects stay unlinked", () => {
  assert.deepEqual(toStudioCompanionContext({ project: { projectId: "p", projectType: "WEBSITE", title: "Assigned", origin: "ASSIGNMENT", assignmentId: "assignment-1", curriculumReleaseId: "release-1", status: "PLANNING" } }).assignment, { id: "assignment-1", releaseId: "release-1" });
  assert.equal(toStudioCompanionContext({ project: { projectId: "i", projectType: "WEBSITE", title: "Idea", origin: "STUDENT_IDEA", status: "DRAFT" } }).assignment, null);
});

test("student terminology is centralized", () => {
  assert.equal(STUDIO_TERMINOLOGY.handoff, "Start Project");
  assert.equal(STUDIO_TERMINOLOGY.project, "My Project");
  assert.equal(STUDIO_TERMINOLOGY.qa, "Check My Project");
  assert.equal(STUDIO_TERMINOLOGY.evidence, "What You Proved");
});

test("progress does not claim unsupported institutional facts", () => {
  const progress = deriveStudioProgress({ status: "READY_FOR_CHECK" });
  assert.equal(progress.currentStage, "Check");
  assert.doesNotMatch(progress.explanation, /passed|delivered|verified|complete/i);
  assert.equal(resolveStudioNextAction({ status: "READY_FOR_CHECK" }).key, "check");
});

test("Beginner is the default experience mode contract", () => {
  assert.equal(STUDIO_EXPERIENCE_MODES.BEGINNER, "BEGINNER");
});

test("Companion context is explicitly read-only", () => {
  const context = toStudioCompanionContext({ project: { projectId: "p", projectType: "WEBSITE", title: "Site", status: "DELIVERED" } });
  assert.equal(context.authority, "read-only");
  assert.equal("completed" in context, false);
  assert.equal("verified" in context, false);
});
