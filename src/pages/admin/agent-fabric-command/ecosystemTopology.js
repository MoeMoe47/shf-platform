// src/pages/admin/agent-fabric-command/ecosystemTopology.js
// AFCC Visual V3 — canonical ecosystem topology.
//
// Every node and edge below is transcribed from the "Ecosystem Connection
// Matrix" in docs/AGENT_FABRIC_COMMAND_CENTER_MASTER_PLAN.md. A relationship the
// matrix does not confirm is not drawn. This file describes STRUCTURE only
// (who connects to whom, and who owns what). Live status comes exclusively from
// the admitted Command Center sources (commandContracts.js); a node with no
// admitted source never borrows status from Fabric health.

// Edge direction: A -> B means B depends on A (A is upstream of B).
// `flow` types the dependency so investigation follows real lineage instead of
// fanning out through the hub to every system (see FLOW_CONTINUES).
export const FLOW = Object.freeze({
  EVENTS: "EVENTS", // signed operational events (SHS API producer -> Fabric ingestion)
  EVIDENCE: "EVIDENCE", // evidence record / Truth source-claim projection and its consumers
  RISK: "RISK", // Watchtower risk gating and LOO rankings
  RUNS: "RUNS", // run ledger payloads (runs -> LOO payload, runs -> reports)
  SERVICE: "SERVICE", // a Fabric-hosted service or route consumed by the system; terminal
  OBSERVES: "OBSERVES", // navigation / observation only; no data dependency confirmed
});

// When a path arrives over a flow, which downstream flows continue it.
// Derived from the matrix: events project to evidence (Truth); Truth feeds
// Oracle, Watchtower and reporting; Watchtower gates LOO; run payloads feed LOO
// and reports.
export const FLOW_CONTINUES = Object.freeze({
  [FLOW.EVENTS]: [FLOW.EVENTS, FLOW.EVIDENCE],
  [FLOW.EVIDENCE]: [FLOW.EVIDENCE, FLOW.RISK],
  [FLOW.RISK]: [FLOW.RISK],
  [FLOW.RUNS]: [FLOW.RISK],
  [FLOW.SERVICE]: [],
  [FLOW.OBSERVES]: [],
});

export const HUB_ID = "agent-fabric";

const admin = (route, permission) => ({ kind: "admin", route, permission });
const app = (href, label) => ({ kind: "app", href, label });
const none = (reason) => ({ kind: "none", reason });

