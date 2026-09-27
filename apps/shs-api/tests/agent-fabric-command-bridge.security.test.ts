// AFCC-2A.2 — SHS -> Agent Fabric read bridge security tests.
// In-process: real routes, real requirePermission, real organization-context
// resolution, real HMAC signer; a local fake Fabric verifies the signature
// independently and records every request it receives. No database needed.
process.env.SHS_AUTH_ENV = "test"; // local demo identity off: unauthenticated stays unauthenticated

import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import express from "express";

const { authMiddleware } = await import("../src/auth/auth-middleware.ts");
const { applyActiveOrganizationContext } = await import("../src/auth/organization-context.ts");
const { mergeRolePermissions, SHS_SECURITY_PERMISSIONS, getPermissionsForRole } = await import("../src/auth/security-permissions.ts");
const { registerAgentFabricCommandRoutes } = await import("../src/domain/agent-fabric-command/api/routes.ts");
const { readFabricSource, BRIDGED_SOURCES } = await import("../src/domain/agent-fabric-command/fabric-read-bridge.ts");

const KID = "bridge-test-k1";
const SECRET = "bridge-test-hmac-secret-value";
const ADMIN_KEY = "fabric-admin-key-must-never-appear";
const SHA = "b".repeat(64);
const ALLOWED_FABRIC_PATHS = new Set(Object.values(BRIDGED_SOURCES).map((s) => s.fabricPath));

// --------------------------------------------------------------- fake Fabric
type Received = { method: string; path: string; headers: http.IncomingHttpHeaders; verified: boolean };
let received: Received[] = [];
let mode: "ok" | "500_traceback" | "401" | "malformed" | "backend_error" | "leaky" | "hang" | "unverified" | "bad_state" = "ok";
let fabric: http.Server;
let fabricUrl = "";

function verify(req: http.IncomingMessage): boolean {
  const h = req.headers;
  const digest = crypto.createHash("sha256").update("{}").digest("hex");
  const msg = ["GET", (req.url || "").split("?")[0], digest, h["x-shf-service-iat"], h["x-shf-service-exp"], h["x-shf-service-kid"]].join("|");
  const expected = crypto.createHmac("sha256", SECRET).update(msg).digest("hex");
  return h["x-shf-service-id"] === "service:shs-api" && h["x-shf-service-kid"] === KID && h["x-shf-service-signature"] === expected;
}

function envelope(kind: string) {
  const base = { contract: "afcc.read.v1", kind, read_only: true, state: "AVAILABLE", access: "shs_service", generated_at: "2026-09-26T10:00:00Z" };
  if (kind === "agents_health") return { ...base, ok: true, source: "contracts/agents/agents.json", summary: { total: 2, ready: 1, warning: 1, approval_required: 1, internal: 1 }, agents: [{ agent_id: "a1", name: "Alpha", layer: "L23", lifecycle: "active", enabled: true, status: "ready", missing: [], policy: { secret: "x" } }] };
  if (kind === "agents_readiness") return { ...base, ok: true, summary: { total: 2, auto_ready: 0, approval_required: 1, blocked: 1 }, agents: [{ agent_id: "a2", name: "Beta", execution_status: "blocked", can_auto_execute: false, humanApproval: false, blockers: ["agent_disabled"], warnings: [] }] };
  if (kind === "watchtower") {
    if (mode === "unverified") return { ...base, state: "NOT_YET_EVALUATED", reason_code: "WATCHTOWER_STORE_NOT_CREATED", catalog_program_count: 2, programs: [{ program_id: "arena_observation_deck", state: "NOT_YET_EVALUATED" }], latest_evaluation: null, manual_quarantine: { active_count: 0, programs: [] }, latest_attestation: { state: "NOT_RECORDED" }, alerts: { state: "NOT_PUBLISHED" }, integrity: { state: "NOT_PUBLISHED" } };
    return { ...base, source: { authority: "Watchtower", store: "watchtower_store", recomputed_on_read: false }, catalog_program_count: 2, alerts: { state: "NOT_PUBLISHED", reason_code: "WATCHTOWER_DOES_NOT_PERSIST_ALERTS" }, integrity: { state: "NOT_PUBLISHED" },
      programs: [{ program_id: "arena_observation_deck", state: "EVALUATED", risk_band: "RED", quarantined: false, action: "DEGRADE", reasons: ["health<0.40"], evaluated_at: "2026-09-26T06:00:00Z" }],
      latest_evaluation: { worst_risk_band: "RED", risk_counts: { GREEN: 0, YELLOW: 0, RED: 1, QUARANTINE: 0 }, quarantined_count: 0, evaluated_program_count: 1, not_evaluated_program_count: 1, latest_evaluated_at: "2026-09-26T06:00:00Z", staleness: { age_seconds: 16524, oldest_age_seconds: 16524, threshold_seconds: null, threshold: "NOT_DEFINED" } },
      non_catalog_snapshot_program_count: 1, manual_quarantine: { active_count: 0, programs: [] }, latest_attestation: { state: "NOT_RECORDED" } };
  }
  if (kind === "infrastructure" || kind === "observability") {
    if (mode === "unverified") return { ...base, state: "NOT_YET_VERIFIED", reason_code: "NO_VERIFICATION_RECORDED", source: { run_on_read: false } };
    return { ...base, status: "DEGRADED", last_verified_at: "2026-09-26T07:00:00Z", trigger: `admin_${kind}_verify`, checks: [{ name: "registry_contract", ok: true, reason_code: null }, { name: "watchtower_attestation", ok: false, reason_code: "CHECK_FAILED" }], degraded: ["watchtower_attestation"], staleness: { age_seconds: 600, threshold_seconds: null, threshold: "NOT_DEFINED" }, stdout_tail: "/Users/x/secret" };
  }
  if (kind === "gate") return { ...base, gate_pass: false, auditor_one_liner: "GATE FAIL: blockers=L08(not_enforced_ready)", gate_required_layers: ["L07", "L08"], gate_blockers: [{ layer: "L08", reason: "not_enforced_ready" }] };
  return { ...base, window: 25, events: [{ runId: "r1", planId: "p1", agentName: "Layer23OrchestratorAgent", kind: "execute", outcome: "ok", ts: "2026-01-09T03:56:55+00:00", snapshotSha256: SHA, artifacts: [{ artifactId: "draft_1", sha256: SHA, path: "/Users/x/db/a.json" }] }] };
}

