import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const routes = read("src/router/AdminRoutes.jsx");
const binder = read("src/pages/admin/GrantBinder.jsx");
const aggregator = read("src/utils/logAggregator.js");
const toolDashboard = read("src/pages/admin/ToolDashboard.jsx");
const missionLogs = read("src/components/civic/MissionLogButtons.jsx");
const surfaceRegistry = JSON.parse(read("docs/SHF_REPORTING_SURFACE_REGISTRY.v1.json"));
const lineageRegistry = JSON.parse(
  read("services/shf-agent-fabric/contracts/reporting/producer_lineage_registry.v1.json"),
);

test("Grant Binder route and component contract are explicit", () => {
  const surface = surfaceRegistry.surfaces.find(
    (item) => item.surface_id === "surface.grant.binder",
  );

  assert.ok(surface);
  assert.match(routes, /<Route path="\/grant-binder" element=\{protect\("\/grant-binder", <GrantBinder \/>\)/);
  assert.equal(routes.includes('path="/funder"'), false);
  assert.equal(surface.route, "/grant-binder");
  assert.equal(surface.component_file, "src/pages/admin/GrantBinder.jsx");
});

test("Grant Binder keeps browser logs noncanonical while workspace authority is backend-owned", () => {
  const surface = surfaceRegistry.surfaces.find(
    (item) => item.surface_id === "surface.grant.binder",
  );
  const lineage = lineageRegistry.entries.find(
    (item) => item.lineage_id === "lineage.grant.binder.logs.v1",
  );

  assert.equal(surface.migration_status, "NOT_APPLICABLE");
  assert.equal(surface.browser_storage, "LEGACY_REPORT_SOURCE");
  assert.equal(surface.producer_status, "authenticated operational ingestion connected; Evidence/Truth intentionally absent");
  assert.match(lineage.current_runtime_status, /^browser_storage_path_reported_by_census/);
  assert.equal(lineage.operational_store, "browser localStorage");
  assert.equal(lineage.truth_eligibility, "OPERATIONAL_ONLY");
  assert.equal(binder.includes("fetch("), false);
  assert.equal(aggregator.includes("fetch("), false);
  assert.match(aggregator, /const ADMIN_LOG_KEY = "shf\.adminToolLogs\.v1"/);
  assert.match(aggregator, /const CIVIC_LOG_KEY = "shf\.civicMissionLogs\.v1"/);
  assert.match(aggregator, /readJSON\(ADMIN_LOG_KEY, \[\]\)/);
  assert.match(aggregator, /readJSON\(CIVIC_LOG_KEY, \[\]\)/);
});

test("Grant Binder totals and exports are browser calculations, not canonical metrics", () => {
  assert.match(aggregator, /allLogs\.reduce\(/);
  assert.match(aggregator, /const totalEntries = allLogs\.length/);
  assert.match(binder, /exportedAt: new Date\(\)\.toISOString\(\)/);
  assert.match(toolDashboard, /localStorage\.getItem\(key\)/);
  assert.match(missionLogs, /saveJSON\(CIVIC_LOG_KEY/);
  assert.equal(binder.includes("/shf/ingestion/events"), false);
  assert.equal(binder.includes("Reporting Service"), false);
  assert.equal(binder.includes("Metric Registry"), false);
});

test("Grant Binder browser logs are not Evidence or Truth claims", () => {
  const surface = surfaceRegistry.surfaces.find(
    (item) => item.surface_id === "surface.grant.binder",
  );
  const lineage = lineageRegistry.entries.find(
    (item) => item.lineage_id === "lineage.grant.binder.logs.v1",
  );

  assert.equal(surface.evidence_path, null);
  assert.equal(surface.truth_claim_type, null);
  assert.equal(surface.truth_predicate, null);
  assert.equal(lineage.truth_claim_type, null);
  assert.equal(lineage.truth_predicate, null);
  assert.equal(lineage.metric_ids.length, 0);
});
