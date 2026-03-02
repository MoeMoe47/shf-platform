/**
 * SHF Growth Claims Market (Top 1%)
 * - Proper scoring rule: Brier (truth-seeking equilibrium)
 * - Adversarial challenge: skeptic gets rewarded for improving calibration
 * - Anti-spam: penalties for low-signal challenges
 * - Persistence: localStorage (dev-first)
 */

export const KEY_GROWTH_MARKET = "shf:growth:market:v1";

export function nowIso() {
  return new Date().toISOString();
}

export function clamp01(n) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export function uid(prefix = "c") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

/** Proper scoring: Brier score (lower is better). We'll convert to a "reward" in [0..100]. */
export function brier(p, outcome01) {
  const pp = clamp01(p);
  const o = outcome01 ? 1 : 0;
  const err = (pp - o) * (pp - o); // [0..1]
  return err;
}

export function brierReward(p, outcome01) {
  // Reward: 100 for perfect, 0 for worst (err=1)
  const err = brier(p, outcome01);
  return Math.round((1 - err) * 100);
}

/**
 * Market model:
 * - claims: array
 * - agents: reputation table (truth-seeking weight)
 */
export function defaultMarket(seedClaims = []) {
  return {
    version: 1,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    agents: {
      scout: { rep: 0, wins: 0, losses: 0 },
      skeptic: { rep: 0, wins: 0, losses: 0 },
      auditor: { rep: 0, wins: 0, losses: 0 },
      allocator: { rep: 0, wins: 0, losses: 0 },
    },
    claims: seedClaims.map(c => ({
      id: c.id || uid("claim"),
      title: c.title,
      thesis: c.thesis,
      probability: clamp01(c.probability ?? 0.55),
      horizon: c.horizon || "30d",
      evidence: Array.isArray(c.evidence) ? c.evidence : [],
      tags: Array.isArray(c.tags) ? c.tags : [],
      status: "open", // open | challenged | resolved
      createdAt: nowIso(),
      updatedAt: nowIso(),

      // challenge state
      challenged: false,
      challenges: [], // { id, by, note, delta, createdAt }
      lastChallengedAt: null,

      // resolution
      resolvedAt: null,
      outcome: null, // true/false
      scoring: null, // { scoutReward, skepticReward, brierBefore, brierAfter, notes }
    })),
  };
}

export function loadMarket(seedClaims = []) {
  try {
    const raw = localStorage.getItem(KEY_GROWTH_MARKET);
    if (!raw) return defaultMarket(seedClaims);
    const parsed = JSON.parse(raw);

    // basic shape guard
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.claims)) {
      return defaultMarket(seedClaims);
    }
    return parsed;
  } catch {
    return defaultMarket(seedClaims);
  }
}

export function saveMarket(market) {
  const next = { ...market, updatedAt: nowIso() };
  localStorage.setItem(KEY_GROWTH_MARKET, JSON.stringify(next));
  return next;
}

export function upsertClaim(market, claim) {
  const idx = market.claims.findIndex(c => c.id === claim.id);
  const nextClaims = [...market.claims];
  if (idx >= 0) nextClaims[idx] = claim;
  else nextClaims.unshift(claim);
  return { ...market, claims: nextClaims, updatedAt: nowIso() };
}

export function createClaim(market, input) {
  const c = {
    id: uid("claim"),
    title: String(input.title || "New claim"),
    thesis: String(input.thesis || ""),
    probability: clamp01(Number(input.probability ?? 0.55)),
    horizon: input.horizon || "30d",
    evidence: (input.evidence || [])
      .map(s => String(s).trim())
      .filter(Boolean)
      .slice(0, 8),
    tags: (input.tags || [])
      .map(s => String(s).trim())
      .filter(Boolean)
      .slice(0, 8),
    status: "open",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    challenged: false,
    challenges: [],
    lastChallengedAt: null,
    resolvedAt: null,
    outcome: null,
    scoring: null,
  };
  return upsertClaim(market, c);
}

/**
 * Skeptic challenge:
 * - skeptic suggests probability adjustment with note
 * - anti-spam: require |delta| >= 0.05 OR meaningful evidence note
 */
export function challengeClaim(market, claimId, { note, suggestedProbability }) {
  const c = market.claims.find(x => x.id === claimId);
  if (!c || c.status === "resolved") return market;

  const suggested = clamp01(Number(suggestedProbability ?? c.probability));
  const delta = Number((suggested - c.probability).toFixed(2));
  const noteText = String(note || "").trim();

  // anti-spam rule
  const meaningful = Math.abs(delta) >= 0.05 || noteText.length >= 18;

  const ch = {
    id: uid("ch"),
    by: "skeptic",
    note: noteText || (meaningful ? "Challenge issued." : "Low-signal challenge."),
    delta,
    suggestedProbability: suggested,
    meaningful,
    createdAt: nowIso(),
  };

  const next = {
    ...c,
    status: "challenged",
    challenged: true,
    lastChallengedAt: nowIso(),
    challenges: [ch, ...(c.challenges || [])].slice(0, 20),
    updatedAt: nowIso(),
  };

  return upsertClaim(market, next);
}

/**
 * Auditor action: accept a challenge update (changes p), or reject it.
 * - If accepted, probability updates to challenger suggestion.
 * - If rejected, probability stays, and skeptic may be penalized at resolution.
 */