// tier: horizontal position in the layered layout (0 = upstream producers,
// 2 = hub, 4 = downstream consumers of Fabric-hosted authorities).
export const TOPOLOGY_NODES = Object.freeze([
  {
    id: HUB_ID,
    name: "Agent Fabric",
    domain: "Governance and execution service",
    tier: 2,
    hub: true,
    liveSource: "posture",
    summary: "FastAPI governance and execution service: agent and layer registry, run ledger, ingestion, and host of the Truth, Watchtower, LOO and Oracle routes.",
    authority: "Agent Fabric admin registry owns canonical Fabric agents and layer toggles.",
    authBoundary: "Public health probes; Fabric session with bos.governance.read for Command Center reads; a server-held admin credential for registry and run routes (read by the Command Center only through the SHS bridge).",
    evidenceProduced: "Run events, draft artifacts with SHA-256, plan snapshot hashes, recorded verification results.",
    failureBehavior: "Startup fail-closed gates; readiness 503 when not ready.",
    destination: admin("/agent-fabric", "audit.view"),
  },
  {
    id: "shs",
    name: "SHS API",
    domain: "Operational systems · event producer",
    tier: 1,
    summary: "Emits HMAC-signed operational events (lesson, referral, report, grant, funding, workforce, GPA) into Fabric internal ingestion.",
    authority: "SHS owns source events; Fabric owns ingestion, evidence and Truth projection.",
    authBoundary: "HMAC service identity service:shs-api, tenant scope, idempotency, rate limit.",
    evidenceProduced: "Operational event, evidence record, Truth source/claim when lineage is eligible.",
    failureBehavior: "401/403 auth rejection, 429 rate limit, 503 projection failure.",
    destination: admin("/ops/system-registry", "audit.view"),
    destinationLabel: "SHS system registry",
  },
  {
    id: "civicsure",
    name: "CivicSure",
    domain: "Hub · ClientOps · referrals",
    tier: 0,
    summary: "Hub systems feed referral and reporting events to Fabric through the SHS API.",
    authority: "Hub owns the referral lifecycle; Fabric owns evidence projection.",
    authBoundary: "Service identity and organization scope (producer hub.referral).",
    evidenceProduced: "referral.created operational event; evidence and Truth draft when lineage is eligible.",
    failureBehavior: "Non-projectable event or projection failure.",
    destination: app("/index.html#/civicsure", "CivicSure app"),
  },
  {
    id: "curriculum",
    name: "Curriculum",
    domain: "Learning progress",
    tier: 0,
    summary: "SHS API emits lesson and progress proof events that Fabric ingests.",
    authority: "Curriculum owns learner progress; Fabric owns institutional evidence projection.",
    authBoundary: "Service identity and tenant (curriculum.lesson, lesson.completed).",
    evidenceProduced: "Operational event, evidence, Truth draft.",
    failureBehavior: "Unsupported event rejected.",
    destination: app("/curriculum.html#/", "Curriculum app"),
  },
  {
    id: "career",
    name: "Career & Workforce",
    domain: "Career Center · workforce",
    tier: 0,
    summary: "Shares the Curriculum / Learning Arcade lane: workforce and progress events reach Fabric through the SHS API.",
    authority: "Career Center owns learner progress; Fabric owns institutional evidence projection.",
    authBoundary: "Service identity and tenant.",
    evidenceProduced: "Operational event, evidence, Truth draft.",
    failureBehavior: "Unsupported event rejected.",
    destination: app("/career.html#/dashboard", "Career app"),
  },
  {
    id: "shf",
    name: "SHF Impact",
    domain: "SHF Impact Command · simulation",
    tier: 1,
    summary: "Consumes Fabric outcome simulation and the agent page-context dry run.",
    authority: "SHF command cannot bypass Fabric agent policy.",
    authBoundary: "Frontend uses the Fabric base.",
    evidenceProduced: "Run-like simulation output, page dry-run.",
    failureBehavior: "UI falls back or reports an error.",
    destination: admin("/command", "audit.view"),
  },
  {
    id: "bos",
    name: "BOS",
    domain: "Executive command · system registry",
    tier: 1,
    summary: "BOS pages navigate and link to Fabric surfaces. No direct Fabric-only route is confirmed.",
    authority: "BOS observes; it does not replace Fabric authorities.",
    authBoundary: "SHS permissions.",
    evidenceProduced: "Registry and readiness evidence.",
    failureBehavior: "Local UI warnings.",
    destination: admin("/ops/executive-command", "audit.view"),
  },
  {
    id: "metaverse",
    name: "Metaverse",
    domain: "BFE · simulation",
    tier: 1,
    summary: "Metaverse BFE pages read Fabric BFE summary, decision and outcome (advisory).",
    authority: "BFE is advisory.",
    authBoundary: "No route-level auth observed on /bfe/*.",
    evidenceProduced: "BFE outcome.",
    failureBehavior: "Fetch failure.",
    destination: app("/arcade.html#/metaverse/growth-observatory", "Arcade · Growth Observatory"),
  },
  {
    id: "truth",
    name: "Truth Spine",
    domain: "Verification and approval",
    tier: 3,
    summary: "Verifies claims and owns public and internal approval state. Fabric services write and read Truth.",
    authority: "Truth verifies and approves; the Command Center only observes.",
    authBoundary: "Permission split: read, create, verify, approve, revoke; tenant or global scope.",
    evidenceProduced: "Truth packages, claim versions, audit.",
    failureBehavior: "Permission denied; fails closed.",
    destination: admin("/truth-spine", "truth.view"),
  },
  {
    id: "registry",
    name: "Registry",
    domain: "Autonomous Registry · entity ledger",
    tier: 3,
    summary: "Fabric registry and append-only entity ledger; admin upserts and attestations.",
    authority: "Registry owns entity truth.",
    authBoundary: "Admin authority for upsert and attest.",
    evidenceProduced: "Ledger events and proofs.",
    failureBehavior: "Ledger verification failure.",
    destination: admin("/registry", null),
  },
  {
    id: "guardrails",
    name: "AI Guardrails",
    domain: "Output constraints",
    tier: 3,
    summary: "Agent output checks run through guardrail policies; decisions are logged.",
    authority: "Guardrails constrain output; no Truth or publish authority.",
    authBoundary: "Admin route and SHS route protection.",
    evidenceProduced: "Audit-feed decisions.",
    failureBehavior: "Block or warn.",
    destination: admin("/ai-guardrails", "truth.view"),
  },
  {
    id: "treasury",
    name: "Treasury",
    domain: "Treasury · capital operator",
    tier: 3,
    summary: "Fabric hosts treasury, pools and operator allocation routes consumed by capital and operator UIs.",
    authority: "Treasury and operator routes are financial authority.",
    authBoundary: "Route auth not observed in decorators; must be hardened before any UI action.",
    evidenceProduced: "Ledger and proof.",
    failureBehavior: "Settlement or validation errors.",
    destination: app("/treasury.html#/dashboard", "Treasury app"),
  },
  {
    id: "oracle",
    name: "Oracle",
    domain: "Supportability rulings",
    tier: 4,
    summary: "Decides what verified evidence supports. Consumes Truth packages; does not verify or publish.",
    authority: "Oracle decides supportability only.",
    authBoundary: "Admin route and SHS route protection.",
    evidenceProduced: "Ruling packages.",
    failureBehavior: "Insufficient evidence.",
    destination: admin("/oracle", "truth.view"),
  },
  {
    id: "watchtower",
    name: "Watchtower",
    domain: "Risk · integrity · quarantine",
    tier: 4,
    liveSource: "watchtower",
    summary: "Observes cross-program risk from LOO rankings, Truth and layer summaries; stores risk snapshots, quarantine and attestations.",
    authority: "Watchtower observes and quarantines; it does not rank beyond its risk gate.",
    authBoundary: "Command Center reads persisted state with a Fabric session; quarantine is a Security/Admin action outside this view.",
    evidenceProduced: "Risk snapshots and attestations.",
    failureBehavior: "Startup hard-fails on store or risk-lock verification when configured.",
    destination: none("Watchtower has no dedicated page; /watchtower redirects to the Agent Fabric page. Its read-only projection is on this page."),
  },
  {
    id: "loo",
    name: "LOO",
    domain: "Outcome scoring and ranking",
    tier: 4,
    summary: "Scores and ranks program outcomes. Applies Watchtower risk fields and manual quarantine; quarantined programs score 0.",
    authority: "LOO ranks and advises; Watchtower gates quarantines.",
    authBoundary: "No route auth observed.",
    evidenceProduced: "Ranking evidence.",
    failureBehavior: "Adapter failures lead to quarantine.",
    destination: admin("/lord-outcomes", "audit.view"),
  },
  {
    id: "reporting",
    name: "Reporting",
    domain: "Reports · proof · publication",
    tier: 4,
    summary: "Run reports, PDFs and proof packs are built from run ids; publication is policy-checked.",
    authority: "Reports communicate; they do not verify or approve.",
    authBoundary: "Publish requires the server-held Fabric admin credential; read routes vary.",
    evidenceProduced: "Report proof, PDF hash.",
    failureBehavior: "Policy blocks publish.",
    destination: admin("/reporting", "reports.view"),
  },
]);

