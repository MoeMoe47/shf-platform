// src/lib/companion/api.js
//
// SHF Ecosystem Phase 11 — client for the canonical backend Companion
// Context Service (GET /companion/context/me). The backend aggregates
// Calendar Intelligence, Journey Milestones, Career Pathway, and
// Credentials — already-entitled, already-canonical reads — into one
// bounded, explainable context plus a deterministic guidance list. This
// module fetches that one result; it computes nothing itself.
import { resolveDevUserId } from "@/lib/liveLearning/api.js";

const COMPANION_API_BASE = "http://127.0.0.1:8091";

function authHeaders(role) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer dev-token:${resolveDevUserId(role)}`,
  };
}

async function parseJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    const err = new Error(data?.error?.message || `Companion context request failed: ${res.status}`);
    err.code = data?.error?.code || "REQUEST_FAILED";
    err.status = res.status;
    throw err;
  }
  return data?.data ?? data;
}

export async function getCompanionContext(role) {
  const res = await fetch(`${COMPANION_API_BASE}/companion/context/me`, { headers: authHeaders(role) });
  return parseJson(res);
}

export default { getCompanionContext };
