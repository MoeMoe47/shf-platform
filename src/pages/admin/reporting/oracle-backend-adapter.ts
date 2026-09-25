import { API_BASE as SHS_API_BASE } from "@/lib/apiClient.js";

const BASE = SHS_API_BASE;

export async function fetchOracleTruth(entityId = "test_case_001") {
  const res = await fetch(`${BASE}/oracle/truth/${encodeURIComponent(entityId)}`);
  if (!res.ok) {
    throw new Error(`Oracle truth fetch failed: ${res.status}`);
  }
  return res.json();
}
