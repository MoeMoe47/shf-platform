import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { ReportPublicationService } from "../src/domain/reporting/report-publication-service.ts";

const migration = readFileSync(new URL("../migrations/025_report_publications.sql", import.meta.url), "utf8");
const reportId = "report.curriculum.lesson_completion_count.v1";
const actor = { user_id: "publisher-1", tenant_id: "tenant-1", organization_id: "org-1", permissions: ["reports.publication.execute"] };

function harness(display = "<10", representation = "SUPPRESSED_LT_10") {
  const publications: any[] = [];
  const projections: any[] = [];
  const audits: any[] = [];
  const authorization = { publication_authorization_id: "auth-1", public_snapshot_id: "snapshot-1", snapshot_version: 1, snapshot_hash: "a".repeat(64), status: "PUBLICATION_AUTHORIZED" };
  const snapshot = { public_snapshot_id: "snapshot-1", version: 1, snapshot_hash: "a".repeat(64), report_id: reportId, report_version: 1, public_population_eligible: true, data_as_of: "2026-08-01T00:00:00.000Z", public_display_value: display, public_representation_type: representation, suppression_state: representation === "SUPPRESSED_LT_10" ? "SUPPRESSED_LT_10" : "NONE", reporting_period_start: "2026-07-01", reporting_period_end: "2026-09-30", reporting_period: "QUARTERLY", reporting_period_label: "Q3 2026", geography_level: "STATE", program_granularity: "FOUNDATION_WIDE", public_eligibility_decision_id: "elig-1", public_disclosure_decision_id: "disc-1" };
  const actionRepo = {
    async getPublicationByIdempotencyKey(key: string) { return publications.find((item) => item.idempotency_key === key) || null; },
    async getPublication(id: string) { return publications.find((item) => item.publication_id === id) || null; },
    async createPublication(input: any) { const row = { ...input, publication_status: "PUBLISHED", version: 1 }; publications.push(row); return row; },
    async createProjection(input: any) { const row = { ...input, projection_status: "PUBLISHED", source_type: "CANONICAL_PUBLICATION", version: 1 }; projections.push(row); return row; },
    async getProjectionForPublication(id: string) { return projections.find((item) => item.publication_id === id) || null; },
    async listPublications() { return publications; },
    async listPublicProjections() { return projections; },
  };
  const service = new ReportPublicationService(
    { async getAuthorization() { return authorization; } } as any,
    { async getSnapshot() { return snapshot; } } as any,
    { async getDecision() { return { decision: "PUBLIC_ELIGIBLE", public_eligibility_decision_id: "elig-1" }; }, async getLatestEligible() { return { public_eligibility_decision_id: "elig-1" }; } } as any,
    { async getDecision() { return { decision: "PUBLIC_DISCLOSURE_APPROVED", report_id: reportId, report_version: 1, privacy_policy_reference: "PUBLIC_AGGREGATE_EDUCATION_ACTIVITY", privacy_policy_version: "1" }; } } as any,
    { async getApprovedPolicy() { return { policy_key: "PUBLIC_AGGREGATE_EDUCATION_ACTIVITY", policy_version: 1 }; } } as any,
    async (fn: any) => fn({}),
    async (event: any) => { audits.push(event); },
    actionRepo as any,
  );
  return { service, publications, projections, audits, snapshot };
}

const input = { publication_authorization_id: "auth-1", public_snapshot_id: "snapshot-1", snapshot_version: 1, snapshot_hash: "a".repeat(64), idempotency_key: "publish-1" };

test("publication writes one immutable canonical projection from the snapshot", async () => {
  const { service, publications, projections, audits } = harness();
  const result = await service.publish(input, actor);
  assert.equal(result.publication.publication_status, "PUBLISHED");
  assert.equal(result.projection.public_display_value, "<10");
  assert.equal(publications.length, 1);
  assert.equal(projections.length, 1);
  assert.equal(audits[0].action_type, "report.published");
});

test("execute permission and exact snapshot authorization are required", async () => {
  const { service } = harness();
  await assert.rejects(() => service.publish(input, { ...actor, permissions: ["reports.publication.authorize"] }), /reports.publication.execute/);
  await assert.rejects(() => service.publish({ ...input, snapshot_hash: "b".repeat(64) }, actor), /publication authorization snapshot binding/);
});

test("publication retry is idempotent and migration has no URL or delivery state", async () => {
  const { service, publications } = harness();
  await service.publish(input, actor);
  const retry = await service.publish(input, actor);
  assert.equal(retry.replayed, true);
  assert.equal(publications.length, 1);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS report_publications/);
  assert.match(migration, /CANONICAL_PUBLICATION/);
  assert.doesNotMatch(migration, /public_url|email|DELIVERED|SENT/);
});

test("safe exact values and zero remain snapshot-owned", async () => {
  const exact = harness("27", "EXACT_COUNT");
  const exactResult = await exact.service.publish({ ...input, idempotency_key: "publish-27" }, actor);
  assert.equal(exactResult.projection.public_display_value, "27");
  const zero = harness("0", "EXACT_COUNT");
  const zeroResult = await zero.service.publish({ ...input, idempotency_key: "publish-0" }, actor);
  assert.equal(zeroResult.projection.public_display_value, "0");
});
