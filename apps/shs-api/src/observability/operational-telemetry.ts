export type OperationalSeverity = "INFO" | "WARNING" | "ERROR" | "CRITICAL";
export type OperationalCategory = "INGESTION" | "OUTBOX" | "DATABASE" | "MIGRATION" | "TRUTH" | "REPORTING" | "GOVERNANCE" | "PUBLICATION" | "PUBLIC_READ" | "RATE_LIMIT" | "AUTH" | "SECURITY";
export type OperationalOutcome = "SUCCESS" | "EXPECTED_DOMAIN_REJECTION" | "DATA_UNAVAILABLE" | "SYSTEM_FAILURE" | "SECURITY_ANOMALY";

export type OperationalTelemetryEvent = {
  event_name: string;
  severity: OperationalSeverity;
  component: string;
  category: OperationalCategory;
  timestamp: string;
  outcome: OperationalOutcome;
  metadata: Record<string, string | number | boolean | null>;
};

export type BacklogHealth = {
  pending_count: number;
  leased_count: number;
  quarantined_count: number;
  oldest_pending_age_seconds?: number | null;
  last_success_age_seconds?: number | null;
};

export type AlertCondition = {
  name: string;
  active: boolean;
  severity: OperationalSeverity;
  reason: string;
  observed: number;
  threshold: number;
};

const SAFE_METADATA_KEYS = new Set(["request_id", "correlation_id", "route_class", "outcome", "reason", "count", "status_code", "limiter_class", "migration_state", "threshold", "observed", "worker_state", "component", "producer_reference", "event_class", "backend", "duration_ms"]);
const counters = new Map<string, number>();
let sink: (event: OperationalTelemetryEvent) => void = (event) => console.info(JSON.stringify(event));

function safeMetadata(metadata: Record<string, unknown> = {}) {
  return Object.fromEntries(Object.entries(metadata).filter(([key, value]) => SAFE_METADATA_KEYS.has(key) && (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean"))) as OperationalTelemetryEvent["metadata"];
}

export function setOperationalTelemetrySink(next?: (event: OperationalTelemetryEvent) => void) {
  sink = next || ((event) => console.info(JSON.stringify(event)));
}

export function emitOperationalTelemetry(input: Omit<OperationalTelemetryEvent, "timestamp" | "metadata"> & { metadata?: Record<string, unknown> }) {
  const event: OperationalTelemetryEvent = { ...input, timestamp: new Date().toISOString(), metadata: safeMetadata(input.metadata) };
  const key = `${event.component}:${event.event_name}:${event.outcome}`;
  counters.set(key, (counters.get(key) || 0) + 1);
  try {
    sink(event);
  } catch {
    try { console.error(JSON.stringify({ event_name: "operational_telemetry_sink_failure", severity: "ERROR", component: "operational_telemetry", category: "DATABASE", outcome: "SYSTEM_FAILURE", timestamp: new Date().toISOString() })); } catch { /* telemetry must never affect core work */ }
  }
  return event;
}

export function operationalTelemetrySnapshot() { return Object.fromEntries(counters.entries()); }
export function resetOperationalTelemetryForTests() { counters.clear(); setOperationalTelemetrySink(); }

export function operationalMonitoringThresholds(env: NodeJS.ProcessEnv = process.env) {
  const production = String(env.SHS_AUTH_ENV || env.NODE_ENV || "development").toLowerCase() === "production";
  const names = { pending: "SHS_MONITOR_BACKLOG_MAX_PENDING", oldest: "SHS_MONITOR_BACKLOG_MAX_OLDEST_AGE_SECONDS", noSuccess: "SHS_MONITOR_BACKLOG_NO_SUCCESS_AGE_SECONDS", quarantine: "SHS_MONITOR_QUARANTINE_DELTA_THRESHOLD" } as const;
  const values = Object.fromEntries(Object.entries(names).map(([key, name]) => [key, Number(env[name] || NaN)])) as Record<keyof typeof names, number>;
  if (production && Object.values(values).some((value) => !Number.isInteger(value) || value <= 0)) throw new Error("production_operational_monitoring_thresholds_required");
  if (!production) {
    values.pending = values.pending > 0 ? values.pending : 100;
    values.oldest = values.oldest > 0 ? values.oldest : 900;
    values.noSuccess = values.noSuccess > 0 ? values.noSuccess : 900;
    values.quarantine = values.quarantine > 0 ? values.quarantine : 1;
  }
  return values;
}

export function evaluateBacklogAlerts(backlog: BacklogHealth, thresholds = operationalMonitoringThresholds()): AlertCondition[] {
  const oldest = Number(backlog.oldest_pending_age_seconds || 0);
  const noSuccess = Number(backlog.last_success_age_seconds || 0);
  return [
    { name: "outbox_pending_backlog", active: backlog.pending_count >= thresholds.pending, severity: "WARNING", reason: "pending_backlog_threshold", observed: backlog.pending_count, threshold: thresholds.pending },
    { name: "outbox_oldest_pending_age", active: oldest >= thresholds.oldest, severity: "WARNING", reason: "oldest_pending_age_threshold", observed: oldest, threshold: thresholds.oldest },
    { name: "outbox_quarantine_growth", active: backlog.quarantined_count >= thresholds.quarantine, severity: "WARNING", reason: "quarantine_threshold", observed: backlog.quarantined_count, threshold: thresholds.quarantine },
    { name: "outbox_delivery_stalled", active: backlog.pending_count > 0 && noSuccess >= thresholds.noSuccess, severity: "ERROR", reason: "pending_work_without_recent_success", observed: noSuccess, threshold: thresholds.noSuccess },
  ];
}