// AFCC-3 live-run projections served by the fake Fabric.
function liveRunKind(url: string) {
  const m = url.split("?")[0].match(/^\/api\/v1-command-center\/agent-fabric\/runs(?:\/([^/]+)(\/timeline|\/evidence|\/dependencies)?)?$/);
  if (!m) return null;
  if (!m[1]) return "runs_live";
  return ({ "": "run_detail", "/timeline": "run_timeline", "/evidence": "run_evidence", "/dependencies": "run_dependencies" } as Record<string, string>)[m[2] || ""];
}

function liveRunBody(kind: string) {
  const base = { contract: "afcc.read.v1", kind, read_only: true, state: "AVAILABLE", access: "shs_service", generated_at: "2026-09-27T10:00:00Z" };
  const source = { authority: "Agent Fabric run ledger and plan store", stores: ["db/runs/events.jsonl"], projection: "live_operations", read_only: true, record_type: "run_event", malformed_event_count: 2, unattributed_event_count: 1, internal_path: "/srv/db/runs/events.jsonl" };
  const refs = (authority: string, r: string[]) => ({ authority, state: r.length ? "PUBLISHED" : "NOT_PUBLISHED", link_basis: r.length ? "RUN_EVENT_RECORDED" : "NO_RUN_SPECIFIC_RELATION", refs: r, raw_record: { secret: "x" } });
  const run = {
    run_id: "a1b2c3", current_state: "COMPLETED", correlation_id: "corr_1234abcd", retry_count: "NOT_CAPTURED", provider: "NOT_APPLICABLE", model: "NOT_APPLICABLE", adapter: "save_draft_artifact",
    state_derivation: { state: "COMPLETED", reason_code: "RUN_EVENT_TERMINAL", conflict: false, debug: "/srv/x.py" },
    initiator: { actor_id: "u-approver", actor_type: "HUMAN", initiator_type: "HUMAN", actor_verification: "VERIFIED", organization_id: "NOT_APPLICABLE", organization_verification: "VERIFIED", tenant_id: "NOT_APPLICABLE", tenant_verification: "VERIFIED", source_system: "agent_fabric.session", source_system_verification: "VERIFIED", entry_point: "fabric.runs.execute", execution_system: "agent_fabric", admin_key: ADMIN_KEY,
      authority: { authentication: "FABRIC_SESSION", role: "shs_admin", permission: "fabric.run.execute", scope: "PLATFORM_GLOBAL", session_token: "tok-should-not-pass" },
      declared_identity: { actor_id: "ceo", organization_id: "org_victim", verification: "DECLARED", email: "ceo@victim.example" } },
    execution: { provider: "NOT_APPLICABLE", model: "NOT_APPLICABLE", adapter: "save_draft_artifact", adapters: ["save_draft_artifact"], agent_version: "NOT_CAPTURED", model_invoked: false, credentials: "sk-live" },
    correlation: { id: "corr_1234abcd", source: "PLAN", continuity: "CONSISTENT" },
    retry_lineage: { retry_supported: false, retrying_state: "DEFERRED", retry_count: "NOT_CAPTURED", parent_run_id: "NOT_CAPTURED", root_run_id: "NOT_CAPTURED", retry_of_run_id: "NOT_CAPTURED", same_plan_run_ids: [] },
    domain_refs: { truth_spine: refs("Truth Spine", ["truth:claim_1"]), watchtower: refs("Watchtower", []), loo: refs("LOO", []), reporting: { ...refs("Reporting", []), proof_refs: [] } },
    approval: { state: "APPROVED", required: true, authority: "plan_store", plan_status: "DONE", basis: "PLAN_APPROVAL_VERIFIED",
      decision: { decision: "APPROVED", approver_actor_id: "u-approver", approver_type: "HUMAN", actor_verification: "VERIFIED", organization_id: "NOT_APPLICABLE", organization_verification: "VERIFIED", decided_at: "2026-09-27T08:00:00Z", reason: "reviewed", correlation_id: "corr_1234abcd", provenance: "RECORDED", csrf_token: "csrf-should-not-pass",
        authority: { authentication: "FABRIC_SESSION", role: "shs_admin", permission: "fabric.plan.approve", scope: "PLATFORM_GLOBAL" } } },
    failure_summary: mode === "leaky" ? "Traceback (most recent call last): File \"/srv/x.py\" ValueError" : "NOT_AVAILABLE",
    event_count: 1, source,
  };
  if (kind === "runs_live") return { ...base, source, count: 1, runs: [run], lifecycle: { supported_states: ["APPROVAL_DENIED", "APPROVAL_REQUIRED", "APPROVED", "COMPLETED", "FAILED"], deferred_states: ["QUEUED", "EXECUTING"] }, freshness: { last_updated: "2026-09-27T09:00:00Z", captured_at: "2026-09-27T10:00:00Z", threshold: "NOT_DEFINED" } };
  if (kind === "run_detail") return { ...base, source, run };
  if (kind === "run_timeline") return { ...base, source, run_id: "a1b2c3", events: [{ event_id: "run_evt_1", run_id: "a1b2c3", event_type: "run.completed", from_state: "APPROVED", to_state: "COMPLETED", occurred_at: "2026-09-27T09:00:00Z", actor_ref: "NOT_CAPTURED", authority_ref: "agent_fabric.run_events", reason_code: "NOT_CAPTURED", reason_summary: "plan executed", evidence_refs: [], policy_refs: [], correlation_id: "corr_1234abcd", source: "agent_fabric.run_events", provenance: "RECORDED", raw: { path: "/srv/a" } }] };
  if (kind === "run_evidence") return { ...base, source, run_id: "a1b2c3", evidence: { evidence_refs: [], artifact_refs: [{ artifact_id: "draft_1", sha256: SHA, path: "/Users/x/a.json" }], proof_refs: [], report_refs: [], truth_refs: ["truth:claim_1"], watchtower_refs: [], loo_refs: [], domain_refs: run.domain_refs, counts: { evidence: 0, artifacts: 1, proofs: 0, reports: 0 } } };
  return { ...base, source, run_id: "a1b2c3", dependency_run_ids: [], parent_run_id: "NOT_CAPTURED", retry_lineage: run.retry_lineage, correlation_id: "corr_1234abcd" };
}

