// src/hooks/useAdminCohortsMock.js
import * as React from "react";
import { track } from "@/utils/analytics.js";

/**
 * useAdminCohortsMock()
 * - Returns cohorts[] rows shaped for your AdminCohorts page + CohortTable
 * - Also returns a global funnel (summed across cohorts)
 * - Includes analytics on refresh (silent)
 */
export function useAdminCohortsMock() {
  // initial mock
  const [cohorts, setCohorts] = React.useState(() => genCohorts(10));
  const [funnel, setFunnel] = React.useState(() => genFunnel(cohorts));

  // (optional) silent init event for observability
  React.useEffect(() => {
    try { track("admin_cohorts_init", { cohorts: cohorts.length }, { silent: true }); } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = React.useCallback(() => {
    const next = genCohorts(10);
    setCohorts(next);
    setFunnel(genFunnel(next));
    // updated analytics: record refresh with useful counts
    track(
      "admin_cohorts_refresh",
      {
        cohorts: next.length,
        enroll: next.reduce((s, r) => s + (r.funnel.enroll || 0), 0),
        timestamp: Date.now(),
      },
      { silent: true }
    );
  }, []);

  return { cohorts, funnel, refresh };
}

/* -------------------- mock data helpers -------------------- */

function genCohorts(n = 10) {
  const SCHOOLS = ["East HS", "Central HS", "West HS", "Tech Charter", "Metro CTC", "Summit Prep", "Riverview", "Valley"];
  const PROGRAMS = ["ASL 1", "ASL 2", "Career Bridge", "Builder Track", "Cyber", "CDL", "STNA", "Software"];
  const INSTRUCTORS = ["Nguyen", "Rodriguez", "Kim", "Patel", "Garcia", "Johnson", "Ali", "Brown"];

  return Array.from({ length: n }, (_, i) => {
    // base enrollment and stage counts
    const enroll     = rint(60, 180);
    const first      = clamp(Math.round(enroll * r01(0.70, 0.90)), 0, enroll);
    const day7       = clamp(Math.round(enroll * r01(0.52, 0.78)), 0, enroll);
    const complete   = clamp(Math.round(enroll * r01(0.35, 0.62)), 0, enroll);
    const credential = clamp(Math.round(complete * r01(0.70, 0.92)), 0, complete);
    const job        = clamp(Math.round(credential * r01(0.15, 0.36)), 0, credential);

    const walletPct  = r01(0.35, 0.95); // 35%–95% of learners with wallets connected
    const retention  = enroll ? day7 / enroll : 0;

    // flag anomalous cohorts (simple heuristic)
    const anomaly =
      retention < 0.50 || (credential / Math.max(enroll, 1)) < 0.30
        ? { reason: "Retention/credential dip beyond threshold (mock)" }
        : null;

    const school     = pick(SCHOOLS);
    const program    = pick(PROGRAMS);
    const instructor = pick(INSTRUCTORS);
    const start      = monthOffset(-i); // YYYY-MM rolling backwards

    return {
      id: `cohort_${i}_${Date.now()}`,
      name: `${program} · ${school}`,
      start,                // e.g., "2025-09"
      school,
      instructor,
      program,
      walletPct,            // 0–1 fraction
      retention,            // 0–1 fraction (used by AdminCohorts severity/hint)
      funnel: {             // shape expected by CohortTable
        enroll,
        first,
        day7,
        complete,
        credential,
        job,
      },
      anomaly,              // { reason } | null
    };
  });
}

function genFunnel(rows) {
  const sum = (k) => rows.reduce((s, r) => s + (r.funnel?.[k] || 0), 0);
  return [
    { key: "enroll",      label: "Enrollment",        value: sum("enroll") },
    { key: "first",       label: "First action",      value: sum("first") },
    { key: "day7",        label: "7-day retention",   value: sum("day7") },
    { key: "complete",    label: "Course completion", value: sum("complete") },
    { key: "credential",  label: "Credential minted", value: sum("credential") },
    { key: "job",         label: "Job outcome",       value: sum("job") },
  ];
}

/* -------------------- tiny utils -------------------- */
function rint(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function r01(min = 0, max = 1) {
  return min + Math.random() * (max - min);
}
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function monthOffset(delta) {
  const d = new Date();
  d.setMonth(d.getMonth() + delta);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
