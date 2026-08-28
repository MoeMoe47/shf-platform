import { emitOperationalTelemetry } from "../observability/operational-telemetry";

export function errorHandler(err: any, req: any, res: any, _next: any) {
  const message = err?.message || "Internal error";
  emitOperationalTelemetry({ event_name: "http_internal_error", severity: "ERROR", component: "shs_api", category: "DATABASE", outcome: "SYSTEM_FAILURE", metadata: { request_id: String(req?.id || req?.headers?.["x-request-id"] || "unknown") } });
  res.status(500).json({
    ok: false,
    error: { code: "INTERNAL_ERROR", message },
    correlation_id: "corr_dev",
  });
}
