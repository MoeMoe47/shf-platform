const BASE = "http://127.0.0.1:8091";

export async function fetchOracleTruth(entityId = "test_case_001") {
  const res = await fetch(`${BASE}/oracle/truth/${encodeURIComponent(entityId)}`);
  if (!res.ok) {
    throw new Error(`Oracle truth fetch failed: ${res.status}`);
  }
  return res.json();
}
