import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(path, "utf8");

test("FE-3 exposes the canonical SHF public routes without replacing the live entrypoint", () => {
  const app = read("src/foundation/App.jsx");
  const info = read("src/foundation/pages/PublicInfoPage.jsx");

  for (const route of ["about", "mission", "programs", "partners", "get-involved", "reports"]) {
    assert.match(app, new RegExp(`\\\"${route}\\\"`));
    assert.match(info, new RegExp(route));
  }
  assert.match(app, /hash === "#reports"/);
  assert.match(app, /<Home \/>/);
});

test("FE-3 public copy preserves mission guardrails and public-safe reporting", () => {
  const home = read("src/foundation/pages/Home.jsx");
  const info = read("src/foundation/pages/PublicInfoPage.jsx");

  assert.doesNotMatch(home, /Recovery Support|Recovery Programs|12,500\+|4,200\+|85%/);
  assert.match(info, /nonprofit organization/);
  assert.match(info, /separate solutions and services organization/);
  assert.match(info, /Evidence and Truth authorities govern acceptance/);
  assert.match(info, /demonstration data/);
});

test("FE-3 preserves existing destinations and product boundaries", () => {
  const routes = read("src/router/AdminRoutes.jsx");
  const registry = read("src/pages/universe-v1/universeDestinationRegistry.js");
  const report = read("docs/architecture/FE-2_REPRESENTATIVE_SHELL_ADOPTION_ACCESSIBILITY_RESPONSIVE_ACCEPTANCE_REPORT.md");

  assert.match(routes, /path="\/agent-fabric"/);
  assert.match(registry, /foundation\.html/);
  assert.match(report, /CivicSure/);
});
