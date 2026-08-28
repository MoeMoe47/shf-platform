import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const lessonPage = fs.readFileSync(new URL("../src/pages/curriculum/Lesson.jsx", import.meta.url), "utf8");
const lessonBody = fs.readFileSync(new URL("../src/components/lessons/LessonBody.jsx", import.meta.url), "utf8");
const curriculumRoutes = fs.readFileSync(new URL("../src/router/CurriculumRoutes.jsx", import.meta.url), "utf8");
const surfaceRegistry = JSON.parse(
  fs.readFileSync(new URL("../docs/SHF_REPORTING_SURFACE_REGISTRY.v1.json", import.meta.url), "utf8"),
);

test("lesson completion surface is a personal UX workflow, not an institutional count", () => {
  const surface = surfaceRegistry.surfaces.find((item) => item.surface_id === "surface.curriculum.lesson_completion");

  assert.ok(surface);
  assert.equal(surface.route, "/curriculum/lesson/:id");
  assert.equal(surface.reporting_role, "PERSONAL_UX_ONLY");
  assert.equal(surface.migration_status, "NOT_APPLICABLE");
  assert.equal(surface.metric_id, null);
  assert.equal(surface.reporting_service, null);
  assert.match(curriculumRoutes, /<Route path="lesson\/:id" element={<CurriculumLesson \/>} \/>/);
  assert.match(lessonPage, /localStorage\.getItem\(KEY\)/);
  assert.match(lessonBody, /markLessonComplete\(/);
  assert.match(lessonBody, /Pending sync/);
  assert.match(lessonBody, /Synchronized/);
  assert.match(lessonBody, /Sync failed/);
  assert.match(lessonPage, /institutionalCompletion=\{false\}/);
  assert.match(lessonBody, /Preview only — completion is unavailable for imported lessons/);
  assert.equal(lessonBody.includes("fetchCurriculumLessonCompletionReport"), false);
});
