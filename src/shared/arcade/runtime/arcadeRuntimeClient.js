import { API_BASE } from "@/lib/apiClient.js";

const ROOT = "/arcade/runtime/sessions";

export class ArcadeRuntimeApiError extends Error {
  constructor({ status, code, message, correlationId, details, body }) {
    super(message || `Arcade runtime request failed (${status}).`);
    this.name = "ArcadeRuntimeApiError";
    this.status = status;
    this.code = code || null;
    this.correlationId = correlationId || null;
    this.details = details || {};
    this.body = body ?? null;
  }
}

async function request(path, { method = "GET", body, fetchImpl = globalThis.fetch, onResponse } = {}) {
  const response = await fetchImpl(`${API_BASE}${path}`, {
    method,
    credentials: "include",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const envelope = await response.json().catch(() => null);
  const correlationId = envelope?.correlation_id ?? envelope?.error?.correlation_id ?? null;
  onResponse?.({ status: response.status, correlationId, body: envelope });

  if (!response.ok || envelope?.ok !== true) {
    const { code, message, details, ...flattenedDetails } = envelope?.error || {};
    throw new ArcadeRuntimeApiError({
      status: response.status,
      code,
      message: message || `Arcade runtime request failed (${response.status}).`,
      correlationId,
      details: details || flattenedDetails,
      body: envelope,
    });
  }
  return envelope.data;
}

function sessionPath(sessionId) {
  return `${ROOT}/${encodeURIComponent(sessionId)}`;
}

export function startRuntimeSession(input, options) {
  return request(ROOT, { ...options, method: "POST", body: input });
}

export function listRuntimeSessions({ status, ...options } = {}) {
  const query = status ? `?${new URLSearchParams({ status })}` : "";
  return request(`${ROOT}${query}`, options);
}

export function getRuntimeSession(sessionId, options) {
  return request(sessionPath(sessionId), options);
}

export function pauseRuntimeSession(sessionId, options) {
  return request(`${sessionPath(sessionId)}/pause`, { ...options, method: "POST" });
}

export function resumeRuntimeSession(sessionId, options) {
  return request(`${sessionPath(sessionId)}/resume`, { ...options, method: "POST" });
}

export function completeRuntimeSession(sessionId, options) {
  return request(`${sessionPath(sessionId)}/complete`, { ...options, method: "POST" });
}

export function abandonRuntimeSession(sessionId, options) {
  return request(`${sessionPath(sessionId)}/abandon`, { ...options, method: "POST" });
}

export function getRuntimeSaveState(sessionId, options) {
  return request(`${sessionPath(sessionId)}/save`, options);
}

export function putRuntimeSaveState(sessionId, input, options) {
  return request(`${sessionPath(sessionId)}/save`, { ...options, method: "PUT", body: input });
}

export function listRuntimeEvents(sessionId, { afterSequence, limit, ...options } = {}) {
  const params = new URLSearchParams();
  if (afterSequence != null) params.set("afterSequence", String(afterSequence));
  if (limit != null) params.set("limit", String(limit));
  const query = params.size ? `?${params}` : "";
  return request(`${sessionPath(sessionId)}/events${query}`, options);
}

export function appendRuntimeEvent(sessionId, event, options) {
  return request(`${sessionPath(sessionId)}/events`, { ...options, method: "POST", body: event });
}
