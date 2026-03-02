/**
 * Growth Market client (Top-1% hybrid)
 * - Talks to Fabric API: /api/growth/*
 * - Supports VITE_FABRIC_API_BASE (optional)
 *
 * Examples:
 *   VITE_FABRIC_API_BASE=http://127.0.0.1:8000
 */
const BASE =
  (import.meta?.env?.VITE_FABRIC_API_BASE || "").replace(/\/+$/, "");

function url(path) {
  if (!path.startsWith("/")) path = "/" + path;
  return BASE + path;
}

async function http(path, opts = {}) {
  const res = await fetch(url(path), {
    credentials: "include",
    headers: { "content-type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });

  let data = null;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }

  if (!res.ok) {
    const msg =
      (data && (data.detail || data.error || data.message)) ||
      `${res.status} ${res.statusText}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function getGrowthDashboard() {
  return http("/api/growth/dashboard");
}

export async function listGrowthClaims() {
  return http("/api/growth/claims");
}

export async function supportClaim(claimId, { actorId, confidence, stake }) {
  return http(`/api/growth/claims/${encodeURIComponent(claimId)}/support`, {
    method: "POST",
    body: JSON.stringify({
      actor_id: actorId,
      confidence,
      stake,
    }),
  });
}

export async function challengeClaim(claimId, { actorId, confidence, stake }) {
  return http(`/api/growth/claims/${encodeURIComponent(claimId)}/challenge`, {
    method: "POST",
    body: JSON.stringify({
      actor_id: actorId,
      confidence,
      stake,
    }),
  });
}

export async function resolveClaim(claimId, { outcome, note }) {
  return http(`/api/growth/claims/${encodeURIComponent(claimId)}/resolve`, {
    method: "POST",
    body: JSON.stringify({
      outcome,
      note: note || "",
    }),
  });
}

export async function agentJournal({ actorId, kind = "agent", claimId = null, entry }) {
  return http("/api/growth/agents/journal", {
    method: "POST",
    body: JSON.stringify({
      actor_id: actorId,
      kind,
      claim_id: claimId,
      entry,
    }),
  });
}