// Each edge cites the matrix row it comes from.
export const TOPOLOGY_EDGES = Object.freeze([
  { id: "civicsure-shs", from: "civicsure", to: "shs", flow: FLOW.EVENTS, label: "referral.created events", matrixRow: "CivicSure / Hub / ClientOps" },
  { id: "curriculum-shs", from: "curriculum", to: "shs", flow: FLOW.EVENTS, label: "lesson and progress proof events", matrixRow: "Career Center / Curriculum / Learning Arcade" },
  { id: "career-shs", from: "career", to: "shs", flow: FLOW.EVENTS, label: "workforce and progress events", matrixRow: "Career Center / Curriculum / Learning Arcade" },
  { id: "shs-fabric", from: "shs", to: HUB_ID, flow: FLOW.EVENTS, label: "HMAC internal ingestion", matrixRow: "SHS API" },
  { id: "fabric-shf", from: HUB_ID, to: "shf", flow: FLOW.SERVICE, label: "simulation and agent dry run", matrixRow: "SHF Impact Command" },
  { id: "fabric-bos", from: HUB_ID, to: "bos", flow: FLOW.OBSERVES, label: "links to Fabric surfaces", matrixRow: "BOS / Executive Command" },
  { id: "fabric-metaverse", from: HUB_ID, to: "metaverse", flow: FLOW.SERVICE, label: "BFE summary and decisions", matrixRow: "Metaverse" },
  { id: "fabric-truth", from: HUB_ID, to: "truth", flow: FLOW.EVIDENCE, label: "evidence and Truth projection", matrixRow: "Truth Spine" },
  { id: "fabric-registry", from: HUB_ID, to: "registry", flow: FLOW.SERVICE, label: "registry and entity ledger", matrixRow: "Autonomous Registry" },
  { id: "fabric-guardrails", from: HUB_ID, to: "guardrails", flow: FLOW.SERVICE, label: "agent output checks", matrixRow: "AI Guardrails" },
  { id: "fabric-treasury", from: HUB_ID, to: "treasury", flow: FLOW.SERVICE, label: "treasury and operator routes", matrixRow: "Treasury / Capital Operator" },
  { id: "truth-oracle", from: "truth", to: "oracle", flow: FLOW.EVIDENCE, label: "Truth packages", matrixRow: "Oracle" },
  { id: "truth-watchtower", from: "truth", to: "watchtower", flow: FLOW.EVIDENCE, label: "Truth layer summary", matrixRow: "Watchtower" },
  { id: "truth-reporting", from: "truth", to: "reporting", flow: FLOW.EVIDENCE, label: "evidence and Truth metadata", matrixRow: "Agent Reporting Agency" },
  { id: "fabric-watchtower", from: HUB_ID, to: "watchtower", flow: FLOW.RISK, label: "layer summaries", matrixRow: "Watchtower" },
  { id: "loo-watchtower", from: "loo", to: "watchtower", flow: FLOW.RISK, label: "LOO rankings", matrixRow: "Watchtower" },
  { id: "watchtower-loo", from: "watchtower", to: "loo", flow: FLOW.RISK, label: "risk gating and quarantine", matrixRow: "LOO" },
  { id: "fabric-loo", from: HUB_ID, to: "loo", flow: FLOW.RUNS, label: "run LOO payloads", matrixRow: "LOO" },
  { id: "fabric-reporting", from: HUB_ID, to: "reporting", flow: FLOW.RUNS, label: "run reports and proof", matrixRow: "Agent Reporting Agency" },
]);

