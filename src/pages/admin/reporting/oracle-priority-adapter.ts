const BASE = "http://127.0.0.1:8091";

export async function fetchOraclePriority(entityIds: string[] = []) {
  const safeIds = entityIds.filter(Boolean);
  if (!safeIds.length) {
    throw new Error("No entity ids provided for priority queue");
  }
  const query = encodeURIComponent(safeIds.join(","));
  const res = await fetch(`${BASE}/oracle/priority?ids=${query}`);
  if (!res.ok) {
    throw new Error(`Oracle priority fetch failed: ${res.status}`);
  }
  return res.json();
}
