// src/utils/creditEngine.js
// Deterministic, auditable scoring engine.
// Events[] -> { points, score, tier, log[] } with simple caps.
// Works with src/shared/credit/CreditProvider.jsx (sync call).

import RULES from "@/data/score-rules.json";
import { isEventKey } from "@/utils/eventSchema.js";
import { tierForScore } from "@/utils/creditMath.js"; // ← static import (no await)

// Keep legacy helpers visible for any callers that still import them.
export { tierForScore as tierForScoreLegacy, marketBreakdown } from "@/utils/creditMath.js";

// If (and only if) these are real exports in your ledger file, keep this line.
// If you don’t have them yet, comment the next line out to avoid ESM errors.
export { openDebt, payDebt, openDispute, resolveDispute } from "@/utils/creditLedger.js";

/* ---------- helpers ---------- */
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const byTs  = (a, b) => (a.ts || 0) - (b.ts || 0);
const now   = () => Date.now();

const MS = {
  day:     24 * 60 * 60 * 1000,
  week:     7 * 24 * 60 * 60 * 1000,
  month:   30 * 24 * 60 * 60 * 1000,
  quarter: 90 * 24 * 60 * 60 * 1000,
};

// interpret “caps” fields if present on a rule
function withinCap(log, taskId, windowMs, cap) {
  const cutoff = now() - windowMs;
  const count = log.filter(x => x.taskId === taskId && x.ts >= cutoff).length;
  return count < cap;
}

// S-curve mapping of abstract points → 300–850 score
function pointsToScore(points) {
  const min = 300, max = 850;
  const k = 0.0045; // growth rate (diminishing returns)
  const s = 1 / (1 + Math.exp(-k * (points - 400)));
  return Math.round(min + (max - min) * s);
}

/* ---------- core API ---------- */
export function computeScoreFromEvents(events = []) {
  const bounds = RULES?.bounds || { minPoints: -1000, maxPoints: 3000 };
  const rules  = Array.isArray(RULES?.rules) ? RULES.rules : [];

  const log = [];
  let points = 0;

  // normalize & sort allowable events
  const list = events
    .filter(ev => ev && isEventKey(ev.key))
    .map(ev => ({
      key: ev.key,
      ts: Number(ev.ts || now()),
      meta: ev.meta || {},
      taskId: ev.taskId || ev.key, // stable id used for caps
    }))
    .sort(byTs);

  for (const ev of list) {
    const rule = rules.find(r => r.key === ev.key);
    if (!rule) continue;

    // evaluate weight
    let delta = 0;
    try {
      switch (ev.key) {
        case "edu.attendance.logged":
          delta = ev.meta.present ? rule.weights.present : rule.weights.absent;
          break;
        case "edu.grade.posted":
          delta = ev.meta.pct >= (rule.thresholds?.minPct ?? 70)
            ? rule.weights.good
            : rule.weights.poor;
          break;
        case "edu.microcert.earned":
          delta = rule.weights.earned;
          break;
        case "eng.assignment.submitted":
          delta = ev.meta.onTime ? rule.weights.onTime : rule.weights.late;
          break;
        case "social.action":
          delta = rule.weights[ev.meta.action] ?? 0;
          break;
        case "credit.payment.posted":
          delta = ev.meta.onTime ? rule.weights.onTime : rule.weights.late;
          break;
        case "credit.dispute.resolved":
          delta = rule.weights[ev.meta.outcome] ?? 0;
          break;
        case "credit.derog.added":
          delta = rule.weights[ev.meta.type] ?? rule.weights.generic ?? -30;
          break;
        default:
          delta = rule.weights?.default ?? 0;
      }
    } catch {
      delta = 0;
    }

    // rule-level caps (optional)
    const cap = rule.cap ?? null;
    if (cap?.perWeek     && !withinCap(log, ev.taskId, MS.week,    cap.perWeek))     { log.push({ ...ev, delta: 0, reason: "cap.perWeek"     }); continue; }
    if (cap?.perMonth    && !withinCap(log, ev.taskId, MS.month,   cap.perMonth))    { log.push({ ...ev, delta: 0, reason: "cap.perMonth"    }); continue; }
    if (cap?.perQuarter  && !withinCap(log, ev.taskId, MS.quarter, cap.perQuarter))  { log.push({ ...ev, delta: 0, reason: "cap.perQuarter"  }); continue; }

    points += (Number(delta) || 0);
    log.push({ ...ev, delta, reason: "ok" });
  }

  // global clamps
  points = clamp(points, bounds.minPoints ?? -1000, bounds.maxPoints ?? 3000);

  const score = pointsToScore(points);
  const tier  = tierForScore(score); // ← sync, no await

  return { points, score, tier, log };
}

export default { computeScoreFromEvents };
