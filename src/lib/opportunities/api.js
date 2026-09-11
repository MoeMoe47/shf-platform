// src/lib/opportunities/api.js
//
// SHF Ecosystem Phase 4 — real backend client for apps/shs-api's
// /opportunities route (mirrors src/lib/liveLearning/api.js and
// src/lib/assignments/api.js: same base URL, same Bearer dev-token auth
// header, same {ok,data}/{ok:false,error} envelope). This is the ONLY
// place in the frontend that talks to the Opportunity backend.
import { apiGet } from "@/lib/apiClient.js";
import { resolveDevUserId } from "@/lib/liveLearning/api.js";

const OPPORTUNITIES_API_BASE = "http://127.0.0.1:8091";

function authHeaders(role) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer dev-token:${resolveDevUserId(role)}`,
  };
}

async function parseJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    const err = new Error(data?.error?.message || `Opportunity request failed: ${res.status}`);
    err.code = data?.error?.code || "REQUEST_FAILED";
    err.status = res.status;
    throw err;
  }
  return data?.data ?? data;
}

export async function listOpportunities(role) {
  const res = await fetch(`${OPPORTUNITIES_API_BASE}/opportunities`, { headers: authHeaders(role) });
  return parseJson(res);
}

export async function listPublicOpportunities() {
  const response = await apiGet("/public/career/opportunities");
  return Array.isArray(response?.data?.items) ? response.data.items : [];
}

export async function getPublicOpportunity(id) {
  const response = await apiGet(`/public/career/opportunities/${encodeURIComponent(String(id || ""))}`);
  return response?.data || null;
}

export async function listPublicEmployers() {
  const response = await apiGet("/public/career/employers");
  return Array.isArray(response?.data?.items) ? response.data.items : [];
}

export async function getPublicEmployer(id) {
  const response = await apiGet(`/public/career/employers/${encodeURIComponent(String(id || ""))}`);
  return response?.data || null;
}

export default { listOpportunities, listPublicOpportunities, getPublicOpportunity, listPublicEmployers, getPublicEmployer };
