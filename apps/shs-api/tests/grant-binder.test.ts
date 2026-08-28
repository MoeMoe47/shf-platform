import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { GrantBinderService } from "../src/domain/grant-binder/service/grant-binder-service.ts";
import { buildGrantBinderCreatedOutboxEvent } from "../src/domain/trusted-reporting/outbox.ts";

const migration = readFileSync(new URL("../migrations/009_grant_binders.sql", import.meta.url), "utf8");
const routes = readFileSync(new URL("../src/domain/grant-binder/api/routes.ts", import.meta.url), "utf8");

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
  const audits: any[] = [];
  const outboxEvents: any[] = [];
  let sequence = 0;
  const repo = {
    async createBinder(input: any) {
      const now = new Date("2026-08-25T12:00:00.000Z");
      const record = {
        binderId: input.binder_id,
        binder_id: input.binder_id,
        tenant_id: input.tenant_id,
        organization_id: input.organization_id,
        createdBy: input.actor_id,
        created_by: input.actor_id,
        title: input.title,
        lifecycleStatus: "draft",
        lifecycle_status: "draft",
        version: 1,
        createdAt: now,
        updatedAt: now,
      };
      records.set(record.binderId, record);
      return record;
    },
    async getBinder(binderId: string, scope: any) {
      const record = records.get(binderId);
      return record && record.tenant_id === scope.tenant_id && record.organization_id === scope.organization_id ? record : null;
    },
    async listBinders(scope: any) {
      return [...records.values()].filter((record) => record.tenant_id === scope.tenant_id && record.organization_id === scope.organization_id);
    },
    async updateBinder(binderId: string, scope: any, title: string, expectedVersion: number) {
      const current = await this.getBinder(binderId, scope);
      if (!current || current.version !== expectedVersion) return null;
      const updated = { ...current, title, version: current.version + 1, updatedAt: new Date(`2026-08-25T12:0${++sequence}:00.000Z`) };
      records.set(binderId, updated);
      return updated;
    },
  };
  const transaction = async (fn: any) => fn({});
  const auditWriter = async (input: any) => {
    audits.push(input);
    return input;
  };
  const outbox = { async enqueue(input: any) { outboxEvents.push(input); return input; } };
  return { service: new GrantBinderService(repo as any, transaction, auditWriter, outbox as any), records, audits, outboxEvents };
}

test("create owns identity, scope, timestamps, lifecycle, and audit server-side", async () => {
  const { service, records, audits } = harness();
  const created = await service.createBinder({
    title: "Synthetic Binder",
    binder_id: "attacker-id",
    tenant_id: "attacker-tenant",
    organization_id: "attacker-org",
    created_by: "attacker",
    created_at: "1999-01-01T00:00:00Z",
    lifecycle: "approved",
    readinessPercentage: 99,
  }, actor());

  assert.match(created.binderId, /^binder_/);
  assert.equal(created.tenant_id, "tenant-server");
  assert.equal(created.organization_id, "org-server");
  assert.equal(created.createdBy, "server-user-1");
  assert.equal(created.lifecycleStatus, "draft");
  assert.equal(created.version, 1);
  assert.equal(records.size, 1);
  assert.equal(audits[0].action_type, "grant_binder.created");
  assert.equal(audits[0].target_object_id, created.binderId);
  assert.equal(audits[0].new_state_json.readinessPercentage, undefined);
});

test("reads and updates are tenant/org scoped and version checked", async () => {
  const { service, audits } = harness();
  const created = await service.createBinder({ title: "Initial" }, actor());

  assert.equal((await service.getBinder(created.binderId, actor({ tenant_id: "other-tenant" }))), null);
  assert.equal((await service.getBinder(created.binderId, actor({ organization_id: "other-org" }))), null);

  const updated = await service.updateBinder(created.binderId, { title: "Updated", version: 99 }, actor(), 1);
  assert.equal(updated.title, "Updated");
  assert.equal(updated.version, 2);
  assert.equal(audits.at(-1).action_type, "grant_binder.updated");
  await assert.rejects(() => service.updateBinder(created.binderId, { title: "Stale" }, actor(), 1), /version conflict/);
});

test("lifecycle is draft-only and creation emits only the minimized producer event", async () => {
  const { service, outboxEvents } = harness();
  const created = await service.createBinder({ lifecycle: "submitted" }, actor());
  assert.equal(created.lifecycleStatus, "draft");
  assert.equal(outboxEvents.length, 1);
  assert.equal(outboxEvents[0].producer_id, "shs.grant_binder");
  assert.equal(outboxEvents[0].event_type, "grant_binder.created");
  assert.equal(outboxEvents[0].subject_id, created.binderId);
  assert.equal(outboxEvents[0].idempotency_key, `grant-binder:${created.binderId}:created`);
  assert.deepEqual(outboxEvents[0].payload, {
    binder_id: created.binderId,
    lifecycle_status: "draft",
    version: 1,
  });
  assert.equal(JSON.stringify(outboxEvents[0]).includes("readiness"), false);
  assert.equal(JSON.stringify(outboxEvents[0]).includes("duration"), false);
});

test("producer builder is server-scoped, minimized, and deterministic", () => {
  const input = {
    binder_id: "binder_synthetic",
    tenant_id: "tenant-server",
    organization_id: "org-server",
    created_by_user_id: "server-user-1",
    created_at: new Date("2026-08-25T12:00:00.000Z"),
    lifecycle_status: "draft",
    version: 1,
    title: "Sensitive title is not event payload",
    activityTotals: { minutes: 42 },
  };
  const event = buildGrantBinderCreatedOutboxEvent(input, "corr_synthetic");
  assert.equal(event.schema_version, "v1");
  assert.equal(event.occurred_at, "2026-08-25T12:00:00.000Z");
  assert.deepEqual(event.payload, { binder_id: "binder_synthetic", lifecycle_status: "draft", version: 1 });
  assert.equal(JSON.stringify(event).includes("Sensitive title"), false);
  assert.equal(JSON.stringify(event).includes("activityTotals"), false);
});

test("updates remain audit/version activity and do not emit a second creation event", async () => {
  const { service, outboxEvents } = harness();
  const created = await service.createBinder({}, actor());
  await service.updateBinder(created.binderId, { title: "Updated" }, actor(), 1);
  assert.equal(outboxEvents.length, 1);
  assert.equal(outboxEvents[0].event_type, "grant_binder.created");
});

test("migration and routes enforce the minimal backend contract", () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS grant_binders/);
  assert.match(migration, /binder_id TEXT PRIMARY KEY/);
  assert.match(migration, /organization_id TEXT NOT NULL REFERENCES organizations/);
  assert.match(migration, /lifecycle_status TEXT NOT NULL DEFAULT 'draft' CHECK \(lifecycle_status IN \('draft'\)\)/);
  assert.match(migration, /CREATE INDEX IF NOT EXISTS idx_grant_binders_scope/);
  assert.match(routes, /"\/grant-binders"/);
  assert.match(routes, /"\/grant-binders\/:binderId"/);
  assert.match(routes, /SHS_SECURITY_PERMISSIONS\.REPORTS_PREVIEW/);
  assert.match(routes, /SHS_SECURITY_PERMISSIONS\.REPORTS_VIEW/);
  assert.match(routes, /grant-binders/);
  assert.equal(routes.includes("truth"), false);
});
