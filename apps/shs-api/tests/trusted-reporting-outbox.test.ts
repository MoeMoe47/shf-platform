import assert from "node:assert/strict";
import test from "node:test";

import { CaseService } from "../src/domain/cases/service/case-service.ts";
import { buildReferralOutboxEvent, classifyDeliveryFailure } from "../src/domain/trusted-reporting/outbox.ts";
import { dispatchPendingIntegrationEvents } from "../src/domain/trusted-reporting/dispatcher.ts";
import { runTrustedReportingWorker } from "../src/domain/trusted-reporting/worker.ts";
import { readFileSync } from "node:fs";

test("referral outbox event is minimized and idempotent", () => {
  const event = buildReferralOutboxEvent(
    {
      case_id: "case_123",
      organization_id: "org_123",
      created_by_user_id: "user_123",
      created_at: "2026-08-25T12:00:00.000Z",
    },
    "corr_123",
  );

  assert.deepEqual(event, {
    producer_id: "hub.referral",
    event_type: "referral.created",
    subject_type: "referral",
    subject_id: "case_123",
    organization_id: "org_123",
    originating_actor_id: "user_123",
    originating_actor_type: "user",
    tenant_id: "tenant:org_123",
    occurred_at: "2026-08-25T12:00:00.000Z",
    idempotency_key: "referral:case_123:created",
    correlation_id: "corr_123",
    payload: { referral_id: "case_123" },
    destination: "agent-fabric",
  });
});

test("referral outbox normalizes PostgreSQL Date timestamps to ISO 8601", () => {
  const event = buildReferralOutboxEvent(
    {
      case_id: "case_date_123",
      organization_id: "org_123",
      created_by_user_id: "user_123",
      created_at: new Date("2026-08-25T12:00:00.000Z"),
    },
    "corr_date_123",
  );
  assert.equal(event.occurred_at, "2026-08-25T12:00:00.000Z");
});

test("delivery failures have bounded retry classification", () => {
  assert.deepEqual(classifyDeliveryFailure({ status: 503 }), { retryable: true, final: false });
  assert.deepEqual(classifyDeliveryFailure({ status: 422 }), { retryable: false, final: true });
  assert.deepEqual(classifyDeliveryFailure({ code: "ETIMEDOUT" }), { retryable: true, final: false });
});

test("referral creation composes business, audit, and outbox work in one transaction callback", async () => {
  const order: string[] = [];
  const repo = {
    async createCase(input: any) {
      order.push("case");
      return { case_id: input.case_id, organization_id: input.organization_id, status: "open", priority: "medium", created_by_user_id: input.created_by_user_id };
    },
    async upsertReferralDetails() {
      order.push("details");
      return { case_id: "case_123" };
    },
  };
  const audit = async () => order.push("audit");
  const outbox = { async enqueue() { order.push("outbox"); } };
  const transaction = async (fn: any) => {
    order.push("begin");
    const result = await fn({});
    order.push("commit");
    return result;
  };
  const service = new CaseService(repo as any, outbox as any, transaction as any, audit as any);

  await service.createReferral({ receiving_organization_id: "org_receiver" }, { user_id: "user_123", organization_id: "org_123" });
  assert.deepEqual(order, ["begin", "case", "details", "audit", "outbox", "commit"]);
});

