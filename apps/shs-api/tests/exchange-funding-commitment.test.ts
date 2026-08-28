import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { ExchangeFundingCommitmentService } from "../src/domain/exchange-funding-commitment/service/exchange-funding-commitment-service";
import { buildFundingCommitmentCommittedOutboxEvent } from "../src/domain/trusted-reporting/outbox";
import { SHS_SECURITY_PERMISSIONS, getPermissionsForRole } from "../src/auth/security-permissions";

const migration = readFileSync(new URL("../migrations/010_exchange_funding_commitments.sql", import.meta.url), "utf8");
const routes = readFileSync(new URL("../src/domain/exchange-funding-commitment/api/routes.ts", import.meta.url), "utf8");
const serviceSource = readFileSync(new URL("../src/domain/exchange-funding-commitment/service/exchange-funding-commitment-service.ts", import.meta.url), "utf8");

function actor(overrides: Record<string, unknown> = {}) {
  return {
    user_id: "user-commitment-authority",
    tenant_id: "tenant-commitment",
    organization_id: "org-committer",
    ...overrides,
  };
}

function harness({ failOutbox = false } = {}) {
  const records = new Map<string, any>();
  const audits: any[] = [];
  const outboxEvents: any[] = [];
  const repo = {
    async createCommitment(input: any) {
      const now = new Date("2026-08-26T12:00:00.000Z");
      const record = {
        commitmentId: input.commitment_id,
        commitment_id: input.commitment_id,
        tenant_id: input.tenant_id,
        organization_id: input.organization_id,
        createdBy: input.actor_id,
        created_by_user_id: input.actor_id,
        committedBy: null,
        committed_by_user_id: null,
        recipientOrganizationId: input.recipient_organization_id,
        recipient_organization_id: input.recipient_organization_id,
        amountMinor: input.amount_minor,
        amount_minor: input.amount_minor,
        currency: input.currency,
        lifecycleStatus: "draft",
        lifecycle_status: "draft",
        version: 1,
        createdAt: now,
        updatedAt: now,
        committedAt: null,
        committed_at: null,
        cancelledAt: null,
        cancelled_at: null,
      };
      records.set(record.commitmentId, record);
      return record;
    },
    async getCommitment(id: string, scope: any) {
      const record = records.get(id);
      return record && record.tenant_id === scope.tenant_id && record.organization_id === scope.organization_id ? record : null;
    },
    async listCommitments(scope: any) {
      return [...records.values()].filter((record) => record.tenant_id === scope.tenant_id && record.organization_id === scope.organization_id);
    },
    async updateDraft(id: string, scope: any, input: any, expectedVersion: number) {
      const current = await this.getCommitment(id, scope);
      if (!current || current.version !== expectedVersion || current.lifecycleStatus !== "draft") return null;
      const updated = { ...current, ...input, recipientOrganizationId: input.recipient_organization_id, amountMinor: input.amount_minor, version: current.version + 1 };
      records.set(id, updated);
      return updated;
    },
    async transition(id: string, scope: any, from: string, to: string, expectedVersion: number, timestampColumn: string) {
      const current = await this.getCommitment(id, scope);
      if (!current || current.version !== expectedVersion || current.lifecycleStatus !== from) return null;
      const now = new Date("2026-08-26T12:05:00.000Z");
      const updated = { ...current, lifecycleStatus: to, lifecycle_status: to, version: current.version + 1, [timestampColumn.replace("_at", "At")]: now, [timestampColumn]: now, ...(to === "committed" ? { committedBy: scope.actor_id, committed_by_user_id: scope.actor_id } : {}) };
      records.set(id, updated);
      return updated;
    },
  };
  const transaction = async (fn: any) => {
    const snapshot = new Map([...records.entries()].map(([id, record]) => [id, { ...record }]));
    const auditCount = audits.length;
    const outboxCount = outboxEvents.length;
    try {
      return await fn({});
    } catch (error) {
      records.clear();
      for (const [id, record] of snapshot) records.set(id, record);
      audits.length = auditCount;
      outboxEvents.length = outboxCount;
      throw error;
    }
  };
  const failingOutbox = {
    async enqueue(input: any) {
      if (failOutbox) throw new Error("outbox unavailable");
      outboxEvents.push(input);
      return input;
    },
  };
  const service = new ExchangeFundingCommitmentService(
    repo as any,
    transaction,
    async (input: any) => { audits.push(input); return input; },
    failingOutbox as any,
  );
  return { service, records, audits, outboxEvents };
}

