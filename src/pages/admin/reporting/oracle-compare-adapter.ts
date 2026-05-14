const BASE = "http://127.0.0.1:8091";

export async function fetchOracleCompare(entityIds: string[] = []) {
  const safeIds = entityIds.filter(Boolean);
  if (!safeIds.length) {
    throw new Error("No entity ids provided for compare");
  }
  const query = encodeURIComponent(safeIds.join(","));
  const res = await fetch(`${BASE}/oracle/compare?ids=${query}`);
  if (!res.ok) {
    throw new Error(`Oracle compare fetch failed: ${res.status}`);
  }
  return res.json();
}
