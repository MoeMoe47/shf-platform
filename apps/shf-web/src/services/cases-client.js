import { API_BASE as SHS_API_BASE } from "@/lib/apiClient.js";

const API_BASE = SHS_API_BASE;

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
