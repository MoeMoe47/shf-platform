// src/lib/accessibilityProfile/api.js
//
// SHF AIEL Phase 3 — client for the backend Personal Accessibility Profile
// API (docs/SHF_AIEL_PERSISTENCE_API_CONTRACT_V1.md). Mirrors
// src/lib/credentials/api.js's own conventions exactly (dev-token bearer
// auth, ok()/fail() envelope unwrapping). This is the only file in this
// domain allowed to know the profile's HTTP shape — everything above it
// (the providers) speaks in terms of preferences objects and revisions,
// never raw fetch responses.
//
// There is no getEffectiveContext() here — the backend has no
// /accessibility/context/me route. The Effective Accessibility Context is
// a pure client-side computation (this profile + the live OS
// prefers-reduced-motion signal), owned by EffectiveAccessibilityContextProvider.
import { resolveDevUserId } from "@/lib/liveLearning/api.js";

const ACCESSIBILITY_PROFILE_API_BASE = "http://127.0.0.1:8091";

function authHeaders(role) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer dev-token:${resolveDevUserId(role)}`,
  };
}

async function parseJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    const err = new Error(data?.error?.message || `Accessibility profile request failed: ${res.status}`);
    err.code = data?.error?.code || "REQUEST_FAILED";
    err.status = res.status;
    throw err;
  }
  return data?.data ?? data;
}

export async function getProfile(role) {
  const res = await fetch(`${ACCESSIBILITY_PROFILE_API_BASE}/accessibility/profile/me`, {
    headers: authHeaders(role),
  });
  return parseJson(res);
}

export async function patchProfile(role, preferences, revision) {
  const res = await fetch(`${ACCESSIBILITY_PROFILE_API_BASE}/accessibility/profile/me`, {
    method: "PATCH",
    headers: authHeaders(role),
    body: JSON.stringify({ preferences, revision: revision ?? null }),
  });
  return parseJson(res);
}

// scope: undefined/null for a full reset, { group } for a group reset, or
// { group, field } for a single-field reset — mirrors ResetScope on the
// backend (accessibility-profile-service.ts).
export async function resetProfile(role, revision, scope) {
  const res = await fetch(`${ACCESSIBILITY_PROFILE_API_BASE}/accessibility/profile/me/reset`, {
    method: "POST",
    headers: authHeaders(role),
    body: JSON.stringify({ revision: revision ?? null, group: scope?.group, field: scope?.field }),
  });
  return parseJson(res);
}

export default { getProfile, patchProfile, resetProfile };
