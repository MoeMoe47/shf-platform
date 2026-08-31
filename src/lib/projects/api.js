// src/lib/projects/api.js
//
// SHF Ecosystem Phase 6 — real backend client for apps/shs-api's
// /projects/schedule route. Calendar consumers must use this client
// instead of reaching across domains directly.
import { resolveDevUserId } from "@/lib/liveLearning/api.js";

const PROJECTS_API_BASE = "http://127.0.0.1:8091";

function authHeaders(role) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer dev-token:${resolveDevUserId(role)}`,
  };
}

async function parseJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    const err = new Error(data?.error?.message || `Project request failed: ${res.status}`);
    err.code = data?.error?.code || "REQUEST_FAILED";
    err.status = res.status;
    throw err;
  }
  return data?.data ?? data;
}

export async function listProjectSchedule(role) {
  const res = await fetch(`${PROJECTS_API_BASE}/projects/schedule`, { headers: authHeaders(role) });
  return parseJson(res);
}

export default { listProjectSchedule };
