import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { classifyDeliveryFailure, classifyDeliveryResponse } from "../src/domain/trusted-reporting/outbox.ts";
import { workerConfig } from "../src/domain/trusted-reporting/dispatcher.ts";
import { runTrustedReportingWorkerLoop } from "../src/domain/trusted-reporting/worker.ts";

test("delivery classifier distinguishes success, idempotent replay, transient, and poison responses", () => {
  assert.equal(classifyDeliveryResponse(200, { ok: true }), "SUCCESS");
  assert.equal(classifyDeliveryResponse(409, { idempotent_replay: true }), "ALREADY_ACCEPTED_IDEMPOTENT_SUCCESS");
  assert.equal(classifyDeliveryResponse(429), "RETRYABLE_FAILURE");
  assert.equal(classifyDeliveryResponse(422), "PERMANENT_FAILURE");
});

test("delivery classifier treats refused consumer connections as retryable", () => {
  assert.deepEqual(classifyDeliveryFailure({ code: "ECONNREFUSED" }), { retryable: true, final: false });
  assert.deepEqual(classifyDeliveryFailure({ cause: { code: "ECONNREFUSED" } } as any), { retryable: true, final: false });
});

test("worker configuration has bounded, restart-safe delivery defaults", () => {
  const config = workerConfig({});
  assert.equal(config.maxAttempts, 8);
  assert.ok(config.backoffBaseSeconds < config.backoffCapSeconds);
  assert.ok(config.leaseSeconds > 0);
  assert.ok(config.requestTimeoutMs > 0);
});

test("worker loop stops claiming after abort", async () => {
  const controller = new AbortController();
  let calls = 0;
  const dispatch = async () => {
    calls += 1;
    controller.abort();
    return [];
  };
  await runTrustedReportingWorkerLoop({ dispatch: dispatch as any, pollIntervalMs: 1, signal: controller.signal });
  assert.equal(calls, 1);
});

test("hardening migration preserves old states and adds lease/quarantine state", () => {
  const sql = readFileSync(new URL("../migrations/029_trusted_reporting_outbox_worker_hardening.sql", import.meta.url), "utf8");
  assert.match(sql, /lease_owner/);
  assert.match(sql, /lease_expires_at/);
  assert.match(sql, /QUARANTINED/);
  assert.match(sql, /integration_outbox_lease_idx/);
  assert.match(sql, /IF NOT EXISTS/);
});

test("repository completion operations are lease-owner scoped", () => {
  const source = readFileSync(new URL("../src/domain/trusted-reporting/outbox-repo.ts", import.meta.url), "utf8");
  assert.match(source, /FOR UPDATE SKIP LOCKED/);
  assert.match(source, /lease_expires_at <= NOW\(\)/);
  assert.match(source, /lease_owner=\$2/);
  assert.match(source, /QUARANTINED/);
  assert.match(source, /getBacklogStatus/);
});
