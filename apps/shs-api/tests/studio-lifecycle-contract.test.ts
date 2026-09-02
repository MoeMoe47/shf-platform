import assert from "node:assert/strict";
import { test } from "node:test";
import {
  STUDENT_EXPERIENCE_LABELS,
  canTransitionStudioProject,
  destinationDispatch,
  experienceStateCannotAssertInstitutionalTruth,
  isPresentationState,
  validateStudioHandoff,
  type StudioHandoff,
} from "../src/domain/studio/model/studio-lifecycle.ts";

const assignmentHandoff: StudioHandoff = {
  handoffId: "handoff-assignment-1", organizationId: "org-a", tenantId: "tenant:org-a", learnerId: "learner-a",
  origin: "ASSIGNMENT", projectType: "WEBSITE", assignmentId: "assignment-a", enrollmentId: "enrollment-a",
  cohortId: "cohort-a", programId: "program-a", courseId: "course-a", unitKey: "unit-a", lessonKey: "lesson-a",
  curriculumReleaseId: "release-1", completionPolicyId: "policy-a", reviewerId: "instructor-a",
  dueAt: "2026-10-01T00:00:00.000Z", requirements: ["required-pages"], destination: "STUDENT",
};

test("WEBSITE and AI_AGENT are valid shared Studio project types", () => {
  assert.deepEqual(validateStudioHandoff(assignmentHandoff), []);
  assert.equal(validateStudioHandoff({ ...assignmentHandoff, projectType: "AI_AGENT" }).length, 0);
});

test("student and commercial destinations dispatch to different consumers", () => {
  assert.equal(destinationDispatch("STUDENT").consumer, "STUDENT_EVIDENCE");
  assert.equal(destinationDispatch("COMMERCIAL").consumer, "COMMERCIAL_CLIENTOPS");
  assert.notEqual(destinationDispatch("STUDENT").consumer, "COMMERCIAL_CLIENTOPS");
});

test("assignment origin preserves canonical curriculum references", () => {
  assert.deepEqual(validateStudioHandoff(assignmentHandoff), []);
  assert.ok(validateStudioHandoff({ ...assignmentHandoff, assignmentId: null }).some((error) => /assignmentId/.test(error)));
  assert.ok(validateStudioHandoff({ ...assignmentHandoff, curriculumReleaseId: null }).some((error) => /curriculumReleaseId/.test(error)));
});

test("independent student ideas do not require or fabricate assignment context", () => {
  const independent: StudioHandoff = {
    ...assignmentHandoff, handoffId: "handoff-idea-1", origin: "STUDENT_IDEA", assignmentId: null,
    enrollmentId: null, cohortId: null, programId: null, courseId: null, unitKey: null, lessonKey: null,
    curriculumReleaseId: null, completionPolicyId: null,
  };
  assert.deepEqual(validateStudioHandoff(independent), []);
  assert.ok(validateStudioHandoff({ ...independent, assignmentId: "fabricated" }).some((error) => /assignment/.test(error)));
});

test("project transitions reject impossible direct delivery", () => {
  assert.equal(canTransitionStudioProject("DRAFT", "PLANNING"), true);
  assert.equal(canTransitionStudioProject("BUILDING", "READY_FOR_CHECK"), true);
  assert.equal(canTransitionStudioProject("DRAFT", "DELIVERED"), false);
  assert.equal(canTransitionStudioProject("DELIVERED", "VERIFIED" as never), false);
});

test("student terminology and presentation state cannot assert institutional truth", () => {
  assert.equal(STUDENT_EXPERIENCE_LABELS.project, "My Project");
  assert.equal(isPresentationState("READY_TO_CONTINUE"), true);
  assert.equal(isPresentationState("COMPLETED"), false);
  assert.equal(experienceStateCannotAssertInstitutionalTruth("COMPLETED"), false);
  assert.equal(experienceStateCannotAssertInstitutionalTruth("READY_TO_CONTINUE"), true);
});
