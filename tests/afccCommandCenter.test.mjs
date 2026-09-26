// AFCC-0/1/2: Agent Fabric Command Center contracts, client, adapters, posture,
// status strip, and shared coordinator. Pure modules only (no React/jsdom);
// browser behavior is covered by tests/afcc-command-center-browser.spec.mjs.
// Run with: node --test tests/afccCommandCenter.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  ADMITTED_ENDPOINTS,
  BACKEND_AUTH,
  COMMAND_ENDPOINTS,
  COMMAND_SECTIONS,
  GAP,
  KNOWN_DATA_GAPS,
  LEGACY_UNSAFE_ENDPOINTS,
  REJECTED_ENDPOINTS,
  SOURCE_STATE,
} from "../src/pages/admin/agent-fabric-command/commandContracts.js";
import { fetchCommandSource, isFabricRouteConfigured } from "../src/pages/admin/agent-fabric-command/commandClient.js";
import {
  adaptAgentHealth,
  adaptAgentReadiness,
  adaptHealthDegraded,
  adaptHealthLive,
  adaptHealthReady,
  adaptInfrastructureRead,
  adaptLayerGate,
  adaptObservabilityRead,
  adaptRecentRuns,
  adaptRuntimeStatus,
  adaptWatchtowerRead,
  derivePosture,
  POSTURE,
} from "../src/pages/admin/agent-fabric-command/commandAdapters.js";
import { agentsNeedingAttention, buildStatusStrip } from "../src/pages/admin/agent-fabric-command/commandPresentation.js";
import { createOverviewCoordinator, initialOverviewSnapshot } from "../src/pages/admin/agent-fabric-command/overviewCoordinator.js";
import { FABRIC_PRODUCTION_UNCONFIGURED_BASE } from "../src/system/fabric/fabricConfig.js";

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const AFCC_DIR = "src/pages/admin/agent-fabric-command";

globalThis.localStorage = globalThis.localStorage || { getItem: () => null, setItem: () => {} };

// Fixtures trimmed from real responses of services/shf-agent-fabric (2026-09-25).
const FIX = {
  healthLive: { ok: true, status: "live" },
  healthReady: { ok: true, status: "ready", checks: { gate_g_startup: { ok: true }, registry_contract: { ok: true, ran: "verify_registry_contract.py", error: null } } },
  healthNotReady: { ok: false, status: "not_ready", checks: { gate_g_startup: { ok: true }, registry_contract: { ok: false, ran: null, error: "health_check_script_missing" } } },
  healthDegraded: { ok: true, status: "healthy", degraded: false, checks: { gate_g_startup: { ok: true } }, warnings: [] },
  status: { fabric: { mode: "ON" }, security: { ok: true, mode: "stub", baseUrl: "http://127.0.0.1:8091", note: "SECURITY_ENABLED=0 (disabled)." } },
  agentHealth: {
    ok: true,
    source: "contracts/agents/agents.json",
    summary: { total: 2, ready: 1, warning: 1, user_visible: 1, internal: 1, approval_required: 1 },
    agents: [
      { agent_id: "a1", name: "Alpha", layer: "L23", lifecycle: "active", enabled: true, status: "ready", missing: [] },
      { agent_id: "a2", name: "Beta", layer: "L24", lifecycle: "draft", enabled: false, status: "warning", missing: ["policy.maxSteps"] },
    ],
  },
  agentReadiness: {
    ok: false,
    source: "contracts/agents/agents.json",
    summary: { total: 2, auto_ready: 0, approval_required: 1, blocked: 1, auto_safe: 0, human_approval_required: 1 },
    agents: [
      { agent_id: "a1", name: "Alpha", execution_status: "approval_required", can_auto_execute: false, humanApproval: true, blockers: [], warnings: [] },
      { agent_id: "a2", name: "Beta", execution_status: "blocked", can_auto_execute: false, humanApproval: false, blockers: ["agent_disabled"], warnings: [] },
    ],
  },
  layerGate: { gate_pass: false, auditor_one_liner: "GATE FAIL: blockers=L08(not_enforced_ready)", gate_required_layers: ["L07", "L08"], gate_blockers: [{ layer: "L08", reason: "not_enforced_ready" }] },
  recentRuns: {
    events: [
      { agentId: "L23-ORCH-001", agentName: "Layer23OrchestratorAgent", artifacts: [{ artifactId: "draft_1", path: "/Users/someone/server/db/artifacts/draft_1.json", sha256: "abc" }], id: null, kind: "execute", layer: "L23", message: "plan executed", outcome: "ok", planId: "082a6e6fc486810b", requestId: "9cf3471234c7", runId: "6b1673ee2869", snapshotSha256: "a9a7", ts: "2026-01-09T03:56:55+00:00" },
      { agentName: "Layer23OrchestratorAgent", kind: "execute", outcome: "ok", planId: "p2", runId: "r2", ts: "2026-01-08T19:44:00+00:00" },
    ],
  },
  // AFCC-2A read envelopes (routers/command_read_routes.py), shaped from real responses.
  watchtower: {
    contract: "afcc.read.v1", kind: "watchtower", read_only: true, generated_at: "2026-09-25T20:00:00Z", access: "admin_key_transitional",
    source: { authority: "Watchtower", store: "watchtower_store", recomputed_on_read: false },
    catalog_program_count: 2,
    alerts: { state: "NOT_PUBLISHED", reason_code: "WATCHTOWER_DOES_NOT_PERSIST_ALERTS" },
    integrity: { state: "NOT_PUBLISHED", reason_code: "WATCHTOWER_DOES_NOT_PERSIST_INTEGRITY" },
    state: "AVAILABLE", reason_code: null,
    programs: [
      { program_id: "arena_observation_deck", state: "EVALUATED", risk_band: "RED", quarantined: false, action: "DEGRADE", reasons: ["health<0.40"], evaluated_at: "2026-09-01T21:40:54.859719Z" },
      { program_id: "watchtower_demo_program", state: "EVALUATED", risk_band: "RED", quarantined: false, action: "DEGRADE", reasons: ["health<0.40"], evaluated_at: "2026-09-01T21:40:54.865068Z" },
    ],
    latest_evaluation: {
      worst_risk_band: "RED", risk_counts: { GREEN: 0, YELLOW: 0, RED: 2, QUARANTINE: 0 }, quarantined_count: 0,
      evaluated_program_count: 2, not_evaluated_program_count: 0,
      latest_evaluated_at: "2026-09-01T21:40:54.865068Z", oldest_evaluated_at: "2026-09-01T21:40:54.859719Z",
      staleness: { age_seconds: 2071744, oldest_age_seconds: 2071744, threshold_seconds: null, threshold: "NOT_DEFINED" },
    },
    non_catalog_snapshot_program_count: 1,
    manual_quarantine: { active_count: 0, programs: [] },
    latest_attestation: { state: "NOT_RECORDED" },
  },
  watchtowerNotEvaluated: {
    contract: "afcc.read.v1", kind: "watchtower", read_only: true, access: "session", catalog_program_count: 2,
    state: "NOT_YET_EVALUATED", reason_code: "WATCHTOWER_STORE_NOT_CREATED",
    programs: [{ program_id: "arena_observation_deck", state: "NOT_YET_EVALUATED" }],
    latest_evaluation: null, manual_quarantine: { active_count: 0, programs: [] }, latest_attestation: { state: "NOT_RECORDED" },
    alerts: { state: "NOT_PUBLISHED" }, integrity: { state: "NOT_PUBLISHED" },
  },
  infrastructure: {
    contract: "afcc.read.v1", kind: "infrastructure", read_only: true, access: "session",
    source: { authority: "Agent Fabric infrastructure verifier", store: "command_verification", action: "admin.infra.verify", run_on_read: false },
    state: "AVAILABLE", status: "DEGRADED", last_verified_at: "2026-09-25T17:00:00Z", trigger: "admin_infra_verify",
    checks: [
      { name: "registry_contract", ok: true, reason_code: null },
      { name: "watchtower_attestation", ok: false, reason_code: "CHECK_FAILED" },
    ],
    degraded: ["watchtower_attestation"],
    staleness: { age_seconds: 10800, threshold_seconds: null, threshold: "NOT_DEFINED" },
  },
  observabilityNotVerified: {
    contract: "afcc.read.v1", kind: "observability", read_only: true, access: "admin_key_transitional",
    source: { run_on_read: false }, state: "NOT_YET_VERIFIED", reason_code: "NO_VERIFICATION_RECORDED",
  },
  observabilityPass: {
    contract: "afcc.read.v1", kind: "observability", read_only: true, access: "session", state: "AVAILABLE", status: "PASS",
    last_verified_at: "2026-09-25T19:56:00Z", trigger: "admin_observability_verify",
    checks: [{ name: "watchtower_probe", ok: true, reason_code: null }], degraded: [], staleness: { age_seconds: 240, threshold: "NOT_DEFINED" },
  },
};

// AFCC-2A.2: the four bridged sources arrive as afcc.read.v1 envelopes from the SHS bridge.
function bridgedEnvelope(key, payload) {
  const e = COMMAND_ENDPOINTS[key];
  if (!e.envelopeKind || !payload || typeof payload !== "object" || Array.isArray(payload) || payload.contract) return payload;
  return { contract: "afcc.read.v1", kind: e.envelopeKind, read_only: true, state: "AVAILABLE", access: "shs_bridge", ...payload };
}

