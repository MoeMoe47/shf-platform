// src/pages/admin/agent-fabric-command/commandContracts.js
// AFCC-0 frozen contracts for the Agent Fabric Command Center (V1, read-only).
//
// The Command Center is a projection over existing authorities. Nothing in this
// folder owns agent, run, risk, gate, or health truth — every value shown is read
// from the endpoint named here and keeps a pointer back to it.
//
// Endpoint admission rule (docs/AGENT_FABRIC_COMMAND_CENTER_MASTER_PLAN.md):
// a route is fetched only when its backend authorization was confirmed in
// services/shf-agent-fabric. Frontend route guards are not backend authorization.

// How the backend authorizes a route, as confirmed in the Fabric source.
export const BACKEND_AUTH = Object.freeze({
  // Unauthenticated liveness/readiness probe; intended to be public.
  PUBLIC_PROBE: "PUBLIC_PROBE",
  // `X-Admin-Key` checked server-side (fabric/admin_auth.py, fabric/security.py); fails closed.
  // AFCC-2A.1: browsers never hold this key, so these routes are not browser-reachable
  // until a server-side SHS->Fabric auth bridge exists (AFCC-2A.2).
  ADMIN_KEY: "ADMIN_KEY",
  // AFCC-2A command read: Fabric session with `bos.governance.read` (routers/command_read_routes.py).
  COMMAND_READ: "COMMAND_READ",
  // AFCC-2A.2: SHS session + SHS `bos.governance.read`, checked by the SHS API
  // (apps/shs-api/src/domain/agent-fabric-command). SHS then reads the Fabric
  // projection with its server-held service:shs-api HMAC identity. The browser
  // sends and receives no Fabric credential.
  SHS_BRIDGE: "SHS_BRIDGE",
  // No backend authorization found; route must not be called from this surface.
  NONE_FOUND: "NONE_FOUND",
});

// Source availability states. Each data source resolves to exactly one.
export const SOURCE_STATE = Object.freeze({
  LOADING: "LOADING",
  AVAILABLE: "AVAILABLE",
  EMPTY: "EMPTY",
  UNAUTHENTICATED: "UNAUTHENTICATED", // 401
  FORBIDDEN: "FORBIDDEN", // 403
  OFFLINE: "OFFLINE", // network failure
  TIMEOUT: "TIMEOUT",
  INVALID_RESPONSE: "INVALID_RESPONSE",
  HTTP_ERROR: "HTTP_ERROR",
  AUTH_HARDENING_REQUIRED: "AUTH_HARDENING_REQUIRED", // rejected at contract level; never fetched
  AUTH_BRIDGE_REQUIRED: "AUTH_BRIDGE_REQUIRED", // needs server-side SHS->Fabric auth the browser cannot supply
  NOT_YET_VERIFIED: "NOT_YET_VERIFIED", // no verification result has been recorded
  NOT_YET_EVALUATED: "NOT_YET_EVALUATED", // Watchtower has no persisted evaluation for the catalog
  NOT_CONFIGURED: "NOT_CONFIGURED", // production Fabric route not configured; never fetched
  // AFCC-2A.2 layered failures (see FAILURE_LAYER for where each happened).
  BACKEND_UNAVAILABLE: "BACKEND_UNAVAILABLE", // the service behind a hop could not be reached
  FABRIC_ERROR: "FABRIC_ERROR", // Agent Fabric answered, but its handler failed
  BRIDGE_NOT_CONFIGURED: "BRIDGE_NOT_CONFIGURED", // SHS API has no Fabric URL / service keyring
  BRIDGE_REJECTED: "BRIDGE_REJECTED", // Agent Fabric refused the SHS service identity
});

// Which hop failed, so a lane can say where to look.
export const FAILURE_LAYER = Object.freeze({
  BROWSER_TO_SHS: "browser_to_shs",
  SHS: "shs",
  SHS_TO_FABRIC: "shs_to_fabric",
  FABRIC: "fabric",
  GATEWAY_TO_FABRIC: "gateway_to_fabric",
});

// Missing-data vocabulary. "Unknown" is never used as a substitute.
export const GAP = Object.freeze({
  NOT_CAPTURED: "NOT_CAPTURED", // the source record exists but does not record this field
  NOT_PUBLISHED: "NOT_PUBLISHED", // the authority has no endpoint that publishes this
  NOT_AVAILABLE: "NOT_AVAILABLE", // the endpoint that would supply it failed or is unreachable
  AUTH_HARDENING_REQUIRED: "AUTH_HARDENING_REQUIRED", // the endpoint exists but is not admitted
  AUTH_BRIDGE_REQUIRED: "AUTH_BRIDGE_REQUIRED", // the endpoint needs server-side auth the browser cannot hold
});

