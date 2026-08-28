import assert from "node:assert/strict";
import test from "node:test";
import {
  emitOperationalTelemetry,
  evaluateBacklogAlerts,
  operationalMonitoringThresholds,
  operationalTelemetrySnapshot,
  resetOperationalTelemetryForTests,
  setOperationalTelemetrySink,
} from "../src/observability/operational-telemetry";

test.afterEach(() => resetOperationalTelemetryForTests());

test("telemetry metadata is allowlisted and secrets/payloads are excluded", () => {
  const events: any[] = [];
  setOperationalTelemetrySink((event) => events.push(event));
  const event = emitOperationalTelemetry({
    event_name: "report_failed",
    severity: "ERROR",
    component: "shs_api",
    category: "REPORTING",
    outcome: "SYSTEM_FAILURE",
    metadata: { reason: "calculation_failure", request_id: "req_1", password: "secret", payload: "private", email: "person@example.com" },
  });
  assert.deepEqual(event.metadata, { reason: "calculation_failure", request_id: "req_1" });
  assert.deepEqual(events[0].metadata, event.metadata);
  assert.equal(Object.keys(operationalTelemetrySnapshot()).length, 1);
});

test("telemetry sink failure is isolated from canonical work", () => {
  setOperationalTelemetrySink(() => { throw new Error("sink down"); });
  assert.doesNotThrow(() => emitOperationalTelemetry({ event_name: "db_failure", severity: "ERROR", component: "shs_api", category: "DATABASE", outcome: "SYSTEM_FAILURE" }));
});

test("production thresholds fail closed while development thresholds are explicit defaults", () => {
  assert.throws(() => operationalMonitoringThresholds({ SHS_AUTH_ENV: "production" }), /thresholds_required/);
  assert.deepEqual(operationalMonitoringThresholds({ SHS_AUTH_ENV: "test" }), { pending: 100, oldest: 900, noSuccess: 900, quarantine: 1 });
});

test("backlog alert predicates preserve liveness/readiness distinction", () => {
  const alerts = evaluateBacklogAlerts({ pending_count: 4, leased_count: 1, quarantined_count: 2, oldest_pending_age_seconds: 120, last_success_age_seconds: 120 }, { pending: 3, oldest: 60, noSuccess: 60, quarantine: 1 });
  assert.equal(alerts.find((alert) => alert.name === "outbox_pending_backlog")?.active, true);
  assert.equal(alerts.find((alert) => alert.name === "outbox_delivery_stalled")?.severity, "ERROR");
});
