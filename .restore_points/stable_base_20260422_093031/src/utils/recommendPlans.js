// src/utils/recommendPlans.js
// Zero-API planner: turns pathways → A/B/C plans (fastest, least cost, highest placement).

// Use a RELATIVE import to avoid alias issues in some setups.
// If you have the @ alias configured, you can switch back to "@/utils/analytics.js".
import { track } from "../utils/analytics.js";

/**
 * recommendPlans(inputs, pathways, options?)
 * Returns up to three plans: A (fastest), B (least cost), C (highest placement).
 *
 * Minimal inputs supported:
 * {
 *   hoursPerWeek?: number,
 *   device?: "desktop"|"laptop"|"tablet"|"mobile"|"unknown",
 *   transport?: "car"|"public"|"bike"|"walk"|"remote_only"|"unknown",
 *   priorSkills?: string[],
 *   veteran?: boolean,
 *   unemployed?: boolean,
 *   hsGrad?: boolean,
 *   age?: number,
 *   state?: string,
 *   householdSize?: number
 * }
 */
export function recommendPlans(inputs = {}, pathways = [], options = {}) {
  const cfg = {
    defaultModuleMinutes: 45,
    minHoursPerWeek: 4,
    targetStepsPreview: 5,
    distinctPathways: true,
    now: new Date(),
    ...options,
  };

  const norms = normalizePathways(pathways);
  if (norms.length === 0) return [];

  // Derive feasibility/duration/cost per pathway
  const derived = norms.map((p) => deriveForPathway(p, inputs, cfg));

  // Ranked lists by strategy
  const rankedFast  = rankByFastest(derived);
  const rankedCost  = rankByLeastCost(derived);
  const rankedPlace = rankByPlacement(derived);

  // Pick A/B/C (keep pathways distinct if possible)
  const picks = pickDistinct(
    [
      { strategy: "fastest",            list: rankedFast },
      { strategy: "least_cost",         list: rankedCost },
      { strategy: "highest_placement",  list: rankedPlace },
    ],
    cfg.distinctPathways
  );

  // Convert to plan objects
  const plans = picks.map(({ strategy, item }) => buildPlan(item, strategy, cfg));

  // One quiet analytics ping
  try {
    track(
      "pathway_plan_generated",
      {
        strategies: plans.map((p) => p.strategy),
        pathwayIds: plans.map((p) => p.pathwayId),
      },
      { silent: true }
    );
  } catch {}

  return plans;
}

/* ----------------------------------------------------------------------------
 * Per-pathway derivation
 * --------------------------------------------------------------------------*/
function deriveForPathway(p, inputs, cfg) {
  const hours = clampNum(inputs.hoursPerWeek, cfg.minHoursPerWeek, 80) ?? cfg.minHoursPerWeek;

  const moduleMinutes =
    Array.isArray(p.modules) && p.modules.length > 0
      ? sumBy(p.modules, (m) => toNum(m.minutes, cfg.defaultModuleMinutes))
      : p.estWeeks
      ? p.estWeeks * 60 * Math.max(1, hours)
      : 12 * 60 * Math.max(1, hours); // coarse fallback

  const weeksByModules = Math.max(1, Math.ceil(moduleMinutes / 60 / Math.max(1, hours)));
  const estWeeks = toNum(p.estWeeks, weeksByModules);
  const estCost  = Math.max(0, toNum(p.estCost, 0));

  // Feasibility penalties (device/transport/prereqs)
  const penalty = feasibilityPenalty(p, inputs); // 0..0.85 (0 = none)
  const weeksAdj = Math.ceil(estWeeks * (1 + penalty * 0.30)); // up to +30%
  const costAdj  = Math.round(estCost * (1 + penalty * 0.15)); // up to +15%

  const netCostAfterAid = Math.max(0, costAdj - estimateAid(p, inputs, { baseCost: costAdj }));
  const placement = placementScore(p); // 0..100

  const localBoost    = (p.jobsMeta?.localEmployers?.length || 0) > 0 ? 3 : 0;
  const partnersBoost = (p.partners?.length || 0) > 0 ? 2 : 0;

  return {
    pathway: p,
    estWeeks,
    estCost,
    adjWeeks: weeksAdj,
    adjCost:  costAdj,
    netCostAfterAid,
    placement: clampNum(placement + localBoost + partnersBoost, 0, 100),
    penalty,
  };
}

