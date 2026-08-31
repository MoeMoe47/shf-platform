// src/lib/credentials/api.js
//
// SHF Ecosystem Phase 7 — read-only client for the learner's own issued
// Credentials. The backend owns all eligibility/issuance/expiration
// truth; this module only fetches what the actor is already entitled to
// see (their own Credentials, or every organization Credential for
// admin-tier actors — enforced server-side).
import { resolveDevUserId } from "@/lib/liveLearning/api.js";

const CREDENTIALS_API_BASE = "http://127.0.0.1:8091";

function authHeaders(role) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer dev-token:${resolveDevUserId(role)}`,
  };
}

async function parseJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    const err = new Error(data?.error?.message || `Credential request failed: ${res.status}`);
    err.code = data?.error?.code || "REQUEST_FAILED";
    err.status = res.status;
    throw err;
  }
  return data?.data ?? data;
}

export async function listMyCredentials(role) {
  const res = await fetch(`${CREDENTIALS_API_BASE}/credentials/me`, { headers: authHeaders(role) });
  return parseJson(res);
}

export default { listMyCredentials };
