import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const dashboard = fs.readFileSync(new URL("../src/pages/curriculum/CurriculumDashboard.jsx", import.meta.url), "utf8");
const progressCard = fs.readFileSync(new URL("../src/pages/curriculum/sections/LearningProgressCard.jsx", import.meta.url), "utf8");
const registry = JSON.parse(fs.readFileSync(new URL("../docs/SHF_REPORTING_SURFACE_REGISTRY.v1.json", import.meta.url), "utf8"));

test("Credentials earned is rendered by LearningProgressCard on the curriculum dashboard", () => {
  assert.match(dashboard, /LearningProgressCard/);
  assert.match(progressCard, /Credentials earned/);
  assert.equal(registry.surfaces.find((item) => item.surface_id === "surface.curriculum.progress").component_file, "src/pages/curriculum/CurriculumDashboard.jsx");
});

test("Credentials earned is a static value with no curriculum credential authority", () => {
  assert.match(progressCard, /credentialsEarned: 8/);
  assert.equal(progressCard.includes("credentialId"), false);
  assert.equal(progressCard.includes("credential.earned"), false);
  assert.equal(progressCard.includes("certificate"), false);
  assert.equal(progressCard.includes("credentialReporting"), false);
  assert.equal(progressCard.includes("fetchCredential"), false);
});

test("lesson completion reporting is not reused as a credential count", () => {
  assert.match(progressCard, /fetchCurriculumLessonCompletionReport/);
  assert.equal(progressCard.includes("curriculum.lesson.completion_count.v1"), false);
  assert.equal(progressCard.includes("lessonCount.*credentialsEarned"), false);
});
