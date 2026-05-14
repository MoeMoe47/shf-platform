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

export async function fetchContracts() {
  const res = await fetch(`${API_BASE}/api/v1/operator/contracts`);
  return safeJson(res);
}

export async function fetchAllocations() {
  const res = await fetch(`${API_BASE}/api/v1/operator/allocations`);
  return safeJson(res);
}

export async function fetchPoolBalances() {
  const res = await fetch(`${API_BASE}/api/v1/operator/pool-balances`);
  return safeJson(res);
}

export async function fetchLedger(limit = 50) {
  const res = await fetch(`${API_BASE}/api/v1/operator/ledger?limit=${limit}`);
  return safeJson(res);
}
