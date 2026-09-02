import { IntegrationOutboxRepo } from "./outbox-repo.js";
import { randomUUID } from "node:crypto";
import { classifyDeliveryFailure, classifyDeliveryResponse, signInternalRequest } from "./outbox.js";
import { emitOperationalTelemetry } from "../../observability/operational-telemetry.js";
import { projectAuthoritativeOutboxEvent, verifiedEvidenceEventSourceTypes } from "../verified-evidence/service/verified-evidence-service.js";

type DispatcherResponse = { ok: boolean; status: number; json: () => Promise<any> };
type DispatcherFetch = (url: string, init: any) => Promise<DispatcherResponse>;

export type WorkerConfig = { batchSize: number; leaseSeconds: number; maxAttempts: number; backoffBaseSeconds: number; backoffCapSeconds: number; requestTimeoutMs: number };

export function workerConfig(env: NodeJS.ProcessEnv = process.env): WorkerConfig {
  const number = (name: string, fallback: number) => {
    const value = Number(env[name] || fallback);
    if (!Number.isFinite(value) || value <= 0) throw new Error(`${name.toLowerCase()}_invalid`);
    return value;
  };
  return {
    batchSize: number("SHS_TRUSTED_REPORTING_WORKER_BATCH_SIZE", 20),
    leaseSeconds: number("SHS_TRUSTED_REPORTING_WORKER_LEASE_SECONDS", 60),
    maxAttempts: number("SHS_TRUSTED_REPORTING_WORKER_MAX_ATTEMPTS", 8),
    backoffBaseSeconds: number("SHS_TRUSTED_REPORTING_WORKER_BACKOFF_BASE_SECONDS", 5),
    backoffCapSeconds: number("SHS_TRUSTED_REPORTING_WORKER_BACKOFF_CAP_SECONDS", 900),
    requestTimeoutMs: number("SHS_TRUSTED_REPORTING_WORKER_REQUEST_TIMEOUT_MS", 10000),
  };
}

function retryAt(config: WorkerConfig, attempt: number, now = Date.now()): Date {
  return new Date(now + Math.min(config.backoffCapSeconds, config.backoffBaseSeconds * (2 ** Math.max(0, attempt - 1))) * 1000);
}

function operationalLog(event: string, fields: Record<string, unknown>) {
  console.info(JSON.stringify({ component: "trusted_reporting_outbox_worker", event, ...fields }));
}

