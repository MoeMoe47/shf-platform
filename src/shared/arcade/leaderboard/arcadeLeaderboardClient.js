import { API_BASE } from "@/lib/apiClient.js";

export class ArcadeLeaderboardApiError extends Error {
  constructor({ status, code, message, correlationId, details }) {
    super(message || `Arcade leaderboard request failed (${status}).`);
    this.name = "ArcadeLeaderboardApiError";
    this.status = status;
    this.code = code || null;
    this.correlationId = correlationId || null;
    this.details = details || {};
  }
}

async function request(path, fetchImpl = globalThis.fetch) {
  const response = await fetchImpl(`${API_BASE}${path}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  const envelope = await response.json().catch(() => null);
  if (!response.ok || envelope?.ok !== true) {
    const error = envelope?.error || {};
    const { code, message, details, ...extraDetails } = error;
    throw new ArcadeLeaderboardApiError({
      status: response.status,
      code,
      message,
      correlationId: envelope?.correlation_id || error.correlation_id,
      details: details || extraDetails,
    });
  }
  return envelope.data;
}

export function listLeaderboardActivities({ fetchImpl } = {}) {
  return request("/arcade/activities", fetchImpl).then((data) => data.items || []);
}

export function getActivityLeaderboard(activityId, { limit = 50, offset = 0, fetchImpl } = {}) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return request(`/arcade/leaderboards/activities/${encodeURIComponent(activityId)}?${params}`, fetchImpl);
}
