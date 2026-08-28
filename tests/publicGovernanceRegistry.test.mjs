import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const registry = read("apps/shs-api/src/domain/reporting/report-public-governance-registry.ts");
const eligibility = read("apps/shs-api/src/domain/reporting/report-public-eligibility-service.ts");
const policy = read("apps/shs-api/src/domain/reporting/report-public-disclosure-policy-service.ts");
const disclosure = read("apps/shs-api/src/domain/reporting/report-public-disclosure-service.ts");
const snapshot = read("apps/shs-api/src/domain/reporting/report-public-snapshot-service.ts");
const publication = read("apps/shs-api/src/domain/reporting/report-publication-service.ts");
const actionRepo = read("apps/shs-api/src/domain/reporting/report-publication-action-repo.ts");
const projectionMigration = read("apps/shs-api/migrations/026_generic_public_governance_registrations.sql");
const curriculumPublicClient = read("src/shared/reporting/publicImpactReportingClient.js");

test("the server registry explicitly registers curriculum and Hub reports", () => {
  assert.match(registry, /report\.curriculum\.lesson_completion_count\.v1/);
  assert.match(registry, /report\.hub\.referral\.created_count\.v1/);
  assert.match(registry, /PUBLIC_AGGREGATE_EDUCATION_ACTIVITY/);
  assert.match(registry, /PUBLIC_AGGREGATE_HUB_REFERRAL_ACTIVITY/);
  assert.match(registry, /REFERRAL_CREATION_ACTIVITY/);
  assert.match(registry, /public_governance_status: "POLICY_REQUIRED"/);
  assert.match(registry, /truth_public_population_required: true/);
});

test("public eligibility accepts only explicit registered reports", () => {
  assert.match(eligibility, /requirePublicReportGovernanceRegistration/);
  assert.doesNotMatch(eligibility, /reportId !== CURRICULUM_COMPLETION_REPORT\.report_id/);
  assert.match(registry, /getPublicReportGovernanceRegistration/);
});

test("policy and disclosure resolution use the registered policy key", () => {
  assert.match(policy, /registration\.required_policy_key/);
  assert.match(disclosure, /registration\.required_policy_key/);
  assert.match(disclosure, /No disclosure evaluator is registered for this report/);
  assert.match(registry, /disclosure_evaluator: "HUB_REFERRAL_ACTIVITY_V1"/);
});

test("Hub cannot silently reuse curriculum disclosure, snapshot, or publication behavior", () => {
  assert.match(registry, /PUBLIC_AGGREGATE_HUB_REFERRAL_ACTIVITY/);
  assert.match(snapshot, /registration\.disclosure_evaluator/);
  assert.match(publication, /registration\.required_policy_key/);
  assert.match(publication, /registration\.semantic_label/);
  assert.doesNotMatch(curriculumPublicClient, /hub\.referral\.created_count/);
});

test("projection storage is generic while the existing curriculum read model stays explicit", () => {
  assert.match(projectionMigration, /DROP CONSTRAINT IF EXISTS shf_public_impact_projections_report_id_check/);
  assert.match(projectionMigration, /CHECK \(length\(report_id\) > 0\)/);
  assert.match(actionRepo, /WHERE report_id = \$1/);
  assert.match(actionRepo, /AND report_version = \$2/);
  assert.match(publication, /public_read_model_id !== "curriculum-lesson-completions"/);
});

test("registration does not create disclosure, snapshot, publication, or public-read state", () => {
  assert.match(registry, /public_governance_status: "POLICY_REQUIRED"/);
  assert.match(registry, /public_read_model_id: "hub-referral-created-count"/);
  assert.match(publication, /No approved disclosure policy|Approved disclosure policy for the registered report/);
  assert.match(actionRepo, /source_type = 'CANONICAL_PUBLICATION'/);
  assert.match(curriculumPublicClient, /curriculum-lesson-completions/);
});