before(async () => {
  fabric = http.createServer((req, res) => {
    received.push({ method: req.method || "", path: req.url || "", headers: req.headers, verified: verify(req) });
    const kind = Object.values(BRIDGED_SOURCES).find((s) => s.fabricPath === (req.url || "").split("?")[0])?.kind || liveRunKind(req.url || "") || "unknown";
    if (mode === "hang") return; // never answers
    if (!verify(req)) { res.writeHead(401, { "content-type": "application/json" }); return res.end(JSON.stringify({ detail: "Authentication required" })); }
    if (mode === "401") { res.writeHead(401, { "content-type": "application/json" }); return res.end("{}"); }
    if (mode === "500_traceback") { res.writeHead(500, { "content-type": "text/plain" }); return res.end(`Traceback (most recent call last):\n  File "/srv/fabric/main.py" KeyError: ${ADMIN_KEY}`); }
    if (mode === "backend_error") { res.writeHead(503, { "content-type": "application/json" }); return res.end(JSON.stringify({ contract: "afcc.read.v1", kind, read_only: true, state: "BACKEND_ERROR", reason_code: "PROJECTION_READ_FAILED" })); }
    if (mode === "bad_state") { res.writeHead(200, { "content-type": "application/json" }); return res.end(JSON.stringify({ ...envelope(kind), state: "EVALUATING_NOW" })); }
    if (mode === "malformed") { res.writeHead(200, { "content-type": "application/json" }); return res.end(JSON.stringify({ contract: "afcc.read.v1", kind: "something_else", read_only: true, state: "AVAILABLE" })); }
    const body: any = ["runs_live", "run_detail", "run_timeline", "run_evidence", "run_dependencies"].includes(kind) ? liveRunBody(kind) : envelope(kind);
    if (mode === "leaky") {
      if (body.events) body.events[0].message = "Traceback (most recent call last): File \"/srv/x.py\" ValueError";
      if (body.agents) body.agents[0].name = `ADMIN_API_KEY=${ADMIN_KEY}`;
      if (body.gate_blockers) body.gate_blockers[0].reason = "/Users/someone/private/path.json";
      if (body.programs) body.programs[0].reasons = ["Traceback (most recent call last): File \"/srv/wt.py\""];
      if (body.checks) body.checks[1].reason_code = "Traceback at /srv/verify.py";
    }
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
  });
  await new Promise<void>((r) => fabric.listen(0, "127.0.0.1", () => r()));
  fabricUrl = `http://127.0.0.1:${(fabric.address() as any).port}`;
});

