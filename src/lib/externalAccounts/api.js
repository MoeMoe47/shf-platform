// src/lib/externalAccounts/api.js
//
// SHF Ecosystem Phase 12.2 — client for the backend External Account
// Security + Native External Calendar Integration API. Mirrors
// src/lib/calendar/api.js's own conventions exactly (dev-token bearer
// auth, ok()/fail() envelope unwrapping).
//
// externalCalendarConnectUrl() builds a real browser-navigation URL, not
// a fetch() target — the OAuth start/callback sequence is a genuine
// full-page redirect through Google/Microsoft, matching how every
// provider's own OAuth flow works. Note for local development: this
// app's local dev-token auth is a Bearer header, which a plain browser
// navigation does not send (a real deployment uses an Auth0 session
// cookie instead, which is sent automatically on navigation) — so
// clicking Connect in local dev will not complete a real handshake
// end-to-end. Google/Microsoft are also not configured with real
// credentials in this environment regardless (see
// docs/SHF_EXTERNAL_CALENDAR_INTEGRATION.md), so there is no live
// success path to reach either way — this is documented, not hidden.
import { resolveDevUserId } from "@/lib/liveLearning/api.js";

const API_BASE = "http://127.0.0.1:8091";

function authHeaders(role) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer dev-token:${resolveDevUserId(role)}`,
  };
}

async function parseJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    const err = new Error(data?.error?.message || `External account request failed: ${res.status}`);
    err.code = data?.error?.code || "REQUEST_FAILED";
    err.status = res.status;
    throw err;
  }
  return data?.data ?? data;
}

export async function listExternalAccountConnections(role) {
  const res = await fetch(`${API_BASE}/external-accounts/me`, { headers: authHeaders(role) });
  return parseJson(res);
}

export async function disconnectExternalAccount(role, provider) {
  const res = await fetch(`${API_BASE}/external-accounts/${provider}`, {
    method: "DELETE",
    headers: authHeaders(role),
  });
  return parseJson(res);
}

export function externalCalendarConnectUrl(provider, returnPath) {
  return `${API_BASE}/external-accounts/${provider}/oauth/start?returnPath=${encodeURIComponent(returnPath)}`;
}
