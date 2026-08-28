import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const contract = read("docs/SHF_GRANT_BINDER_BACKEND_AUTHORITY_CONTRACT.md");
const routes = read("src/router/AdminRoutes.jsx");
const surfaceRegistry = JSON.parse(read("docs/SHF_REPORTING_SURFACE_REGISTRY.v1.json"));
const lineageRegistry = JSON.parse(
  read("services/shf-agent-fabric/contracts/reporting/producer_lineage_registry.v1.json"),
);

function domainFiles() {
  const domainRoot = path.join(root, "apps/shs-api/src/domain");
  const result = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(fullPath);
      else result.push(fullPath);
    }
  };
  visit(domainRoot);
  return result.map((file) => path.relative(root, file));
}

test("Grant Binder route and status remain bounded to the reviewed surface", () => {
  const surface = surfaceRegistry.surfaces.find(
    (item) => item.surface_id === "surface.grant.binder",
  );
  assert.ok(surface);
  assert.match(routes, /<Route path="\/grant-binder"/);
  assert.equal(surface.migration_status, "NOT_APPLICABLE");
  assert.equal(surface.producer_status, "authenticated operational ingestion connected; Evidence/Truth intentionally absent");
});

test("The Grant Binder backend domain is the minimal workspace only", () => {
  const files = domainFiles();
  assert.equal(files.some((file) => /grant-binder/i.test(file)), true);
  assert.match(contract, /minimal backend-owned Grant Binder\s+workspace record/);
  assert.match(contract, /one minimized, transactionally bound\s+producer event/);
});

test("The proposed authority contract keeps scope, identity, and lifecycle server-owned", () => {
  for (const field of [
    "binder_id",
    "tenant_id",
    "organization_id",
    "created_by",
    "created_at",
    "updated_at",
    "lifecycle",
    "version",
  ]) {
    assert.match(contract, new RegExp("\\\\| `" + field + "` \\|"));
  }
  assert.match(contract, /No `READY`, `QUALIFIED`, `APPROVED`, `SUBMITTED`, `AWARDED`/);
  assert.match(contract, /derived activity totals, percentages, readiness scores/);
});

test("Only the future creation event is a bounded candidate; browser logs stay operational", () => {
  const lineage = lineageRegistry.entries.find(
    (item) => item.lineage_id === "lineage.grant.binder.logs.v1",
  );
  assert.ok(lineage);
  assert.equal(lineage.truth_eligibility, "OPERATIONAL_ONLY");
  assert.equal(lineage.truth_claim_type, null);
  assert.equal(lineage.metric_ids.length, 0);
  const backendLineage = lineageRegistry.entries.find(
    (item) => item.lineage_id === "lineage.shs.grant_binder.created.v1",
  );
  assert.ok(backendLineage);
  assert.equal(backendLineage.truth_eligibility, "OPERATIONAL_ONLY");
  assert.deepEqual(backendLineage.metric_ids, []);
  assert.match(backendLineage.payload_policy, /no_logs_or_content/);
  assert.equal(backendLineage.evidence_projection, "absent_by_contract");
  assert.equal(backendLineage.truth_projection, "absent_by_contract");
  assert.match(contract, /`grant\.log\.recorded` \| `OPERATIONAL_ONLY`/);
  assert.match(contract, /`grant_binder\.created\.v1` \| `DEFENSIBLE_PRODUCER_EVENT`/);
  assert.match(contract, /`grant-binder:\{binder_id\}:created`/);
  assert.match(contract, /authenticated\s+Agent Fabric ingestion/);
});
