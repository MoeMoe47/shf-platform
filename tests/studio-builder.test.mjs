import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const api = readFileSync(new URL("../src/lib/studio/api.js", import.meta.url), "utf8");
const page = readFileSync(new URL("../src/pages/studio/StudioBuilderWorkspace.jsx", import.meta.url), "utf8");
const routes = readFileSync(new URL("../src/router/CurriculumRoutes.jsx", import.meta.url), "utf8");

test("builder has one project-scoped route and only sends revision plus work", () => {
  assert.match(routes, /projects\/:projectId\/build/);
  assert.match(api, /updateStudioWorkspace/);
  assert.match(api, /JSON\.stringify\(\{ revision, work \}\)/);
  assert.doesNotMatch(api, /localStorage|sessionStorage/);
  assert.doesNotMatch(page, /destination|assignmentId|curriculumReleaseId|qaStatus|reviewStatus|deliveryStatus/);
});

test("builder presents truthful draft-only Website and AI Agent boundaries", () => {
  assert.match(page, /Build Your Website/);
  assert.match(page, /Build Your AI Agent/);
  assert.match(page, /does not mark it complete/);
  assert.match(page, /Save draft/);
  assert.match(page, /Testing, approvals, and registry actions are separate/);
});