after(() => { fabric.closeAllConnections?.(); fabric.close(); });

beforeEach(() => {
  received = [];
  mode = "ok";
  process.env.SHF_AGENT_FABRIC_INTERNAL_URL = fabricUrl;
  process.env.SHF_INTERNAL_SERVICE_KEYS_JSON = JSON.stringify({ [KID]: SECRET });
  process.env.SHF_INTERNAL_SERVICE_ACTIVE_KID = KID;
  process.env.ADMIN_API_KEY = ADMIN_KEY; // present in the SHS env on purpose: it must never be used or echoed
  delete process.env.SHS_AGENT_FABRIC_READ_TIMEOUT_MS;
});

// ------------------------------------------------------------------ SHS app
function identity(role: string, org = "org_shs", scope = "organization") {
  return {
    user_id: `u_${role}`,
    id: `u_${role}`,
    email: `${role}@test.invalid`,
    organization_id: org,
    memberships: [{ membership_id: `m_${role}`, organization_id: org, tenant_id: `tenant:${org}`, role, role_scope_type: scope, status: "active", organization_status: "active", permissions: mergeRolePermissions([role]) }],
  };
}

async function withApp(user: any, fn: (base: string) => Promise<void>, { realAuth = false } = {}) {
  const app = express();
  app.use(express.json());
  if (realAuth) app.use(authMiddleware);
  else app.use((req: any, _res, next) => { req.user = user; next(); });
  registerAgentFabricCommandRoutes(app);
  const server = await new Promise<http.Server>((r) => { const s = app.listen(0, "127.0.0.1", () => r(s)); });
  try {
    await fn(`http://127.0.0.1:${(server.address() as any).port}`);
  } finally {
    server.closeAllConnections?.();
    server.close();
  }
}

const userFor = (role: string, org?: string, scope?: string) => applyActiveOrganizationContext(identity(role, org, scope), org || "org_shs");
const SOURCES = Object.keys(BRIDGED_SOURCES);

// 1. unauthenticated
test("1: unauthenticated browser cannot use the bridge (real authMiddleware)", async () => {
  await withApp(null, async (base) => {
    for (const s of SOURCES) {
      const res = await fetch(`${base}/agent-fabric/command/${s}`);
      assert.equal(res.status, 401, s);
      assert.equal((await res.json()).error.code, "AUTH_REQUIRED");
    }
  }, { realAuth: true });
  assert.equal(received.length, 0, "no Fabric call without authentication");
});

// 2 + 12. authenticated without the read permission (incl. roles holding audit.view), org context enforced
test("2/12: authenticated users without bos.governance.read get 403 — including audit.view holders", async () => {
  for (const role of ["org_admin", "partner_org_admin", "reviewer_verifier", "auditor", "shf_admin", "read_only_viewer", "student"]) {
    assert.ok(!getPermissionsForRole(role).includes("bos.governance.read"), role);
    await withApp(userFor(role), async (base) => {
      const res = await fetch(`${base}/agent-fabric/command/agents/health`);
      assert.equal(res.status, 403, role);
    });
  }
  assert.ok(getPermissionsForRole("auditor").includes("audit.view"), "audit.view alone is not enough");
  assert.equal(received.length, 0);
});