test("commitment authority is server-owned and money is integer minor units", async () => {
  const { service, records, audits } = harness();
  const created = await service.createCommitment({
    commitment_id: "attacker-id",
    tenant_id: "attacker-tenant",
    organization_id: "attacker-org",
    created_by: "attacker",
    created_at: "1999-01-01T00:00:00Z",
    committed_at: "1999-01-01T00:00:00Z",
    lifecycle: "committed",
    recipient_organization_id: "org-recipient",
    amount_minor: 125050,
    currency: "usd",
  }, actor());

  assert.match(created.commitmentId, /^commitment_/);
  assert.equal(created.tenant_id, "tenant-commitment");
  assert.equal(created.organization_id, "org-committer");
  assert.equal(created.createdBy, "user-commitment-authority");
  assert.equal(created.amountMinor, 125050);
  assert.equal(created.currency, "USD");
  assert.equal(created.lifecycleStatus, "draft");
  assert.equal(created.version, 1);
  assert.equal(records.size, 1);
  assert.equal(audits[0].action_type, "funding_commitment.created");
});

test("draft update and commit are versioned and audited", async () => {
  const { service, audits, outboxEvents } = harness();
  const created = await service.createCommitment({ recipientOrganizationId: "org-recipient", amountMinor: 1000, currency: "USD" }, actor());
  const updated = await service.updateCommitment(created.commitmentId, { recipientOrganizationId: "org-recipient-2", amountMinor: 2000, currency: "USD" }, actor(), 1);
  assert.equal(updated.version, 2);
  assert.equal(updated.amountMinor, 2000);
  const committed = await service.commitCommitment(created.commitmentId, actor(), 2);
  assert.equal(committed.lifecycleStatus, "committed");
  assert.equal(committed.version, 3);
  assert.ok(committed.committedAt);
  assert.equal(committed.committedBy, "user-commitment-authority");
  assert.equal(outboxEvents.length, 1);
  assert.equal(outboxEvents[0].producer_id, "shs.exchange");
  assert.equal(outboxEvents[0].event_type, "funding_commitment.committed");
  assert.equal(outboxEvents[0].schema_version, "v1");
  assert.equal(outboxEvents[0].subject_id, created.commitmentId);
  assert.equal(outboxEvents[0].occurred_at, "2026-08-26T12:05:00.000Z");
  assert.equal(outboxEvents[0].idempotency_key, `exchange-funding-commitment:${created.commitmentId}:committed`);
  assert.deepEqual(outboxEvents[0].payload, {
    commitment_id: created.commitmentId,
    recipient_organization_id: "org-recipient-2",
    amount_minor: 2000,
    currency: "USD",
    lifecycle_status: "committed",
    version: 3,
  });
  assert.deepEqual(audits.map((item) => item.action_type), [
    "funding_commitment.created",
    "funding_commitment.updated",
    "funding_commitment.committed",
  ]);
  await assert.rejects(() => service.updateCommitment(created.commitmentId, { recipientOrganizationId: "org-x", amountMinor: 3000, currency: "USD" }, actor(), 3), /Only draft/);
  await assert.rejects(() => service.commitCommitment(created.commitmentId, actor(), 2), /version conflict/);
});

test("cancellation preserves the record and cannot be reopened", async () => {
  const { service, records, audits, outboxEvents } = harness();
  const created = await service.createCommitment({ recipientOrganizationId: "org-recipient", amountMinor: 5000, currency: "EUR" }, actor());
  const cancelled = await service.cancelCommitment(created.commitmentId, actor(), 1);
  assert.equal(cancelled.lifecycleStatus, "cancelled");
  assert.ok(cancelled.cancelledAt);
  assert.equal(records.size, 1);
  assert.equal(audits.at(-1).action_type, "funding_commitment.cancelled");
  assert.equal(outboxEvents.length, 0);
  await assert.rejects(() => service.cancelCommitment(created.commitmentId, actor(), 1), /cannot re-enter lifecycle/);
});

