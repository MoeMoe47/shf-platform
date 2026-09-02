// src/lib/journey/api.js
//
// SHF Ecosystem Phase 6 — read-only Journey Milestones projection client.
// The backend owns all entitlement and completion semantics; this module
// only fetches the learner's own projected milestones.
import { resolveDevUserId } from "@/lib/liveLearning/api.js";

const JOURNEY_API_BASE = import.meta.env.VITE_SHS_API_BASE || "http://127.0.0.1:8091";

function authHeaders(role) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer dev-token:${resolveDevUserId(role)}`,
  };
}

async function parseJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    const err = new Error(data?.error?.message || `Journey milestone request failed: ${res.status}`);
    err.code = data?.error?.code || "REQUEST_FAILED";
    err.status = res.status;
    throw err;
  }
  return data?.data ?? data;
}

export async function listJourneyMilestones(role) {
  const res = await fetch(`${JOURNEY_API_BASE}/journey/milestones/me`, { headers: authHeaders(role) });
  return parseJson(res);
}

export default { listJourneyMilestones };
