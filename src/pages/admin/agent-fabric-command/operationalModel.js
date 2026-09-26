// src/pages/admin/agent-fabric-command/operationalModel.js
// AFCC Visual V3 — the operational model behind Priority, the ecosystem map and
// search. Pure: it reads the coordinator snapshot and never fetches.
//
// Classification rule: an item gets a priority category only from a state its
// owning authority published (liveness, readiness, a recorded verification
// verdict, a Watchtower action, a registry health/execution status, the layer
// gate). Nothing is classified from absence of data, and nothing is inferred
// across authorities (Fabric health never becomes Truth or Watchtower status).
import { derivePosture, POSTURE } from "./commandAdapters.js";
import { SOURCE_STATE } from "./commandContracts.js";
import { stateCopy } from "./commandPresentation.js";
import { formatAge, formatAgeShort } from "./commandTime.js";
import { HUB_ID, NODE_BY_ID, TOPOLOGY_EDGES, TOPOLOGY_NODES } from "./ecosystemTopology.js";

export const PRIORITY = Object.freeze({
  CRITICAL: "CRITICAL",
  REVIEW: "REVIEW",
  DEGRADED: "DEGRADED",
  STALE: "STALE",
  NORMAL: "NORMAL",
});

export const PRIORITY_ORDER = [PRIORITY.CRITICAL, PRIORITY.REVIEW, PRIORITY.DEGRADED, PRIORITY.STALE, PRIORITY.NORMAL];

export const PRIORITY_COPY = Object.freeze({
  [PRIORITY.CRITICAL]: { label: "Critical", tone: "fail", rule: "Fabric liveness failed, a recorded verification FAIL, a Watchtower quarantine, or a blocked governance gate." },
  [PRIORITY.REVIEW]: { label: "Needs Review", tone: "warn", rule: "Agents the registry flags with a health warning or blocked execution. A pending-approval queue is not published, so approvals are not counted here." },
  [PRIORITY.DEGRADED]: { label: "Degraded", tone: "warn", rule: "Fabric readiness or degraded probe reports a problem, a recorded verification DEGRADED, or a Watchtower DEGRADE action." },
  [PRIORITY.STALE]: { label: "Stale", tone: "gap", rule: "Recorded state older than a freshness threshold published by its authority." },
  [PRIORITY.NORMAL]: { label: "Normal", tone: "ok", rule: "Fabric operational, a recorded verification PASS, a Watchtower ALLOW, a passing gate, or a registry-ready agent." },
});

// Node status vocabulary (display). Missing status uses the gap vocabulary.
export const NODE_STATUS = Object.freeze({
  OPERATIONAL: "Operational",
  HEALTHY: "Healthy",
  NEEDS_REVIEW: "Needs Review",
  DEGRADED: "Degraded",
  BLOCKED: "Blocked",
  STALE: "Stale",
  RESTRICTED: "Restricted",
  UNAVAILABLE: "Unavailable",
  CHECKING: "Checking",
  NOT_PUBLISHED: "Not published",
});

export const NODE_STATUS_TONE = Object.freeze({
  [NODE_STATUS.OPERATIONAL]: "ok",
  [NODE_STATUS.HEALTHY]: "ok",
  [NODE_STATUS.NEEDS_REVIEW]: "warn",
  [NODE_STATUS.DEGRADED]: "warn",
  [NODE_STATUS.BLOCKED]: "fail",
  [NODE_STATUS.STALE]: "gap",
  [NODE_STATUS.RESTRICTED]: "gap",
  [NODE_STATUS.UNAVAILABLE]: "fail",
  [NODE_STATUS.CHECKING]: "neutral",
  [NODE_STATUS.NOT_PUBLISHED]: "gap",
});

const isData = (p) => p && (p.state === SOURCE_STATE.AVAILABLE || p.state === SOURCE_STATE.EMPTY);
const ACCESS_STATES = [SOURCE_STATE.AUTH_BRIDGE_REQUIRED, SOURCE_STATE.AUTH_HARDENING_REQUIRED, SOURCE_STATE.UNAUTHENTICATED, SOURCE_STATE.FORBIDDEN];

// A published freshness threshold is required before anything is called stale.
// Today every Fabric read reports threshold NOT_DEFINED, so this returns null.
export function isStale(ageSeconds, thresholdSeconds) {
  if (typeof ageSeconds !== "number" || typeof thresholdSeconds !== "number" || thresholdSeconds <= 0) return null;
  return ageSeconds > thresholdSeconds;
}