test("12: missing or invalid organization context is 403 before any Fabric call", async () => {
  const noOrg = { ...userFor("shs_admin"), active_organization_id: null, tenant_id: null };
  await withApp(noOrg, async (base) => {
    const res = await fetch(`${base}/agent-fabric/command/gate/status`);
    assert.equal(res.status, 403);
    assert.equal((await res.json()).error.code, "ORG_CONTEXT_REQUIRED");
  });
  await withApp({ org_context_error: "ORG_CONTEXT_FORBIDDEN", permissions: [], roles: [] }, async (base) => {
    assert.equal((await fetch(`${base}/agent-fabric/command/gate/status`)).status, 403);
  });
  assert.equal(received.length, 0);
});

// 3. authorized
test("3: shs_admin and super_admin read all four sources through a verified HMAC call", async () => {
  for (const role of ["shs_admin", "super_admin"]) {
    received = [];
    await withApp(userFor(role, "shs-core", role === "super_admin" ? "platform" : "organization"), async (base) => {
      for (const s of SOURCES) {
        const res = await fetch(`${base}/agent-fabric/command/${s}`);
        assert.equal(res.status, 200, `${role} ${s}`);
        assert.equal(res.headers.get("cache-control"), "no-store");
        const body = await res.json();
        assert.equal(body.contract, "afcc.read.v1");
        assert.equal(body.access, "shs_bridge");
        assert.equal(body.read_only, true);
      }
    });
    assert.equal(received.length, SOURCES.length);
    assert.ok(received.every((r) => r.verified && r.method === "GET" && ALLOWED_FABRIC_PATHS.has(r.path)));
  }
});

// 4 + 5. no admin key, no HMAC secret anywhere the browser can see; Fabric never gets an admin key
test("4/5: browser never receives the admin key or HMAC secret; Fabric never receives X-Admin-Key", async () => {
  mode = "leaky";
  await withApp(userFor("shs_admin"), async (base) => {
    for (const s of SOURCES) {
      const res = await fetch(`${base}/agent-fabric/command/${s}`);
      const text = await res.text();
      const headers = JSON.stringify([...res.headers.entries()]);
      for (const secret of [ADMIN_KEY, SECRET, KID, "x-shf-service", "X-Admin-Key"]) {
        assert.ok(!text.includes(secret), `${s} body leaks ${secret}`);
        assert.ok(!headers.toLowerCase().includes(secret.toLowerCase()), `${s} headers leak ${secret}`);
      }
    }
  });
  assert.ok(received.length === SOURCES.length && received.every((r) => r.headers["x-admin-key"] === undefined));
});

// 6. read only
test("6: POST/PUT/PATCH/DELETE on the bridge are 405 and never reach Fabric", async () => {
  await withApp(userFor("shs_admin"), async (base) => {
    for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
      for (const s of [...SOURCES, "runs/execute", "agents/a1/enabled"]) {
        const res = await fetch(`${base}/agent-fabric/command/${s}`, { method, headers: { "content-type": "application/json" }, body: method === "DELETE" ? undefined : "{}" });
        assert.equal(res.status, 405, `${method} ${s}`);
        assert.equal(res.headers.get("allow"), "GET");
      }
    }
  });
  assert.equal(received.length, 0);
});

// 7-10. the read permission cannot reach any mutation: request input never shapes the Fabric call
test("7-10: read permission cannot execute runs, mutate agents/layers, or quarantine", async () => {
  await withApp(userFor("shs_admin"), async (base) => {
    const attempts = [
      "/agent-fabric/command/runs/recent?path=/runs/execute",
      "/agent-fabric/command/gate/status?layer=L08&enabled=false",
      "/agent-fabric/command/agents/health?../../admin/agents/a1/enabled",
      "/agent-fabric/command/runs/execute",
      "/agent-fabric/command/agents/a1/enabled",
      "/agent-fabric/command/layers/L08/enabled",
      "/agent-fabric/command/watchtower/quarantine/p1",
    ];
    for (const a of attempts) await fetch(`${base}${a}`, { headers: { "X-Fabric-Path": "/runs/execute", "X-Admin-Key": "attacker" } });
  });
  assert.ok(received.every((r) => r.method === "GET" && ALLOWED_FABRIC_PATHS.has(r.path)), JSON.stringify(received.map((r) => r.path)));
  assert.ok(received.every((r) => r.headers["x-admin-key"] === undefined && r.headers["x-fabric-path"] === undefined));
  // The permission is referenced only by this bridge.
  const src = path.resolve(import.meta.dirname, "../src");
  const users = fs.readdirSync(src, { recursive: true }).filter((f) => String(f).endsWith(".ts") && !String(f).includes(".bak"))
    .filter((f) => fs.readFileSync(path.join(src, String(f)), "utf8").includes("AGENT_FABRIC_COMMAND_READ"));
  assert.deepEqual(users.map(String).sort(), ["auth/security-permissions.ts", "domain/agent-fabric-command/api/routes.ts"]);
});

