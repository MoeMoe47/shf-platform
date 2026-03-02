/**
 * Growth Market client (Top-1% hybrid)
 *
 * Primary: Fabric API (/api/growth/*)
 * Fallback: deterministic simulator when API fails (500/offline/CORS)
 *
 * Controls:
 *   - VITE_FABRIC_API_BASE=http://127.0.0.1:8000  (optional)
 *   - VITE_GROWTH_SIM=1  (force simulation)
 */
const BASE = (import.meta?.env?.VITE_FABRIC_API_BASE || "").replace(/\/+$/, "");
const FORCE_SIM = String(import.meta?.env?.VITE_GROWTH_SIM || "") === "1";

function url(path) {
  if (!path.startsWith("/")) path = "/" + path;
  return BASE + path;
}

function seededRand(seedStr) {
  // tiny deterministic PRNG (mulberry32-ish)
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return function rand() {
    h += 0x6D2B79F5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

function simClaims() {
  const r = seededRand("shf.growth.market.v1");
  const t = nowSec();
  const mk = (id, title, thesis, tags) => {
    const scout = Math.floor(20 + r() * 180);
    const skeptic = Math.floor(15 + r() * 200);
    // market probability: skew by stake diff, but keep in [0.08, 0.92]
    const raw = 0.5 + (scout - skeptic) / 600;
    const p = Math.max(0.08, Math.min(0.92, raw));
    const positions = [];
    const n = Math.floor(2 + r() * 7);
    for (let i = 0; i < n; i++) {
      const side = r() > 0.5 ? "scout" : "skeptic";
      positions.push({
        id: `${id}.pos.${i}`,
        side,
        actor_id: `${side === "scout" ? "agent" : "human"}.${Math.floor(r() * 9999)}`,
        confidence: Math.max(0.51, Math.min(0.92, 0.5 + (r() - 0.5) * 0.6)),
        stake: Math.floor(5 + r() * 40),
        created_at: t - Math.floor(r() * 7200),
      });
    }
    return {
      id,
      title,
      thesis,
      status: "open",
      created_at: t - Math.floor(r() * 86400),
      tags,
      market: {
        market_p_true: p,
        scout_stake: scout,
        skeptic_stake: skeptic,
      },
      positions,
    };
  };

  return [
    mk(
      "claim.signal.001",
      "Spike in Mentor Signups",
      "Mentor signups are accelerating due to Arcade Plus missions + referral loop.",
      ["growth", "engagement", "community"]
    ),
    mk(
      "claim.funding.002",
      "Grant Readiness Lift",
      "Watchtower attestations are increasing grant confidence and conversion.",
      ["funding", "watchtower", "audit"]
    ),
    mk(
      "claim.product.003",
      "Employer Hub Pull",
      "Employers are responding to verified portfolio artifacts at a higher rate.",
      ["employer", "portfolio", "verification"]
    ),
  ];
}

function simDashboard(items) {
  const open = items.filter((x) => x.status !== "resolved").length;
  const positions = items.reduce((a, x) => a + (x.positions?.length || 0), 0);
  return {
    provider: "simulator",
    claims_open: open,
    positions,
    journals: Number(localStorage.getItem("shf_growth_sim_journals") || "0"),
  };
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

function shouldFallback(err) {
  // Fallback for 5xx, network/CORS, or forced sim
  if (FORCE_SIM) return true;
  const s = err?.status;
  if (s >= 500) return true;
  // fetch failures (TypeError) often indicate CORS/offline
  const m = String(err?.message || "");
  if (m.includes("Failed to fetch") || m.includes("NetworkError")) return true;
  return false;
}

/** Public API */
export async function getGrowthDashboard() {
  if (FORCE_SIM) {
    const items = simClaims();
    return simDashboard(items);
  }
  try {
    return await http("/api/growth/dashboard");
  } catch (e) {
    if (!shouldFallback(e)) throw e;
    const items = simClaims();
    return simDashboard(items);
  }
}

export async function listGrowthClaims() {
  if (FORCE_SIM) return { items: simClaims() };
  try {
    return await http("/api/growth/claims");
  } catch (e) {
    if (!shouldFallback(e)) throw e;
    return { items: simClaims() };
  }
}

export async function supportClaim(claimId, { actorId, confidence, stake }) {
  if (FORCE_SIM) return { ok: true, mode: "sim" };
  try {
    return await http(`/api/growth/claims/${encodeURIComponent(claimId)}/support`, {
      method: "POST",
      body: JSON.stringify({ actor_id: actorId, confidence, stake }),
    });
  } catch (e) {
    if (!shouldFallback(e)) throw e;
    return { ok: true, mode: "sim" };
  }
}

export async function challengeClaim(claimId, { actorId, confidence, stake }) {
  if (FORCE_SIM) return { ok: true, mode: "sim" };
  try {
    return await http(`/api/growth/claims/${encodeURIComponent(claimId)}/challenge`, {
      method: "POST",
      body: JSON.stringify({ actor_id: actorId, confidence, stake }),
    });
  } catch (e) {
    if (!shouldFallback(e)) throw e;
    return { ok: true, mode: "sim" };
  }
}

export async function resolveClaim(claimId, { outcome, note }) {
  if (FORCE_SIM) return { ok: true, mode: "sim" };
  try {
    return await http(`/api/growth/claims/${encodeURIComponent(claimId)}/resolve`, {
      method: "POST",
      body: JSON.stringify({ outcome, note: note || "" }),
    });
  } catch (e) {
    if (!shouldFallback(e)) throw e;
    return { ok: true, mode: "sim" };
  }
}

export async function agentJournal({ actorId, kind = "agent", claimId = null, entry }) {
  // Always store locally as a safety net
  const key = "shf_growth_sim_journals";
  localStorage.setItem(key, String(Number(localStorage.getItem(key) || "0") + 1));

  if (FORCE_SIM) return { ok: true, stored: "local", mode: "sim" };

  try {
    return await http("/api/growth/agents/journal", {
      method: "POST",
      body: JSON.stringify({
        actor_id: actorId,
        kind,
        claim_id: claimId,
        entry,
      }),
    });
  } catch (e) {
    if (!shouldFallback(e)) throw e;
    return { ok: true, stored: "local", mode: "sim" };
  }
}
