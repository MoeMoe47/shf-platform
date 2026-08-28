import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { ReportArtifactService } from "../src/domain/reporting/report-artifact-service.ts";

const migration = readFileSync(new URL("../migrations/012_report_artifacts.sql", import.meta.url), "utf8");
const routes = readFileSync(new URL("../src/domain/reporting/routes.ts", import.meta.url), "utf8");

function actor(overrides: Record<string, unknown> = {}) {
  return {
    user_id: "server-user-1",
    organization_id: "org-server",
    tenant_id: "tenant-server",
    ...overrides,
  };
}

function harness() {
  const records = new Map<string, any>();
  const audits: any[] = [];
  const repo = {
    async createArtifact(input: any) {
      const now = new Date("2026-08-26T12:00:00.000Z");
      const record = {
        ...input,
        created_by_user_id: input.actor_id,
        created_at: now,
        updated_at: now,
        artifact_version: 1,
        lifecycle_status: "GENERATED",
        content_hash: null,
        version: 1,
      };
      records.set(record.artifact_id, record);
      return record;
    },
    async getArtifact(id: string, scope: any) {
      const record = records.get(id);
      return record && record.tenant_id === scope.tenant_id && record.organization_id === scope.organization_id ? record : null;
    },
    async listArtifacts(scope: any) {
      return [...records.values()].filter((record) => record.tenant_id === scope.tenant_id && record.organization_id === scope.organization_id);
    },
  };
  const transaction = async (fn: any) => fn({});
  const auditWriter = async (input: any) => {
    audits.push(input);
    return input;
  };
  return { service: new ReportArtifactService(repo as any, transaction, auditWriter), records, audits };
}

test("artifact generation owns identity, scope, actor, classification, and lifecycle", async () => {
  const { service, records, audits } = harness();
  const artifact = await service.createArtifact({
    artifact_id: "attacker-id",
    tenant_id: "attacker-tenant",
    organization_id: "attacker-org",
    created_by: "attacker",
    created_at: "1999-01-01T00:00:00Z",
    public_approved: true,
    composition_type: "board_brief",
    composition_version: 1,
    classification: "internal",
    lifecycle_status: "PUBLISHED",
    canonical_input_manifest: {
      reports: [{ report_id: "report.workforce.employment.started_verified_count.v1", report_version: 1, truth: "must-not-persist" }],
    },
  }, actor());

  assert.match(artifact.artifact_id, /^artifact_/);
  assert.equal(artifact.tenant_id, "tenant-server");
  assert.equal(artifact.organization_id, "org-server");
  assert.equal(artifact.created_by_user_id, "server-user-1");
  assert.equal(artifact.classification, "INTERNAL");
  assert.equal(artifact.lifecycle_status, "GENERATED");
  assert.equal(artifact.content_hash, null);
  assert.deepEqual(artifact.canonical_input_manifest, {
    reports: [{ report_id: "report.workforce.employment.started_verified_count.v1", report_version: 1 }],
  });
  assert.equal(records.size, 1);
  assert.equal(audits[0].action_type, "report_artifact.generated");
  assert.equal(audits[0].target_object_id, artifact.artifact_id);
  assert.equal(JSON.stringify(artifact).includes("must-not-persist"), false);
});

test("artifact reads are scoped and list only the server-derived organization", async () => {
  const { service } = harness();
  const artifact = await service.createArtifact({
    composition_type: "grant_narrative",
    composition_version: 1,
    classification: "RESTRICTED_EXTERNAL",
    canonical_input_manifest: { reports: [{ report_id: "report.example.v1", report_version: 1 }] },
  }, actor());

  assert.ok(await service.getArtifact(artifact.artifact_id, actor()));
  assert.equal(await service.getArtifact(artifact.artifact_id, actor({ tenant_id: "other-tenant" })), null);
  assert.equal(await service.getArtifact(artifact.artifact_id, actor({ organization_id: "other-org" })), null);
  assert.equal((await service.listArtifacts(actor({ organization_id: "other-org" }))).length, 0);
});

test("artifact persistence and routes exclude publication authority", () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS report_artifacts/);
  assert.match(migration, /classification TEXT NOT NULL CHECK \(classification IN \('INTERNAL', 'RESTRICTED_EXTERNAL', 'PUBLIC'\)\)/);
  assert.match(migration, /lifecycle_status TEXT NOT NULL DEFAULT 'GENERATED' CHECK \(lifecycle_status IN \('GENERATED'\)\)/);
  assert.match(migration, /canonical_input_manifest JSONB NOT NULL/);
  assert.match(routes, /\/reporting\/artifacts/);
  assert.match(routes, /SHS_SECURITY_PERMISSIONS\.REPORTS_EXPORT/);
  assert.match(routes, /SHS_SECURITY_PERMISSIONS\.REPORTS_VIEW/);
  assert.doesNotMatch(routes, /\/reporting\/artifacts[^\"]*\/publish/is);
});

test("invalid manifests and classifications fail closed", async () => {
  const { service } = harness();
  await assert.rejects(() => service.createArtifact({ composition_type: "board_brief", composition_version: 1, classification: "INTERNAL", canonical_input_manifest: { reports: [] } }, actor()), /canonical report input/);
  await assert.rejects(() => service.createArtifact({ composition_type: "board_brief", composition_version: 1, classification: "INTERNAL", canonical_input_manifest: { reports: [{ report_id: "x", report_version: 0 }] } }, actor()), /report_version/);
  await assert.rejects(() => service.createArtifact({ composition_type: "board_brief", composition_version: 1, classification: "PUBLICATION_APPROVED", canonical_input_manifest: { reports: [{ report_id: "x", report_version: 1 }] } }, actor()), /Unsupported report artifact classification/);
});