// 11. sanitization + error model
test("11: raw Fabric errors are sanitized and each failing layer is named", async () => {
  const cases: Array<[typeof mode, number, string, string]> = [
    ["500_traceback", 502, "FABRIC_ERROR", "fabric"],
    ["backend_error", 502, "FABRIC_ERROR", "fabric"],
    ["401", 502, "BRIDGE_REJECTED", "shs_to_fabric"],
    ["malformed", 502, "INVALID_RESPONSE", "fabric"],
  ];
  await withApp(userFor("shs_admin"), async (base) => {
    for (const [m, status, code, layer] of cases) {
      mode = m;
      const res = await fetch(`${base}/agent-fabric/command/gate/status`);
      const text = await res.text();
      assert.equal(res.status, status, m);
      const body = JSON.parse(text);
      assert.equal(body.error.code, code, m);
      assert.equal(body.error.layer, layer, m);
      for (const leak of ["Traceback", "/srv/", "KeyError", ADMIN_KEY]) assert.ok(!text.includes(leak), `${m} leaks ${leak}`);
    }
    mode = "backend_error";
    assert.equal((await (await fetch(`${base}/agent-fabric/command/gate/status`)).json()).error.reason_code, "PROJECTION_READ_FAILED");
  });
});

test("11: successful payloads are minimized; paths and exception text never pass through", async () => {
  mode = "leaky";
  await withApp(userFor("shs_admin"), async (base) => {
    const runs = await (await fetch(`${base}/agent-fabric/command/runs/recent`)).json();
    assert.equal(runs.events[0].message, "[redacted]");
    assert.deepEqual(runs.events[0].artifacts, [{ artifactId: "draft_1", sha256: SHA }]);
    assert.equal(runs.events[0].snapshotSha256, SHA, "evidence hashes survive");
    const health = await (await fetch(`${base}/agent-fabric/command/agents/health`)).json();
    assert.equal(health.agents[0].name, "[redacted]");
    assert.ok(!("policy" in health.agents[0]));
    assert.deepEqual(Object.keys(health.summary).sort(), ["approval_required", "ready", "total", "warning"]);
    const gate = await (await fetch(`${base}/agent-fabric/command/gate/status`)).json();
    assert.equal(gate.gate_blockers[0].reason, "[redacted]");
  });
});

test("error model: not configured, unreachable and timeout are distinct SHS-side failures", async () => {
  delete process.env.SHF_INTERNAL_SERVICE_KEYS_JSON;
  let r: any = await readFabricSource("gate/status");
  assert.deepEqual([r.status, r.body.error.code, r.body.error.layer, r.body.error.reason_code], [503, "BRIDGE_NOT_CONFIGURED", "shs", "INTERNAL_SERVICE_CREDENTIALS_MISSING"]);
  assert.ok(!JSON.stringify(r.body).includes(SECRET));
  process.env.SHF_INTERNAL_SERVICE_KEYS_JSON = JSON.stringify({ [KID]: SECRET });
  r = await readFabricSource("gate/status", { config: null });
  assert.equal(r.body.error.code, "BRIDGE_NOT_CONFIGURED");
  r = await readFabricSource("gate/status", { config: { fabricBaseUrl: "http://127.0.0.1:1", timeoutMs: 2000 } });
  assert.deepEqual([r.status, r.body.error.code, r.body.error.layer, r.body.error.reason_code], [502, "BACKEND_UNAVAILABLE", "shs_to_fabric", "FABRIC_UNREACHABLE"]);
  mode = "hang";
  r = await readFabricSource("gate/status", { config: { fabricBaseUrl: fabricUrl, timeoutMs: 150 } });
  assert.deepEqual([r.status, r.body.error.code, r.body.error.reason_code], [504, "BACKEND_UNAVAILABLE", "FABRIC_TIMEOUT"]);
});

test("the SHS bridge never reads or sends the Fabric admin key", () => {
  const dir = path.resolve(import.meta.dirname, "../src/domain/agent-fabric-command");
  const code = fs.readdirSync(dir, { recursive: true }).filter((f) => String(f).endsWith(".ts")).map((f) => fs.readFileSync(path.join(dir, String(f)), "utf8")).join("\n");
  assert.ok(!/ADMIN_API_KEY|x-admin-key/i.test(code.replace(/\/\/.*$/gm, "")));
});