export function auditChallenge(market, claimId, { accept }) {
  const c = market.claims.find(x => x.id === claimId);
  if (!c || c.status === "resolved") return market;

  const latest = (c.challenges || [])[0];
  if (!latest) return market;

  const next = { ...c, updatedAt: nowIso() };

  if (accept) {
    next.probability = clamp01(latest.suggestedProbability);
    next.status = "open"; // back to open after audit-accept
    next.challenged = false;
  } else {
    // keep challenged state visible
    next.status = "challenged";
    next.challenged = true;
  }

  return upsertClaim(market, next);
}

/**
 * Resolve claim:
 * - outcome true/false
 * - scoring:
 *   scoutReward based on Brier reward at time of creation (baseline p0)
 *   skepticReward based on improvement from p0 -> p_final (if challenge existed and meaningful)
 *
 * We store p0 by deriving it from the earliest challenge? We’ll store baseline in scoring notes.
 * For simplicity: baseline = probability at first creation snapshot stored in claim.scoringBaseline
 */
export function resolveClaim(market, claimId, { outcome }) {
  const c = market.claims.find(x => x.id === claimId);
  if (!c || c.status === "resolved") return market;

  const o = !!outcome;

  // baseline: if we previously stored it, use it; else treat current as baseline
  const baselineP =
    (c.scoring && typeof c.scoring.baselineP === "number") ? c.scoring.baselineP : c.probability;

  const finalP = c.probability;

  const b0 = brier(baselineP, o);
  const b1 = brier(finalP, o);

  const scoutReward = brierReward(baselineP, o);

  // skeptic reward: only if there was a meaningful challenge AND calibration improved
  const hadMeaningful = (c.challenges || []).some(ch => ch.meaningful);
  const improved = b1 < b0;

  // base skeptic payout: proportional to improvement, capped
  const skepticReward = hadMeaningful && improved
    ? Math.min(60, Math.max(10, Math.round((b0 - b1) * 200))) // 10..60 typical
    : (hadMeaningful ? -10 : -5); // penalty for noise / no improvement

  const nextAgents = { ...market.agents };

  // Update scout rep
  if (scoutReward >= 60) {
    nextAgents.scout = { ...nextAgents.scout, rep: nextAgents.scout.rep + 2, wins: nextAgents.scout.wins + 1 };
  } else {
    nextAgents.scout = { ...nextAgents.scout, rep: nextAgents.scout.rep - 2, losses: nextAgents.scout.losses + 1 };
  }

  // Update skeptic rep
  if (skepticReward > 0) {
    nextAgents.skeptic = { ...nextAgents.skeptic, rep: nextAgents.skeptic.rep + 2, wins: nextAgents.skeptic.wins + 1 };
  } else {
    nextAgents.skeptic = { ...nextAgents.skeptic, rep: nextAgents.skeptic.rep - 1, losses: nextAgents.skeptic.losses + 1 };
  }

  // auditor gets small steady rep for closure
  nextAgents.auditor = { ...nextAgents.auditor, rep: nextAgents.auditor.rep + 1 };

  const scoring = {
    baselineP,
    finalP,
    brierBefore: Number(b0.toFixed(3)),
    brierAfter: Number(b1.toFixed(3)),
    scoutReward,
    skepticReward,
    notes: improved ? "Calibration improved." : "No calibration improvement.",
  };

  const nextClaim = {
    ...c,
    status: "resolved",
    resolvedAt: nowIso(),
    outcome: o,
    scoring,
    updatedAt: nowIso(),
  };

  return {
    ...market,
    agents: nextAgents,
    claims: market.claims.map(x => (x.id === claimId ? nextClaim : x)),
    updatedAt: nowIso(),
  };
}

export function markBaselineIfMissing(market, claimId) {
  const c = market.claims.find(x => x.id === claimId);
  if (!c) return market;
  if (c.scoring && typeof c.scoring.baselineP === "number") return market;

  const nextClaim = {
    ...c,
    scoring: { ...(c.scoring || {}), baselineP: c.probability },
    updatedAt: nowIso(),
  };
  return upsertClaim(market, nextClaim);
}

export function computeKpis(market) {
  const open = market.claims.filter(c => c.status !== "resolved");
  const resolved = market.claims.filter(c => c.status === "resolved");

  const meaningfulChallenges = market.claims.reduce((acc, c) => {
    const m = (c.challenges || []).filter(ch => ch.meaningful).length;
    return acc + m;
  }, 0);

  const avgScout = resolved.length
    ? Math.round(resolved.reduce((acc, c) => acc + (c.scoring?.scoutReward || 0), 0) / resolved.length)
    : 0;

  const mismatches = resolved.filter(c => {
    // mismatch definition: high confidence wrong (>=0.75 but false OR <=0.25 but true)
    const p = c.scoring?.baselineP ?? c.probability;
    if (p >= 0.75 && c.outcome === false) return true;
    if (p <= 0.25 && c.outcome === true) return true;
    return false;
  }).length;

  return {
    signals: open.length,
    attestations24h: "—", // wired later to Watchtower
    mismatches,
    lastExportUtc: "—", // wired later to export log
    meaningfulChallenges,
    avgScout,
  };
}
