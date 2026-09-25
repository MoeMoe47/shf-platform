import { API_BASE as SHS_API_BASE } from "@/lib/apiClient.js";

const API_BASE = SHS_API_BASE;

export async function listPrograms() {
  const res = await fetch(`${API_BASE}/programs`);
  return res.json();
}

export async function createProgram(payload) {
  const res = await fetch(`${API_BASE}/programs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function transitionProgram(programId, payload) {
  const res = await fetch(`${API_BASE}/programs/${programId}/transition`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}
