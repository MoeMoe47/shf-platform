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

export async function listMyCertificates(role) {
  const res = await fetch(`${CREDENTIALS_API_BASE}/credentials/certificates/me`, { headers: authHeaders(role) });
  return parseJson(res);
}

export async function renderMyCertificate(role, certificateId, format = "PDF") {
  const res = await fetch(`${CREDENTIALS_API_BASE}/credentials/certificates/${encodeURIComponent(certificateId)}/render`, { method: "POST", headers: authHeaders(role), body: JSON.stringify({ format }) });
  const data = await parseJson(res);
  const bytes = Uint8Array.from(atob(data.bytesBase64), (character) => character.charCodeAt(0));
  return { ...data, blob: new Blob([bytes], { type: data.mimeType }) };
}

export async function emailMyCertificate(role, certificateId) {
  const res = await fetch(`${CREDENTIALS_API_BASE}/credentials/certificates/${encodeURIComponent(certificateId)}/email`, { method: "POST", headers: authHeaders(role), body: JSON.stringify({}) });
  return parseJson(res);
}

export default { listMyCredentials, listMyCertificates, renderMyCertificate, emailMyCertificate };
