const API_BASE = "http://localhost:8091";

export async function listAudit() {
  const res = await fetch(`${API_BASE}/audit`);
  return res.json();
}