export async function dispatchPendingIntegrationEvents(
  options: { repo?: IntegrationOutboxRepo; fetchImpl?: DispatcherFetch; limit?: number; now?: number; workerId?: string; config?: Partial<WorkerConfig> } = {},
) {
  const repo: any = options.repo || new IntegrationOutboxRepo();
  const fetchImpl = options.fetchImpl || fetch;
  const baseUrl = String(process.env.SHF_AGENT_FABRIC_INTERNAL_URL || "").trim();
  if (!baseUrl) throw new Error("agent_fabric_internal_url_missing");

  const config = { ...workerConfig(), ...options.config };
  const workerId = options.workerId || `trusted-reporting:${randomUUID()}`;
  const events = await repo.claimPending(options.limit || config.batchSize, workerId, config.leaseSeconds);
  operationalLog("rows_claimed", { worker_id: workerId, count: events.length });
  emitOperationalTelemetry({ event_name: "outbox_rows_claimed", severity: "INFO", component: "trusted_reporting_worker", category: "OUTBOX", outcome: "SUCCESS", metadata: { count: events.length, worker_state: "running" } });
  const results: any[] = [];
  for (const event of events) {
    try {
      const body = typeof event.payload_json === "string" ? JSON.parse(event.payload_json) : event.payload_json;
      // Curriculum evidence/truth projection is an SHS production consumer of
      // this same outbox. It must commit before the row is acknowledged and
      // must never be delegated to a browser or the development JSONL path.
      let verifiedProjection: { handled: boolean; projected: number } | null = null;
      if (Object.prototype.hasOwnProperty.call(verifiedEvidenceEventSourceTypes, event.event_type)) {
        verifiedProjection = await projectAuthoritativeOutboxEvent({ ...event, payload_json: body });
      }
      const headers = signInternalRequest("POST", "/shf/internal/ingestion/events", body, options.now);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);
      let response: DispatcherResponse;
      try { response = await fetchImpl(`${baseUrl}/shf/internal/ingestion/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(body),
        signal: controller.signal,
      }); } finally { clearTimeout(timeout); }
      let responseBody: any = null;
      try {
        responseBody = await response.json();
      } catch {
        responseBody = null;
      }
      const classification = response.ok && responseBody?.ok === true
        ? (responseBody?.event_idempotent_replay ? "ALREADY_ACCEPTED_IDEMPOTENT_SUCCESS" : "SUCCESS")
        : classifyDeliveryResponse(response.status, responseBody);
      if (classification === "SUCCESS" || classification === "ALREADY_ACCEPTED_IDEMPOTENT_SUCCESS") {
        await repo.markDelivered(event.outbox_event_id, workerId);
        operationalLog("delivery_succeeded", { worker_id: workerId, outbox_event_id: event.outbox_event_id, classification });
        emitOperationalTelemetry({ event_name: "outbox_delivery_succeeded", severity: "INFO", component: "trusted_reporting_worker", category: "OUTBOX", outcome: "SUCCESS", metadata: { reason: classification } });
        results.push({ outbox_event_id: event.outbox_event_id, status: "DELIVERED", ...(verifiedProjection ? { verified_projection_count: verifiedProjection.projected } : {}) });
      } else if (classification === "RETRYABLE_FAILURE") {
        const error: any = new Error("agent_fabric_delivery_retryable"); error.status = response.status; throw error;
      } else {
        await repo.markFailedFinal(event.outbox_event_id, "agent_fabric_delivery_rejected", workerId, false);
        operationalLog("permanent_failure", { worker_id: workerId, outbox_event_id: event.outbox_event_id });
        emitOperationalTelemetry({ event_name: "outbox_delivery_failed", severity: "ERROR", component: "trusted_reporting_worker", category: "OUTBOX", outcome: "SYSTEM_FAILURE", metadata: { reason: "permanent_delivery_failure" } });
        results.push({ outbox_event_id: event.outbox_event_id, status: "FAILED_FINAL" });
      }
    } catch (error: any) {
      const classification = classifyDeliveryFailure(error || {});
      if (!classification.retryable) {
        await repo.markFailedFinal(event.outbox_event_id, "agent_fabric_delivery_rejected", workerId, false);
        operationalLog("permanent_failure", { worker_id: workerId, outbox_event_id: event.outbox_event_id });
        results.push({ outbox_event_id: event.outbox_event_id, status: "FAILED_FINAL" });
      } else if (Number(event.attempt_count || 0) >= config.maxAttempts) {
        await repo.markFailedFinal(event.outbox_event_id, "agent_fabric_delivery_max_attempts", workerId, true);
        operationalLog("quarantined", { worker_id: workerId, outbox_event_id: event.outbox_event_id });
        emitOperationalTelemetry({ event_name: "outbox_quarantined", severity: "WARNING", component: "trusted_reporting_worker", category: "OUTBOX", outcome: "SYSTEM_FAILURE", metadata: { reason: "max_attempts" } });
        results.push({ outbox_event_id: event.outbox_event_id, status: "QUARANTINED" });
      } else {
        await repo.markRetryable(event.outbox_event_id, "agent_fabric_delivery_retryable", retryAt(config, Number(event.attempt_count || 1), options.now ? options.now * 1000 : Date.now()), workerId);
        operationalLog("retry_scheduled", { worker_id: workerId, outbox_event_id: event.outbox_event_id });
        emitOperationalTelemetry({ event_name: "outbox_retry_scheduled", severity: "WARNING", component: "trusted_reporting_worker", category: "OUTBOX", outcome: "SYSTEM_FAILURE", metadata: { reason: "retryable_delivery_failure" } });
        results.push({ outbox_event_id: event.outbox_event_id, status: "RETRYABLE" });
      }
    }
  }
  return results;
}
