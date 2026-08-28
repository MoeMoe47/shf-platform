import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { ReportDraftService } from "../src/domain/reporting/report-draft-service.ts";
import { buildReportCreatedOutboxEvent } from "../src/domain/trusted-reporting/outbox.ts";

const migration = readFileSync(new URL("../migrations/008_report_drafts.sql", import.meta.url), "utf8");
const routes = readFileSync(new URL("../src/domain/reporting/routes.ts", import.meta.url), "utf8");

function actor(overrides: Record<string, unknown> = {}) {
  return {
    user_id: "server-user-1",
    organization_id: "org-server",
    tenant_id: "tenant-server",
    permissions: ["reports.preview", "reports.view"],
    ...overrides,
  };
}

function harness() {
  const records = new Map<string, any>();
  const revisions: any[] = [];
  const audits: any[] = [];
  const outboxEvents: any[] = [];
  const repo = {
    async createDraft(input: any) {
      const now = new Date("2026-08-25T12:00:00.000Z");
      const record = { ...input, created_by_user_id: input.actor_id, updated_at_user_id: input.actor_id, created_at: now, updated_at: now, version: 1, lifecycle_status: "draft" };
      records.set(record.report_id, record);
      return record;
    },
    async getDraft(reportId: string, scope: any) {
      const record = records.get(reportId);
      return record && record.tenant_id === scope.tenant_id && record.organization_id === scope.organization_id ? record : null;
    },
    async listDrafts(scope: any) {
      return [...records.values()].filter((record) => record.tenant_id === scope.tenant_id && record.organization_id === scope.organization_id);
    },
    async listRevisions(reportId: string, scope: any) {
      return revisions
        .filter((revision) => revision.report_id === reportId && revision.tenant_id === scope.tenant_id && revision.organization_id === scope.organization_id)
        .sort((a, b) => b.version - a.version)
        .map((revision) => ({
          revisionId: revision.revision_id,
          reportId: revision.report_id,
          tenant_id: revision.tenant_id,
          organization_id: revision.organization_id,
          version: revision.version,
          createdAt: revision.created_at,
        }));
    },
    async updateDraft(reportId: string, scope: any, input: any) {
      const current = await this.getDraft(reportId, scope);
      if (!current) return null;
      const next = { ...current, ...input, version: current.version + 1, updated_at: new Date("2026-08-25T12:01:00.000Z") };
      records.set(reportId, next);
      return next;
    },
    async createRevision(record: any) {
      revisions.push({ report_id: record.report_id, revision_id: `revision_${revisions.length + 1}`, tenant_id: record.tenant_id, organization_id: record.organization_id, version: record.version, snapshot_json: record, created_at: new Date() });
    },
  };
  const transaction = async (fn: any) => fn({});
  const auditWriter = async (input: any) => {
    audits.push(input);
    return input;
  };
  const outbox = { async enqueue(input: any) { outboxEvents.push(input); return input; } };
  return { service: new ReportDraftService(repo as any, transaction, auditWriter, outbox as any), records, revisions, audits, outboxEvents };
}

test("create derives scope and identity and ignores client authority fields", async () => {
  const { service, records, audits } = harness();
  const created = await service.createDraft({
    reportType: "generic-shs-report",
    subjectName: "Synthetic Client",
    tenant_id: "attacker-tenant",
    organization_id: "attacker-org",
    report_id: "attacker-id",
    created_at: "1999-01-01T00:00:00Z",
    created_by: "attacker",
    lifecycleStatus: "approved",
  }, actor());

  assert.match(created.report_id, /^report_/);
  assert.equal(created.tenant_id, "tenant-server");
  assert.equal(created.organization_id, "org-server");
  assert.equal(created.createdBy || created.created_by_user_id, "server-user-1");
  assert.equal(created.lifecycle_status, "draft");
  assert.equal(records.size, 1);
  assert.equal(audits[0].action_type, "report_draft.created");
});

test("update is scoped, versioned, and creates immutable history", async () => {
  const { service, revisions, audits } = harness();
  const created = await service.createDraft({ reportType: "generic-shs-report", subjectName: "Synthetic Client" }, actor());
  const updated = await service.updateDraft(created.report_id, { subjectName: "Updated Client", version: 99 }, actor(), 1);

  assert.equal(updated.subject_name, "Updated Client");
  assert.equal(updated.version, 2);
  assert.equal(updated.lifecycle_status, "draft");
  assert.equal(revisions.length, 2);
  assert.equal(audits.at(-1).action_type, "report_draft.updated");
});