test("dispatcher marks an authenticated acknowledgment delivered and never logs credentials", async () => {
  process.env.SHF_INTERNAL_SERVICE_KEYS_JSON = JSON.stringify({ "test-k1": "test-secret" });
  process.env.SHF_INTERNAL_SERVICE_ACTIVE_KID = "test-k1";
  process.env.SHF_AGENT_FABRIC_INTERNAL_URL = "http://agent-fabric.test";
  const states: string[] = [];
  const repo: any = {
    async claimPending() {
      return [{
        outbox_event_id: "outbox_1",
        payload_json: JSON.stringify({
          producer_id: "hub.referral",
          event_type: "referral.created",
          subject_type: "referral",
          subject_id: "case_1",
          organization_id: "org_1",
          originating_actor_id: "user_1",
          originating_actor_type: "user",
          tenant_id: "tenant:org_1",
          occurred_at: "2026-08-25T12:00:00.000Z",
          idempotency_key: "referral:case_1:created",
          correlation_id: "corr_1",
          payload: { referral_id: "case_1" },
        }),
      }];
    },
    async markDelivered() { states.push("DELIVERED"); },
    async markRetryable() { states.push("RETRYABLE"); },
    async markFailedFinal() { states.push("FAILED_FINAL"); },
  };
  let received: any;
  const result = await dispatchPendingIntegrationEvents({
    repo,
    fetchImpl: async (_url, init) => {
      received = init;
      return { ok: true, status: 200, json: async () => ({ ok: true }) };
    },
    now: 1724587200,
  });
  assert.deepEqual(result, [{ outbox_event_id: "outbox_1", status: "DELIVERED" }]);
  assert.deepEqual(states, ["DELIVERED"]);
  assert.match(received.headers["X-SHF-Service-Signature"], /^[a-f0-9]{64}$/);
  assert.equal(JSON.stringify(received).includes("test-secret"), false);
});

test("dispatcher retains transient failures for retry and finalizes validation failures", async () => {
  process.env.SHF_INTERNAL_SERVICE_KEYS_JSON = JSON.stringify({ "test-k1": "test-secret" });
  process.env.SHF_INTERNAL_SERVICE_ACTIVE_KID = "test-k1";
  process.env.SHF_AGENT_FABRIC_INTERNAL_URL = "http://agent-fabric.test";
  const states: string[] = [];
  const repo: any = {
    async claimPending() { return [{ outbox_event_id: "outbox_2", payload_json: "{}" }]; },
    async markDelivered() {},
    async markRetryable() { states.push("RETRYABLE"); },
    async markFailedFinal() { states.push("FAILED_FINAL"); },
  };
  await dispatchPendingIntegrationEvents({ repo, fetchImpl: async () => ({ ok: false, status: 503, json: async () => ({}) }) });
  assert.deepEqual(states, ["RETRYABLE"]);
});

test("worker entrypoint delegates one bounded pass to the dispatcher", async () => {
  let invoked = false;
  const result = await runTrustedReportingWorker(async () => {
    invoked = true;
    return [{ status: "DELIVERED" }];
  });
  assert.equal(invoked, true);
  assert.deepEqual(result, [{ status: "DELIVERED" }]);
});

test("trusted-reporting worker uses the repository TypeScript runtime entrypoint", () => {
  const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(packageJson.scripts["worker:trusted-reporting"], "tsx src/domain/trusted-reporting/worker.ts");
});

test("outbox migration defines idempotency, retry, and concurrent claiming contracts", () => {
  const sql = readFileSync(new URL("../migrations/007_integration_outbox.sql", import.meta.url), "utf8");
  assert.match(sql, /UNIQUE \(organization_id, producer_id, idempotency_key\)/);
  assert.match(sql, /delivery_status TEXT NOT NULL CHECK/);
  assert.match(sql, /attempt_count INTEGER NOT NULL DEFAULT 0/);
  assert.match(sql, /next_attempt_at TIMESTAMPTZ NOT NULL/);
  assert.match(sql, /last_error TEXT/);
  assert.match(sql, /integration_outbox_pending_idx/);
  const repo = readFileSync(new URL("../src/domain/trusted-reporting/outbox-repo.ts", import.meta.url), "utf8");
  assert.match(repo, /FOR UPDATE SKIP LOCKED/);
  assert.match(repo, /delivery_status IN \('PENDING','RETRYABLE'\)/);
});

test("referral route uses the existing referrals.manage permission boundary", () => {
  const routes = readFileSync(new URL("../src/domain/cases/api/routes.ts", import.meta.url), "utf8");
  assert.match(routes, /app\.post\("\/cases\/referrals", requirePermission\("referrals\.manage"\)/);
});
