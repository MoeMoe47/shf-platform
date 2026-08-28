import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { ReportPublicSnapshotService } from "../src/domain/reporting/report-public-snapshot-service.ts";
import { APPROVED_CURRICULUM_POLICY_V1 } from "../src/domain/reporting/report-public-disclosure-policy-service.ts";

const migration = readFileSync(new URL("../migrations/022_report_public_snapshots.sql", import.meta.url), "utf8");
const reportId = "report.curriculum.lesson_completion_count.v1";
const actor = { user_id: "reviewer-1", tenant_id: "tenant-1", organization_id: "org-1", permissions: ["reports.public_snapshot.generate", "reports.public_snapshot.view"] };
const baseResult = { report_id: reportId, report_version: 1, metric_id: "curriculum.lesson.completion_count.v1", metric_version: 1, report_result_id: "curriculum.lesson_completion_count:v1:2026-01-01:2026-03-31:org-1", public_eligibility: true, public_population_eligible: true, canonical_count: 27, period_start: "2026-01-01", period_end: "2026-03-31", data_as_of: "2026-08-01T00:00:00.000Z", reporting_period: "QUARTERLY", reporting_period_label: "Q1 2026", geography: "COUNTY", program_granularity: "FOUNDATION_WIDE" };
const reviewContext = { ...baseResult, complementary_suppression_review: "PASS", reidentification_review: "PASS", rare_event_review: "PASS", reconstruction_review: "PASS", longitudinal_review: "PASS", combination_risk_review: "PASS", zero_publicly_safe: true, evaluated_at: "2026-08-26T00:00:00.000Z" };

function harness(count = 27) {
  const records = new Map<string, any>(); const audits: any[] = [];
  const eligibility = { public_eligibility_decision_id: "elig-1", report_id: reportId, report_version: 1, decision: "PUBLIC_ELIGIBLE" };
  const disclosure = { public_disclosure_decision_id: "disc-1", report_id: reportId, report_version: 1, decision: "PUBLIC_DISCLOSURE_APPROVED", privacy_policy_reference: "PUBLIC_AGGREGATE_EDUCATION_ACTIVITY", privacy_policy_version: "1", review_context: { ...reviewContext, canonical_count: count } };
  const policy = { policy_id: "policy-1", policy_key: "PUBLIC_AGGREGATE_EDUCATION_ACTIVITY", policy_version: 1, policy_definition: APPROVED_CURRICULUM_POLICY_V1 };
  const repo = { async createSnapshot(input: any) { const row = { ...input, version: 1, created_at: "2026-08-26T00:00:00.000Z" }; records.set(row.public_snapshot_id, row); return row; }, async getByIdempotencyKey(key: string) { return [...records.values()].find((row) => row.idempotency_key === key) || null; }, async getSnapshot(id: string, scope: any) { const row = records.get(id); return row?.tenant_id === scope.tenant_id && row?.organization_id === scope.organization_id ? row : null; }, async listSnapshots(scope: any) { return [...records.values()].filter((row) => row.tenant_id === scope.tenant_id && row.organization_id === scope.organization_id); } };
  const eligRepo = { async getDecision() { return eligibility; }, async getLatestEligible() { return eligibility; } };
  const disclosureRepo = { async getDecision() { return disclosure; } };
  const policyRepo = { async getApprovedPolicy() { return policy; } };
  const service = new ReportPublicSnapshotService(repo as any, eligRepo as any, disclosureRepo as any, policyRepo as any, async (fn: any) => fn({}), async (event: any) => { audits.push(event); });
  return { service, records, audits, result: { ...baseResult, canonical_count: count }, disclosure };
}

test("creates an immutable public-safe snapshot and audit without private count", async () => {
  const { service, records, audits, result } = harness();
  const created = await service.createSnapshot({ report_result: result, public_eligibility_decision_id: "elig-1", public_disclosure_decision_id: "disc-1", idempotency_key: "snapshot-q1" }, actor);
  assert.equal(created.snapshot.public_display_value, "27");
  assert.equal(created.snapshot.public_representation_type, "EXACT_COUNT");
  assert.equal(created.snapshot.created_by_user_id, actor.user_id);
  assert.equal("canonical_count" in created.snapshot, false);
  assert.equal(created.snapshot.snapshot_hash.length, 64);
  assert.equal(audits[0].action_type, "report.public_snapshot.created");
  assert.equal(records.size, 1);
});

test("suppresses nine, preserves safe zero, and never stores the suppressed integer", async () => {
  const low = harness(9); const lowResult = { ...low.result };
  const lowSnapshot = await low.service.createSnapshot({ report_result: lowResult, public_eligibility_decision_id: "elig-1", public_disclosure_decision_id: "disc-1", idempotency_key: "snapshot-9" }, actor);
  assert.equal(lowSnapshot.snapshot.public_display_value, "<10");
  assert.equal(JSON.stringify(lowSnapshot.snapshot).includes("canonical_count"), false);
  const zero = harness(0); zero.disclosure.review_context.zero_publicly_safe = true;
  const zeroSnapshot = await zero.service.createSnapshot({ report_result: { ...zero.result }, public_eligibility_decision_id: "elig-1", public_disclosure_decision_id: "disc-1", idempotency_key: "snapshot-0" }, actor);
  assert.equal(zeroSnapshot.snapshot.public_display_value, "0");
});

test("requires exact governed result and fails closed for unauthorized slices or scope", async () => {
  const { service, result } = harness();
  await assert.rejects(() => service.createSnapshot({ report_result: { ...result, report_version: 2 }, public_eligibility_decision_id: "elig-1", public_disclosure_decision_id: "disc-1", idempotency_key: "bad-version" }, actor), /Only curriculum/);
  await assert.rejects(() => service.createSnapshot({ report_result: { ...result, geography: "MUNICIPALITY" }, public_eligibility_decision_id: "elig-1", public_disclosure_decision_id: "disc-1", idempotency_key: "bad-geo" }, actor), /Public geography/);
  await assert.rejects(() => service.createSnapshot({ report_result: { ...result, report_result_id: "arbitrary-result" }, public_eligibility_decision_id: "elig-1", public_disclosure_decision_id: "disc-1", idempotency_key: "bad-result" }, actor), /result reference/);
  await assert.rejects(() => service.createSnapshot({ report_result: { ...result, public_display_value: "999" }, public_eligibility_decision_id: "elig-1", public_disclosure_decision_id: "disc-1", idempotency_key: "client-value" }, { ...actor, permissions: [] }), /Missing permission/);
});

test("idempotent retry returns the same snapshot and conflicting reuse is rejected", async () => {
  const { service, result } = harness();
  const input = { report_result: result, public_eligibility_decision_id: "elig-1", public_disclosure_decision_id: "disc-1", idempotency_key: "retry-1" };
  const first = await service.createSnapshot(input, actor); const second = await service.createSnapshot(input, actor);
  assert.equal(second.replayed, true); assert.equal(second.snapshot.public_snapshot_id, first.snapshot.public_snapshot_id);
  await assert.rejects(() => service.createSnapshot({ ...input, report_result: { ...result, reporting_period_label: "Q2 2026" } }, actor), /idempotency key conflicts/);
});

test("schema is scoped, immutable by API shape, and has no publication or file fields", () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS report_public_snapshots/);
  assert.match(migration, /UNIQUE \(tenant_id, organization_id, idempotency_key\)/);
  assert.match(migration, /public_display_value TEXT NOT NULL/);
  assert.doesNotMatch(migration, /PUBLISHED|publication_authorized|file_path|pdf/i);
});