export const GAP_LABEL = Object.freeze({
  [GAP.NOT_CAPTURED]: "Not captured",
  [GAP.NOT_PUBLISHED]: "Not published",
  [GAP.NOT_AVAILABLE]: "Not available",
  [GAP.AUTH_HARDENING_REQUIRED]: "Auth hardening required",
  [GAP.AUTH_BRIDGE_REQUIRED]: "Auth bridge required",
});

// Backend auth kinds a browser can satisfy on its own (AFCC-2A.1): public probes,
// and command reads via the same-origin Fabric session cookie. ADMIN_KEY routes
// need a server-held credential and are never called from the browser.
export const BROWSER_SATISFIABLE_AUTH = Object.freeze(["PUBLIC_PROBE", "COMMAND_READ", "SHS_BRIDGE"]);

// Where a source is fetched from. "fabric": same-origin /fabric-api (Fabric-owned).
// "shs": the SHS API /api gateway (SHS-owned), used by the AFCC-2A.2 bridge.
export const TRANSPORT = Object.freeze({ FABRIC: "fabric", SHS: "shs" });

export const AUTHORITY = Object.freeze({
  FABRIC_RUNTIME: "Agent Fabric runtime",
  FABRIC_AGENT_REGISTRY: "Agent Fabric agent registry",
  FABRIC_LAYER_REGISTRY: "Agent Fabric layer registry",
  FABRIC_RUN_LEDGER: "Agent Fabric run ledger",
  WATCHTOWER: "Watchtower",
  FABRIC_INFRA_VERIFIER: "Agent Fabric infra verifier",
  FABRIC_OBSERVABILITY_VERIFIER: "Agent Fabric observability verifier",
});

