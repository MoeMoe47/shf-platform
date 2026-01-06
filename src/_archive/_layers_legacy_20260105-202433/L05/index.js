import { makeLayer } from "../_layerContract.js";
import { recordMetric } from "../L04/index.js";

const SNAP_KEY = "shf:l05:outcomes:snapshot:v1";

function readSnapshot() { try { return JSON.parse(localStorage.getItem(SNAP_KEY) || "null"); } catch { return null; } }
function writeSnapshot(s) { try { localStorage.setItem(SNAP_KEY, JSON.stringify(s)); } catch {} }
function sum(list, key) { try { return (list||[]).reduce((a,r)=>a+Number(r?.[key]||0),0); } catch { return 0; } }

function seed() {
  return {
    version: "v1",
    createdAt: new Date().toISOString(),
    states: [
      { state: "OH", placements: 120, completions: 310, credentials: 180 },
      { state: "MI", placements: 80, completions: 190, credentials: 105 }
    ],
    programs: [
      { name: "Career Launchpad", placements: 60, completions: 140, credentials: 90 },
      { name: "STNA (Ohio)", placements: 40, completions: 110, credentials: 55 },
      { name: "CDL", placements: 20, completions: 60, credentials: 35 }
    ],
    employers: [
      { name: "Employer Partner A", hires: 25, retention90: 0.78 },
      { name: "Employer Partner B", hires: 18, retention90: 0.72 }
    ],
    funding: [
      { source: "Perkins V", dollars: 250000 },
      { source: "WIOA", dollars: 180000 },
      { source: "ESSA Title IV", dollars: 120000 }
    ]
  };
}

export function initOutcomes() {
  const s = readSnapshot();
  if (!s) writeSnapshot(seed());
  recordMetric("outcomes:init", { layer: "L05" });
  return readSnapshot();
}

export function computeSnapshot(options = {}) {
  const snap = readSnapshot() || seed();
  const totals = {
    states: (snap.states||[]).length,
    programs: (snap.programs||[]).length,
    employers: (snap.employers||[]).length,
    fundingSources: (snap.funding||[]).length,
    placements: sum(snap.programs, "placements"),
    completions: sum(snap.programs, "completions"),
    credentials: sum(snap.programs, "credentials"),
    dollars: sum(snap.funding, "dollars"),
  };
  const out = { ...snap, totals, computedAt: new Date().toISOString(), options };
  recordMetric("outcomes:snapshot", { totals });
  return out;
}

export const { LAYER, init, status, guard, recommend, default: Layer } = makeLayer({
  id: "L05",
  name: "Outcomes & Evidence Engine",
  short: "Outcomes",
  purpose: "Compute outcomes snapshots, evidence summaries, and KPI totals for dashboards.",
  fundableAngle: "Performance reporting, measurable outcomes, pay-for-success readiness.",
}, {
  init() { initOutcomes(); }
});
