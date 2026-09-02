// src/lib/assignments/api.js
//
// SHF Calendar Wave 2A — real backend client for apps/shs-api's
// /assignments route (mirrors src/lib/liveLearning/api.js's pattern:
// same base URL, same Bearer dev-token auth header, same {ok,data}/
// {ok:false,error} envelope). This is the ONLY place in the frontend
// that talks to the Assignment backend — the Calendar adapter must go
// through here, never fetch() the backend directly.
import { resolveDevUserId } from "@/lib/liveLearning/api.js";

const ASSIGNMENTS_API_BASE = import.meta.env?.VITE_SHS_API_BASE || import.meta.env?.VITE_LIVE_LEARNING_API_BASE || "http://127.0.0.1:8091";

function authHeaders(role) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer dev-token:${resolveDevUserId(role)}`,
  };
}

async function parseJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    const err = new Error(data?.error?.message || `Assignment request failed: ${res.status}`);
    err.code = data?.error?.code || "REQUEST_FAILED";
    err.status = res.status;
    throw err;
  }
  return data?.data ?? data;
}

export async function listAssignments(role) {
  const res = await fetch(`${ASSIGNMENTS_API_BASE}/assignments`, { headers: authHeaders(role) });
  return parseJson(res);
}

export default { listAssignments };
