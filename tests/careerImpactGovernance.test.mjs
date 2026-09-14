// tests/careerImpactGovernance.test.mjs
//
// CCV2 Phase 0 (Career Center V2 governance/correctness audit) correction:
// src/pages/CareerPathways.jsx (the live "My Career Planner" personal route,
// see src/router/CareerRoutes.jsx's `path="planner"`) previously rendered
// hardcoded, non-canonical institutional outcome figures
// (src/data/impact.js: "Avg time to first paycheck", "Avg cost after aid",
// "90-day employment") and let anyone locally fabricate/override those
// figures via a "?admin=1" query param + localStorage mechanism that
// required no real authentication. Per the locked "govern facts, not
// ambition" principle, unverified institutional outcome numbers must not be
// presented as fact, and a browser-only override must never be able to make
// them look authoritative. This phase removed the override mechanism and
// the fabricated default figures, replacing them with a bounded, honest
// "not currently available" state — no governed backend projection for
// these specific metrics exists yet (see src/shared/reporting/ for the
// metrics that are governed today), so nothing was fabricated to replace
// them.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pathwaysPage = await readFile(new URL("../src/pages/CareerPathways.jsx", import.meta.url), "utf8");

test("Career Planner no longer exposes a browser-only admin override for institutional outcome figures", () => {
  assert.doesNotMatch(pathwaysPage, /sh_impact_override_v1/, "the localStorage impact-override key must be gone");
  assert.doesNotMatch(pathwaysPage, /sh_admin\b/, "the localStorage admin-mode key must be gone");
  assert.doesNotMatch(pathwaysPage, /useIsAdmin/, "the admin-mode hook must be gone");
  assert.doesNotMatch(pathwaysPage, /useImpactData/, "the impact-override hook must be gone");
  assert.doesNotMatch(pathwaysPage, /admin=1/, "the query-param admin unlock must be gone");
  assert.doesNotMatch(pathwaysPage, /Edit Impact/, "the Edit Impact UI must be gone");
  assert.doesNotMatch(pathwaysPage, /open-impact-editor/, "the Alt\\+I impact-editor shortcut must be gone");
});

test("Career Planner no longer imports or renders the hardcoded institutional outcome figures", () => {
  assert.doesNotMatch(pathwaysPage, /import\s+\w+\s+from\s+["'][.\w/]*data\/impact\.js["']/, "src/data/impact.js must no longer be imported by the live Career Planner");
  assert.doesNotMatch(pathwaysPage, /\{k\.value\}|safeKpis\.map/, "the fabricated per-KPI render loop must not be reintroduced");
});

test("Career Planner shows a bounded, honest unavailable state instead of fabricating outcome data", () => {
  assert.match(pathwaysPage, /Verified outcome data is not currently available\./);
  assert.match(pathwaysPage, /function ImpactStrip/);
});
