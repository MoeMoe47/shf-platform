import { API_BASE as SHS_API_BASE } from "@/lib/apiClient.js";

const API_BASE = SHS_API_BASE;

export async function listAudit() {
  const res = await fetch(`${API_BASE}/audit`);
  return res.json();
}
