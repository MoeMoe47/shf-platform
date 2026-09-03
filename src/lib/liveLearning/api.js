// src/lib/liveLearning/api.js
//
// Phase 2A Secure Live Learning — real backend client for apps/shs-api's
// /live-learning/* routes (mirrors the existing src/lib/hub/api.js
// pattern: same base URL, same Bearer dev-token auth header, same
// {ok,data}/{ok:false,error} envelope). This is the ONLY place in the
// frontend that talks to the Live Learning backend — components must go
// through here, never fetch() the backend directly, and never decide
// join authorization themselves (that decision is 100% server-side).
//
// Identity bridge (Phase 2A, documented rather than silent): the
// curriculum frontend's UserContext (src/context/UserContext.jsx) has no
// real backend-linked user id yet — it only exposes a demo role/email.
// Until real curriculum identity exists, this maps that demo role to one
// of the two backend demo users seeded for Live Learning
// (apps/shs-api/seeds/010_seed_live_learning_users.sql): "student" and
// "instructor". This is a temporary bridge, not a second identity system
// — it defers entirely to the backend's real role/permission checks.
const LIVE_LEARNING_API_BASE = import.meta.env?.VITE_LIVE_LEARNING_API_BASE || "http://127.0.0.1:8091";

export function resolveDevUserId(role) {
  // The authenticated boot identity is authoritative when present. The Vite
  // value remains a development fallback for screens without a boot identity.
  return (typeof window !== "undefined" && window.__user?.id) || import.meta.env?.VITE_DEV_USER_ID || (role === "admin" || role === "instructor" ? "user_instructor_001" : "user_student_001");
}

function authHeaders(role) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer dev-token:${resolveDevUserId(role)}`,
  };
}

async function parseJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    const err = new Error(data?.error?.message || `Live Learning request failed: ${res.status}`);
    err.code = data?.error?.code || "REQUEST_FAILED";
    err.status = res.status;
    throw err;
  }
  return data?.data ?? data;
}

export async function fetchProviderHealth(role) {
  const res = await fetch(`${LIVE_LEARNING_API_BASE}/live-learning/health`, { headers: authHeaders(role) });
  return parseJson(res);
}

export async function listLiveSessions(role, { lessonId } = {}) {
  const qs = lessonId ? `?lessonId=${encodeURIComponent(lessonId)}` : "";
  const res = await fetch(`${LIVE_LEARNING_API_BASE}/live-learning/sessions${qs}`, { headers: authHeaders(role) });
  return parseJson(res);
}

export async function getLiveSession(role, sessionId) {
  const res = await fetch(`${LIVE_LEARNING_API_BASE}/live-learning/sessions/${encodeURIComponent(sessionId)}`, { headers: authHeaders(role) });
  return parseJson(res);
}

export async function createLiveSession(role, input) {
  const res = await fetch(`${LIVE_LEARNING_API_BASE}/live-learning/sessions`, {
    method: "POST",
    headers: authHeaders(role),
    body: JSON.stringify(input),
  });
  return parseJson(res);
}

export async function cancelLiveSession(role, sessionId) {
  const res = await fetch(`${LIVE_LEARNING_API_BASE}/live-learning/sessions/${encodeURIComponent(sessionId)}/cancel`, {
    method: "POST",
    headers: authHeaders(role),
  });
  return parseJson(res);
}

/**
 * The ONLY way the frontend ever obtains join access. Always authorizes
 * the caller for THEMSELVES — there is no way to request access for
 * someone else. Returns either {allowed:true, launchUrl, expiresAt,
 * provider} or throws (with err.status 403 and a human-readable reason)
 * when denied. Never assume allowed without checking the response.
 */
export async function requestJoin(role, sessionId) {
  const res = await fetch(`${LIVE_LEARNING_API_BASE}/live-learning/sessions/${encodeURIComponent(sessionId)}/join`, {
    method: "POST",
    headers: authHeaders(role),
  });
  if (res.status === 403) {
    const data = await res.json().catch(() => ({}));
    return { allowed: false, reason: data?.error?.message || "Join not authorized." };
  }
  return parseJson(res);
}

export async function listJoinEvents(role, sessionId) {
  const res = await fetch(`${LIVE_LEARNING_API_BASE}/live-learning/sessions/${encodeURIComponent(sessionId)}/join-events`, {
    headers: authHeaders(role),
  });
  return parseJson(res);
}

export async function confirmAttendance(role, joinEventId) {
  const res = await fetch(`${LIVE_LEARNING_API_BASE}/live-learning/join-events/${encodeURIComponent(joinEventId)}/confirm-attendance`, {
    method: "POST",
    headers: authHeaders(role),
  });
  return parseJson(res);
}

export default {
  fetchProviderHealth,
  listLiveSessions,
  getLiveSession,
  createLiveSession,
  cancelLiveSession,
  requestJoin,
  listJoinEvents,
  confirmAttendance,
  resolveDevUserId,
};
