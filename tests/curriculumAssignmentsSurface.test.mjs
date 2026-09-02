import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const assignments = fs.readFileSync(new URL("../src/pages/Assignments.jsx", import.meta.url), "utf8");
const curriculumRoutes = fs.readFileSync(new URL("../src/router/CurriculumRoutes.jsx", import.meta.url), "utf8");
const surfaceRegistry = JSON.parse(
  fs.readFileSync(new URL("../docs/SHF_REPORTING_SURFACE_REGISTRY.v1.json", import.meta.url), "utf8"),
);

test("Assignments reads backend assignments and cannot manufacture completion", () => {
  const surface = surfaceRegistry.surfaces.find((item) => item.surface_id === "surface.assignments");

  assert.ok(surface);
  assert.equal(surface.reporting_role, "PERSONAL_UX_ONLY");
  assert.equal(surface.migration_status, "NOT_APPLICABLE");
  assert.equal(surface.metric_id, null);
  assert.equal(surface.reporting_service, null);
  assert.match(curriculumRoutes, /<Route path="asl\/assignments" element={<Assignments \/>} \/>/);
  assert.match(assignments, /listAssignments\(role\)/);
  // SHF Lesson + Assignment + Curriculum Phase 3: the backend now
  // resolves real curriculum-release progress/access state per
  // assignment (assignment-entitlement-service.ts), so the page renders
  // that real state instead of a blanket "not available yet" notice.
  // The underlying guarantee this test exists to protect — no
  // browser-manufactured completion — is unchanged and re-asserted below.
  assert.match(assignments, /accessState/);
  // Phase 5.5 rework: status tabs map to the real accessState values
  // only (To Do/In Progress/Completed) — no fabricated Submitted/Returned
  // lifecycle, since no submission/grading domain exists to own that
  // truth (see assignment.ts's own comment on computeDueState).
  assert.match(assignments, /"AVAILABLE"/);
  assert.match(assignments, /"IN_PROGRESS"/);
  assert.match(assignments, /"COMPLETED"/);
  assert.equal(assignments.includes("Submitted"), false);
  assert.equal(assignments.includes("Returned"), false);
  assert.equal(assignments.includes("useCreditCtx"), false);
  assert.equal(assignments.includes("assignment_completed"), false);
  assert.equal(assignments.includes("markComplete"), false);
  assert.equal(assignments.includes("setCompleted"), false);
  assert.equal(assignments.includes("fetchCurriculumLessonCompletionReport"), false);
  assert.equal(assignments.includes("localStorage"), false);
  assert.equal(assignments.includes("curriculum.lesson.completion_count.v1"), false);
});
