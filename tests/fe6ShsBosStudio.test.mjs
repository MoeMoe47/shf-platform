import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const adminRoutes = readFileSync(new URL("../src/router/AdminRoutes.jsx", import.meta.url), "utf8");
const curriculumRoutes = readFileSync(new URL("../src/router/CurriculumRoutes.jsx", import.meta.url), "utf8");
const sidebar = readFileSync(new URL("../src/components/admin/AdminSidebar.jsx", import.meta.url), "utf8");
const project = readFileSync(new URL("../src/pages/studio/StudioProjectShell.jsx", import.meta.url), "utf8");
const builder = readFileSync(new URL("../src/pages/studio/StudioBuilderWorkspace.jsx", import.meta.url), "utf8");
const release = readFileSync(new URL("../src/pages/admin/release-assurance/ReleaseAssurancePage.jsx", import.meta.url), "utf8");
const ops = readFileSync(new URL("../src/pages/admin/ops/OpsProductionDashboard.jsx", import.meta.url), "utf8");
const hubHome = readFileSync(new URL("../src/pages/hub/HubWorkspaceDashboard.jsx", import.meta.url), "utf8");

test("FE-6 exposes one canonical SHS/BOS product navigation path", () => {
  assert.match(adminRoutes, /path="\/hub" element=\{protect\("\/hub"/);
  assert.match(curriculumRoutes, /path="\/studio" element=\{<CurriculumLayout \/>\}/);
  assert.match(sidebar, /label: "BOS Home"/);
  assert.match(sidebar, /href: "\/curriculum\.html#\/studio"/);
  assert.match(sidebar, /label: "ARAG-1 Assurance"/);
  assert.equal((sidebar.match(/label: "BOS Home"/g) || []).length, 1);
});

test("Studio lifecycle remains connected through project, workspace, packet, QA, review, and release", () => {
  assert.match(curriculumRoutes, /path="projects" element=\{<StudioProjects \/>\}/);
  assert.match(curriculumRoutes, /path="projects\/:projectId" element=\{<StudioProjectShell \/>\}/);
  assert.match(curriculumRoutes, /path="projects\/:projectId\/build" element=\{<StudioBuilderWorkspace \/>\}/);
  assert.match(project, /StudioBuildPacket/);
  assert.match(builder, /StudioProjectCheck/);
  assert.match(builder, /StudioReviewStatus/);
  assert.match(builder, /StudioDeliveryStatus/);
});

test("FE-6 preserves governed release and operational boundaries", () => {
  assert.match(release, /\/api\/arag\/releases/);
  assert.match(release, /approval|assurance/i);
  assert.match(ops, /localStorage/);
  assert.match(ops, /No projects|No page|Not Started/);
  assert.doesNotMatch(release, /api[_ -]?key|password|private[_ -]?key/i);
});

test("FE-0 and deferred product boundaries remain intact", () => {
  const registry = readFileSync(new URL("../src/pages/universe-v1/universeDestinationRegistry.js", import.meta.url), "utf8");
  assert.match(registry, /productionPath: '\/admin\.html#\/agent-fabric'/);
  assert.match(sidebar, /href: "\/curriculum\.html#\/studio"/);
  assert.match(registry, /Universe/);
});

test("BOS home uses honest availability states instead of fixture-backed summaries", () => {
  assert.match(hubHome, /HubDataAvailability/);
  assert.match(hubHome, /No canonical operational summaries are available/);
  assert.match(hubHome, /Not configured on this home/);
  assert.match(hubHome, /Canonical readiness data will appear/);
  assert.doesNotMatch(hubHome, /demoRole|shsHubDemoRole|demoReferrals|demoPartners|activityRows|adaptiveWorkflowSignals/);
  assert.doesNotMatch(hubHome, /Jordan Ellis|FY24 Q2|87%|Due in 18 days|Active Organizations/);
  assert.doesNotMatch(hubHome, /Notifications\s*<b>|\["Action Queue"[^\n]*"12"/);
});