function item(fields) {
  return { detail: null, ageSeconds: null, observedAt: null, ...fields };
}

// ------------------------------------------------------------ classification
// Returns { items, sources }. `sources` lists each contributing source and
// whether it could be classified, so counts always show their coverage.
export function classifyItems(snapshot) {
  const items = [];
  const sources = [];

  // 1. Fabric runtime posture (public probes).
  const posture = derivePosture(snapshot);
  const postureReady = posture.posture !== POSTURE.CHECKING;
  sources.push({ key: "posture", label: "Fabric health probes", classified: postureReady, state: snapshot.healthLive?.state, feeds: [PRIORITY.CRITICAL, PRIORITY.DEGRADED, PRIORITY.NORMAL] });
  if (postureReady) {
    const category = { [POSTURE.OFFLINE]: PRIORITY.CRITICAL, [POSTURE.DEGRADED]: PRIORITY.DEGRADED, [POSTURE.OPERATIONAL]: PRIORITY.NORMAL }[posture.posture];
    // Verifier reasons are classified by the verifier items below, not twice.
    const reasons = posture.reasons.filter((r) => !/verification/.test(r));
    if (category !== PRIORITY.DEGRADED || reasons.length) {
      items.push(item({
        id: "posture", kind: "runtime", nodeId: HUB_ID, label: "Agent Fabric runtime", category,
        reason: posture.posture === POSTURE.OPERATIONAL ? "Liveness, readiness and degraded probes report no problem." : reasons.join(" ") || "Liveness probe did not respond.",
        sourceKey: "healthLive", selection: { type: "posture" }, observedAt: snapshot.healthLive?.source?.observedAt || null,
      }));
    }
  }

  // 2. Verification lanes (last recorded result; never run from here).
  for (const [key, label] of [["infrastructure", "Infrastructure verification"], ["observability", "Observability verification"]]) {
    const p = snapshot[key];
    const classified = isData(p);
    sources.push({ key, label, classified, state: p?.state, feeds: [PRIORITY.CRITICAL, PRIORITY.DEGRADED, PRIORITY.STALE, PRIORITY.NORMAL] });
    if (!classified) continue;
    const category = { FAIL: PRIORITY.CRITICAL, DEGRADED: PRIORITY.DEGRADED, PASS: PRIORITY.NORMAL }[p.data.verdict];
    const age = formatAge(p.data.ageSeconds);
    const stale = isStale(p.data.ageSeconds, p.data.stalenessThresholdSeconds);
    items.push(item({
      id: key, kind: "verifier", nodeId: HUB_ID, label, category: stale ? PRIORITY.STALE : category,
      reason: `Last recorded ${p.data.verdict}${age ? ` ${age}` : ""}.${p.data.degraded.length ? ` Degraded checks: ${p.data.degraded.join(", ")}.` : ""}`,
      sourceKey: key, selection: { type: "source", key }, ageSeconds: p.data.ageSeconds,
    }));
  }

  // 3. Watchtower persisted evaluation: Watchtower's own action per program.
  const wt = snapshot.watchtower;
  const wtClassified = isData(wt) && Array.isArray(wt.data?.programs);
  sources.push({ key: "watchtower", label: "Watchtower persisted risk", classified: wtClassified, state: wt?.state, feeds: [PRIORITY.CRITICAL, PRIORITY.DEGRADED, PRIORITY.STALE, PRIORITY.NORMAL] });
  if (wtClassified) {
    for (const program of wt.data.programs) {
      if (!program.programId || program.state !== "EVALUATED") continue;
      let category = null;
      if (program.quarantined === true || program.action === "QUARANTINE") category = PRIORITY.CRITICAL;
      else if (program.action === "DEGRADE") category = PRIORITY.DEGRADED;
      else if (program.action === "ALLOW") category = PRIORITY.NORMAL;
      if (!category) continue; // no Watchtower action recorded: not classified
      items.push(item({
        id: `program:${program.programId}`, kind: "program", nodeId: "watchtower", label: program.programId, category,
        reason: `Watchtower ${program.action || "quarantine"} · band ${program.riskBand || "not recorded"}${program.reasons.length ? ` · ${program.reasons.join(", ")}` : ""}.`,
        sourceKey: "watchtower", selection: { type: "node", key: "watchtower" }, ageSeconds: wt.data.ageSeconds ?? null,
      }));
    }
    for (const q of wt.data.manualQuarantine?.programs || []) {
      if (!q.programId) continue;
      items.push(item({
        id: `quarantine:${q.programId}`, kind: "quarantine", nodeId: "watchtower", label: `${q.programId} (manual quarantine)`, category: PRIORITY.CRITICAL,
        reason: q.reason ? `Manual quarantine: ${q.reason}.` : "Manual quarantine is active.",
        sourceKey: "watchtower", selection: { type: "node", key: "watchtower" },
      }));
    }
  }

  // 4. Governance gate (layer registry).
  const gate = snapshot.layerGate;
  sources.push({ key: "layerGate", label: "Layer gate", classified: isData(gate), state: gate?.state, feeds: [PRIORITY.CRITICAL, PRIORITY.NORMAL] });
  if (isData(gate)) {
    items.push(item({
      id: "gate", kind: "gate", nodeId: HUB_ID, label: "Governance gate", category: gate.data.gatePass ? PRIORITY.NORMAL : PRIORITY.CRITICAL,
      reason: gate.data.gatePass ? "Gate pass." : `Gate blocked: ${gate.data.blockers.map((b) => `${b.layer || "layer"} ${b.reason || ""}`.trim()).join("; ") || "blockers not named"}.`,
      sourceKey: "layerGate", selection: { type: "gate" },
    }));
  }

  // 5. Agent registry: health status and execution readiness, one item per agent.
  const health = snapshot.agentHealth;
  const readiness = snapshot.agentReadiness;
  sources.push({ key: "agentHealth", label: "Agent registry health", classified: isData(health), state: health?.state, feeds: [PRIORITY.REVIEW, PRIORITY.NORMAL] });
  sources.push({ key: "agentReadiness", label: "Agent execution readiness", classified: isData(readiness), state: readiness?.state, feeds: [PRIORITY.REVIEW, PRIORITY.NORMAL] });
  const agents = new Map();
  if (isData(health)) {
    for (const a of health.data.agents) if (a.agentId) agents.set(a.agentId, { name: a.name, health: a.status, missing: a.missing, execution: null, blockers: [] });
  }
  if (isData(readiness)) {
    for (const a of readiness.data.agents) {
      if (!a.agentId) continue;
      const current = agents.get(a.agentId) || { name: a.name, health: null, missing: [], execution: null, blockers: [] };
      agents.set(a.agentId, { ...current, execution: a.executionStatus, blockers: a.blockers });
    }
  }
  for (const [agentId, a] of agents) {
    const flags = [];
    if (a.health === "warning") flags.push(`registry health warning${a.missing.length ? ` (missing ${a.missing.join(", ")})` : ""}`);
    if (a.execution === "blocked") flags.push(`execution blocked${a.blockers.length ? ` (${a.blockers.join(", ")})` : ""}`);
    let category = null;
    if (flags.length) category = PRIORITY.REVIEW;
    else if (a.health === "ready" && (a.execution === null || a.execution !== "blocked")) category = PRIORITY.NORMAL;
    if (!category) continue;
    items.push(item({
      id: `agent:${agentId}`, kind: "agent", nodeId: HUB_ID, label: a.name || agentId, category,
      reason: flags.length ? `Registry reports ${flags.join("; ")}.` : "Registry reports ready.",
      sourceKey: "agentHealth", selection: { type: "agent", key: agentId },
    }));
  }

  return { items, sources };
}