// ------------------------------------------------------------------ AFCC-2A.3
test("2A.3: Watchtower, Infrastructure and Observability are bridged as last-known reads", async () => {
  assert.deepEqual(SOURCES.slice(-3), ["watchtower", "infrastructure", "observability"]);
  await withApp(userFor("shs_admin"), async (base) => {
    const wt = await (await fetch(`${base}/agent-fabric/command/watchtower`)).json();
    assert.equal(wt.state, "AVAILABLE");
    assert.equal(wt.latest_evaluation.worst_risk_band, "RED");
    assert.deepEqual(wt.latest_evaluation.staleness, { age_seconds: 16524, oldest_age_seconds: 16524, threshold_seconds: null, threshold: "NOT_DEFINED" }, "staleness stays visible");
    assert.ok(!("source" in wt), "implementation metadata is dropped");
    const infra = await (await fetch(`${base}/agent-fabric/command/infrastructure`)).json();
    assert.equal(infra.status, "DEGRADED");
    assert.deepEqual(infra.degraded, ["watchtower_attestation"]);
    assert.ok(!JSON.stringify(infra).includes("stdout") && !JSON.stringify(infra).includes("/Users/"));
    mode = "unverified";
    const obs = await (await fetch(`${base}/agent-fabric/command/observability`)).json();
    assert.deepEqual([obs.state, obs.reason_code], ["NOT_YET_VERIFIED", "NO_VERIFICATION_RECORDED"]);
    const notEval = await (await fetch(`${base}/agent-fabric/command/watchtower`)).json();
    assert.deepEqual([notEval.state, notEval.latest_evaluation], ["NOT_YET_EVALUATED", null]);
  });
  // Only the fixed read paths were ever requested, with GET: no verify action, no quarantine route.
  assert.ok(received.every((r) => r.method === "GET" && ALLOWED_FABRIC_PATHS.has(r.path)));
  assert.ok(!received.some((r) => /verify|quarantine|attest|summary/.test(r.path)));
});

test("2A.3: unknown projection states are rejected; nested leaks are redacted", async () => {
  await withApp(userFor("shs_admin"), async (base) => {
    mode = "bad_state";
    for (const s of ["watchtower", "infrastructure", "observability"]) {
      const res = await fetch(`${base}/agent-fabric/command/${s}`);
      assert.equal(res.status, 502);
      assert.equal((await res.json()).error.code, "INVALID_RESPONSE", s);
    }
    mode = "leaky";
    const wt = await (await fetch(`${base}/agent-fabric/command/watchtower`)).text();
    const infra = await (await fetch(`${base}/agent-fabric/command/infrastructure`)).text();
    for (const leak of ["Traceback", "/srv/", "/Users/"]) {
      assert.ok(!wt.includes(leak) && !infra.includes(leak), leak);
    }
    assert.equal(JSON.parse(infra).checks[1].reason_code, "UNSPECIFIED", "non-code reason becomes a neutral code");
  });
});

test("2A.3: the read permission reaches no privileged verify or Watchtower action through SHS", async () => {
  await withApp(userFor("shs_admin"), async (base) => {
    for (const path of ["infrastructure/verify", "observability/verify", "watchtower/summary", "watchtower/quarantine/p1", "watchtower/attest/verify"]) {
      const get = await fetch(`${base}/agent-fabric/command/${path}`);
      assert.equal(get.status, 404, path);
      const post = await fetch(`${base}/agent-fabric/command/${path}`, { method: "POST" });
      assert.equal(post.status, 405, path);
    }
  });
  assert.equal(received.length, 0);
});

test("2A.3: canonical dev startup loads the local .env; production start does not", () => {
  const pkg = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, "../package.json"), "utf8"));
  assert.equal(pkg.scripts.dev, "tsx watch --env-file-if-exists=.env src/server.ts");
  assert.equal(pkg.scripts.start, "node dist/server.js", "production start unchanged: env comes from the platform, never a file");
  assert.doesNotMatch(JSON.stringify(pkg.scripts), /SHF_INTERNAL_SERVICE_KEYS|ADMIN_API_KEY|SECRET|KEY=/, "no secret material in scripts");
});

// ------------------------------------------------------------ AFCC-3 Phase 2

test("AFCC-3 P2: action words are rejected as run ids before any Fabric call", async () => {
  await withApp(userFor("shs_admin"), async (base) => {
    for (const word of ["execute", "cancel", "revoke", "retry", "timeout", "EXECUTE"]) {
      for (const suffix of ["", "/timeline"]) {
        const res = await fetch(`${base}/agent-fabric/command/runs/${word}${suffix}`);
        assert.equal(res.status, 400, word + suffix);
        assert.equal((await res.json()).error.code, "INVALID_RUN_ID");
      }
    }
  });
  assert.equal(received.length, 0, "nothing reached Fabric");
});