test("scope isolation and explicit mutation permissions are defined", async () => {
  const { service } = harness();
  const created = await service.createCommitment({ recipientOrganizationId: "org-recipient", amountMinor: 1, currency: "USD" }, actor());
  assert.equal(await service.getCommitment(created.commitmentId, actor({ tenant_id: "other-tenant" })), null);
  assert.equal(await service.getCommitment(created.commitmentId, actor({ organization_id: "other-org" })), null);
  assert.ok(getPermissionsForRole("shs_admin").includes(SHS_SECURITY_PERMISSIONS.EXCHANGE_FUNDING_COMMITMENTS_MANAGE));
  assert.ok(getPermissionsForRole("shf_admin").includes(SHS_SECURITY_PERMISSIONS.EXCHANGE_FUNDING_COMMITMENTS_VIEW));
  assert.match(routes, /EXCHANGE_FUNDING_COMMITMENTS_MANAGE/);
  assert.match(routes, /EXCHANGE_FUNDING_COMMITMENTS_VIEW/);
});

test("migration has bounded lifecycle, monetary, scope, and recipient protections without Trusted Reporting", () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS exchange_funding_commitments/);
  assert.match(migration, /amount_minor BIGINT NOT NULL CHECK \(amount_minor > 0\)/);
  assert.match(migration, /currency TEXT NOT NULL CHECK \(currency ~ '\^\[A-Z\]\{3\}\$'/);
  assert.match(migration, /lifecycle_status IN \('draft', 'committed', 'cancelled'\)/);
  assert.match(migration, /recipient_organization_id TEXT NOT NULL REFERENCES organizations/);
  assert.match(migration, /committed_by_user_id TEXT REFERENCES users/);
  assert.match(migration, /idx_exchange_funding_commitments_scope/);
  assert.match(migration, /idx_exchange_funding_commitments_recipient/);
  assert.equal(routes.includes("IntegrationOutbox"), false);
  assert.equal(routes.includes("truth"), false);
  assert.match(serviceSource, /IntegrationOutbox|buildFundingCommitmentCommittedOutboxEvent/);
  assert.doesNotMatch(serviceSource, /Evidence|Truth|metric|Reporting Service/i);
});

test("committed producer payload is minimized and deterministic", () => {
  const event = buildFundingCommitmentCommittedOutboxEvent({
    commitment_id: "commitment_synthetic",
    tenant_id: "tenant-commitment",
    organization_id: "org-committer",
    created_by_user_id: "user-commitment-authority",
    committed_by_user_id: "user-commitment-authority",
    recipient_organization_id: "org-recipient",
    amount_minor: 125050,
    currency: "USD",
    committed_at: new Date("2026-08-26T12:00:00.000Z"),
    version: 2,
    narrative: "must not enter event",
  }, "corr_synthetic");
  assert.equal(event.producer_id, "shs.exchange");
  assert.equal(event.event_type, "funding_commitment.committed");
  assert.equal(event.idempotency_key, "exchange-funding-commitment:commitment_synthetic:committed");
  assert.equal(event.occurred_at, "2026-08-26T12:00:00.000Z");
  assert.equal(JSON.stringify(event).includes("narrative"), false);
  assert.equal(JSON.stringify(event).includes("transfer"), false);
  assert.equal(JSON.stringify(event).includes("settlement"), false);
});

test("outbox failure rolls back the committed transition and audit together", async () => {
  const { service, records, audits, outboxEvents } = harness({ failOutbox: true });
  const created = await service.createCommitment({ recipientOrganizationId: "org-recipient", amountMinor: 100, currency: "USD" }, actor());
  await assert.rejects(() => service.commitCommitment(created.commitmentId, actor(), 1), /outbox unavailable/);
  const current = records.get(created.commitmentId);
  assert.equal(current.lifecycleStatus, "draft");
  assert.equal(current.version, 1);
  assert.equal(outboxEvents.length, 0);
  assert.equal(audits.filter((item) => item.action_type === "funding_commitment.committed").length, 0);
});