// Authorities the matrix lists without a confirmed Fabric connection. They are
// not drawn on the map; drawing them unconnected would imply a relationship
// was checked and found healthy.
export const UNCONNECTED_AUTHORITIES = Object.freeze([
  { id: "oas", name: "OAS", reason: "No direct code connection to Agent Fabric was found in the audited files (master plan, Ecosystem Connection Matrix).", destination: app("/oas.html", "Open Autonomous Standard") },
]);

export const NODE_BY_ID = Object.freeze(Object.fromEntries(TOPOLOGY_NODES.map((n) => [n.id, n])));

// Left-navigation order for ECOSYSTEM AUTHORITIES.
export const AUTHORITY_NAV = Object.freeze(["registry", "oracle", "loo", "shs", "shf", "bos", "civicsure", "curriculum", "career", "metaverse", "oas", "treasury"]);

export function authorityEntry(id) {
  if (NODE_BY_ID[id]) return NODE_BY_ID[id];
  return UNCONNECTED_AUTHORITIES.find((a) => a.id === id) || null;
}

// ------------------------------------------------------------- traversal
// Directed, flow-aware reachability. The first hop from the selected node takes
// any edge; later hops continue only along flows that the arriving flow feeds.
// Hub-hosted SERVICE/OBSERVES edges therefore never fan a producer's path out to
// unrelated systems.
export function dependencyPaths(nodeId, edges = TOPOLOGY_EDGES) {
  const outgoing = (id) => edges.filter((e) => e.from === id);
  const incoming = (id) => edges.filter((e) => e.to === id);

  // Breadth-first over EDGES (a node can be reached by several flows, and only
  // the flow it arrived on decides where the path continues). `edgeParent`
  // records the edge each edge was reached from, so a displayed chain is always
  // a path the flow rules actually allow.
  function walk(start, nextEdges, endOf, continues) {
    const nodes = new Set();
    const edgeIds = new Set();
    const queue = nextEdges(start).map((e) => ({ edge: e, depth: 1, prev: null }));
    const depthOf = new Map();
    const edgeParent = new Map();
    const nodeEdge = new Map();
    const byId = new Map(edges.map((e) => [e.id, e]));
    while (queue.length) {
      const { edge, depth, prev } = queue.shift();
      if (edgeIds.has(edge.id)) continue;
      edgeIds.add(edge.id);
      edgeParent.set(edge.id, prev);
      const end = endOf(edge);
      if (end === nodeId) continue;
      if (!depthOf.has(end)) {
        depthOf.set(end, depth);
        nodeEdge.set(end, edge.id);
      }
      nodes.add(end);
      for (const next of nextEdges(end)) {
        if (continues(edge, next)) queue.push({ edge: next, depth: depth + 1, prev: edge.id });
      }
    }
    // Returns [selected, ..., id] along the discovering path.
    const chainTo = (id) => {
      const chain = [id];
      let edgeId = nodeEdge.get(id);
      while (edgeId && chain.length < 16) {
        const e = byId.get(edgeId);
        chain.push(endOf(e) === e.to ? e.from : e.to);
        edgeId = edgeParent.get(edgeId);
      }
      return chain.reverse();
    };
    return { nodes, edgeIds, depthOf, chainTo };
  }

  const downstream = walk(nodeId, outgoing, (e) => e.to, (arrived, next) => FLOW_CONTINUES[arrived.flow].includes(next.flow));
  // Upstream: `prev` feeds `arrived` when arrived.flow continues prev.flow.
  const upstream = walk(nodeId, incoming, (e) => e.from, (arrived, prev) => FLOW_CONTINUES[prev.flow].includes(arrived.flow));
  return { upstream, downstream };
}

export function directEdges(nodeId, edges = TOPOLOGY_EDGES) {
  return edges.filter((e) => e.from === nodeId || e.to === nodeId);
}
