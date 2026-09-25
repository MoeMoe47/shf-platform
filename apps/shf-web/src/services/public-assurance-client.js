import { API_BASE as SHS_API_BASE } from "@/lib/apiClient.js";

const API_BASE = SHS_API_BASE;

async function read(path) {
  const response = await fetch(`${API_BASE}${path}`);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message || "Public assurance data unavailable");
  return body?.data || {};
}

export async function listPublicAssuranceProjections() {
  const data = await read("/public/assurance/projections");
  return Array.isArray(data.items) ? data.items : [];
}

export async function getPublicAssuranceProjection(publicReference) {
  return read(`/public/assurance/projections/${encodeURIComponent(publicReference)}`);
}
