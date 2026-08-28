import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const dashboard = fs.readFileSync(new URL("../src/pages/curriculum/CurriculumDashboard.jsx", import.meta.url), "utf8");
const progressCard = fs.readFileSync(new URL("../src/pages/curriculum/sections/LearningProgressCard.jsx", import.meta.url), "utf8");
const weeklyCard = fs.readFileSync(new URL("../src/pages/curriculum/sections/WeeklySummaryCard.jsx", import.meta.url), "utf8");
const assignmentsCard = fs.readFileSync(new URL("../src/pages/curriculum/sections/UpcomingAssignmentsCard.jsx", import.meta.url), "utf8");
const registry = JSON.parse(fs.readFileSync(new URL("../docs/SHF_REPORTING_SURFACE_REGISTRY.v1.json", import.meta.url), "utf8"));

test("curriculum progress surface route and component contract are explicit", () => {
  const surface = registry.surfaces.find((item) => item.surface_id === "surface.curriculum.progress");
  assert.equal(surface.route, "/curriculum");
  assert.equal(surface.component_file, "src/pages/curriculum/CurriculumDashboard.jsx");
  assert.match(dashboard, /LearningProgressCard/);
  assert.match(dashboard, /WeeklySummaryCard/);
  assert.match(dashboard, /UpcomingAssignmentsCard/);
});

test("only Lessons completed consumes the existing canonical report", () => {
  assert.match(progressCard, /fetchCurriculumLessonCompletionReport/);
  assert.match(progressCard, /Lessons completed/);
  assert.equal(progressCard.includes("completed \/ total"), false);
  assert.equal(progressCard.includes("localStorage"), false);
});

test("remaining progress-card values are not silently canonicalized", () => {
  assert.match(progressCard, /percentComplete: 68/);
  assert.match(progressCard, /assignmentsDue: 3/);
  assert.match(progressCard, /credentialsEarned: 8/);
  assert.match(progressCard, /streakDays: 12/);
  assert.match(weeklyCard, /__mockAttendancePct/);
  assert.match(assignmentsCard, /const ASSIGNMENTS/);
  const surface = registry.surfaces.find((item) => item.surface_id === "surface.curriculum.progress");
  assert.equal(surface.migration_status, "MIGRATE");
  assert.match(surface.required_action, /remaining noncanonical cards separately/);
});