function feasibilityPenalty(p, inputs) {
  let pen = 0;

  // Device needs vs actual device
  const needs = p.deviceNeeds || "any";
  const dev   = inputs.device || "unknown";
  if (needs === "desktop" && (dev === "mobile" || dev === "tablet" || dev === "unknown")) pen += 0.35;
  if (needs === "laptop"  &&  dev === "mobile") pen += 0.15;

  // Transport vs delivery
  const del   = p.delivery || "remote";
  const trans = inputs.transport || "unknown";
  if (del !== "remote" && (trans === "remote_only" || trans === "unknown")) pen += 0.25;

  // Prereqs vs prior skills
  const reqs = (p.prerequisites || []).map(nor);
  const have = new Set((inputs.priorSkills || []).map(nor));
  if (reqs.length) {
    const met = reqs.filter((r) => have.has(r)).length;
    const gapShare = 1 - met / reqs.length;
    pen += 0.20 * gapShare; // up to +0.2 if nothing matches
  }

  return clampNum(pen, 0, 0.85);
}

function placementScore(p) {
  // If openingsIndex is present & numeric, prefer it
  const oi = p?.jobsMeta?.openingsIndex;
  if (oi != null && Number.isFinite(Number(oi))) {
    return clampNum(Number(oi), 0, 100);
  }

  // Otherwise infer from medianStart + presence of employers/partners
  let s = 50;
  const start = toNum(p.jobsMeta?.medianStart, 0);
  if (start > 18000) s += 10;
  if (start > 28000) s += 10;
  if ((p.jobsMeta?.localEmployers?.length || 0) > 0) s += 10;
  if ((p.partners?.length || 0) > 0)       s += 8;
  return clampNum(s, 0, 100);
}

/* ----------------------------------------------------------------------------
 * Ranking strategies
 * --------------------------------------------------------------------------*/
function rankByFastest(arr) {
  return [...arr].sort(
    (a, b) =>
      asc(a.adjWeeks, b.adjWeeks) ||
      asc(a.netCostAfterAid, b.netCostAfterAid) ||
      desc(a.placement, b.placement)
  );
}
function rankByLeastCost(arr) {
  return [...arr].sort(
    (a, b) =>
      asc(a.netCostAfterAid, b.netCostAfterAid) ||
      asc(a.adjWeeks, b.adjWeeks) ||
      desc(a.placement, b.placement)
  );
}
function rankByPlacement(arr) {
  return [...arr].sort(
    (a, b) =>
      desc(a.placement, b.placement) ||
      asc(a.adjWeeks, b.adjWeeks) ||
      asc(a.netCostAfterAid, b.netCostAfterAid)
  );
}

/* ----------------------------------------------------------------------------
 * Pick distinct pathways for A/B/C
 * --------------------------------------------------------------------------*/
function pickDistinct(strategyLists, distinct) {
  const seen = new Set();
  const picks = [];

  for (const { strategy, list } of strategyLists) {
    let chosen = null;

    for (const item of list) {
      const id = item.pathway.id || item.pathway.title;
      if (!distinct || !seen.has(id)) {
        chosen = item;
        if (distinct) seen.add(id);
        break;
      }
    }

    // If nothing unique available, allow the top duplicate as fallback
    if (!chosen && list[0]) chosen = list[0];
    if (chosen) picks.push({ strategy, item: chosen });
  }

  return picks;
}

/* ----------------------------------------------------------------------------
 * Build Plan objects
 * --------------------------------------------------------------------------*/
function buildPlan(d, strategy, cfg) {
  const p  = d.pathway;
  const pid = p.id ?? slugify(p.title ?? `path-${Math.random().toString(36).slice(2)}`);
  const id = `plan_${strategy}_${String(pid).replace(/\W+/g, "_")}`;

  return {
    id,
    strategy, // "fastest" | "least_cost" | "highest_placement"
    pathwayId: pid,
    title: p.title,
    estWeeks: d.adjWeeks,
    estCost: d.adjCost,
    netCostAfterAid: Math.max(0, d.netCostAfterAid),
    nextCohortDate: p.nextCohortDate || computeNextCohortDate(cfg.now),
    steps: buildStepsPreview(p, cfg.targetStepsPreview),
    pathway: p, // embed for UI (modules, firstCredential, etc.)
  };
}

