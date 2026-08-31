// src/lib/careerEvents/api.js
//
// SHF Ecosystem Phase 4 — real backend client for apps/shs-api's
// /career-events route (mirrors src/lib/liveLearning/api.js and
// src/lib/assignments/api.js: same base URL, same Bearer dev-token auth
// header, same {ok,data}/{ok:false,error} envelope). This is the ONLY
// place in the frontend that talks to the Career Event backend.
import { resolveDevUserId } from "@/lib/liveLearning/api.js";

const CAREER_EVENTS_API_BASE = "http://127.0.0.1:8091";

function authHeaders(role) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer dev-token:${resolveDevUserId(role)}`,
  };
}

async function parseJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    const err = new Error(data?.error?.message || `Career event request failed: ${res.status}`);
    err.code = data?.error?.code || "REQUEST_FAILED";
    err.status = res.status;
    throw err;
  }
  return data?.data ?? data;
}

export async function listCareerEvents(role) {
  const res = await fetch(`${CAREER_EVENTS_API_BASE}/career-events`, { headers: authHeaders(role) });
  return parseJson(res);
}

export default { listCareerEvents };