function available(key, rawPayload, httpStatus = 200) {
  const e = COMMAND_ENDPOINTS[key];
  const payload = bridgedEnvelope(key, rawPayload);
  return { key, endpoint: e.path, authority: e.authority, state: SOURCE_STATE.AVAILABLE, httpStatus, payload, message: "", observedAt: "2026-09-25T19:40:00.000Z" };
}

function failed(key, state, message = "") {
  const e = COMMAND_ENDPOINTS[key];
  return { key, endpoint: e.path, authority: e.authority, state, httpStatus: null, payload: null, message, observedAt: "2026-09-25T19:40:00.000Z" };
}

function fakeResponse(status, body) {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  return { status, ok: status >= 200 && status < 300, text: async () => text };
}

// ============================================================ 2. endpoint contracts
test("contract: the V1 endpoint set is frozen to the audited read-only routes", () => {
  assert.deepEqual(
    Object.values(COMMAND_ENDPOINTS).map((e) => e.path).sort(),
    [
      "/agent-fabric/command/agents/health",
      "/agent-fabric/command/agents/readiness",
      "/agent-fabric/command/gate/status",
      "/agent-fabric/command/runs/recent",
      "/agent-fabric/command/infrastructure",
      "/agent-fabric/command/observability",
      "/agent-fabric/command/watchtower",
      "/health/degraded",
      "/health/live",
      "/health/ready",
      "/status",
    ].sort()
  );
  assert.ok(Object.values(COMMAND_ENDPOINTS).every((e) => e.method === "GET"), "V1 is GET-only");
  assert.ok(Object.isFrozen(COMMAND_ENDPOINTS) && Object.values(COMMAND_ENDPOINTS).every(Object.isFrozen));
});

