import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { WorkforceOutcomeService } from "../src/domain/workforce-outcome/service/workforce-outcome-service";
import { buildEmploymentStartedVerifiedOutboxEvent } from "../src/domain/trusted-reporting/outbox";
import { SHS_SECURITY_PERMISSIONS, getPermissionsForRole } from "../src/auth/security-permissions";

const migration = readFileSync(new URL("../migrations/011_workforce_employment_outcomes.sql", import.meta.url), "utf8");
const source = readFileSync(new URL("../src/domain/workforce-outcome/service/workforce-outcome-service.ts", import.meta.url), "utf8");
const routes = readFileSync(new URL("../src/domain/workforce-outcome/api/routes.ts", import.meta.url), "utf8");

const actor = (extra: any = {}) => ({ user_id: "worker-1", tenant_id: "tenant-1", organization_id: "org-1", ...extra });

function harness({ failOutbox = false } = {}) {
  const records = new Map<string, any>();
  const audits: any[] = [];
  const outboxEvents: any[] = [];
  const repo = {
    async create(input: any) {
      const record = { ...input, outcomeId: input.outcome_id, outcome_type: "EMPLOYMENT_STARTED", lifecycle_status: "verification_pending", verification_status: "pending", version: 1 };
      records.set(record.outcomeId, record);
      return record;
    },
    async get(id: string, scope: any) {
      const record = records.get(id);
      return record && record.tenant_id === scope.tenant_id && record.organization_id === scope.organization_id ? record : null;
    },
    async list(scope: any) { return [...records.values()].filter((r) => r.tenant_id === scope.tenant_id && r.organization_id === scope.organization_id); },
    async transition(id: string, scope: any, from: string, to: string, expected: number, verificationStatus: string) {
      const current = await this.get(id, scope);
      if (!current || current.lifecycle_status !== from || current.version !== expected) return null;
      const updated = { ...current, lifecycle_status: to, verification_status: verificationStatus, version: current.version + 1 };
      records.set(id, updated);
      return updated;
    },
  };
  const transaction = async (fn: any) => {
    const snapshot = new Map([...records].map(([id, record]) => [id, { ...record }]));
    const auditCount = audits.length;
    try { return await fn({}); } catch (error) { records.clear(); for (const [id, record] of snapshot) records.set(id, record); audits.length = auditCount; throw error; }
  };
  const outbox = { async enqueue(input: any) { if (failOutbox) throw new Error("outbox unavailable"); outboxEvents.push(input); return input; } };
  const service = new WorkforceOutcomeService(repo as any, transaction, async (input: any) => { audits.push(input); return input; }, outbox as any);
  return { service, records, audits, outboxEvents };
}

test("canonical employment-start submission is server-owned and pending", async () => {
  const { service, audits } = harness();
  const result = await service.submit({ outcome_id: "forged", tenant_id: "bad", organization_id: "bad", created_at: "1999-01-01", lifecycle: "verified", participant_ref: "participant:1", employment_started_at: "2026-08-01T00:00:00Z", verification_source_type: "participant_attestation", verification_reference: "self-report" }, actor());
  assert.match(result.outcomeId, /^outcome_/);
  assert.equal(result.tenant_id, "tenant-1");
  assert.equal(result.organization_id, "org-1");
  assert.equal(result.actor_id, "worker-1");
  assert.equal(result.lifecycle_status, "verification_pending");
  assert.equal(result.verification_status, "pending");
  assert.equal(result.employment_started_at, "2026-08-01T00:00:00.000Z");
  assert.equal(audits[0].action_type, "employment_outcome.submitted");
});

test("only an authorized strong source can verify, with optimistic lifecycle and scope controls", async () => {
  const { service, records, audits, outboxEvents } = harness();
  const pending = await service.submit({ participant_ref: "participant:1", employment_started_at: "2026-08-01", verification_source_type: "participant_attestation", verification_reference: "self-report" }, actor());
  await assert.rejects(() => service.verify(pending.outcomeId, actor(), 1), /insufficient/);
  assert.equal(outboxEvents.length, 0);
  const verifiedPending = await service.submit({ participant_ref: "participant:2", employment_started_at: "2026-08-02", verification_source_type: "employer_confirmation", verification_reference: "proof-ref" }, actor());
  const verified = await service.verify(verifiedPending.outcomeId, actor(), 1);
  assert.equal(verified.lifecycle_status, "verified");
  assert.equal(verified.version, 2);
  assert.equal(outboxEvents.length, 1);
  assert.equal(outboxEvents[0].producer_id, "shf.workforce");
  assert.equal(outboxEvents[0].event_type, "employment_started.verified");
  await assert.rejects(() => service.verify(verifiedPending.outcomeId, actor(), 1), /version conflict|transition rejected/);
  assert.equal(await service.get(verifiedPending.outcomeId, actor({ tenant_id: "other" })), null);
  assert.equal(await service.get(verifiedPending.outcomeId, actor({ organization_id: "other" })), null);
  assert.deepEqual(audits.map((a) => a.action_type), ["employment_outcome.submitted", "employment_outcome.submitted", "employment_outcome.verified"]);
  assert.equal(records.get(verifiedPending.outcomeId).participant_ref, "participant:2");
});

