import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(path, "utf8");

test("FE-4 keeps the canonical student learning route chain and exposes Career", () => {
  const routes = read("src/router/CurriculumRoutes.jsx");
  const sidebar = read("src/components/CurriculumSidebar.jsx");
  const dashboard = read("src/pages/curriculum/CurriculumDashboard.jsx");

  for (const route of ["asl/dashboard", "asl/assignments", "learning", "courses/:courseId", "lessons/:slug", "asl/portfolio"]) {
    assert.match(routes, new RegExp(`path=\"${route.replace(/[/:]/g, "\\$&")}\"`));
  }
  assert.match(sidebar, /label: "Career"/);
  assert.match(sidebar, /career\.html#\/dashboard/);
  assert.match(dashboard, /Open Career Center/);
  assert.match(dashboard, /career\.html#\/pathways/);
  assert.match(dashboard, /View portfolio/);
});

test("FE-4 presents a bounded authenticated Career Center bridge", () => {
  const routes = read("src/router/CareerRoutes.jsx");
  const dashboard = read("src/pages/career/CareerDashboard.jsx");
  const sidebar = read("src/components/career/CareerSidebar.jsx");

  for (const route of ["dashboard", "learn", "portfolio", "explore", "pathways", "pathways/:pathwaySlug"]) {
    assert.match(routes, new RegExp(`path=\"${route.replace(/[/:]/g, "\\$&")}\"`));
  }
  assert.match(dashboard, /Your next step/);
  assert.match(dashboard, /Explore careers/);
  assert.match(dashboard, /Continue learning/);
  assert.match(dashboard, /Review portfolio/);
  assert.match(sidebar, /My Career Center/);
});

test("FE-4 preserves boundaries and avoids a second assistant or career authority", () => {
  assert.match(read("src/layouts/CurriculumLayout.jsx"), /data-shell-family="learning"/);
  assert.match(read("src/layouts/CareerLayout.jsx"), /title="Career Center"/);
  assert.match(read("src/router/AdminRoutes.jsx"), /path="\/agent-fabric"/);
  assert.match(read("src/pages/universe-v1/universeDestinationRegistry.js"), /foundation\.html/);
  assert.match(read("src/pages/career/CareerDashboardNorthstar.jsx"), /Canonical portfolio/);
});