// Counts per category with explicit coverage, computed only over the sources
// that can place an item in THAT category. A category whose own sources are all
// unreadable shows why (e.g. "Auth bridge required"), never a zero. STALE has no
// count until an authority publishes a freshness threshold.
export function priorityCounts(classified, snapshot) {
  const { items, sources } = classified;
  const thresholdPublished = [snapshot.infrastructure, snapshot.observability, snapshot.watchtower]
    .some((p) => isData(p) && typeof p.data?.stalenessThresholdSeconds === "number");
  return PRIORITY_ORDER.map((category) => {
    const relevant = sources.filter((s) => s.feeds.includes(category));
    const readable = relevant.filter((s) => s.classified);
    const matches = items.filter((i) => i.category === category);
    const unreadable = relevant.filter((s) => !s.classified).map((s) => `${s.label}: ${stateCopy(s.state).label.toLowerCase()}`);
    if (category === PRIORITY.STALE && !thresholdPublished) {
      return { category, count: null, unavailable: "No threshold", detail: "No authority publishes a freshness threshold (threshold NOT_DEFINED). Ages are shown, never judged.", items: [] };
    }
    if (!readable.length) {
      const states = [...new Set(relevant.map((s) => s.state))];
      const loading = states.every((st) => !st || st === SOURCE_STATE.LOADING);
      const label = loading ? "Checking" : states.length === 1 ? stateCopy(states[0]).label : "No source";
      return { category, count: null, unavailable: label, detail: `No contributing source is readable. ${unreadable.join("; ")}.`, items: [] };
    }
    return {
      category,
      count: matches.length,
      coverage: { classified: readable.length, total: relevant.length },
      detail: `${readable.length} of ${relevant.length} contributing sources readable.${unreadable.length ? ` Not readable: ${unreadable.join("; ")}.` : ""}`,
      items: matches,
    };
  });
}

