const API_BASE = "http://localhost:8091";

export async function listCases() {
  const res = await fetch(`${API_BASE}/cases`);
  return res.json();
}

export async function createCase(payload) {
  const res = await fetch(`${API_BASE}/cases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function assignCase(caseId, payload) {
  const res = await fetch(`${API_BASE}/cases/${caseId}/assign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function transitionCase(caseId, payload) {
  const res = await fetch(`${API_BASE}/cases/${caseId}/transition`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}
