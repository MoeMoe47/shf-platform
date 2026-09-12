import { emitOperationalTelemetry } from "../observability/operational-telemetry.js";

export function errorHandler(err: any, req: any, res: any, _next: any) {
  emitOperationalTelemetry({ event_name: "http_internal_error", severity: "ERROR", component: "shs_api", category: "DATABASE", outcome: "SYSTEM_FAILURE", metadata: { request_id: String(req?.id || req?.headers?.["x-request-id"] || "unknown") } });
  res.status(500).json({
    ok: false,
    error: { code: "INTERNAL_ERROR", message: "Internal error" },
    correlation_id: String(req?.id || req?.headers?.["x-request-id"] || "corr_unknown"),
  });
}
