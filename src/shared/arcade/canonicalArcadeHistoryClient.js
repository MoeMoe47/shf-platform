import { API_BASE } from "@/lib/apiClient.js";

export async function fetchCanonicalArcadeHistory({ limit = 50, offset = 0, fetchImpl = fetch } = {}) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  const response = await fetchImpl(`${API_BASE}/arcade/results?${params}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.ok !== true || !Array.isArray(payload?.data?.items)) {
    throw new Error(payload?.error?.message || "Canonical Arcade history is temporarily unavailable.");
  }
  return payload.data;
}
