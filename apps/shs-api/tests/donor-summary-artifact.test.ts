import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { DONOR_SUMMARY_COMPOSITION, ReportArtifactService } from "../src/domain/reporting/report-artifact-service.ts";

const routes = readFileSync(new URL("../src/domain/reporting/routes.ts", import.meta.url), "utf8");
const migration = readFileSync(new URL("../migrations/012_report_artifacts.sql", import.meta.url), "utf8");
const idempotencyMigration = readFileSync(new URL("../migrations/015_report_artifact_generation_idempotency.sql", import.meta.url), "utf8");

function actor(overrides: Record<string, unknown> = {}) {
  return {
    user_id: "server-user-1",
    organization_id: "org-server",
    tenant_id: "tenant-server",
    permissions: ["reports.export"],
    ...overrides,
  };
}

function harness() {
  const audits: any[] = [];
  const records = new Map<string, any>();
  const repo = {
    async findByGenerationIdempotencyKey(key: string, scope: any) {
      return [...records.values()].find((item) => item.generation_idempotency_key === key && item.tenant_id === scope.tenant_id && item.organization_id === scope.organization_id) || null;
    },
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
        generation_idempotency_key: input.generation_idempotency_key,
        version: 1,
      };
      records.set(record.artifact_id, record);
      return record;
    },
  };
  const transaction = async (fn: any) => fn({});
  const auditWriter = async (input: any) => {
    audits.push(input);
    return input;
  };
  return { service: new ReportArtifactService(repo as any, transaction, auditWriter), audits };
}

test("Donor Summary composition is fixed, restricted, versioned, and manifest-bound", async () => {
  const { service, audits } = harness();
  const artifact = await service.createDonorSummaryArtifact(actor(), { idempotency_key: "donor-summary-request-1" });

  assert.deepEqual(DONOR_SUMMARY_COMPOSITION, {
    type: "DONOR_SUMMARY",
    version: 1,
    classification: "RESTRICTED_EXTERNAL",
    report_id: "report.workforce.employment.started_verified_count.v1",
    report_version: 1,
  });
  assert.equal(artifact.composition_type, "DONOR_SUMMARY");
  assert.equal(artifact.composition_version, 1);
  assert.equal(artifact.classification, "RESTRICTED_EXTERNAL");
  assert.deepEqual(artifact.canonical_input_manifest, {
    reports: [{ report_id: DONOR_SUMMARY_COMPOSITION.report_id, report_version: 1 }],
  });
  assert.equal(artifact.tenant_id, "tenant-server");
  assert.equal(artifact.organization_id, "org-server");
  assert.equal(artifact.lifecycle_status, "GENERATED");
  assert.equal(artifact.content_hash, null);
  assert.equal(artifact.generation_idempotency_key, "donor-summary-request-1");
  assert.equal(audits[0].action_type, "report_artifact.generated");
  assert.equal(audits[0].target_object_id, artifact.artifact_id);
  assert.equal(JSON.stringify(artifact).includes("participant_ref"), false);
  assert.equal(JSON.stringify(artifact).includes("truth"), false);
  assert.equal(JSON.stringify(artifact).includes("evidence"), false);
});

test("Donor Summary requires export permission and cannot be client-configured", async () => {
  const { service } = harness();
  await assert.rejects(() => service.createDonorSummaryArtifact(actor({ permissions: ["reports.view"] }), { idempotency_key: "request-1" }), /permission/);
  await assert.rejects(() => service.createDonorSummaryArtifact(actor()), /idempotency key/);
  const source = service.createDonorSummaryArtifact.toString();
  assert.doesNotMatch(source, /canonical_input_manifest\s*[:=]\s*actor/);
  assert.doesNotMatch(source, /classification\s*[:=]\s*actor/);
  assert.doesNotMatch(source, /authorizeDistribution|report_distributions/);
});

test("Donor Summary generation retries replay the same artifact within scope", async () => {
  const { service } = harness();
  const first = await service.createDonorSummaryArtifact(actor(), { idempotency_key: "retry-1" });
  const retry = await service.createDonorSummaryArtifact(actor(), { idempotency_key: "retry-1" });
  assert.equal(retry.artifact_id, first.artifact_id);
  assert.match(idempotencyMigration, /UNIQUE INDEX/);
  assert.match(idempotencyMigration, /generation_idempotency_key/);
});

test("Donor Summary has a bounded authenticated artifact route and no delivery/public route", () => {
  assert.match(routes, /\/reporting\/compositions\/donor-summary\/artifacts/);
  assert.match(routes, /DONOR_SUMMARY_ARTIFACT_CREATE_REJECTED/);
  assert.match(routes, /SHS_SECURITY_PERMISSIONS\.REPORTS_EXPORT/);
  assert.doesNotMatch(routes, /donor-summary\/(?:distribute|send|share|publish)/);
  assert.match(migration, /canonical_input_manifest JSONB NOT NULL/);
});