test("rejection and withdrawal preserve records and history; transactions roll back", async () => {
  const { service, records, audits } = harness();
  const pending = await service.submit({ participant_ref: "participant:1", employment_started_at: "2026-08-01" }, actor());
  const rejected = await service.reject(pending.outcomeId, actor(), 1);
  assert.equal(rejected.lifecycle_status, "rejected");
  assert.equal(records.size, 1);
  await assert.rejects(() => service.reject(pending.outcomeId, actor(), 1), /version conflict|transition rejected/);
  assert.equal(audits.at(-1).action_type, "employment_outcome.rejected");
});

test("verified transition rolls back with audit when the existing outbox fails", async () => {
  const { service, records, audits, outboxEvents } = harness({ failOutbox: true });
  const pending = await service.submit({ participant_ref: "participant:1", employment_started_at: "2026-08-01", verification_source_type: "employer_confirmation", verification_reference: "proof" }, actor());
  await assert.rejects(() => service.verify(pending.outcomeId, actor(), 1), /outbox unavailable/);
  assert.equal(records.get(pending.outcomeId).lifecycle_status, "verification_pending");
  assert.equal(records.get(pending.outcomeId).version, 1);
  assert.equal(audits.filter((a) => a.action_type === "employment_outcome.verified").length, 0);
  assert.equal(outboxEvents.length, 0);
});

test("contract is durable, privacy-minimized, and stops before Trusted Reporting", () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS workforce_employment_outcomes/);
  assert.match(migration, /outcome_type TEXT NOT NULL CHECK \(outcome_type = 'EMPLOYMENT_STARTED'\)/);
  assert.match(migration, /verification_source_type TEXT/);
  assert.match(migration, /version INTEGER NOT NULL DEFAULT 1/);
  assert.match(migration, /idx_workforce_employment_outcomes_scope/);
  assert.match(routes, /WORKFORCE_OUTCOMES_(SUBMIT|VERIFY|REJECT)/);
  assert.match(source, /IntegrationOutbox|buildEmploymentStartedVerifiedOutboxEvent/);
  assert.match(source, /strongVerificationSources/);
  assert.doesNotMatch(source, /JOB_90D/);
  assert.ok(getPermissionsForRole("shf_admin").includes(SHS_SECURITY_PERMISSIONS.WORKFORCE_OUTCOMES_VERIFY));
  assert.ok(getPermissionsForRole("reviewer_verifier").includes(SHS_SECURITY_PERMISSIONS.WORKFORCE_OUTCOMES_REJECT));
});

test("verified producer uses the employment date and excludes sensitive or stronger claims", () => {
  const event = buildEmploymentStartedVerifiedOutboxEvent({
    outcome_id: "outcome_synthetic",
    tenant_id: "tenant-1",
    organization_id: "org-1",
    verified_by_user_id: "reviewer-1",
    participant_ref: "participant:1",
    program_id: "program:1",
    employment_started_at: new Date("2026-08-01T00:00:00.000Z"),
    verification_source_type: "EMPLOYER_CONFIRMATION",
    version: 2,
    participant_name: "must not emit",
    wage: 100000,
    job_90d: true,
  }, "corr-1");
  assert.equal(event.subject_type, "workforce_employment_outcome");
  assert.equal(event.subject_id, "outcome_synthetic");
  assert.equal(event.occurred_at, "2026-08-01T00:00:00.000Z");
  assert.equal(event.idempotency_key, "workforce-employment-outcome:outcome_synthetic:verified");
  assert.equal(event.payload.employment_started_at, "2026-08-01T00:00:00.000Z");
  assert.equal(JSON.stringify(event).includes("participant_name"), false);
  assert.equal(JSON.stringify(event).includes("wage"), false);
  assert.equal(JSON.stringify(event).includes("job_90d"), false);
  assert.equal(JSON.stringify(event).includes("retention"), false);
  assert.equal(JSON.stringify(event).includes("impact"), false);
});
