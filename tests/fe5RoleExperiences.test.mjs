import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(path, "utf8");

test("FE-5 keeps canonical role homes and registers the parent fallback", () => {
  const routes = read("src/router/CurriculumRoutes.jsx");
  const curriculum = read("src/components/CurriculumSidebar.jsx");
  const admin = read("src/components/admin/AdminSidebar.jsx");
  const parent = read("src/pages/ParentDashboard.jsx");

  assert.match(routes, /path="instructor\/operations"/);
  assert.match(routes, /path="parent" element={<ParentDashboard \/>}/);
  assert.match(routes, /path="\/:curriculum\/parent"/);
  assert.match(curriculum, /canSeeInstructor/);
  assert.match(curriculum, /roles.*admin\|instructor\|teacher\|coach/);
  assert.match(admin, /to: "\/hub".*label: "BOS Home"/);
  assert.match(parent, /authorized family relationship/);
});

test("FE-5 parent surface does not fabricate learner data or authority", () => {
  const parent = read("src/pages/ParentDashboard.jsx");
  assert.match(parent, /No linked learner data is available/);
  assert.match(parent, /canonical relationship and membership services/);
  assert.doesNotMatch(parent, /studentId|learnerId|localStorage|fetch\(/);
});

test("FE-5 preserves completed student/public and protected admin boundaries", () => {
  assert.match(read("src/router/AdminRoutes.jsx"), /path="\/agent-fabric"/);
  assert.match(read("src/pages/universe-v1/universeDestinationRegistry.js"), /productionPath: '\/oas\.html'/);
  assert.match(read("src/layouts/CurriculumLayout.jsx"), /data-shell-family="learning"/);
  assert.match(read("docs/architecture/FE-4_STUDENT_CAREER_CENTER_EXPERIENCE_REPORT.md"), /FE-5/);
});
