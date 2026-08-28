import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const service = readFileSync(new URL("../apps/shs-api/src/domain/reporting/report-publication-service.ts", import.meta.url), "utf8");
const repo = readFileSync(new URL("../apps/shs-api/src/domain/reporting/report-publication-action-repo.ts", import.meta.url), "utf8");
const migration = readFileSync(new URL("../apps/shs-api/migrations/025_report_publications.sql", import.meta.url), "utf8");
const staticImpact = readFileSync(new URL("../src/data/shfImpactData.js", import.meta.url), "utf8");

test("publication consumes the snapshot representation and never recomputes Truth", () => {
  assert.match(service, /public_display_value: snapshot\.public_display_value/);
  assert.doesNotMatch(service, /Truth|Evidence|canonical_count|evaluateCurriculum/);
  assert.match(repo, /source_type = 'CANONICAL_PUBLICATION'/);
  assert.match(repo, /projection_status = 'PUBLISHED'/);
});

test("public projection is safe and distinct from retained static samples", () => {
  assert.match(migration, /source_type TEXT NOT NULL DEFAULT 'CANONICAL_PUBLICATION'/);
  assert.match(migration, /public_display_value TEXT NOT NULL/);
  assert.doesNotMatch(migration, /participant_ref|truth_payload|evidence_payload|private_exact|public_url/i);
  assert.match(staticImpact, /publicApproved: false/);
});

test("publication boundary does not create delivery or public URL semantics", () => {
  assert.match(service, /report\.published/);
  assert.doesNotMatch(service, /sendEmail|email|shareLink|publicUrl|PUBLISHED.*DELIVERED/i);
});