test("AFCC-3 P2: lifecycle, execution, lineage and domain-ref blocks are minimized to the contract", async () => {
  mode = "leaky";
  await withApp(userFor("shs_admin"), async (base) => {
    const detailRes = await fetch(`${base}/agent-fabric/command/runs/a1b2c3`);
    const text = await detailRes.clone().text();
    const { run } = await detailRes.json();
    assert.deepEqual(run.state_derivation, { state: "COMPLETED", reason_code: "RUN_EVENT_TERMINAL", conflict: false });
    assert.deepEqual(run.execution, { provider: "NOT_APPLICABLE", model: "NOT_APPLICABLE", adapter: "save_draft_artifact", agent_version: "NOT_CAPTURED", adapters: ["save_draft_artifact"], model_invoked: false });
    assert.equal(run.initiator.initiator_type, "HUMAN");
    assert.equal(run.initiator.entry_point, "fabric.runs.execute");
    assert.ok(!("admin_key" in run.initiator));
    assert.deepEqual(run.correlation, { id: "corr_1234abcd", source: "PLAN", continuity: "CONSISTENT" });
    assert.equal(run.retry_count, "NOT_CAPTURED");
    assert.equal(run.retry_lineage.retrying_state, "DEFERRED");
    assert.equal(run.retry_lineage.retry_supported, false);
    assert.deepEqual(run.domain_refs.truth_spine, { authority: "Truth Spine", state: "PUBLISHED", link_basis: "RUN_EVENT_RECORDED", refs: ["truth:claim_1"] });
    assert.equal(run.domain_refs.reporting.state, "NOT_PUBLISHED");
    assert.equal(run.approval.basis, "PLAN_APPROVAL_VERIFIED");
    assert.equal(run.failure_summary, "[redacted]");
    assert.equal(run.source.malformed_event_count, 2);
    for (const leak of [ADMIN_KEY, "sk-live", "/srv/", "/Users/", "raw_record", "internal_path", "Traceback"]) assert.ok(!text.includes(leak), leak);

    const timeline = await (await fetch(`${base}/agent-fabric/command/runs/a1b2c3/timeline`)).json();
    assert.equal(timeline.events[0].provenance, "RECORDED");
    assert.equal(timeline.events[0].source, "agent_fabric.run_events");
    assert.ok(!("raw" in timeline.events[0]));

    const evidence = await (await fetch(`${base}/agent-fabric/command/runs/a1b2c3/evidence`)).json();
    assert.deepEqual(evidence.evidence.artifact_refs, [{ artifact_id: "draft_1", sha256: SHA }]);
    assert.deepEqual(evidence.evidence.domain_refs.truth_spine.refs, ["truth:claim_1"]);

    const deps = await (await fetch(`${base}/agent-fabric/command/runs/a1b2c3/dependencies`)).json();
    assert.equal(deps.retry_lineage.root_run_id, "NOT_CAPTURED");

    const list = await (await fetch(`${base}/agent-fabric/command/runs`)).json();
    assert.deepEqual(list.lifecycle.deferred_states, ["QUEUED", "EXECUTING"]);
    assert.equal(list.runs[0].execution.model_invoked, false);
  });
  assert.ok(received.every((r) => r.method === "GET" && r.verified));
});

test("AFCC-3 P3: verification status, approver and declared identity pass; credentials never do", async () => {
  await withApp(userFor("shs_admin"), async (base) => {
    const res = await fetch(`${base}/agent-fabric/command/runs/a1b2c3`);
    const text = await res.clone().text();
    const { run } = await res.json();
    assert.equal(run.initiator.actor_verification, "VERIFIED");
    assert.equal(run.initiator.organization_verification, "VERIFIED");
    assert.deepEqual(run.initiator.authority, { authentication: "FABRIC_SESSION", role: "shs_admin", permission: "fabric.run.execute", scope: "PLATFORM_GLOBAL" });
    assert.deepEqual(run.initiator.declared_identity, { actor_id: "ceo", organization_id: "org_victim", tenant_id: null, source_system: null, verification: "DECLARED" });
    assert.equal(run.approval.decision.approver_actor_id, "u-approver");
    assert.equal(run.approval.decision.actor_verification, "VERIFIED");
    assert.equal(run.approval.decision.authority.permission, "fabric.plan.approve");
    for (const leak of ["tok-should-not-pass", "csrf-should-not-pass", "ceo@victim.example", ADMIN_KEY]) assert.ok(!text.includes(leak), leak);
  });
});