// ----------------------------------------------------------- node status
function sourceStatus(p) {
  if (!p || p.state === SOURCE_STATE.LOADING) return { status: NODE_STATUS.CHECKING };
  if (ACCESS_STATES.includes(p.state)) return { status: NODE_STATUS.RESTRICTED };
  if (p.state === SOURCE_STATE.NOT_CONFIGURED) return { status: NODE_STATUS.NOT_PUBLISHED };
  return { status: NODE_STATUS.UNAVAILABLE };
}

export function nodeStatus(node, snapshot, items) {
  const attention = items.filter((i) => i.nodeId === node.id && i.category !== PRIORITY.NORMAL);
  const base = { attention, ageSeconds: null, freshness: null, metric: null, sourceKey: null };

  if (node.liveSource === "posture") {
    const posture = derivePosture(snapshot);
    const observedAt = snapshot.healthLive?.source?.observedAt || null;
    const status = {
      [POSTURE.CHECKING]: NODE_STATUS.CHECKING,
      [POSTURE.OPERATIONAL]: NODE_STATUS.OPERATIONAL,
      [POSTURE.DEGRADED]: NODE_STATUS.DEGRADED,
      [POSTURE.OFFLINE]: NODE_STATUS.UNAVAILABLE,
    }[posture.posture];
    const ready = snapshot.healthReady;
    const metric = isData(ready) ? (ready.data.ready ? "Ready" : "Not ready") : posture.posture === POSTURE.OFFLINE ? "Liveness failed" : null;
    return {
      ...base,
      status,
      sourceKey: "healthLive",
      observedAt,
      freshness: { kind: "observed", text: posture.posture === POSTURE.CHECKING ? "Checking probes" : "Probed on page load / poll" },
      metric,
      short: metric,
    };
  }

  if (node.liveSource === "watchtower") {
    const wt = snapshot.watchtower;
    if (wt?.state === SOURCE_STATE.NOT_YET_EVALUATED) {
      return { ...base, status: NODE_STATUS.UNAVAILABLE, sourceKey: "watchtower", freshness: { kind: "gap", text: "Not yet evaluated" }, metric: null, short: "Not yet evaluated" };
    }
    if (!isData(wt)) {
      const text = sourceStatus(wt).status === NODE_STATUS.RESTRICTED ? "Access restricted" : "Not available";
      return { ...base, ...sourceStatus(wt), sourceKey: "watchtower", freshness: { kind: "gap", text }, short: null };
    }
    const programs = wt.data.programs.filter((p) => p.state === "EVALUATED");
    const quarantined = programs.some((p) => p.quarantined === true || p.action === "QUARANTINE") || (wt.data.manualQuarantine?.activeCount || 0) > 0;
    const degraded = programs.some((p) => p.action === "DEGRADE");
    const allowed = programs.length > 0 && programs.every((p) => p.action === "ALLOW");
    // Watchtower's own actions decide; with no recorded action the status is not published.
    let status = quarantined ? NODE_STATUS.BLOCKED : degraded ? NODE_STATUS.DEGRADED : allowed ? NODE_STATUS.HEALTHY : NODE_STATUS.NOT_PUBLISHED;
    if (isStale(wt.data.ageSeconds, wt.data.stalenessThresholdSeconds)) status = NODE_STATUS.STALE;
    const age = formatAge(wt.data.ageSeconds);
    return {
      ...base,
      status,
      sourceKey: "watchtower",
      ageSeconds: wt.data.ageSeconds ?? null,
      freshness: age ? { kind: "age", text: `Evaluated ${age}` } : { kind: "gap", text: "Evaluation time not captured" },
      metric: wt.data.worstRiskBand ? `Worst band ${wt.data.worstRiskBand}` : null,
      // Age stays on the node itself so old risk never reads as current.
      short: formatAgeShort(wt.data.ageSeconds) || "time not captured",
    };
  }

  return { ...base, status: NODE_STATUS.NOT_PUBLISHED, freshness: { kind: "gap", text: "No admitted source" }, short: null };
}