test("cross-tenant and cross-organization reads are concealed", async () => {
  const { service } = harness();
  const created = await service.createDraft({ reportType: "generic-shs-report" }, actor());
  assert.equal(await service.getDraft(created.report_id, actor({ tenant_id: "other-tenant" })), null);
  assert.equal(await service.getDraft(created.report_id, actor({ organization_id: "other-org" })), null);
});

test("stale version and unsupported lifecycle transitions fail closed", async () => {
  const { service } = harness();
  const created = await service.createDraft({ reportType: "generic-shs-report" }, actor());
  await assert.rejects(() => service.updateDraft(created.report_id, {}, actor(), 7), /version conflict/);
  await assert.rejects(() => service.updateDraft(created.report_id, { lifecycle_status: "approved" }, actor(), 1), /Unsupported lifecycle status/);
});

test("draft persistence has scoped version/history constraints and authenticated route permissions", () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS report_drafts/);
  assert.match(migration, /organization_id TEXT NOT NULL REFERENCES organizations/);
  assert.match(migration, /lifecycle_status TEXT NOT NULL DEFAULT 'draft'/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS report_draft_revisions/);
  assert.match(migration, /UNIQUE \(report_id, version\)/);
  assert.match(routes, /\/reporting\/drafts/);
  assert.match(routes, /SHS_SECURITY_PERMISSIONS\.REPORTS_PREVIEW/);
});

test("report.created is the only defensible trusted producer event for draft creation", () => {
  const draft = {
    report_id: "report_synthetic-1",
    tenant_id: "tenant-server",
    organization_id: "org-server",
    created_by_user_id: "server-user-1",
    created_at: new Date("2026-08-25T12:00:00.000Z"),
    version: 1,
    lifecycle_status: "draft",
    report_type: "generic-shs-report",
    subject_name: "Sensitive narrative must not be copied",
    draft_config: { readiness: { score: 99 } },
  };
  const event = buildReportCreatedOutboxEvent(draft, "revision_synthetic-1", "corr_synthetic-1");
  assert.equal(event.producer_id, "shs.reporting");
  assert.equal(event.event_type, "report.created");
  assert.equal(event.schema_version, "v1");
  assert.equal(event.subject_id, draft.report_id);
  assert.equal(event.idempotency_key, "report:report_synthetic-1:created");
  assert.deepEqual(event.payload, {
    report_id: draft.report_id,
    revision_id: "revision_synthetic-1",
    report_version: 1,
    lifecycle_status: "draft",
  });
  assert.equal(JSON.stringify(event).includes("Sensitive narrative"), false);
  assert.equal(JSON.stringify(event).includes("readiness"), false);
});

test("draft creation enqueues one deterministic report.created event in the same transaction", async () => {
  const { service, outboxEvents } = harness();
  const created = await service.createDraft({ reportType: "generic-shs-report", subjectName: "Synthetic Client" }, actor());
  assert.equal(outboxEvents.length, 1);
  assert.equal(outboxEvents[0].subject_id, created.report_id);
  assert.equal(outboxEvents[0].event_type, "report.created");
  assert.equal(outboxEvents[0].payload.report_version, 1);
  assert.equal(outboxEvents[0].payload.lifecycle_status, "draft");
  assert.match(outboxEvents[0].payload.revision_id, /^revision_/);
});

test("draft updates remain audit/version activity and do not emit report.updated events", async () => {
  const { service, outboxEvents } = harness();
  const created = await service.createDraft({ reportType: "generic-shs-report" }, actor());
  await service.updateDraft(created.report_id, { subjectName: "Updated" }, actor(), 1);
  assert.equal(outboxEvents.length, 1);
  assert.equal(outboxEvents[0].event_type, "report.created");
});

test("revision retrieval is scoped, deterministic, and exposes safe history metadata", async () => {
  const { service } = harness();
  const created = await service.createDraft({ reportType: "generic-shs-report", subjectName: "Synthetic Client" }, actor());
  const revisions = await service.listRevisions(created.report_id, actor());

  assert.deepEqual(revisions.map((revision: any) => revision.version), [1]);
  assert.equal(revisions[0].reportId, created.report_id);
  assert.match(revisions[0].revisionId, /^revision_/);
  assert.equal("snapshot" in revisions[0], false);
  assert.equal("snapshot_json" in revisions[0], false);
  assert.deepEqual(await service.listRevisions(created.report_id, actor({ organization_id: "other-org" })), []);
});

test("history route is authenticated and does not expose a version mutation contract", () => {
  assert.match(routes, /\/reporting\/drafts\/:reportId\/revisions/);
  assert.match(routes, /SHS_SECURITY_PERMISSIONS\.REPORTS_VIEW/);
  assert.doesNotMatch(routes, /createReportVersion/);
});