test("contract: every endpoint keeps canonical source, authority owner, router and auth finding", () => {
  for (const e of Object.values(COMMAND_ENDPOINTS)) {
    assert.ok(e.authority, `${e.key} authority`);
    if (e.transport === "shs") {
      assert.equal(e.router, "apps/shs-api/src/domain/agent-fabric-command/api/routes.ts", `${e.key} SHS router`);
      assert.equal(e.fabricRouter, "routers/command_read_routes.py", `${e.key} Fabric router`);
      assert.match(e.fabricRead, /^\/api\/v1-command-center\/agent-fabric\//);
    } else {
      assert.ok(e.router?.startsWith("routers/"), `${e.key} router`);
    }
    assert.ok(Object.values(BACKEND_AUTH).includes(e.auth), `${e.key} auth`);
    assert.ok(Array.isArray(e.acceptStatuses) && e.acceptStatuses.length, `${e.key} statuses`);
  }
});

test("contract: every fetched route has confirmed backend auth; legacy unsafe routes are never in the fetch set", () => {
  assert.equal(REJECTED_ENDPOINTS.length, 0);
  for (const e of ADMITTED_ENDPOINTS) {
    assert.notEqual(e.auth, BACKEND_AUTH.NONE_FOUND, `${e.key} admitted without confirmed auth`);
    assert.notEqual(e.auth, BACKEND_AUTH.ADMIN_KEY, `${e.key}: no admin-key route is in the fetch set (AFCC-2A.2)`);
    assert.ok(!e.path.startsWith("/admin/") && !e.path.startsWith("/runs/"), `${e.key} never targets an admin-key Fabric route`);
    if (e.path.startsWith("/api/v1-command-center/")) assert.equal(e.auth, BACKEND_AUTH.COMMAND_READ);
    if (e.transport === "shs") assert.equal(e.auth, BACKEND_AUTH.SHS_BRIDGE);
  }
  const fetched = new Set(Object.values(COMMAND_ENDPOINTS).map((e) => e.path));
  assert.deepEqual(LEGACY_UNSAFE_ENDPOINTS.map((e) => e.path).sort(), ["/admin/infra/verify", "/admin/observability/verify", "/watchtower/summary"]);
  for (const legacy of LEGACY_UNSAFE_ENDPOINTS) {
    assert.ok(!fetched.has(legacy.path), `${legacy.path} must not be fetched`);
    assert.ok(COMMAND_ENDPOINTS[legacy.supersededBy], `${legacy.path} names its safe replacement`);
    assert.ok(legacy.rejection.length > 40);
  }
});

test("contract: backend auth findings still match the Fabric source", () => {
  const fabric = (p) => read(`services/shf-agent-fabric/${p}`);
  assert.match(fabric("routers/admin_agents_routes.py"), /dependencies=\[Depends\(require_admin_key\)\]/);
  assert.match(fabric("routers/admin_layers_routes.py"), /dependencies=\[Depends\(require_admin_key\)\]/);
  assert.match(fabric("routers/runs_routes.py"), /def recent_runs\([^\n]*\n\s*require_admin_key\(x_admin_key\)/);
  // AFCC-2A: verification actions now require the admin key; the read router
  // accepts a Fabric session with bos.governance.read or the transitional key.
  assert.match(fabric("routers/admin_infra_verify_routes.py"), /dependencies=\[Depends\(require_admin_key\)\]/);
  assert.match(fabric("routers/admin_observability_routes.py"), /dependencies=\[Depends\(require_admin_key\)\]/);
  const readRouter = fabric("routers/command_read_routes.py");
  assert.match(readRouter, /COMMAND_READ_PERMISSION = "bos.governance.read"/);
  assert.match(readRouter, /prefix="\/api\/v1-command-center\/agent-fabric"/);
  assert.doesNotMatch(readRouter, /@router\.(post|put|patch|delete)/);
  // AFCC-2A.1: the transitional browser admin-key read is gone.
  assert.doesNotMatch(readRouter, /x_admin_key|ADMIN_API_KEY|admin_key_transitional/);
  // Watchtower's evaluation route is unchanged (still evaluates and writes); the Command Center never calls it.
  assert.match(fabric("routers/watchtower_routes.py"), /@router\.get\("\/summary"\)/);
});

test("contract: no internal service identity, mutation, or high-authority route is called", () => {
  const paths = Object.values(COMMAND_ENDPOINTS).map((e) => e.path).join("\n");
  for (const forbidden of ["/shf/internal", "/quarantine", "/enabled", "/lifecycle", "/attest", "/publish", "/approve", "/reject", "/runs/execute", "/admin/align", "/api/v1/", "/api/funding"]) {
    assert.ok(!paths.includes(forbidden), `must not call ${forbidden}`);
  }
  // Only the client performs network requests, and only with GET.
  const files = fs.readdirSync(AFCC_DIR, { recursive: true }).filter((f) => /\.(js|jsx)$/.test(f));
  for (const f of files) {
    const text = read(path.join(AFCC_DIR, f));
    if (!f.endsWith("commandClient.js")) assert.doesNotMatch(text, /\bfetch\(|fabricUrl\(|XMLHttpRequest|sendBeacon/, f);
    assert.doesNotMatch(text, /method:\s*"(POST|PUT|PATCH|DELETE)"/, f);
  }
});

test("contract: Fabric routing uses the canonical base — no hard-coded hosts or ports", () => {
  const files = fs.readdirSync(AFCC_DIR, { recursive: true }).filter((f) => /\.(js|jsx)$/.test(f));
  for (const f of files) {
    const text = read(path.join(AFCC_DIR, f));
    assert.doesNotMatch(text, /localhost|127\.0\.0\.1|:8090|:8000|:8091/, f);
  }
  assert.match(read(`${AFCC_DIR}/commandClient.js`), /fabricUrl\(endpoint\.path\)/);
});

// ================================================== client: loading/error states
test("AFCC-2A.2: the four formerly admin-key sources go only to the SHS bridge, with no credential header", async () => {
  const store = { ADMIN_API_KEY: "a-key-left-in-storage", shf_admin_key: "a-key-left-in-storage", shsPreferredOrganizationId: "shs-core" };
  globalThis.localStorage = { getItem: (k) => store[k] || null, setItem: () => {} };
  globalThis.window = { localStorage: globalThis.localStorage };
  const calls = [];
  for (const key of ["agentHealth", "agentReadiness", "layerGate", "recentRuns"]) {
    const result = await fetchCommandSource(COMMAND_ENDPOINTS[key], { fetchImpl: async (url, opts) => { calls.push({ url, opts }); return fakeResponse(200, bridgedEnvelope(key, {})); } });
    assert.equal(result.state, SOURCE_STATE.AVAILABLE, key);
  }
  assert.deepEqual(calls.map((c) => c.url), [
    "/api/agent-fabric/command/agents/health",
    "/api/agent-fabric/command/agents/readiness",
    "/api/agent-fabric/command/gate/status",
    "/api/agent-fabric/command/runs/recent",
  ]);
  for (const { opts } of calls) {
    assert.equal(opts.method, "GET");
    assert.equal(opts.credentials, "include");
    assert.deepEqual(opts.headers, { Accept: "application/json", "x-shs-preferred-organization-id": "shs-core" }, "no credential header, only org context");
  }
  delete globalThis.window;
  globalThis.localStorage = { getItem: () => null, setItem: () => {} };
});

test("AFCC-2A.2: bridge failures keep their layer — Browser->SHS, SHS, SHS->Fabric, Fabric", async () => {
  const e = COMMAND_ENDPOINTS.layerGate;
  const bridgeError = (status, code, layer, reason) => async () => fakeResponse(status, { ok: false, contract: "afcc.bridge.v1", kind: "gate", error: { code, layer, reason_code: reason, message: "m" } });
  const cases = [
    [async () => fakeResponse(401, { ok: false, error: { code: "AUTH_REQUIRED" } }), SOURCE_STATE.UNAUTHENTICATED, "browser_to_shs"],
    [async () => fakeResponse(403, { ok: false, error: { code: "FORBIDDEN" } }), SOURCE_STATE.FORBIDDEN, "browser_to_shs"],
    [async () => { throw new TypeError("Failed to fetch"); }, SOURCE_STATE.OFFLINE, "browser_to_shs"],
    [async () => fakeResponse(502, ""), SOURCE_STATE.BACKEND_UNAVAILABLE, "browser_to_shs"],
    [bridgeError(503, "BRIDGE_NOT_CONFIGURED", "shs", "INTERNAL_SERVICE_CREDENTIALS_MISSING"), SOURCE_STATE.BRIDGE_NOT_CONFIGURED, "shs"],
    [bridgeError(502, "BACKEND_UNAVAILABLE", "shs_to_fabric", "FABRIC_UNREACHABLE"), SOURCE_STATE.BACKEND_UNAVAILABLE, "shs_to_fabric"],
    [bridgeError(502, "BRIDGE_REJECTED", "shs_to_fabric", "FABRIC_HTTP_401"), SOURCE_STATE.BRIDGE_REJECTED, "shs_to_fabric"],
    [bridgeError(502, "FABRIC_ERROR", "fabric", "PROJECTION_READ_FAILED"), SOURCE_STATE.FABRIC_ERROR, "fabric"],
    [bridgeError(502, "INVALID_RESPONSE", "fabric", "CONTRACT_MISMATCH"), SOURCE_STATE.INVALID_RESPONSE, "fabric"],
  ];
  for (const [fetchImpl, state, layer] of cases) {
    const r = await fetchCommandSource(e, { fetchImpl });
    assert.equal(r.state, state, `${state}`);
    assert.equal(r.failedLayer, layer, `${state} layer`);
  }
  const reason = await fetchCommandSource(e, { fetchImpl: bridgeError(502, "FABRIC_ERROR", "fabric", "PROJECTION_READ_FAILED") });
  assert.match(reason.message, /PROJECTION_READ_FAILED/);
  const junk = await fetchCommandSource(e, { fetchImpl: bridgeError(502, "FABRIC_ERROR", "fabric", "Traceback at /srv/x.py") });
  assert.doesNotMatch(junk.message, /Traceback|\/srv\//, "non-code reasons are never shown");
});

test("AFCC-2A.2: a raw (unbridged) admin payload is not accepted; a Fabric projection error is FABRIC_ERROR", () => {
  const raw = { key: "agentHealth", endpoint: "/agent-fabric/command/agents/health", authority: "x", state: SOURCE_STATE.AVAILABLE, payload: FIX.agentHealth, observedAt: "t" };
  assert.equal(adaptAgentHealth(raw).state, SOURCE_STATE.INVALID_RESPONSE);
  const err = adaptLayerGate(available("layerGate", { contract: "afcc.read.v1", kind: "gate", read_only: true, state: "BACKEND_ERROR", reason_code: "PROJECTION_READ_FAILED" }));
  assert.equal(err.state, SOURCE_STATE.FABRIC_ERROR);
  const wrongKind = adaptLayerGate(available("layerGate", { contract: "afcc.read.v1", kind: "runs_recent", read_only: true, state: "AVAILABLE", gate_pass: true }));
  assert.equal(wrongKind.state, SOURCE_STATE.INVALID_RESPONSE);
  assert.equal(adaptLayerGate(available("layerGate", FIX.layerGate)).data.access, "shs_bridge");
});

test("AFCC-2A.3: safe reads go through the SHS bridge with no credential header, only the session cookie", async () => {
  globalThis.localStorage = { getItem: () => "a-key-left-in-storage", setItem: () => {} };
  const calls = [];
  const result = await fetchCommandSource(COMMAND_ENDPOINTS.watchtower, {
    fetchImpl: async (url, opts) => { calls.push({ url, opts }); return fakeResponse(200, FIX.watchtower); },
  });
  assert.equal(calls[0].url, "/api/agent-fabric/command/watchtower");
  for (const key of ["watchtower", "infrastructure", "observability"]) {
    assert.equal(COMMAND_ENDPOINTS[key].auth, BACKEND_AUTH.SHS_BRIDGE, key);
    assert.equal(COMMAND_ENDPOINTS[key].transport, "shs", key);
  }
  assert.equal(calls[0].opts.credentials, "include");
  assert.deepEqual(Object.keys(calls[0].opts.headers), ["Accept"]);
  assert.equal(result.state, SOURCE_STATE.AVAILABLE);
  globalThis.localStorage = { getItem: () => null, setItem: () => {} };
});

test("client: public probes never receive the admin key", async () => {
  const store = { ADMIN_API_KEY: "k-test" };
  globalThis.localStorage = { getItem: (k) => store[k] || null, setItem: () => {} };
  let headers;
  await fetchCommandSource(COMMAND_ENDPOINTS.healthLive, { fetchImpl: async (_u, o) => { headers = o.headers; return fakeResponse(200, FIX.healthLive); } });
  assert.equal(headers["X-Admin-Key"], undefined);
  globalThis.localStorage = { getItem: () => null, setItem: () => {} };
});

test("client: rejected endpoints are never fetched", async () => {
  const rejected = { ...COMMAND_ENDPOINTS.healthLive, key: "legacy", admitted: false, rejection: "not admitted in this contract" };
  for (const endpoint of [rejected]) {
    let called = false;
    const result = await fetchCommandSource(endpoint, { fetchImpl: async () => { called = true; return fakeResponse(200, {}); } });
    assert.equal(called, false, endpoint.key);
    assert.equal(result.state, SOURCE_STATE.AUTH_HARDENING_REQUIRED);
  }
});

test("client: unconfigured production Fabric route is never fetched", async () => {
  assert.equal(isFabricRouteConfigured(FABRIC_PRODUCTION_UNCONFIGURED_BASE), false);
  let called = false;
  const result = await fetchCommandSource(COMMAND_ENDPOINTS.healthLive, { base: FABRIC_PRODUCTION_UNCONFIGURED_BASE, fetchImpl: async () => { called = true; } });
  assert.equal(called, false);
  assert.equal(result.state, SOURCE_STATE.NOT_CONFIGURED);
});

test("permission denied: SHS 401 is UNAUTHENTICATED and 403 FORBIDDEN; a Fabric-session read without a session is AUTH_BRIDGE_REQUIRED", async () => {
  const r401 = await fetchCommandSource(COMMAND_ENDPOINTS.infrastructure, { fetchImpl: async () => fakeResponse(401, { ok: false, error: { code: "AUTH_REQUIRED" } }) });
  const r403 = await fetchCommandSource(COMMAND_ENDPOINTS.watchtower, { fetchImpl: async () => fakeResponse(403, { ok: false, error: { code: "FORBIDDEN" } }) });
  assert.equal(r401.state, SOURCE_STATE.UNAUTHENTICATED);
  assert.equal(r401.failedLayer, "browser_to_shs");
  assert.equal(r403.state, SOURCE_STATE.FORBIDDEN);
  // The Fabric-session path is still classified correctly if any endpoint uses it.
  const sessionRead = { ...COMMAND_ENDPOINTS.healthLive, key: "sessionRead", auth: BACKEND_AUTH.COMMAND_READ };
  const noSession = await fetchCommandSource(sessionRead, { fetchImpl: async () => fakeResponse(401, { detail: "Authentication required" }) });
  assert.equal(noSession.state, SOURCE_STATE.AUTH_BRIDGE_REQUIRED);
  assert.equal(noSession.httpStatus, 401);
  const probe401 = await fetchCommandSource(COMMAND_ENDPOINTS.healthLive, { fetchImpl: async () => fakeResponse(401, {}) });
  assert.equal(probe401.state, SOURCE_STATE.UNAUTHENTICATED);
});

test("client: offline, timeout, invalid JSON, non-object JSON and HTTP errors are classified", async () => {
  const offline = await fetchCommandSource(COMMAND_ENDPOINTS.healthLive, { fetchImpl: async () => { throw new TypeError("Failed to fetch"); } });
  assert.equal(offline.state, SOURCE_STATE.OFFLINE);

  const timeout = await fetchCommandSource(COMMAND_ENDPOINTS.healthLive, {
    timeoutMs: 10,
    fetchImpl: (_u, { signal }) => new Promise((_, reject) => signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")))),
  });
  assert.equal(timeout.state, SOURCE_STATE.TIMEOUT);

  const html = await fetchCommandSource(COMMAND_ENDPOINTS.healthLive, { fetchImpl: async () => fakeResponse(200, "<!doctype html><html>") });
  assert.equal(html.state, SOURCE_STATE.INVALID_RESPONSE);

  const arr = await fetchCommandSource(COMMAND_ENDPOINTS.healthLive, { fetchImpl: async () => fakeResponse(200, [1, 2]) });
  assert.equal(arr.state, SOURCE_STATE.INVALID_RESPONSE);

  const err = await fetchCommandSource(COMMAND_ENDPOINTS.status, { fetchImpl: async () => fakeResponse(503, { reason_code: "PROJECTION_READ_FAILED" }) });
  assert.equal(err.state, SOURCE_STATE.FABRIC_ERROR, "a JSON 5xx is Fabric's own handler failing");
  assert.equal(err.message, "PROJECTION_READ_FAILED");
  assert.equal(err.failedLayer, "fabric");

  // Phase 9: the dev proxy answers an empty text/plain 500 when Fabric is not running.
  const proxy = await fetchCommandSource(COMMAND_ENDPOINTS.healthLive, { fetchImpl: async () => fakeResponse(500, "") });
  assert.equal(proxy.state, SOURCE_STATE.BACKEND_UNAVAILABLE, "an empty non-JSON 5xx is the gateway, not Fabric");
  assert.equal(proxy.failedLayer, "gateway_to_fabric");
  const notFound = await fetchCommandSource(COMMAND_ENDPOINTS.healthLive, { fetchImpl: async () => fakeResponse(404, {}) });
  assert.equal(notFound.state, SOURCE_STATE.HTTP_ERROR);
});

test("client: /health/ready 503 is data (not_ready), not a transport failure", async () => {
  const result = await fetchCommandSource(COMMAND_ENDPOINTS.healthReady, { fetchImpl: async () => fakeResponse(503, FIX.healthNotReady) });
  assert.equal(result.state, SOURCE_STATE.AVAILABLE);
  const projection = adaptHealthReady(result);
  assert.equal(projection.data.ready, false);
});

// ============================================================== 3. adapters
test("adapters: health projections read real shapes; /status drops baseUrl and raw errors", () => {
  assert.equal(adaptHealthLive(available("healthLive", FIX.healthLive)).data.live, true);
  const ready = adaptHealthReady(available("healthReady", FIX.healthReady));
  assert.equal(ready.data.ready, true);
  assert.deepEqual(ready.data.checks.map((c) => c.name), ["gate_g_startup", "registry_contract"]);
  assert.equal(adaptHealthDegraded(available("healthDegraded", FIX.healthDegraded)).data.degraded, false);
  const status = adaptRuntimeStatus(available("status", FIX.status));
  assert.deepEqual(status.data, { mode: "ON", security: { ok: true, mode: "stub" } });
  assert.ok(!JSON.stringify(status).includes("8091"), "internal security base URL is not projected");
});

test("adapters: every projection retains source endpoint, authority and observed time", () => {
  const p = adaptLayerGate(available("layerGate", FIX.layerGate));
  assert.equal(p.source.endpoint, "/agent-fabric/command/gate/status");
  assert.equal(p.source.authority, "Agent Fabric layer registry");
  assert.equal(p.source.observedAt, "2026-09-25T19:40:00.000Z");
});

test("adapters: agent summaries use actual fields only", () => {
  const health = adaptAgentHealth(available("agentHealth", FIX.agentHealth));
  assert.deepEqual(health.data.summary, { total: 2, ready: 1, warning: 1, approvalRequired: 1 });
  assert.equal(health.data.enabledCount, 1);
  assert.equal(health.data.canonicalSource, "contracts/agents/agents.json");
  const readiness = adaptAgentReadiness(available("agentReadiness", FIX.agentReadiness));
  assert.deepEqual(readiness.data.summary, { total: 2, autoReady: 0, approvalRequired: 1, blocked: 1 });
  assert.deepEqual(agentsNeedingAttention(health, readiness), [{ agentId: "a2", name: "Beta", health: "warning", execution: "blocked" }]);
});

test("adapters: enabled count is withheld when any row omits enabled", () => {
  const payload = structuredClone(FIX.agentHealth);
  delete payload.agents[1].enabled;
  assert.equal(adaptAgentHealth(available("agentHealth", payload)).data.enabledCount, null);
});

test("adapters: layer gate", () => {
  const gate = adaptLayerGate(available("layerGate", FIX.layerGate));
  assert.equal(gate.data.gatePass, false);
  assert.deepEqual(gate.data.blockers, [{ layer: "L08", reason: "not_enforced_ready" }]);
  assert.deepEqual(gate.data.requiredLayers, ["L07", "L08"]);
});

test("adapters: run events keep recorded kind/outcome and never derive a lifecycle state", () => {
  const runs = adaptRecentRuns(available("recentRuns", FIX.recentRuns));
  const [first] = runs.data.runs;
  assert.equal(first.runId.value, "6b1673ee2869");
  assert.equal(first.kind.value, "execute");
  assert.equal(first.outcome.value, "ok");
  assert.equal(first.artifactCount.value, 1);
  assert.deepEqual(first.artifacts, [{ artifactId: "draft_1", sha256: "abc" }], "server filesystem path is dropped");
  const text = JSON.stringify(runs);
  for (const state of ["RUNNING", "WAITING", "TIMED_OUT", "TIMED OUT", "REVOKED", "SUCCEEDED"]) {
    assert.ok(!text.includes(state), `${state} must not be invented`);
  }
});

test("missing fields: run actor/org/model/work order/state are marked, not faked", () => {
  const [first, second] = adaptRecentRuns(available("recentRuns", FIX.recentRuns)).data.runs;
  assert.deepEqual(first.actor, { value: null, gap: GAP.NOT_CAPTURED });
  assert.deepEqual(first.organization, { value: null, gap: GAP.NOT_CAPTURED });
  assert.deepEqual(first.modelProvider, { value: null, gap: GAP.NOT_CAPTURED });
  assert.deepEqual(first.workOrderId, { value: null, gap: GAP.NOT_PUBLISHED });
  assert.deepEqual(first.lifecycleState, { value: null, gap: GAP.NOT_PUBLISHED });
  assert.deepEqual(second.artifactCount, { value: null, gap: GAP.NOT_CAPTURED }, "absent artifacts are not reported as zero");
  assert.deepEqual(second.agentId, { value: null, gap: GAP.NOT_CAPTURED });
});

test("missing fields: a future event carrying actor/org/model is read through", () => {
  const runs = adaptRecentRuns(available("recentRuns", { events: [{ runId: "r", actor: "user-1", organization_id: "org-a", model: "m-1" }] }));
  const [run] = runs.data.runs;
  assert.equal(run.actor.value, "user-1");
  assert.equal(run.organization.value, "org-a");
  assert.equal(run.modelProvider.value, "m-1");
});

test("empty: zero run events and zero agents become EMPTY, not zero-filled AVAILABLE", () => {
  assert.equal(adaptRecentRuns(available("recentRuns", { events: [] })).state, SOURCE_STATE.EMPTY);
  assert.equal(adaptAgentHealth(available("agentHealth", { ok: true, summary: { total: 0, ready: 0, warning: 0 }, agents: [] })).state, SOURCE_STATE.EMPTY);
});

test("invalid response: payloads that break the contract are rejected whole", () => {
  assert.equal(adaptRecentRuns(available("recentRuns", { runs: [] })).state, SOURCE_STATE.INVALID_RESPONSE);
  assert.equal(adaptLayerGate(available("layerGate", { gate_pass: "yes" })).state, SOURCE_STATE.INVALID_RESPONSE);
  assert.equal(adaptHealthReady(available("healthReady", { status: "maybe" })).state, SOURCE_STATE.INVALID_RESPONSE);
  assert.equal(adaptAgentHealth(available("agentHealth", { agents: [] })).state, SOURCE_STATE.INVALID_RESPONSE);
  const malformed = adaptRecentRuns(available("recentRuns", { events: [{ runId: "ok" }, "junk", null] }));
  assert.equal(malformed.data.runs.length, 1);
  assert.equal(malformed.data.droppedCount, 2);
});

test("adapters: non-data source states pass through with source metadata", () => {
  const p = adaptAgentHealth(failed("agentHealth", SOURCE_STATE.UNAUTHENTICATED, "creds"));
  assert.equal(p.state, SOURCE_STATE.UNAUTHENTICATED);
  assert.equal(p.data, null);
  assert.equal(p.source.message, "creds");
});

test("adapters: Watchtower read projection keeps persisted state, age, and NOT_PUBLISHED gaps", () => {
  const wt = adaptWatchtowerRead(available("watchtower", FIX.watchtower));
  assert.equal(wt.state, SOURCE_STATE.AVAILABLE);
  assert.equal(wt.data.worstRiskBand, "RED");
  assert.deepEqual(wt.data.riskCounts, { GREEN: 0, YELLOW: 0, RED: 2, QUARANTINE: 0 });
  assert.equal(wt.data.ageSeconds, 2071744);
  assert.equal(wt.data.stalenessThreshold, "NOT_DEFINED");
  assert.equal(wt.data.alertsGap, true);
  assert.equal(wt.data.integrityGap, true);
  assert.equal(wt.data.attestation.recorded, false);
  assert.equal(wt.data.nonCatalogSnapshotPrograms, 1);
  assert.equal(wt.data.access, "admin_key_transitional");
  assert.deepEqual(wt.data.programs[0].reasons, ["health<0.40"]);
});

test("adapters: NOT_YET_EVALUATED / NOT_YET_VERIFIED are states, not zero-filled data", () => {
  const wt = adaptWatchtowerRead(available("watchtower", FIX.watchtowerNotEvaluated));
  assert.equal(wt.state, SOURCE_STATE.NOT_YET_EVALUATED);
  assert.equal(wt.data.worstRiskBand, undefined);
  const obs = adaptObservabilityRead(available("observability", FIX.observabilityNotVerified));
  assert.equal(obs.state, SOURCE_STATE.NOT_YET_VERIFIED);
  assert.equal(obs.data.verdict, undefined);
});

test("adapters: verification read is the last recorded result with age and reason codes", () => {
  const infra = adaptInfrastructureRead(available("infrastructure", FIX.infrastructure));
  assert.equal(infra.state, SOURCE_STATE.AVAILABLE);
  assert.equal(infra.data.verdict, "DEGRADED");
  assert.equal(infra.data.lastVerifiedAt, "2026-09-25T17:00:00Z");
  assert.equal(infra.data.ageSeconds, 10800);
  assert.deepEqual(infra.data.degraded, ["watchtower_attestation"]);
  assert.deepEqual(infra.data.checks[1], { name: "watchtower_attestation", ok: false, reasonCode: "CHECK_FAILED" });
});

test("adapters: read envelopes are validated (contract, kind, read_only) and backend errors are not data", () => {
  assert.equal(adaptInfrastructureRead(available("infrastructure", { ...FIX.infrastructure, kind: "observability" })).state, SOURCE_STATE.INVALID_RESPONSE);
  assert.equal(adaptInfrastructureRead(available("infrastructure", { ...FIX.infrastructure, read_only: false })).state, SOURCE_STATE.INVALID_RESPONSE);
  assert.equal(adaptInfrastructureRead(available("infrastructure", { ...FIX.infrastructure, status: "GREAT" })).state, SOURCE_STATE.INVALID_RESPONSE);
  assert.equal(adaptWatchtowerRead(available("watchtower", { ...FIX.watchtower, latest_evaluation: null })).state, SOURCE_STATE.INVALID_RESPONSE);
  const err = adaptObservabilityRead(available("observability", { contract: "afcc.read.v1", kind: "observability", read_only: true, state: "BACKEND_ERROR", reason_code: "VERIFICATION_RECORD_UNREADABLE" }));
  assert.equal(err.state, SOURCE_STATE.FABRIC_ERROR);
  assert.match(err.source.message, /VERIFICATION_RECORD_UNREADABLE/);
  assert.equal(err.data, null);
});

test("formatAge: elapsed age wording with no invented threshold", async () => {
  const { formatAge } = await import("../src/pages/admin/agent-fabric-command/commandTime.js");
  assert.equal(formatAge(30), "less than a minute ago");
  assert.equal(formatAge(240), "4 minutes ago");
  assert.equal(formatAge(10800), "3 hours ago");
  assert.equal(formatAge(2071744), "23 days ago");
  assert.equal(formatAge(3600), "1 hour ago");
  assert.equal(formatAge(null), null);
  assert.equal(formatAge(-5), null);
});

// ========================================================== posture + strip
function healthySnapshot() {
  const s = initialOverviewSnapshot();
  s.healthLive = adaptHealthLive(available("healthLive", FIX.healthLive));
  s.healthReady = adaptHealthReady(available("healthReady", FIX.healthReady));
  s.healthDegraded = adaptHealthDegraded(available("healthDegraded", FIX.healthDegraded));
  s.status = adaptRuntimeStatus(available("status", FIX.status));
  s.agentHealth = adaptAgentHealth(available("agentHealth", FIX.agentHealth));
  s.agentReadiness = adaptAgentReadiness(available("agentReadiness", FIX.agentReadiness));
  s.layerGate = adaptLayerGate(available("layerGate", FIX.layerGate));
  s.recentRuns = adaptRecentRuns(available("recentRuns", FIX.recentRuns));
  s.watchtower = adaptWatchtowerRead(available("watchtower", FIX.watchtower));
  s.infrastructure = adaptInfrastructureRead(available("infrastructure", { ...FIX.observabilityNotVerified, kind: "infrastructure" }));
  s.observability = adaptObservabilityRead(available("observability", FIX.observabilityNotVerified));
  return s;
}

test("posture: operational keeps individual sources and lists excluded verifiers", () => {
  const posture = derivePosture(healthySnapshot());
  assert.equal(posture.posture, POSTURE.OPERATIONAL);
  assert.deepEqual(posture.excluded, ["Infrastructure verification (not yet verified)", "Observability verification (not yet verified)"]);
});

test("posture: checking while liveness loads; offline when liveness fails", () => {
  assert.equal(derivePosture(initialOverviewSnapshot()).posture, POSTURE.CHECKING);
  const s = healthySnapshot();
  s.healthLive = adaptHealthLive(failed("healthLive", SOURCE_STATE.OFFLINE, "Agent Fabric could not be reached."));
  const posture = derivePosture(s);
  assert.equal(posture.posture, POSTURE.OFFLINE);
  assert.deepEqual(posture.reasons, ["Agent Fabric could not be reached."]);
});

test("posture: degraded when not ready, when degraded probe warns, or when readiness is unreadable", () => {
  const notReady = healthySnapshot();
  notReady.healthReady = adaptHealthReady(available("healthReady", FIX.healthNotReady, 503));
  assert.equal(derivePosture(notReady).posture, POSTURE.DEGRADED);
  assert.match(derivePosture(notReady).reasons[0], /registry_contract/);

  const warn = healthySnapshot();
  warn.healthDegraded = adaptHealthDegraded(available("healthDegraded", { ...FIX.healthDegraded, degraded: true, warnings: ["x"] }));
  assert.equal(derivePosture(warn).posture, POSTURE.DEGRADED);

  const unreadable = healthySnapshot();
  unreadable.healthReady = adaptHealthReady(failed("healthReady", SOURCE_STATE.TIMEOUT));
  assert.equal(derivePosture(unreadable).posture, POSTURE.DEGRADED);
});

test("posture: an admitted verifier failure would degrade posture", () => {
  const s = healthySnapshot();
  s.infrastructure = adaptInfrastructureRead(available("infrastructure", FIX.infrastructure));
  const posture = derivePosture(s);
  assert.equal(posture.posture, POSTURE.DEGRADED);
  assert.ok(posture.reasons.includes("Infrastructure verification: last recorded DEGRADED (3 hours ago)."), posture.reasons.join("|"));
  s.infrastructure = adaptInfrastructureRead(available("infrastructure", { ...FIX.observabilityPass, kind: "infrastructure" }));
  assert.equal(derivePosture(s).posture, POSTURE.OPERATIONAL);
  s.observability = adaptObservabilityRead(failed("observability", SOURCE_STATE.UNAUTHENTICATED));
  assert.equal(derivePosture(s).posture, POSTURE.OPERATIONAL, "viewer access problems are not Fabric faults");
  assert.ok(derivePosture(s).excluded.includes("Observability verification (auth required)"));
});

test("global health strip: real values, and source state instead of numbers when unavailable", () => {
  const strip = buildStatusStrip(healthySnapshot());
  const byId = Object.fromEntries(strip.items.map((i) => [i.id, i.value]));
  assert.deepEqual(byId, { fabric: "LIVE", readiness: "READY", agents: "1 / 2 READY", infrastructure: "NOT YET VERIFIED", risk: "RED" });
  assert.equal(strip.items.find((i) => i.id === "risk").detail, "Evaluated 23 days ago");

  const s = healthySnapshot();
  s.agentHealth = adaptAgentHealth(failed("agentHealth", SOURCE_STATE.FORBIDDEN));
  s.infrastructure = adaptInfrastructureRead(available("infrastructure", FIX.infrastructure));
  const items = Object.fromEntries(buildStatusStrip(s).items.map((i) => [i.id, i]));
  assert.equal(items.agents.value, "ACCESS RESTRICTED");
  assert.equal(items.infrastructure.value, "DEGRADED");
  assert.equal(items.infrastructure.detail, "Verified 3 hours ago", "a recorded verdict always carries its age");
});

// ============================================================== coordinator
function fakeTimers() {
  const timers = new Map();
  let id = 0;
  return {
    set: (fn, ms) => { timers.set(++id, { fn, ms }); return id; },
    clear: (tid) => timers.delete(tid),
    timers,
  };
}

function fakeDoc() {
  const listeners = {};
  return { hidden: false, addEventListener: (t, f) => { listeners[t] = f; }, removeEventListener: (t) => { delete listeners[t]; }, fire: (t) => listeners[t]?.() };
}

test("coordinator: one shared fetch per admitted endpoint; failures stay independent", async () => {
  const calls = [];
  const t = fakeTimers();
  let snapshot;
  const coordinator = createOverviewCoordinator({
    fetchSource: async (endpoint) => {
      calls.push(endpoint.key);
      if (endpoint.key === "recentRuns") return failed("recentRuns", SOURCE_STATE.HTTP_ERROR, "boom");
      if (endpoint.key === "watchtower") return failed("watchtower", SOURCE_STATE.OFFLINE);
      const payload = { healthLive: FIX.healthLive, healthReady: FIX.healthReady, healthDegraded: FIX.healthDegraded, status: FIX.status, agentHealth: FIX.agentHealth, agentReadiness: FIX.agentReadiness, layerGate: FIX.layerGate, infrastructure: FIX.infrastructure, observability: FIX.observabilityNotVerified }[endpoint.key];
      return available(endpoint.key, payload);
    },
    onUpdate: (s) => { snapshot = s; },
    setIntervalImpl: t.set,
    clearIntervalImpl: t.clear,
    doc: fakeDoc(),
  });
  await coordinator.start();
  assert.deepEqual(calls.sort(), ADMITTED_ENDPOINTS.map((e) => e.key).sort());
  assert.equal(snapshot.recentRuns.state, SOURCE_STATE.HTTP_ERROR);
  assert.equal(snapshot.agentHealth.state, SOURCE_STATE.AVAILABLE);
  assert.equal(snapshot.healthLive.state, SOURCE_STATE.AVAILABLE);
  assert.equal(snapshot.watchtower.state, SOURCE_STATE.OFFLINE);
  assert.equal(snapshot.infrastructure.state, SOURCE_STATE.AVAILABLE);
  assert.equal(snapshot.observability.state, SOURCE_STATE.NOT_YET_VERIFIED);
  assert.deepEqual([...t.timers.values()].map((x) => x.ms).sort((a, b) => a - b), [30_000, 60_000, 60_000, 120_000, 120_000], "one timer per poll group");
  coordinator.stop();
  assert.equal(t.timers.size, 0);
});

test("coordinator: polling pauses while hidden and refreshes on return", async () => {
  const t = fakeTimers();
  const doc = fakeDoc();
  let count = 0;
  const coordinator = createOverviewCoordinator({
    fetchSource: async (e) => { count += 1; return available(e.key, FIX.healthLive); },
    setIntervalImpl: t.set,
    clearIntervalImpl: t.clear,
    doc,
  });
  await coordinator.start();
  const afterStart = count;
  doc.hidden = true;
  doc.fire("visibilitychange");
  assert.equal(t.timers.size, 0, "no timers while hidden");
  doc.hidden = false;
  doc.fire("visibilitychange");
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(t.timers.size, 5);
  assert.equal(count, afterStart * 2, "refreshes every admitted source on return");
  coordinator.stop();
});

test("coordinator: in-flight requests are not duplicated, and stale runs never land after restart", async () => {
  const t = fakeTimers();
  const pending = [];
  let snapshot;
  const coordinator = createOverviewCoordinator({
    fetchSource: (e) => new Promise((resolve) => pending.push(() => resolve(available(e.key, FIX.healthLive)))),
    onUpdate: (s) => { snapshot = s; },
    setIntervalImpl: t.set,
    clearIntervalImpl: t.clear,
    doc: fakeDoc(),
  });
  coordinator.start();
  const first = pending.length;
  coordinator.refreshAll();
  assert.equal(pending.length, first, "no duplicate in-flight requests");
  coordinator.stop();
  coordinator.start(); // StrictMode remount
  const stale = pending.slice(0, first);
  stale.forEach((resolve) => resolve());
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(snapshot.healthLive.state, SOURCE_STATE.LOADING, "response from the stopped run is ignored");
  coordinator.stop();
});

test("coordinator: a failure after success reports the last available time", async () => {
  let fail = false;
  const coordinator = createOverviewCoordinator({
    endpoints: { healthLive: COMMAND_ENDPOINTS.healthLive },
    fetchSource: async (e) => (fail ? failed(e.key, SOURCE_STATE.OFFLINE) : available(e.key, FIX.healthLive)),
    setIntervalImpl: () => 0,
    clearIntervalImpl: () => {},
    doc: fakeDoc(),
  });
  await coordinator.start();
  fail = true;
  await coordinator.refreshAll();
  const s = coordinator.getSnapshot();
  assert.equal(s.healthLive.state, SOURCE_STATE.OFFLINE);
  assert.equal(s.healthLive.lastAvailableAt, "2026-09-25T19:40:00.000Z");
  coordinator.stop();
});

// ============================================================== 1. routing
test("routing: /agent-fabric/command is registered with the /agent-fabric access rule; the existing page is unchanged", () => {
  const routes = read("src/router/AdminRoutes.jsx");
  assert.match(routes, /<Route path="\/agent-fabric" element=\{protect\("\/agent-fabric", <AgentFabricPage \/>, \[SHS_SECURITY_PERMISSIONS\.AUDIT_VIEW\]\)\} \/>/);
  assert.match(routes, /<Route path="\/agent-fabric\/command" element=\{protect\("\/agent-fabric", <AgentFabricCommandCenter \/>, \[SHS_SECURITY_PERMISSIONS\.AUDIT_VIEW\]\)\} \/>/);
  assert.match(routes, /import AgentFabricCommandCenter from "@\/pages\/admin\/agent-fabric-command\/AgentFabricCommandCenter\.jsx";/);
  for (const r of ["/truth-spine", "/oracle", "/lord-outcomes", "/watchtower", "/loo"]) assert.ok(routes.includes(`path="${r}"`), `${r} still routed`);
  assert.match(routes, /<Route path="\/watchtower" element=\{<Navigate to="\/agent-fabric" replace \/>\} \/>/);
});

test("routing: command navigation goes somewhere real or is disabled with a reason", () => {
  assert.deepEqual(COMMAND_SECTIONS.map((s) => s.label), [
    "Command Center", "Priority & Alerts", "Ecosystem Map", "Agent Fleet", "Operations", "Governance & Alignment",
    "Truth & Evidence", "Watchtower & Risk", "Infrastructure", "Observability", "Security & Trust", "Incidents",
    "Reports & Insights", "Settings",
  ]);
  assert.deepEqual(COMMAND_SECTIONS.filter((s) => s.status === "CURRENT").map((s) => s.id), ["command"]);
  const routes = read("src/router/AdminRoutes.jsx");
  const ui = ["AgentFabricCommandCenter.jsx", "components/CommandStatusStrip.jsx", "components/EcosystemMap.jsx", "components/CommandOverview.jsx"]
    .map((f) => read(`${AFCC_DIR}/${f}`)).join("\n");
  for (const s of COMMAND_SECTIONS) {
    if (s.status === "ROUTE") assert.ok(routes.includes(`path="${s.route}"`), `${s.route} is a real admin route`);
    if (s.status === "IN_PAGE") {
      const lane = s.target.replace(/^afcc-lane-/, "");
      assert.ok(ui.includes(`id="${s.target}"`) || ui.includes(`id="${lane}"`), `${s.target} exists on the page`);
    }
    if (s.status === "NOT_AVAILABLE") assert.ok(/^AFCC-\d+$/.test(s.phase) && !s.route && !s.target);
  }
});

test("routing: admin rail links the Command Center under the same access key", () => {
  const sidebar = read("src/components/admin/AdminSidebar.jsx");
  assert.match(sidebar, /\{ to: "\/agent-fabric", icon: "F", label: "Agent Fabric", end: true \}/);
  assert.match(sidebar, /\{ to: "\/agent-fabric\/command", route: "\/agent-fabric", icon: "⌘", label: "Fabric Command" \}/);
});

test("data gaps: the master plan's known limitations are all represented", () => {
  assert.deepEqual(KNOWN_DATA_GAPS.map((g) => g.id).sort(), ["approval_queue", "cancel_revoke", "evidence_lineage", "model_provider", "resource_permissions", "run_actor_org", "run_state_machine", "timeout", "work_order_id"]);
});

// ============================================================== 7. reduced motion / UI source contracts
test("reduced motion: animations only under no-preference, and disabled under reduce", () => {
  const css = read(`${AFCC_DIR}/agent-fabric-command.css`);
  const noPref = css.indexOf("@media (prefers-reduced-motion: no-preference)");
  const firstAnimation = css.indexOf("animation:");
  assert.ok(noPref > 0 && firstAnimation > noPref, "animations are declared only inside the no-preference block");
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*animation: none !important/);
});

test("UI: no high-authority action controls exist in the Command Center", () => {
  const ui = fs.readdirSync(AFCC_DIR, { recursive: true }).filter((f) => f.endsWith(".jsx")).map((f) => read(path.join(AFCC_DIR, f))).join("\n");
  const buttons = ui.match(/<button[\s\S]*?<\/button>/g) || [];
  assert.ok(buttons.length > 5);
  for (const button of buttons) {
    assert.doesNotMatch(button, />\s*[^<{]*\b(Quarantine|Release|Approve|Reject|Publish|Execute|Disable|Enable|Revoke|Cancel|Delete|Attest)\b/i, button.slice(0, 120));
  }
});

test("UI: class names avoid the global [class*=…] selectors that restyle admin pages", () => {
  const css = read(`${AFCC_DIR}/agent-fabric-command.css`);
  const classes = [...new Set(css.match(/\.afcc-[a-z0-9-]+/g))];
  for (const c of classes) {
    assert.doesNotMatch(c, /overview|layer|chip|card|panel|status|badge|header|tab|bar|kpi|metric|summary|readiness|command|hero|rail|main|muted|next|index|progress/i, c);
  }
});

// ================================================= AFCC Visual V3 — operational topology
import {
  AUTHORITY_NAV,
  authorityEntry,
  dependencyPaths,
  FLOW,
  HUB_ID,
  NODE_BY_ID,
  TOPOLOGY_EDGES,
  TOPOLOGY_NODES,
  UNCONNECTED_AUTHORITIES,
} from "../src/pages/admin/agent-fabric-command/ecosystemTopology.js";
import {
  buildOperationalModel,
  buildSearchIndex,
  classifyItems,
  EDGE_STATE,
  NODE_STATUS,
  nodesForCategory,
  PRIORITY,
  searchEntries,
} from "../src/pages/admin/agent-fabric-command/operationalModel.js";
import { computeLayout, edgePath, FRAME_HEIGHT } from "../src/pages/admin/agent-fabric-command/topologyLayout.js";

const MASTER_PLAN = read("docs/AGENT_FABRIC_COMMAND_CENTER_MASTER_PLAN.md");
const MATRIX = MASTER_PLAN.slice(MASTER_PLAN.indexOf("## Ecosystem Connection Matrix"), MASTER_PLAN.indexOf("## Canonical Run Lifecycle"));

test("V3 topology: every edge joins known nodes and cites a real Ecosystem Connection Matrix row", () => {
  const ids = new Set(TOPOLOGY_NODES.map((n) => n.id));
  assert.equal(TOPOLOGY_NODES.filter((n) => n.hub).map((n) => n.id).join(), HUB_ID);
  for (const e of TOPOLOGY_EDGES) {
    assert.ok(ids.has(e.from) && ids.has(e.to), e.id);
    assert.ok(Object.values(FLOW).includes(e.flow), e.id);
    assert.ok(MATRIX.includes(`| ${e.matrixRow} |`), `${e.id} cites matrix row "${e.matrixRow}"`);
  }
  assert.equal(new Set(TOPOLOGY_EDGES.map((e) => e.id)).size, TOPOLOGY_EDGES.length);
  for (const n of TOPOLOGY_NODES) assert.ok(TOPOLOGY_EDGES.some((e) => e.from === n.id || e.to === n.id), `${n.id} is connected`);
});

test("V3 topology: systems the matrix does not connect are not drawn, and producers reach Fabric only via SHS API", () => {
  assert.match(MATRIX, /\| OAS \| No direct code connection found/);
  assert.deepEqual(UNCONNECTED_AUTHORITIES.map((a) => a.id), ["oas"]);
  assert.ok(!NODE_BY_ID.oas);
  for (const producer of ["civicsure", "curriculum", "career"]) {
    assert.deepEqual(TOPOLOGY_EDGES.filter((e) => e.from === producer || e.to === producer).map((e) => `${e.from}>${e.to}`), [`${producer}>shs`]);
  }
  assert.deepEqual(TOPOLOGY_EDGES.filter((e) => e.to === HUB_ID).map((e) => e.from), ["shs"], "only SHS API feeds Fabric");
  assert.ok(!TOPOLOGY_EDGES.some((e) => (e.from === HUB_ID && e.to === "oracle") || (e.from === "oracle" && e.to === HUB_ID)), "Oracle connects through Truth");
});

test("V3 dependencies: CivicSure follows real lineage (events -> evidence -> risk), not every hub spoke", () => {
  const { upstream, downstream } = dependencyPaths("civicsure");
  assert.equal(upstream.nodes.size, 0);
  assert.deepEqual([...downstream.nodes].sort(), ["agent-fabric", "loo", "oracle", "reporting", "shs", "truth", "watchtower"]);
  for (const unrelated of ["treasury", "metaverse", "shf", "bos", "registry", "guardrails"]) assert.ok(!downstream.nodes.has(unrelated), unrelated);
  assert.deepEqual(downstream.chainTo("reporting"), ["civicsure", "shs", "agent-fabric", "truth", "reporting"]);
  assert.deepEqual(downstream.chainTo("watchtower"), ["civicsure", "shs", "agent-fabric", "truth", "watchtower"]);
});

test("V3 dependencies: Watchtower upstream and downstream; hub reaches everything directly", () => {
  const wt = dependencyPaths("watchtower");
  assert.deepEqual([...wt.downstream.nodes], ["loo"]);
  for (const id of ["truth", "agent-fabric", "loo", "shs", "civicsure"]) assert.ok(wt.upstream.nodes.has(id), id);
  assert.ok(!wt.upstream.nodes.has("treasury"));
  // Chains are real allowed paths: SHS events reach Watchtower only through Truth.
  assert.deepEqual(wt.upstream.chainTo("shs").reverse(), ["shs", "agent-fabric", "truth", "watchtower"]);
  assert.deepEqual(wt.upstream.chainTo("civicsure").reverse(), ["civicsure", "shs", "agent-fabric", "truth", "watchtower"]);
  const hub = dependencyPaths(HUB_ID);
  assert.deepEqual([...hub.upstream.nodes].sort(), ["career", "civicsure", "curriculum", "shs"]);
  assert.equal(hub.downstream.nodes.size, TOPOLOGY_NODES.length - 5);
});

test("V3 priority: categories come only from published states; approval policy is not 'needs review'", () => {
  const { items, sources } = classifyItems(healthySnapshot());
  const by = (c) => items.filter((i) => i.category === c).map((i) => i.id).sort();
  assert.deepEqual(by(PRIORITY.CRITICAL), ["gate"], "blocked layer gate");
  assert.deepEqual(by(PRIORITY.REVIEW), ["agent:a2"], "registry health warning + execution blocked");
  assert.deepEqual(by(PRIORITY.DEGRADED), ["program:arena_observation_deck", "program:watchtower_demo_program"], "Watchtower DEGRADE actions");
  assert.deepEqual(by(PRIORITY.NORMAL), ["agent:a1", "posture"], "a1 requires approval by policy but is ready");
  assert.deepEqual(by(PRIORITY.STALE), []);
  assert.deepEqual(sources.filter((s) => !s.classified).map((s) => s.key), ["infrastructure", "observability"], "not-yet-verified is never classified");
  const model = buildOperationalModel(healthySnapshot());
  const counts = Object.fromEntries(model.counts.map((c) => [c.category, c]));
  assert.equal(counts.CRITICAL.count, 1);
  assert.deepEqual(counts.CRITICAL.coverage, { classified: 3, total: 5 }, "posture, Watchtower, gate readable; verifiers not yet verified");
  assert.deepEqual(counts.REVIEW.coverage, { classified: 2, total: 2 });
  assert.equal(counts.STALE.count, null);
  assert.equal(counts.STALE.unavailable, "No threshold");
});

test("V3 priority: a category whose own sources are unreadable shows why, never zero", () => {
  // Today's browser reality: agent registry routes need the auth bridge.
  const s = healthySnapshot();
  s.agentHealth = adaptAgentHealth(failed("agentHealth", SOURCE_STATE.AUTH_BRIDGE_REQUIRED));
  s.agentReadiness = adaptAgentReadiness(failed("agentReadiness", SOURCE_STATE.AUTH_BRIDGE_REQUIRED));
  const review = buildOperationalModel(s).counts.find((c) => c.category === PRIORITY.REVIEW);
  assert.equal(review.count, null);
  assert.equal(review.unavailable, "Auth bridge required");
  assert.match(review.detail, /Agent registry health: auth bridge required/);
});

test("V3 priority: nothing readable means no counts; a published threshold enables Stale", () => {
  const empty = buildOperationalModel(initialOverviewSnapshot());
  assert.ok(empty.counts.every((c) => c.count === null), "loading/unreadable sources never become zero counts");
  const s = healthySnapshot();
  s.infrastructure = adaptInfrastructureRead(available("infrastructure", { ...FIX.infrastructure, staleness: { age_seconds: 10800, threshold_seconds: 3600, threshold: "DEFINED" } }));
  const model = buildOperationalModel(s);
  const stale = model.counts.find((c) => c.category === PRIORITY.STALE);
  assert.equal(stale.count, 1);
  assert.equal(stale.items[0].id, "infrastructure");
});

test("V3 node status: live only where an admitted source exists; never inferred across authorities", () => {
  const model = buildOperationalModel(healthySnapshot());
  assert.equal(model.statusById[HUB_ID].status, NODE_STATUS.OPERATIONAL);
  assert.equal(model.statusById.watchtower.status, NODE_STATUS.DEGRADED);
  assert.equal(model.statusById.watchtower.freshness.text, "Evaluated 23 days ago");
  for (const id of ["truth", "oracle", "loo", "registry", "treasury", "civicsure", "shs"]) {
    assert.equal(model.statusById[id].status, NODE_STATUS.NOT_PUBLISHED, `${id} does not borrow Fabric health`);
  }
  const bridge = healthySnapshot();
  bridge.watchtower = adaptWatchtowerRead(failed("watchtower", SOURCE_STATE.AUTH_BRIDGE_REQUIRED));
  assert.equal(buildOperationalModel(bridge).statusById.watchtower.status, NODE_STATUS.RESTRICTED);
  const notEvaluated = healthySnapshot();
  notEvaluated.watchtower = adaptWatchtowerRead(available("watchtower", FIX.watchtowerNotEvaluated));
  const info = buildOperationalModel(notEvaluated).statusById.watchtower;
  assert.equal(info.status, NODE_STATUS.UNAVAILABLE);
  assert.equal(info.freshness.text, "Not yet evaluated");
  assert.deepEqual([...nodesForCategory(model, PRIORITY.DEGRADED)], ["watchtower"]);
});

test("V3 edges: state comes from the upstream end; unpublished ends are 'not observed', never normal", () => {
  const edgeBy = (m) => Object.fromEntries(m.edges.map((e) => [e.id, e.state]));
  const healthy = edgeBy(buildOperationalModel(healthySnapshot()));
  assert.equal(healthy["fabric-watchtower"], EDGE_STATE.OBSERVED);
  assert.equal(healthy["watchtower-loo"], EDGE_STATE.DEGRADED);
  assert.equal(healthy["fabric-truth"], EDGE_STATE.UNOBSERVED);
  assert.equal(healthy["shs-fabric"], EDGE_STATE.UNOBSERVED);
  const off = healthySnapshot();
  off.healthLive = adaptHealthLive(failed("healthLive", SOURCE_STATE.OFFLINE));
  const offline = edgeBy(buildOperationalModel(off));
  assert.ok(TOPOLOGY_EDGES.filter((e) => e.from === HUB_ID).every((e) => offline[e.id] === EDGE_STATE.BLOCKED));
});

// Geometry regression: an edge that passes behind an unrelated node would read
// as a relationship that does not exist.
function sampleEdge(edge, layout, pair) {
  const d = edgePath(edge, layout, { pair }).d;
  const n = d.match(/-?\d+(\.\d+)?/g).map(Number);
  const pts = [];
  if (d.includes("Q")) {
    const [x1, y1, qx, qy, x2, y2] = n;
    for (let t = 0; t <= 1; t += 0.02) pts.push([(1 - t) ** 2 * x1 + 2 * (1 - t) * t * qx + t * t * x2, (1 - t) ** 2 * y1 + 2 * (1 - t) * t * qy + t * t * y2]);
  } else {
    const [x1, y1, x2, y2] = n;
    for (let t = 0; t <= 1; t += 0.02) pts.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]);
  }
  return pts;
}

test("V3 layout: frame nodes never overlap and no edge passes behind an unrelated node", () => {
  const pairOf = (e) => (TOPOLOGY_EDGES.some((x) => x.from === e.to && x.to === e.from) ? (e.from < e.to ? 1 : -1) : 0);
  for (const width of [860, 960, 1040, 1168, 1360, 1600]) {
    const layout = computeLayout(width);
    assert.equal(layout.kind, "frame");
    assert.equal(layout.height, FRAME_HEIGHT);
    const boxes = Object.entries(layout.nodes);
    assert.equal(boxes.length, TOPOLOGY_NODES.length);
    for (const [a, A] of boxes) {
      assert.ok(A.x - A.w / 2 >= 0 && A.x + A.w / 2 <= width, `${a} inside at ${width}`);
      for (const [b, B] of boxes) {
        if (a >= b) continue;
        const overlap = Math.abs(A.x - B.x) < (A.w + B.w) / 2 + 4 && Math.abs(A.y - B.y) < (A.h + B.h) / 2 + 4;
        assert.ok(!overlap, `${a} overlaps ${b} at ${width}`);
      }
    }
    for (const edge of TOPOLOGY_EDGES) {
      for (const [x, y] of sampleEdge(edge, layout, pairOf(edge))) {
        for (const [id, B] of boxes) {
          if (id === edge.from || id === edge.to) continue;
          const inside = Math.abs(x - B.x) < B.w / 2 + 3 && Math.abs(y - B.y) < B.h / 2 + 3;
          assert.ok(!inside, `${edge.id} passes behind ${id} at ${width}`);
        }
      }
    }
  }
});

test("V3 layout: narrow widths use a non-overlapping grid without drawn edges", () => {
  for (const width of [358, 398, 712]) {
    const layout = computeLayout(width);
    assert.equal(layout.kind, "grid");
    assert.equal(layout.drawsEdges, false);
    const boxes = Object.values(layout.nodes);
    for (const A of boxes) assert.ok(A.x - A.w / 2 >= 0 && A.x + A.w / 2 <= width && A.h >= 44);
  }
});

test("V3 search: loaded systems, agents, runs and alerts only", () => {
  const snapshot = healthySnapshot();
  const model = buildOperationalModel(snapshot);
  const index = buildSearchIndex(snapshot, model);
  assert.deepEqual([...new Set(index.map((e) => e.group))].sort(), ["Agents", "Alerts", "Runs", "Systems"]);
  assert.equal(searchEntries(index, "civic")[0].selection.key, "civicsure");
  assert.equal(searchEntries(index, "6b1673")[0].group, "Runs");
  assert.equal(searchEntries(index, "beta")[0].selection.key, "a2");
  assert.deepEqual(searchEntries(index, "zzzz-no-such-thing"), []);
  assert.ok(!index.some((e) => e.group === "Alerts" && e.label === "Agent Fabric runtime"), "normal items are not alerts");
});

test("V3 nav: ecosystem authority destinations are real routes or apps, or disabled with a reason", () => {
  const routes = read("src/router/AdminRoutes.jsx");
  assert.deepEqual(AUTHORITY_NAV.map((id) => authorityEntry(id)?.id), AUTHORITY_NAV);
  for (const id of AUTHORITY_NAV) {
    const dest = authorityEntry(id).destination;
    if (dest.kind === "admin") assert.ok(routes.includes(`path="${dest.route}"`), `${id} -> ${dest.route}`);
    else if (dest.kind === "app") assert.ok(fs.existsSync(new URL(`../${dest.href.split("#")[0].replace(/^\//, "")}`, import.meta.url)), `${id} -> ${dest.href}`);
    else assert.ok(dest.reason && dest.reason.length > 20, id);
  }
});

test("V3 truth: no illustrative mock numbers, invented run states or 'Unknown' in the UI source", () => {
  const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
  const ui = fs.readdirSync(AFCC_DIR, { recursive: true }).filter((f) => /\.(jsx|js)$/.test(f)).map((f) => stripComments(read(path.join(AFCC_DIR, f)))).join("\n");
  for (const fake of ["1,284", "238", "98.7", "99.9", "96.1", "92.4", "98.3", "Jordan Ellis", "RUN-2025"]) assert.ok(!ui.includes(fake), `mock value ${fake}`);
  for (const invented of ['"Running"', '"Waiting"', '"Timed Out"', '"Revoked"', ">Running<", ">Unknown<", '"Unknown"']) assert.ok(!ui.includes(invented), invented);
  const drawer = read(`${AFCC_DIR}/components/CommandDrawer.jsx`);
  assert.match(drawer, /label: "Overview"[\s\S]*label: "Authority"[\s\S]*label: "Timeline"[\s\S]*label: "Evidence"[\s\S]*label: "Dependencies"/);
  assert.match(drawer, /role="tablist"/);
  assert.match(read(`${AFCC_DIR}/components/EcosystemMap.jsx`), /aria-disabled="true"[\s\S]*Geography/);
});

test("V3 fetch: the topology adds no endpoint; every source is still the frozen AFCC contract", () => {
  const files = ["ecosystemTopology.js", "operationalModel.js", "topologyLayout.js", "components/EcosystemMap.jsx", "components/CommandDrawer.jsx", "components/CommandSearch.jsx"];
  for (const f of files) {
    const src = read(`${AFCC_DIR}/${f}`);
    assert.doesNotMatch(src, /\bfetch\(|fabricUrl|XMLHttpRequest|localhost|127\.0\.0\.1|:8090|:8091|:8000/, f);
  }
});

// ================================================= AFCC-2A.2 — shell + bridge guards
test("AFCC-2A.2 Phase 8: only the Command Center renders full-bleed; the admin shell is unchanged elsewhere", () => {
  const layout = read("src/layouts/AdminLayout.jsx");
  assert.match(layout, /FULL_BLEED_ADMIN_ROUTES = Object\.freeze\(\["\/agent-fabric\/command"\]\)/);
  assert.match(layout, /<AdminHeader \/>[\s\S]*<AdminSidebar \/>/, "every other admin route keeps the header and rail");
  assert.match(layout, /data-shell-family="operator"[\s\S]*data-shell-mode="full-bleed"/);
  assert.match(read(`${AFCC_DIR}/components/CommandSidebar.jsx`), /to="\/hub"/, "a way back to the admin shell");
});

test("AFCC-2A.2: no AFCC source references an admin-key Fabric route or credential", () => {
  const files = fs.readdirSync(AFCC_DIR, { recursive: true }).filter((f) => /\.(js|jsx)$/.test(f));
  for (const f of files) {
    const text = read(path.join(AFCC_DIR, f)).replace(/\/\/.*$/gm, "");
    assert.doesNotMatch(text, /["'`]\/admin\/(agents|layers)|["'`]\/runs\/recent|X-Admin-Key|ADMIN_API_KEY|x-shf-service/i, f);
  }
});

test("AFCC-2A.3: SHS-side failures on the verifier reads are not counted against Fabric posture", () => {
  const s = healthySnapshot();
  s.infrastructure = adaptInfrastructureRead({ ...failed("infrastructure", SOURCE_STATE.BACKEND_UNAVAILABLE), failedLayer: "browser_to_shs" });
  s.observability = adaptObservabilityRead({ ...failed("observability", SOURCE_STATE.BRIDGE_NOT_CONFIGURED), failedLayer: "shs" });
  const posture = derivePosture(s);
  assert.equal(posture.posture, POSTURE.OPERATIONAL);
  assert.deepEqual(posture.excluded, ["Infrastructure verification (SHS API unavailable)", "Observability verification (bridge not configured)"]);
  // A Fabric-side failure on the same read still degrades posture.
  s.infrastructure = adaptInfrastructureRead({ ...failed("infrastructure", SOURCE_STATE.FABRIC_ERROR), failedLayer: "fabric" });
  assert.equal(derivePosture(s).posture, POSTURE.DEGRADED);
});
