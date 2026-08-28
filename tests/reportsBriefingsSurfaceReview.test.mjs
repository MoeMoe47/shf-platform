import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const panel = fs.readFileSync(new URL("../src/pages/shf-command/sections/ReportsBriefingsPanel.jsx", import.meta.url), "utf8");
const command = fs.readFileSync(new URL("../src/pages/shf-command/SHFImpactCommandCenter.jsx", import.meta.url), "utf8");
const registry = JSON.parse(fs.readFileSync(new URL("../docs/SHF_REPORTING_SURFACE_REGISTRY.v1.json", import.meta.url), "utf8"));

test("Reports & Briefings uses the real route/component and remains a renderer", () => {
  const entry = registry.surfaces.find((surface) => surface.surface_id === "surface.reports.briefings");

  assert.equal(entry.route, "/foundation/impact");
  assert.equal(entry.component_file, "src/pages/shf-command/sections/ReportsBriefingsPanel.jsx");
  assert.match(panel, /items = \[\]/);
  assert.match(panel, /items\.map/);
  assert.doesNotMatch(panel, /fetch\(|localStorage|reduce\(|filter\(/);
});

test("non-Board Brief values remain static command-surface inputs", () => {
  assert.match(command, /const EXPORT_ITEMS = \[/);
  for (const label of ["Board Brief", "Grant Narrative", "Donor Summary", "Public Impact Snapshot", "Program Health Memo"]) {
    assert.match(command, new RegExp(label.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")));
  }
  assert.match(command, /const REPORTING_DATA_AVAILABLE = false/);
  assert.match(command, /const ORACLE_BASE =/);
  assert.match(command, /fetchOracleBundle/);
  const entry = registry.surfaces.find((surface) => surface.surface_id === "surface.reports.briefings");
  assert.equal(entry.migration_status, "PARTIAL_CANONICAL");
  assert.equal(entry.metric_id, "workforce.employment.started_verified_count.v1");
  assert.equal(entry.reporting_service, "/shf/reports/workforce.employment-started-verified-count for Board Brief, Grant Narrative, and Program Health Memo");
  assert.equal(entryHasCanonicalLineage(registry), true);
});

function entryHasCanonicalLineage(surfaceRegistry) {
  const entry = surfaceRegistry.surfaces.find((surface) => surface.surface_id === "surface.reports.briefings");
  return Boolean(entry?.ingestion_route || entry?.evidence_path || entry?.truth_claim_type || entry?.metric_id || entry?.reporting_service);
}
