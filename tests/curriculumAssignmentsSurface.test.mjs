import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const assignments = fs.readFileSync(new URL("../src/pages/Assignments.jsx", import.meta.url), "utf8");
const curriculumRoutes = fs.readFileSync(new URL("../src/router/CurriculumRoutes.jsx", import.meta.url), "utf8");
const surfaceRegistry = JSON.parse(
  fs.readFileSync(new URL("../docs/SHF_REPORTING_SURFACE_REGISTRY.v1.json", import.meta.url), "utf8"),
);

test("Assignments is personal/placeholder UX and is not an institutional metric consumer", () => {
  const surface = surfaceRegistry.surfaces.find((item) => item.surface_id === "surface.assignments");

  assert.ok(surface);
  assert.equal(surface.reporting_role, "PERSONAL_UX_ONLY");
  assert.equal(surface.migration_status, "NOT_APPLICABLE");
  assert.equal(surface.metric_id, null);
  assert.equal(surface.reporting_service, null);
  assert.match(curriculumRoutes, /<Route path="asl\/assignments" element={<Assignments \/>} \/>/);
  assert.match(assignments, /useState\(\[\s*\{ id: "ref-1"/);
  assert.match(assignments, /const \[completed, setCompleted\] = React\.useState\(\[\]\)/);
  assert.match(assignments, /setOpen\(\(list\) => list\.filter/);
  assert.match(assignments, /setCompleted\(\(list\) =>/);
  assert.match(assignments, /track\?\.\("assignment_completed"/);
  assert.equal(assignments.includes("fetchCurriculumLessonCompletionReport"), false);
  assert.equal(assignments.includes("localStorage"), false);
  assert.equal(assignments.includes("curriculum.lesson.completion_count.v1"), false);
});
