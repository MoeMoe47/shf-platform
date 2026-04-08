const API_BASE = "http://127.0.0.1:8000";

async function safeJson(res) {
  const text = await res.text();
  if (!text) throw new Error(`Empty response (${res.status})`);

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON response (${res.status})`);
  }

  if (!res.ok) {
    throw new Error(data.detail || data.error || res.statusText || `Request failed (${res.status})`);
  }

  return data;
}

export async function fetchOperatorEvents(limit = 50) {
  const res = await fetch(`${API_BASE}/api/v1/operator/events?limit=${limit}`);
  return safeJson(res);
}

export async function resolveOperatorDispute(disputeId, payload) {
  const res = await fetch(`${API_BASE}/api/v1/operator/disputes/${disputeId}/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return safeJson(res);
}

export async function createOperatorPool(payload) {
  const res = await fetch(`${API_BASE}/api/v1/operator/pools/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return safeJson(res);
}
