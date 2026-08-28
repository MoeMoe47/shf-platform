import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { ReportPublicationService } from "../src/domain/reporting/report-publication-service.ts";

const migration = readFileSync(new URL("../migrations/024_report_publication_authority.sql", import.meta.url), "utf8");
const reportId = "report.curriculum.lesson_completion_count.v1";
const actor = { user_id: "publisher-1", tenant_id: "tenant-1", organization_id: "org-1", permissions: ["reports.publication.authorize"] };

function harness() {
  const rows = new Map<string, any>(); const audits: any[] = [];
  const snapshot = { public_snapshot_id: "snapshot-1", version: 1, snapshot_hash: "a".repeat(64), report_id: reportId, report_version: 1, public_population_eligible: true, data_as_of: "2026-08-01T00:00:00.000Z", public_display_value: "<10", public_representation_type: "SUPPRESSED_LT_10", public_eligibility_decision_id: "elig-1", public_disclosure_decision_id: "disc-1", tenant_id: "tenant-1", organization_id: "org-1" };
  const repo = { async getAuthority() { return { authority_id: "authority-1", authority_type: "SHF_EXECUTIVE_AUTHORITY", authority_reference: "shf-executive-authority", status: "ACTIVE", effective_at: "2026-01-01T00:00:00.000Z", tenant_id: "tenant-1", organization_id: "org-1" }; }, async getReleaseApproval(id: string) { return id === "release-1" ? { release_approval_id: "release-1", public_snapshot_id: "snapshot-1", snapshot_version: 1, snapshot_hash: "a".repeat(64), authority_id: "authority-1", approval_category: "PUBLIC_REPORTING_RELEASE_APPROVAL", status: "APPROVED", tenant_id: "tenant-1", organization_id: "org-1" } : null; }, async getByIdempotencyKey(key: string) { return [...rows.values()].find((row) => row.idempotency_key === key) || null; }, async createAuthorization(input: any) { const row = { ...input, status: "PUBLICATION_AUTHORIZED", version: 1, authorized_at: "2026-08-26T00:00:00.000Z" }; rows.set(row.publication_authorization_id, row); return row; }, async getAuthorization(id: string) { return rows.get(id) || null; }, async listAuthorizations() { return [...rows.values()]; } };
  const snapshotRepo = { async getSnapshot() { return snapshot; } };
  const eligibility = { async getDecision() { return { public_eligibility_decision_id: "elig-1", report_id: reportId, report_version: 1, decision: "PUBLIC_ELIGIBLE" }; }, async getLatestEligible() { return { public_eligibility_decision_id: "elig-1" }; } };
  const disclosure = { async getDecision() { return { public_disclosure_decision_id: "disc-1", report_id: reportId, report_version: 1, decision: "PUBLIC_DISCLOSURE_APPROVED", privacy_policy_reference: "PUBLIC_AGGREGATE_EDUCATION_ACTIVITY", privacy_policy_version: "1" }; } };
  const policies = { async getApprovedPolicy() { return { policy_key: "PUBLIC_AGGREGATE_EDUCATION_ACTIVITY", policy_version: 1 }; } };
  const service = new ReportPublicationService(repo as any, snapshotRepo as any, eligibility as any, disclosure as any, policies as any, async (fn: any) => fn({}), async (event: any) => { audits.push(event); });
  return { service, rows, audits, snapshot };
}

const input = { public_snapshot_id: "snapshot-1", snapshot_version: 1, snapshot_hash: "a".repeat(64), institutional_authority_reference: "authority-1", release_approval_reference: "release-1", idempotency_key: "publication-1" };

test("authorizes the exact immutable snapshot only after institutional release approval", async () => {
  const { service, audits } = harness();
  const result = await service.authorize(input, actor);
  assert.equal(result.authorization.status, "PUBLICATION_AUTHORIZED");
  assert.equal(result.authorization.public_snapshot_id, "snapshot-1");
  assert.equal(result.authorization.snapshot_hash, "a".repeat(64));
  assert.equal(audits[0].action_type, "report.publication.authorized");
});

test("technical permission and exact snapshot binding fail closed", async () => {
  const { service } = harness();
  await assert.rejects(() => service.authorize(input, { ...actor, permissions: ["reports.publish"] }), /reports.publication.authorize/);
  await assert.rejects(() => service.authorize({ ...input, snapshot_hash: "b".repeat(64) }, actor), /immutable public snapshot binding/);
  await assert.rejects(() => service.authorize({ ...input, release_approval_reference: "missing" }, actor), /institutional release approval/);
});

test("authorization is idempotent and does not create publication state or URLs", async () => {
  const { service, rows } = harness();
  const first = await service.authorize(input, actor); const second = await service.authorize(input, actor);
  assert.equal(second.replayed, true); assert.equal(rows.size, 1);
  assert.equal(first.authorization.status, "PUBLICATION_AUTHORIZED");
  assert.match(migration, /PUBLICATION_AUTHORIZED/);
  assert.doesNotMatch(migration, /PUBLISHED|public_url/i);
});
