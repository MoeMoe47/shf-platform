import { API_BASE as SHS_API_BASE } from "@/lib/apiClient.js";
export async function sendOracleAction(entityId, action) {
  const res = await fetch(`${SHS_API_BASE}/oracle/action`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ entityId, action }),
  });

  if (!res.ok) {
    throw new Error("Oracle action request failed");
  }

  return res.json();
}