// V1 endpoint set. Frozen: adding a route here is an AFCC contract change and
// must be accompanied by a backend auth confirmation in the acceptance doc.
export const COMMAND_ENDPOINTS = Object.freeze({
  healthLive: Object.freeze({
    key: "healthLive",
    method: "GET",
    path: "/health/live",
    router: "routers/health_routes.py",
    auth: BACKEND_AUTH.PUBLIC_PROBE,
    admitted: true,
    authority: AUTHORITY.FABRIC_RUNTIME,
    pollGroup: "health",
    acceptStatuses: [200],
  }),
  healthReady: Object.freeze({
    key: "healthReady",
    method: "GET",
    path: "/health/ready",
    router: "routers/health_routes.py",
    auth: BACKEND_AUTH.PUBLIC_PROBE,
    admitted: true,
    authority: AUTHORITY.FABRIC_RUNTIME,
    pollGroup: "health",
    // 503 carries a valid not_ready payload; it is data, not a transport failure.
    acceptStatuses: [200, 503],
  }),
  healthDegraded: Object.freeze({
    key: "healthDegraded",
    method: "GET",
    path: "/health/degraded",
    router: "routers/health_routes.py",
    auth: BACKEND_AUTH.PUBLIC_PROBE,
    admitted: true,
    authority: AUTHORITY.FABRIC_RUNTIME,
    pollGroup: "health",
    acceptStatuses: [200],
  }),
  status: Object.freeze({
    key: "status",
    method: "GET",
    path: "/status",
    router: "routers/status_routes.py",
    auth: BACKEND_AUTH.PUBLIC_PROBE,
    admitted: true,
    authority: AUTHORITY.FABRIC_RUNTIME,
    pollGroup: "health",
    acceptStatuses: [200],
    // /status also returns security.baseUrl and raw exception text; the adapter drops both.
  }),
  // AFCC-2A.2: formerly X-Admin-Key only. Read through the SHS bridge; the
  // Fabric admin routes themselves are unchanged and still admin-key only.
  agentHealth: Object.freeze({
    key: "agentHealth",
    method: "GET",
    transport: "shs",
    path: "/agent-fabric/command/agents/health",
    router: "apps/shs-api/src/domain/agent-fabric-command/api/routes.ts",
    fabricRead: "/api/v1-command-center/agent-fabric/agents/health",
    fabricRouter: "routers/command_read_routes.py",
    envelopeKind: "agents_health",
    auth: BACKEND_AUTH.SHS_BRIDGE,
    admitted: true,
    authority: AUTHORITY.FABRIC_AGENT_REGISTRY,
    pollGroup: "governance",
    acceptStatuses: [200],
  }),
  agentReadiness: Object.freeze({
    key: "agentReadiness",
    method: "GET",
    transport: "shs",
    path: "/agent-fabric/command/agents/readiness",
    router: "apps/shs-api/src/domain/agent-fabric-command/api/routes.ts",
    fabricRead: "/api/v1-command-center/agent-fabric/agents/readiness",
    fabricRouter: "routers/command_read_routes.py",
    envelopeKind: "agents_readiness",
    auth: BACKEND_AUTH.SHS_BRIDGE,
    admitted: true,
    authority: AUTHORITY.FABRIC_AGENT_REGISTRY,
    pollGroup: "governance",
    acceptStatuses: [200],
  }),
  layerGate: Object.freeze({
    key: "layerGate",
    method: "GET",
    transport: "shs",
    path: "/agent-fabric/command/gate/status",
    router: "apps/shs-api/src/domain/agent-fabric-command/api/routes.ts",
    fabricRead: "/api/v1-command-center/agent-fabric/gate",
    fabricRouter: "routers/command_read_routes.py",
    envelopeKind: "gate",
    auth: BACKEND_AUTH.SHS_BRIDGE,
    admitted: true,
    authority: AUTHORITY.FABRIC_LAYER_REGISTRY,
    pollGroup: "governance",
    acceptStatuses: [200],
  }),
  recentRuns: Object.freeze({
    key: "recentRuns",
    method: "GET",
    transport: "shs",
    path: "/agent-fabric/command/runs/recent",
    router: "apps/shs-api/src/domain/agent-fabric-command/api/routes.ts",
    fabricRead: "/api/v1-command-center/agent-fabric/runs/recent",
    fabricRouter: "routers/command_read_routes.py",
    envelopeKind: "runs_recent",
    auth: BACKEND_AUTH.SHS_BRIDGE,
    admitted: true,
    authority: AUTHORITY.FABRIC_RUN_LEDGER,
    pollGroup: "runs",
    acceptStatuses: [200],
  }),
  // AFCC-2A safe read projections (persisted state / last-recorded results only),
  // AFCC-2A.3: read through the SHS bridge. The Fabric routes still accept a
  // Fabric session too; the browser no longer needs one.
  watchtower: Object.freeze({
    key: "watchtower",
    method: "GET",
    transport: "shs",
    path: "/agent-fabric/command/watchtower",
    router: "apps/shs-api/src/domain/agent-fabric-command/api/routes.ts",
    fabricRead: "/api/v1-command-center/agent-fabric/watchtower",
    fabricRouter: "routers/command_read_routes.py",
    envelopeKind: "watchtower",
    auth: BACKEND_AUTH.SHS_BRIDGE,
    admitted: true,
    authority: AUTHORITY.WATCHTOWER,
    pollGroup: "risk",
    acceptStatuses: [200],
  }),
  infrastructure: Object.freeze({
    key: "infrastructure",
    method: "GET",
    transport: "shs",
    path: "/agent-fabric/command/infrastructure",
    router: "apps/shs-api/src/domain/agent-fabric-command/api/routes.ts",
    fabricRead: "/api/v1-command-center/agent-fabric/infrastructure",
    fabricRouter: "routers/command_read_routes.py",
    envelopeKind: "infrastructure",
    auth: BACKEND_AUTH.SHS_BRIDGE,
    admitted: true,
    authority: AUTHORITY.FABRIC_INFRA_VERIFIER,
    pollGroup: "verification",
    acceptStatuses: [200],
  }),
  observability: Object.freeze({
    key: "observability",
    method: "GET",
    transport: "shs",
    path: "/agent-fabric/command/observability",
    router: "apps/shs-api/src/domain/agent-fabric-command/api/routes.ts",
    fabricRead: "/api/v1-command-center/agent-fabric/observability",
    fabricRouter: "routers/command_read_routes.py",
    envelopeKind: "observability",
    auth: BACKEND_AUTH.SHS_BRIDGE,
    admitted: true,
    authority: AUTHORITY.FABRIC_OBSERVABILITY_VERIFIER,
    pollGroup: "verification",
    acceptStatuses: [200],
  }),
});

// Unsafe for dashboard polling (AFCC-2A audit). Kept only as a record: the
// Command Center never calls them. They remain privileged evaluation/verification
// ACTIONS owned by their authorities.
export const LEGACY_UNSAFE_ENDPOINTS = Object.freeze([
  Object.freeze({
    path: "/watchtower/summary",
    router: "routers/watchtower_routes.py",
    supersededBy: "watchtower",
    rejection:
      "Evaluates on every GET: recomputes program risk and writes a risk snapshot, a risk-history row and an audit line per program. No backend authorization.",
  }),
  Object.freeze({
    path: "/admin/infra/verify",
    router: "routers/admin_infra_verify_routes.py",
    supersededBy: "infrastructure",
    rejection:
      "Privileged verification action: runs verification scripts as subprocesses and returns their stdout/stderr. Now requires the server-held Fabric admin credential and records a sanitized result for the read projection.",
  }),
  Object.freeze({
    path: "/admin/observability/verify",
    router: "routers/admin_observability_routes.py",
    supersededBy: "observability",
    rejection:
      "Privileged verification action: re-runs health scripts and a Watchtower evaluation probe and returns raw exception text. Now requires the server-held Fabric admin credential and records a sanitized result for the read projection.",
  }),
]);

