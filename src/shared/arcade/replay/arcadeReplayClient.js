import { API_BASE } from "@/lib/apiClient.js";

export async function fetchArcadeResultReplay(resultId, { fetchImpl = fetch } = {}) {
  const response = await fetchImpl(`${API_BASE}/arcade/results/${encodeURIComponent(resultId)}/replay`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.ok !== true || !payload?.data?.result || !Array.isArray(payload?.data?.timeline)) {
    const error = new Error(payload?.error?.message || "Arcade execution replay is temporarily unavailable.");
    error.status = response.status;
    error.code = payload?.error?.code || "ARCADE_REPLAY_UNAVAILABLE";
    error.correlationId = payload?.correlation_id || null;
    throw error;
  }
  return payload.data;
}