// ------------------------------------------------------------- edge state
export const EDGE_STATE = Object.freeze({
  OBSERVED: "observed", // both ends have a readable, healthy source
  DEGRADED: "degraded",
  BLOCKED: "blocked",
  UNOBSERVED: "unobserved", // at least one end publishes no status to this view
});

const OK_STATUSES = [NODE_STATUS.OPERATIONAL, NODE_STATUS.HEALTHY];
// Statuses that come from a readable source (as opposed to a gap or access problem).
const OBSERVED_STATUSES = [...OK_STATUSES, NODE_STATUS.NEEDS_REVIEW, NODE_STATUS.DEGRADED, NODE_STATUS.BLOCKED, NODE_STATUS.STALE];

// A dependency's state comes from its UPSTREAM end, because that is what the
// dependent reads. It is "observed" only when the upstream is observed healthy
// and the downstream is observed at all; a downstream problem is shown on that
// node, not on the edge. Anything else is "not observed", never "normal".
export function edgeState(edge, statusById) {
  const up = statusById[edge.from]?.status;
  const down = statusById[edge.to]?.status;
  if (up === NODE_STATUS.UNAVAILABLE || up === NODE_STATUS.BLOCKED) return EDGE_STATE.BLOCKED;
  if (up === NODE_STATUS.DEGRADED || up === NODE_STATUS.STALE) return EDGE_STATE.DEGRADED;
  if (OK_STATUSES.includes(up) && OBSERVED_STATUSES.includes(down)) return EDGE_STATE.OBSERVED;
  return EDGE_STATE.UNOBSERVED;
}

// ------------------------------------------------------------- the model
export function buildOperationalModel(snapshot) {
  const classified = classifyItems(snapshot);
  const counts = priorityCounts(classified, snapshot);
  const statusById = {};
  for (const node of TOPOLOGY_NODES) statusById[node.id] = nodeStatus(node, snapshot, classified.items);
  const edges = TOPOLOGY_EDGES.map((edge) => ({ ...edge, state: edgeState(edge, statusById) }));
  return { items: classified.items, sources: classified.sources, counts, statusById, edges };
}

// Nodes that hold at least one item in the category (priority filter).
export function nodesForCategory(model, category) {
  if (!category) return null;
  return new Set(model.items.filter((i) => i.category === category).map((i) => i.nodeId));
}

// ---------------------------------------------------------------- search
// V1 search covers only what this page has loaded plus the canonical topology.
export function buildSearchIndex(snapshot, model) {
  const entries = [];
  for (const node of TOPOLOGY_NODES) {
    entries.push({ id: `node:${node.id}`, group: "Systems", label: node.name, hint: `${node.domain} · ${model.statusById[node.id].status}`, selection: { type: "node", key: node.id } });
  }
  if (isData(snapshot.agentHealth)) {
    for (const a of snapshot.agentHealth.data.agents) {
      if (a.agentId) entries.push({ id: `agent:${a.agentId}`, group: "Agents", label: a.name || a.agentId, hint: `${a.agentId}${a.layer ? ` · ${a.layer}` : ""}`, selection: { type: "agent", key: a.agentId } });
    }
  }
  if (isData(snapshot.recentRuns)) {
    for (const run of snapshot.recentRuns.data.runs) {
      const id = run.runId.value || run.rowKey;
      entries.push({ id: `run:${run.rowKey}`, group: "Runs", label: id, hint: [run.agentName.value, run.kind.value, run.outcome.value].filter(Boolean).join(" · "), selection: { type: "run", key: run.rowKey } });
    }
  }
  for (const i of model.items.filter((x) => x.category !== PRIORITY.NORMAL)) {
    entries.push({ id: `alert:${i.id}`, group: "Alerts", label: i.label, hint: `${PRIORITY_COPY[i.category].label} · ${i.reason}`, selection: i.selection });
  }
  return entries;
}

export function searchEntries(entries, query, limit = 12) {
  const q = query.trim().toLowerCase();
  if (!q) return entries.filter((e) => e.group === "Systems" || e.group === "Alerts").slice(0, limit);
  const scored = [];
  for (const e of entries) {
    const label = e.label.toLowerCase();
    const hint = (e.hint || "").toLowerCase();
    let score = -1;
    if (label.startsWith(q)) score = 0;
    else if (label.includes(q)) score = 1;
    else if (hint.includes(q)) score = 2;
    if (score >= 0) scored.push({ e, score });
  }
  return scored.sort((a, b) => a.score - b.score).slice(0, limit).map((s) => s.e);
}

export { NODE_BY_ID };