export const ADMITTED_ENDPOINTS = Object.freeze(
  Object.values(COMMAND_ENDPOINTS).filter((endpoint) => endpoint.admitted)
);

export const REJECTED_ENDPOINTS = Object.freeze(
  Object.values(COMMAND_ENDPOINTS).filter((endpoint) => !endpoint.admitted)
);

// Poll cadence per group. Health probes run verification scripts server-side,
// so they are polled slowly; everything pauses while the tab is hidden.
export const POLL_INTERVALS_MS = Object.freeze({
  health: 60_000,
  governance: 120_000,
  runs: 30_000,
  risk: 60_000,
  verification: 120_000,
});

export const REQUEST_TIMEOUT_MS = 15_000;

// Known platform data gaps (master plan "Data Gap Report"). Shown, never papered over.
export const KNOWN_DATA_GAPS = Object.freeze([
  { id: "run_state_machine", label: "Canonical run state machine", gap: GAP.NOT_PUBLISHED, detail: "Run events record kind and outcome only. RUNNING, WAITING, TIMED OUT and REVOKED are not persisted states." },
  { id: "work_order_id", label: "Unified work order", gap: GAP.NOT_PUBLISHED, detail: "No work_order_id links plan, task, run and report. planId is the closest link." },
  { id: "model_provider", label: "Model / provider", gap: GAP.NOT_CAPTURED, detail: "Run execution does not record model or provider." },
  { id: "run_actor_org", label: "Run initiator and organization", gap: GAP.NOT_CAPTURED, detail: "/runs/execute events carry no actor or organization fields." },
  { id: "resource_permissions", label: "Resource permissions", gap: GAP.NOT_PUBLISHED, detail: "Tool names exist; no resource permission graph is published." },
  { id: "approval_queue", label: "Unified approval state", gap: GAP.NOT_PUBLISHED, detail: "Plan approval and the local workbench ledger exist separately; no unified approval queue API." },
  { id: "evidence_lineage", label: "Execution evidence lineage", gap: GAP.NOT_PUBLISHED, detail: "Operational events project to evidence and Truth, but plan execution is not linked to them by default." },
  { id: "cancel_revoke", label: "Cancel / revoke run", gap: GAP.NOT_PUBLISHED, detail: "No cancel or revoke endpoint exists for runs." },
  { id: "timeout", label: "Run timeout", gap: GAP.NOT_PUBLISHED, detail: "No run deadline or timeout state exists." },
]);

// Command navigation (AFCC Visual V3). Every entry is one of:
//   CURRENT  — this page
//   IN_PAGE  — a region on this page (`target` is its element id)
//   ROUTE    — an existing admin route (no placeholder pages are created)
//   NOT_AVAILABLE — shown disabled with the phase that would deliver it
export const COMMAND_SECTIONS = Object.freeze([
  { id: "command", label: "Command Center", status: "CURRENT", route: "/agent-fabric/command" },
  { id: "priority", label: "Priority & Alerts", status: "IN_PAGE", target: "afcc-priority" },
  { id: "map", label: "Ecosystem Map", status: "IN_PAGE", target: "afcc-map" },
  { id: "fleet", label: "Agent Fleet", status: "IN_PAGE", target: "afcc-lane-agents" },
  { id: "operations", label: "Operations", status: "IN_PAGE", target: "afcc-lane-operations" },
  { id: "governance", label: "Governance & Alignment", status: "IN_PAGE", target: "afcc-lane-gate" },
  { id: "truth", label: "Truth & Evidence", status: "ROUTE", route: "/truth-spine", note: "Truth Spine page" },
  { id: "watchtower", label: "Watchtower & Risk", status: "IN_PAGE", target: "afcc-lane-watchtower" },
  { id: "infrastructure", label: "Infrastructure", status: "IN_PAGE", target: "afcc-lane-infrastructure" },
  { id: "observability", label: "Observability", status: "IN_PAGE", target: "afcc-lane-observability" },
  { id: "security", label: "Security & Trust", status: "NOT_AVAILABLE", phase: "AFCC-10" },
  { id: "incidents", label: "Incidents", status: "NOT_AVAILABLE", phase: "AFCC-12" },
  { id: "reports", label: "Reports & Insights", status: "ROUTE", route: "/reporting", note: "Reporting page" },
  { id: "settings", label: "Settings", status: "NOT_AVAILABLE", phase: "AFCC-14", reason: "The Command Center has no settings yet." },
]);