function buildStepsPreview(p, maxSteps) {
  const steps = [];

  // First 3 modules (if any)
  const mods = Array.isArray(p.modules) ? p.modules : [];
  for (let i = 0; i < Math.min(3, mods.length); i++) {
    const m = mods[i];
    steps.push({ type: "module", title: m.title || m.slug || `Module ${i + 1}` });
  }

  // Credential step
  if (p.firstCredential?.name) {
    steps.push({ type: "exam", title: `Sit for ${p.firstCredential.name}` });
  }

  // Apply step (local employers or partners)
  const employers =
    p.jobsMeta?.localEmployers && p.jobsMeta.localEmployers.length
      ? p.jobsMeta.localEmployers
      : (p.partners || []).map((x) => x.name).filter(Boolean);

  if (employers.length > 0) {
    steps.push({ type: "apply", title: `Apply to ${Math.min(3, employers.length)} local employers` });
  } else {
    steps.push({ type: "apply", title: "Apply to 3 entry-level roles" });
  }

  return steps.slice(0, Math.max(3, maxSteps || 5));
}

/* ----------------------------------------------------------------------------
 * Funding estimator (heuristic only; replace with API in Phase 2)
 * --------------------------------------------------------------------------*/
export function estimateAid(pathway, inputs = {}, ctx = {}) {
  const baseCost = toNum(ctx.baseCost, toNum(pathway.estCost, 0));
  if (baseCost <= 0) return 0;

  let aid = 0;
  if (inputs.unemployed) aid += baseCost * 0.35;                       // WIOA
  if (inputs.veteran)    aid += Math.min(baseCost * 0.4, 4000);        // GI cap
  if (toNum(inputs.age, 30) <= 24) aid += baseCost * 0.15;             // Title I youth
  if (inputs.hsGrad === false) aid += baseCost * 0.1;                  // HS completion support

  const cluster = (pathway.cluster || "").toLowerCase();               // cluster nudges
  if (/health|nurse|care/.test(cluster))          aid += baseCost * 0.1;
  if (/manufactur|trades|logist/.test(cluster))   aid += baseCost * 0.08;
  if (/cyber|it|cloud|data/.test(cluster))        aid += baseCost * 0.06;

  const hh = toNum(inputs.householdSize, 0);                           // need proxy
  if (hh >= 4) aid += baseCost * 0.05;

  return clampNum(aid, 0, baseCost * 0.9);                             // keep ≤90%
}

/* ----------------------------------------------------------------------------
 * Helpers
 * --------------------------------------------------------------------------*/
function normalizePathways(arr) {
  return (Array.isArray(arr) ? arr : [])
    .map((p, i) => ({
      ...p,
      id: p?.id ?? `pw_${i}`,
      title: p?.title ?? `Pathway ${i + 1}`,
      modules: Array.isArray(p?.modules) ? p.modules : [],
      jobsMeta: p?.jobsMeta || {},
      partners: Array.isArray(p?.partners) ? p.partners : [],
      prerequisites: Array.isArray(p?.prerequisites) ? p.prerequisites : [],
    }))
    .filter(Boolean);
}
function computeNextCohortDate(now = new Date()) {
  // Next Monday at least 10 days out, 09:00 local
  const d = new Date(now.getTime());
  d.setDate(d.getDate() + 10);
  const delta = (1 - d.getDay() + 7) % 7; // to Monday
  d.setDate(d.getDate() + delta);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

function asc(a, b)  { return a === b ? 0 : a < b ? -1 : 1; }
function desc(a, b) { return a === b ? 0 : a > b ? -1 : 1; }

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function clampNum(n, min = 0, max = 1) {
  const x = Number(n);
  if (!Number.isFinite(x)) return min;
  return Math.max(min, Math.min(max, x));
}
function sumBy(arr, f) { let s = 0; for (const x of arr) s += toNum(f(x), 0); return s; }
function slugify(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
function nor(s) { return String(s || "").trim().toLowerCase(); }

/* ----------------------------------------------------------------------------
 * Optional single-strategy helpers
 * --------------------------------------------------------------------------*/
export function recommendFastest(inputs, pathways, options) {
  const d = normalizePathways(pathways).map((p) => deriveForPathway(p, inputs, { ...options }));
  return d.length ? buildPlan(rankByFastest(d)[0], "fastest", { now: new Date(), ...options }) : null;
}
export function recommendLeastCost(inputs, pathways, options) {
  const d = normalizePathways(pathways).map((p) => deriveForPathway(p, inputs, { ...options }));
  return d.length ? buildPlan(rankByLeastCost(d)[0], "least_cost", { now: new Date(), ...options }) : null;
}
export function recommendHighestPlacement(inputs, pathways, options) {
  const d = normalizePathways(pathways).map((p) => deriveForPathway(p, inputs, { ...options }));
  return d.length ? buildPlan(rankByPlacement(d)[0], "highest_placement", { now: new Date(), ...options }) : null;
}

/* ----------------------------------------------------------------------------
 * Default export (so CareerPlanner can `import recommendPlans from ...`)
 * --------------------------------------------------------------------------*/
export default recommendPlans;
