// AFCC-3 Phase 7 — Live Operations browser acceptance (read-only).
// The SHS bridge (/api/agent-fabric/command/*) is mocked with afcc.read.v1
// envelopes shaped like the real minimized projections. Requires a running Vite
// dev server (SHS_TEST_FRONTEND_URL, default http://127.0.0.1:5173).
// Screenshots: AFCC_LIVE_SCREENSHOTS=1 writes docs/agent-fabric-command-center/live-operations/.
// Run: npx playwright test tests/afcc-live-operations-browser.spec.mjs
import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const frontend = process.env.SHS_TEST_FRONTEND_URL || "http://127.0.0.1:5173";
const LIVE = `${frontend}/admin.html#/agent-fabric/command/operations`;
const SHOTS = path.resolve("docs/agent-fabric-command-center/live-operations");
const DECOY_KEY = "decoy-browser-admin-key-must-never-be-sent";
const SHA_A = "3f7a9c2e5b8d1f4a6c0e9b2d5f8a1c4e7b0d3f6a9c2e5b8d1f4a6c0e9b2d5f8a";
const SHA_L = "9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d";
const SHA_X = "0a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f9";

const identity = {
  ok: true, authenticated: true, session_status: "active",
  user: { id: "admin-afcc", user_id: "admin-afcc", email: "admin@test.invalid", full_name: "AFCC Admin" },
  role: "shs_admin", permissions: ["audit.view"], memberships: [], authorized_organizations: [],
};

const envelope = (kind, body) => ({ contract: "afcc.read.v1", kind, read_only: true, state: "AVAILABLE", access: "shs_bridge", generated_at: "2026-09-27T12:00:00Z", ...body });
const SOURCE = { authority: "Agent Fabric shared run authority", stores: ["postgres:fabric_run_events"], projection: "live_operations", read_only: true, record_type: "run_event", record_origin: "POSTGRES_RUN_AUTHORITY", run_authority: "postgres" };
const verified = (who) => ({ actor_id: who, actor_type: "HUMAN", initiator_type: "HUMAN", actor_verification: "VERIFIED", organization_id: "NOT_APPLICABLE", organization_verification: "VERIFIED", tenant_id: "NOT_APPLICABLE", tenant_verification: "VERIFIED", source_system: "agent_fabric.session", source_system_verification: "VERIFIED", entry_point: "fabric.runs.execute", execution_system: "agent_fabric", authority: { authentication: "FABRIC_SESSION", role: "shs_admin", permission: "fabric.run.execute", scope: "PLATFORM_GLOBAL" }, declared_identity: "NOT_CAPTURED" });
const decision = { decision: "APPROVED", approver_actor_id: "demo_shs_approver", approver_type: "HUMAN", actor_verification: "VERIFIED", decided_at: "2026-09-27T10:02:00+00:00", reason: "Reviewed scope", correlation_id: "corr-pilot-0001", provenance: "RECORDED" };
const noRetry = { retry_supported: false, retrying_state: "DEFERRED", retry_count: "NOT_CAPTURED", parent_run_id: "NOT_CAPTURED", root_run_id: "NOT_CAPTURED", retry_of_run_id: "NOT_CAPTURED", same_plan_run_ids: [] };

function run(overrides) {
  return {
    run_id: "NOT_AVAILABLE", work_order_id: "NOT_CAPTURED", tenant_id: "NOT_APPLICABLE", organization_id: "NOT_APPLICABLE",
    current_state: "COMPLETED", created_at: "2026-09-27T10:05:00+00:00", started_at: "2026-09-27T10:05:00+00:00", last_transition_at: "2026-09-27T10:05:01+00:00",
    completed_at: "NOT_AVAILABLE", failed_at: "NOT_AVAILABLE", timed_out_at: "NOT_AVAILABLE", result: "ok", failure_code: "NOT_AVAILABLE", failure_summary: "NOT_AVAILABLE",
    provider: "NOT_APPLICABLE", model: "NOT_APPLICABLE", adapter: "save_draft_artifact", parent_run_id: "NOT_CAPTURED", correlation_id: "NOT_CAPTURED", retry_count: "NOT_CAPTURED",
    initiator: verified("demo_shs_admin"), state_derivation: { state: "COMPLETED", reason_code: "RUN_EVENT_TERMINAL", conflict: false },
    execution: { provider: "NOT_APPLICABLE", model: "NOT_APPLICABLE", adapter: "save_draft_artifact", agent_version: "NOT_CAPTURED", adapters: ["save_draft_artifact"], model_invoked: false },
    correlation: { id: "NOT_CAPTURED", source: "NOT_CAPTURED", continuity: "NOT_CAPTURED" }, retry_lineage: noRetry,
    agent: { agent_id: "L23-ORCH-001", name: "Layer23OrchestratorAgent", layer: "L23", version: "NOT_CAPTURED" },
    operation: { type: "execute", plan_id: "NOT_CAPTURED" },
    approval: { state: "APPROVED", required: true, authority: "plan_store", plan_status: "DONE", basis: "PLAN_APPROVAL_VERIFIED", decision },
    policy: { policy_ref: "plan.policy", gate_decision_refs: [] }, evidence_refs: [], artifact_refs: [], proof_refs: [], report_refs: [], policy_decision_refs: [],
    watchtower_refs: [], truth_refs: [], loo_refs: [], dependency_run_ids: [], evidence: { status: "NONE", artifact_count: 0, durable_count: 0, verified: false, storage: "FABRIC_RUN_ARTIFACTS" },
    event_count: 2, source: SOURCE, freshness: { last_updated: "2026-09-27T10:05:01+00:00", captured_at: "2026-09-27T10:05:01+00:00", threshold: "NOT_DEFINED" },
    execution_lease: { status: "CLOSED_BY_TERMINAL", lease_expires_at: "2026-09-27T10:10:00+00:00", heartbeat: "NOT_SUPPORTED", scope: "SHARED_TRANSACTIONAL_STORE", evaluated_at: "2026-09-27T12:00:00Z", lease_seconds: 300, orphan_recorded: false },
    ...overrides,
  };
}

const ART = (id, sha, extra) => ({ artifact_id: id, sha256: sha, canonical_ref: `fabric-artifact:${id}`, type: "draft_artifact", created_at: "2026-09-27T10:05:01+00:00", completeness: "COMPLETE", size: 13826, ...extra });

const RUNS = {
  done: run({ run_id: "a1b2c3d4e5f6", completed_at: "2026-09-27T10:05:01+00:00", correlation_id: "corr-pilot-0001",
    correlation: { id: "corr-pilot-0001", source: "PLAN", continuity: "CONSISTENT" }, operation: { type: "execute", plan_id: "7c1e9a2b44d0f618" },
    evidence: { status: "DURABLE", artifact_count: 1, durable_count: 1, verified: false, storage: "FABRIC_RUN_ARTIFACTS" },
    artifact_refs: [ART("draft_20260927T100501Z_9c2e5b", SHA_A, { storage_state: "STORED", verification_state: "HASH_RECORDED", durable: true })] }),
  pending: run({ run_id: "NOT_AVAILABLE", current_state: "APPROVAL_REQUIRED", started_at: "NOT_AVAILABLE", last_transition_at: "2026-09-27T11:40:00+00:00", result: "NOT_AVAILABLE",
    initiator: { ...verified("NOT_CAPTURED"), actor_verification: "NOT_CAPTURED", entry_point: "fabric.plan.create" }, operation: { type: "plan", plan_id: "plan77880042aa" },
    state_derivation: { state: "APPROVAL_REQUIRED", reason_code: "PLAN_APPROVAL_PENDING", conflict: false },
    approval: { state: "PENDING", required: true, authority: "plan_store", plan_status: "PLANNED", basis: "NOT_CAPTURED", decision: "NOT_CAPTURED" },
    correlation: { id: "corr-grants-0042", source: "PLAN", continuity: "CONSISTENT" }, agent: { agent_id: "L14-GRANTS-001", name: "Layer14GrantsDrafter", layer: "L14", version: "NOT_CAPTURED" },
    execution_lease: { status: "NOT_AVAILABLE" } }),
  failed: run({ run_id: "f00dfeed0001", current_state: "FAILED", last_transition_at: "2026-09-27T11:10:02+00:00", failed_at: "2026-09-27T11:10:02+00:00", result: "error",
    failure_code: "EVIDENCE_STORAGE_FAILED", failure_summary: "execution failed", state_derivation: { state: "FAILED", reason_code: "RUN_EVENT_TERMINAL", conflict: false },
    correlation: { id: "corr-intake-0907", source: "PLAN", continuity: "CONSISTENT" }, operation: { type: "execute", plan_id: "5a5a5a5a5a5a5a5a" },
    evidence: { status: "STORAGE_FAILED", artifact_count: 1, durable_count: 0, verified: false, storage: "FABRIC_RUN_ARTIFACTS" },
    artifact_refs: [ART("draft_20260927T111002Z_77aa11", SHA_X, { storage_state: "STORAGE_FAILED", verification_state: "NOT_APPLICABLE", durable: false, size: "NOT_CAPTURED", type: "NOT_CAPTURED", created_at: "NOT_CAPTURED" })] }),
  executing: run({ run_id: "e1e2e3e4e5e6", current_state: "EXECUTING", last_transition_at: "2026-09-27T11:55:00+00:00", result: "started",
    state_derivation: { state: "EXECUTING", reason_code: "RUN_EXECUTION_STARTED", conflict: false }, operation: { type: "execute", plan_id: "9e9e9e9e9e9e9e9e" },
    correlation: { id: "corr-weekly-0311", source: "REQUEST_HEADER", continuity: "CONSISTENT" }, execution_lease: { status: "ACTIVE", lease_expires_at: "2026-09-27T12:00:00+00:00", heartbeat: "NOT_SUPPORTED", scope: "SHARED_TRANSACTIONAL_STORE", lease_seconds: 300, orphan_recorded: false } }),
  legacy: run({ run_id: "6b1673ee2869", last_transition_at: "2026-01-09T03:56:55+00:00", created_at: "2026-01-09T03:56:55+00:00", started_at: "NOT_CAPTURED", completed_at: "2026-01-09T03:56:55+00:00",
    initiator: { actor_id: "NOT_CAPTURED", actor_type: "NOT_CAPTURED", initiator_type: "NOT_CAPTURED", actor_verification: "NOT_CAPTURED", organization_id: "NOT_CAPTURED", organization_verification: "NOT_CAPTURED", tenant_id: "NOT_CAPTURED", tenant_verification: "NOT_CAPTURED", source_system: "NOT_CAPTURED", source_system_verification: "NOT_CAPTURED", entry_point: "NOT_CAPTURED", execution_system: "agent_fabric" },
    organization_id: "NOT_CAPTURED", tenant_id: "NOT_CAPTURED", provider: "NOT_CAPTURED", model: "NOT_CAPTURED", adapter: "NOT_CAPTURED",
    approval: { state: "APPROVED", required: true, authority: "plan_store", plan_status: "DONE", basis: "NOT_CAPTURED", decision: "NOT_CAPTURED" },
    correlation: { id: "9cf3471234c7", source: "LEGACY_REQUEST_ID", continuity: "NOT_CAPTURED" }, operation: { type: "execute", plan_id: "082a6e6fc486810b" },
    evidence: { status: "NOT_DURABLE", artifact_count: 1, durable_count: 0, verified: false, storage: "REPLICA_LOCAL_FILE" },
    artifact_refs: [ART("draft_20260109T035655Z_legacy", SHA_L, { storage_state: "LEGACY_REPLICA_LOCAL", verification_state: "NOT_VERIFIABLE", durable: false, size: "NOT_CAPTURED", type: "NOT_CAPTURED", created_at: "NOT_CAPTURED", canonical_ref: "NOT_CAPTURED", completeness: "NOT_CAPTURED" })],
    source: { ...SOURCE, record_origin: "LEGACY_FILE_STORE" }, execution_lease: { status: "NOT_CAPTURED" } }),
  tampered: run({ run_id: "badc0ffee001", last_transition_at: "2026-09-27T09:00:00+00:00", completed_at: "2026-09-27T09:00:00+00:00",
    correlation: { id: "corr-audit-0666", source: "PLAN", continuity: "CONSISTENT" }, operation: { type: "execute", plan_id: "4d4d4d4d4d4d4d4d" },
    evidence: { status: "INTEGRITY_FAILED", artifact_count: 1, durable_count: 1, verified: false, storage: "FABRIC_RUN_ARTIFACTS" },
    artifact_refs: [ART("draft_20260927T090000Z_bad001", SHA_X, { storage_state: "STORED", verification_state: "HASH_MISMATCH", durable: true })] }),
};

const LIST = envelope("runs_live", {
  count: 6, source: SOURCE, freshness: { last_updated: "2026-09-27T11:55:00+00:00", captured_at: "2026-09-27T12:00:00Z", threshold: "NOT_DEFINED" },
  lifecycle: { supported_states: ["APPROVAL_DENIED", "APPROVAL_REQUIRED", "APPROVED", "COMPLETED", "EXECUTING", "FAILED", "ORPHANED", "TIMED_OUT"], deferred_states: ["REQUESTED", "QUEUED", "WAITING", "RETRYING", "CANCEL_REQUESTED", "CANCELLED", "REVOKED"] },
  execution_safety: { level: "DISTRIBUTED", local_single_flight: "ACTIVE", distributed_single_flight: "GUARANTEED", scope: "SHARED_TRANSACTIONAL_STORE", production_blocker: "NONE", artifact_storage: "SHARED_POSTGRES_RUN_ARTIFACTS", summary: "DISTRIBUTED SINGLE-FLIGHT ACTIVE (SHARED TRANSACTIONAL RUN AUTHORITY); RUN ARTIFACTS DURABLE IN THE SAME STORE" },
  runs: [RUNS.legacy, RUNS.done, RUNS.pending, RUNS.executing, RUNS.tampered, RUNS.failed],
});

const TIMELINE = {
  a1b2c3d4e5f6: [
    { event_id: "plan:7c1e9a2b44d0f618:created", event_type: "plan.created", from_state: "NOT_APPLICABLE", to_state: "APPROVAL_REQUIRED", occurred_at: "2026-09-27T10:00:00+00:00", actor_ref: "demo_shs_admin", authority_ref: "agent_fabric.plan_store", reason_code: "PLAN_CREATED", reason_summary: "NOT_CAPTURED", evidence_refs: [], policy_refs: [], correlation_id: "corr-pilot-0001", source: "agent_fabric.plan_store", provenance: "DERIVED" },
    { event_id: "plan:7c1e9a2b44d0f618:decision:0", event_type: "plan.approved", from_state: "APPROVAL_REQUIRED", to_state: "APPROVED", occurred_at: "2026-09-27T10:02:00+00:00", actor_ref: "demo_shs_approver", authority_ref: "agent_fabric.plan_store", reason_code: "PLAN_APPROVED", reason_summary: "Reviewed scope", evidence_refs: [], policy_refs: [], correlation_id: "corr-pilot-0001", source: "agent_fabric.plan_store", provenance: "RECORDED" },
    { event_id: "run_evt_1", event_type: "run.execution_started", from_state: "APPROVED", to_state: "EXECUTING", occurred_at: "2026-09-27T10:05:00+00:00", actor_ref: "demo_shs_approver", authority_ref: "agent_fabric.run_events", reason_code: "NOT_CAPTURED", reason_summary: "NOT_CAPTURED", evidence_refs: [], policy_refs: [], correlation_id: "corr-pilot-0001", source: "agent_fabric.run_events", provenance: "RECORDED" },
    { event_id: "run_evt_2", event_type: "run.completed", from_state: "EXECUTING", to_state: "COMPLETED", occurred_at: "2026-09-27T10:05:01+00:00", actor_ref: "demo_shs_approver", authority_ref: "agent_fabric.run_events", reason_code: "NOT_CAPTURED", reason_summary: "plan executed", evidence_refs: ["fabric-artifact:draft_20260927T100501Z_9c2e5b"], policy_refs: [], correlation_id: "corr-pilot-0001", source: "agent_fabric.run_events", provenance: "RECORDED" },
  ],
  "6b1673ee2869": [
    { event_id: "run:6b1673ee2869:0", event_type: "run.execute", from_state: "NOT_CAPTURED", to_state: "COMPLETED", occurred_at: "2026-01-09T03:56:55+00:00", actor_ref: "NOT_CAPTURED", authority_ref: "agent_fabric.run_events", reason_code: "NOT_CAPTURED", reason_summary: "plan executed", evidence_refs: [], policy_refs: [], correlation_id: "9cf3471234c7", source: "agent_fabric.run_events", provenance: "LEGACY_DERIVED" },
  ],
};

const ARTIFACT_BODY = {
  type: "draft_artifact", title: "Plan Draft · Layer23OrchestratorAgent",
  meta: { agent: "Layer23OrchestratorAgent", layer: "L23" },
  body: { pilotPlan: { overview: { task: "After-school pilot, Franklin County", deliverable: "Draft-only pilot plan" }, steps: [{ step: 1, title: "Pick pilot sites + partners" }, { step: 2, title: "Define program model + schedule" }] }, constraints: ["draft only"] },
  provenance: { run_id: "a1b2c3d4e5f6", plan_id: "7c1e9a2b44d0f618", correlation_id: "corr-pilot-0001" },
};

function bridgeFixtures() {
  const out = { "/agent-fabric/command/runs": LIST };
  for (const r of Object.values(RUNS)) {
    if (r.run_id === "NOT_AVAILABLE") continue;
    const id = r.run_id;
    const detailRefs = r.artifact_refs.map((a) => (a.verification_state === "HASH_RECORDED" ? { ...a, verification_state: "VERIFIED" } : a));
    const detailEvidence = r.evidence.status === "DURABLE" ? { ...r.evidence, verified: true } : r.evidence;
    out[`/agent-fabric/command/runs/${id}`] = envelope("run_detail", { source: SOURCE, run: { ...r, artifact_refs: detailRefs, evidence: detailEvidence } });
    out[`/agent-fabric/command/runs/${id}/timeline`] = envelope("run_timeline", { source: SOURCE, run_id: id, events: TIMELINE[id] || [
      { event_id: `${id}-s`, event_type: "run.execution_started", from_state: "APPROVED", to_state: "EXECUTING", occurred_at: r.started_at, actor_ref: "demo_shs_admin", authority_ref: "agent_fabric.run_events", reason_code: "NOT_CAPTURED", reason_summary: "NOT_CAPTURED", evidence_refs: [], policy_refs: [], correlation_id: r.correlation.id, source: "agent_fabric.run_events", provenance: "RECORDED" },
    ] });
    out[`/agent-fabric/command/runs/${id}/evidence`] = envelope("run_evidence", { source: SOURCE, run_id: id, evidence: { evidence_refs: [], artifact_refs: detailRefs, evidence_status: detailEvidence, proof_refs: [], report_refs: [], truth_refs: [], watchtower_refs: [], loo_refs: [], counts: { evidence: 0, artifacts: detailRefs.length, proofs: 0, reports: 0 } } });
    out[`/agent-fabric/command/runs/${id}/dependencies`] = envelope("run_dependencies", { source: SOURCE, run_id: id, dependency_run_ids: [], parent_run_id: "NOT_CAPTURED", retry_lineage: id === "e1e2e3e4e5e6" ? { ...noRetry, same_plan_run_ids: ["f00dfeed0001"] } : noRetry, correlation_id: r.correlation.id });
  }
  out["/agent-fabric/command/runs/a1b2c3d4e5f6/artifacts/draft_20260927T100501Z_9c2e5b"] = envelope("run_artifact", { source: SOURCE, run_id: "a1b2c3d4e5f6", artifact_id: "draft_20260927T100501Z_9c2e5b", artifact: { ...RUNS.done.artifact_refs[0], verification_state: "VERIFIED" }, trust: "VERIFIED", body: ARTIFACT_BODY, body_available: true });
  out["/agent-fabric/command/runs/6b1673ee2869/artifacts/draft_20260109T035655Z_legacy"] = envelope("run_artifact", { source: SOURCE, run_id: "6b1673ee2869", artifact_id: "draft_20260109T035655Z_legacy", artifact: RUNS.legacy.artifact_refs[0], trust: "NOT_TRUSTED_REPLICA_LOCAL", body: { type: "draft_artifact", title: "Legacy draft", body: { echo: { x: 1 } } }, body_available: true });
  out["/agent-fabric/command/runs/badc0ffee001/artifacts/draft_20260927T090000Z_bad001"] = envelope("run_artifact", { source: SOURCE, run_id: "badc0ffee001", artifact_id: "draft_20260927T090000Z_bad001", artifact: RUNS.tampered.artifact_refs[0], trust: "INTEGRITY_FAILED", body: null, body_available: false });
  return out;
}

async function openLive(page, { overrides = {}, width = 1440, height = 900, hash = "" } = {}) {
  const net = { requests: [], secretHeaders: [], errors: [], bodies: [] };
  await page.addInitScript((decoy) => { localStorage.setItem("ADMIN_API_KEY", decoy); localStorage.setItem("shf_admin_key", decoy); }, DECOY_KEY);
  page.on("request", (r) => {
    net.requests.push({ method: r.method(), url: r.url() });
    const h = r.headers();
    // Admin key / HMAC headers are forbidden on every request. Live Operations'
    // own bridge reads carry no Authorization header either (cookies only). The
    // admin shell's pre-existing dev identity header on its own widgets is out of scope.
    for (const name of Object.keys(h)) {
      if (/^x-admin-key$|^x-shf-service/i.test(name)) net.secretHeaders.push(`${name} ${r.url()}`);
      if (/^authorization$/i.test(name) && r.url().includes("/api/agent-fabric/command/")) net.secretHeaders.push(`${name} ${r.url()}`);
    }
    if ((r.postData() || "").length) net.bodies.push(r.url());
  });
  page.on("pageerror", (e) => net.errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) net.errors.push(m.text()); });
  await page.setViewportSize({ width, height });
  await page.route("**/api/auth/me*", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(identity) }));
  const fixtures = bridgeFixtures();
  await page.route("**/api/agent-fabric/command/**", (route) => {
    const p = decodeURIComponent(new URL(route.request().url()).pathname.replace(/^\/api/, ""));
    const o = overrides[p];
    if (o === "abort") return route.abort("failed");
    if (o) return route.fulfill({ status: o.status, contentType: "application/json", body: typeof o.body === "string" ? o.body : JSON.stringify(o.body) });
    if (fixtures[p]) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fixtures[p]) });
    return route.fulfill({ status: 404, contentType: "application/json", body: "{}" });
  });
  await page.route("**/fabric-api/**", (route) => route.fulfill({ status: 599, body: "must not be called" }));
  await page.goto(`${LIVE}${hash}`);
  await expect(page.getByRole("heading", { level: 1, name: "Live Operations" })).toBeVisible({ timeout: 15000 });
  return net;
}

const rowKeys = (page) => page.locator("[data-run-key]").evaluateAll((els) => els.map((e) => e.getAttribute("data-run-key")));

async function shot(page, name) {
  if (process.env.AFCC_LIVE_SCREENSHOTS !== "1") return;
  fs.mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: false });
}

// ------------------------------------------------------------------ list + summary

test("summary shows only published states with real counts; no deferred states anywhere", async ({ page }) => {
  await openLive(page);
  const counts = page.locator("[data-count-state]");
  await expect(counts).toHaveCount(5);
  expect(await counts.evaluateAll((els) => els.map((e) => [e.getAttribute("data-count-state"), e.querySelector(".afcc-lo-count-value").textContent]))).toEqual([
    ["APPROVAL_REQUIRED", "1"], ["APPROVED", "0"], ["EXECUTING", "1"], ["COMPLETED", "3"], ["FAILED", "1"],
  ]);
  const text = await page.locator(".afcc-lo").innerText();
  for (const deferred of ["Queued", "Waiting", "Cancelled", "Canceled", "Revoked", "Retrying", "Timed out", "QUEUED", "WAITING", "REVOKED"]) {
    expect(text, deferred).not.toContain(deferred);
  }
});

test("attention ordering is deterministic from real states", async ({ page }) => {
  await openLive(page);
  expect(await rowKeys(page)).toEqual([
    "run:f00dfeed0001", // FAILED (and storage failed)
    "run:badc0ffee001", // evidence integrity failed
    "plan:plan77880042aa", // approval required
    "run:e1e2e3e4e5e6", // executing
    "run:a1b2c3d4e5f6", // completed, newest
    "run:6b1673ee2869", // completed, oldest
  ]);
  await expect(page.locator("[data-run-key='run:f00dfeed0001'] [data-attention]")).toHaveText("Needs attention");
  await expect(page.locator("[data-run-key='run:a1b2c3d4e5f6'] [data-attention]")).toHaveCount(0);
  await expect(page.getByRole("status").filter({ hasText: "need attention" })).toContainText("3 need attention");
});

test("missing metadata is labelled, never blank; execution and evidence are separate columns", async ({ page }) => {
  await openLive(page);
  const legacy = page.locator("tr[data-run-key='run:6b1673ee2869']");
  await expect(legacy.locator("td").nth(2)).toContainText("Not captured"); // initiator + organization
  await expect(legacy.locator("[data-run-state]")).toHaveText(/Completed/);
  await expect(legacy.locator("[data-evidence-state]")).toHaveText(/Not durable/);
  const blanks = await page.locator(".afcc-lo-grid td, .afcc-lo-grid tbody th").evaluateAll((cells) => cells.filter((c) => !c.innerText.trim()).length);
  expect(blanks).toBe(0);
  const failed = page.locator("tr[data-run-key='run:f00dfeed0001']");
  await expect(failed.locator("[data-run-state]")).toHaveText(/Failed/);
  await expect(failed.locator("[data-evidence-state]")).toHaveText(/Storage failed/);
  const plan = page.locator("tr[data-run-key='plan:plan77880042aa']");
  await expect(plan).toContainText("Plan plan77880042aa");
  await expect(plan.locator("[data-approval-state]")).toHaveText(/Pending/);
});

test("filters narrow the list client-side and can be cleared", async ({ page }) => {
  await openLive(page);
  await page.getByLabel("Evidence").selectOption("DURABLE");
  expect(await rowKeys(page)).toEqual(["run:a1b2c3d4e5f6"]);
  await page.getByRole("button", { name: "Clear filters" }).click();
  const count = page.locator("[data-count-state='APPROVAL_REQUIRED']");
  await count.click();
  expect(await rowKeys(page)).toEqual(["plan:plan77880042aa"]);
  await expect(count).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("Agent").selectOption("Layer23OrchestratorAgent");
  await expect(page.getByText("No runs match these filters.")).toBeVisible();
});

// ------------------------------------------------------------------ focus views

test("keyboard selection opens the docked focus; overview uses progressive disclosure", async ({ page }) => {
  await openLive(page);
  const open = page.locator("tr[data-run-key='run:a1b2c3d4e5f6'] .afcc-lo-row-open");
  await open.focus();
  await page.keyboard.press("Enter");
  const dock = page.locator(".afcc-lo-dock");
  await expect(dock.getByRole("heading", { level: 2, name: "a1b2c3d4e5f6" })).toBeVisible();
  await expect(page).toHaveURL(/run=run%3Aa1b2c3d4e5f6/);
  await expect(dock.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
  await expect(dock).toContainText("demo_shs_approver");
  await expect(dock).toContainText("Verified");
  await expect(dock.locator("[data-evidence-state]").first()).toHaveText(/Durable · verified/);
  const more = dock.locator("details.afcc-lo-more");
  await expect(more).not.toHaveAttribute("open", "");
  await more.locator("summary").click();
  await expect(more).toContainText("Agent version");
  await expect(more).toContainText("Not applicable"); // provider/model: no model invoked
  await shot(page, "run-completed-verified");
});

test("views are an accessible tablist with arrow-key navigation", async ({ page }) => {
  await openLive(page, { hash: "?run=run%3Aa1b2c3d4e5f6&view=overview" });
  const tabs = page.getByRole("tab");
  await expect(tabs).toHaveCount(4);
  await page.getByRole("tab", { name: "Overview" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Timeline" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tab", { name: "Timeline" })).toBeFocused();
  await expect(page.getByRole("tabpanel")).toHaveAttribute("aria-labelledby", "afcc-lo-view-timeline");
  await page.keyboard.press("End");
  await expect(page.getByRole("tab", { name: "Dependencies" })).toHaveAttribute("aria-selected", "true");
});

test("timeline renders canonical events; legacy-derived events are distinguishable", async ({ page }) => {
  await openLive(page, { hash: "?run=run%3Aa1b2c3d4e5f6&view=timeline" });
  const items = page.locator(".afcc-lo-tl-item");
  await expect(items).toHaveCount(4);
  await expect(items.nth(0)).toContainText("Plan created");
  await expect(items.nth(1)).toContainText("Approval required → Approved");
  await expect(items.nth(1)).toContainText("Reviewed scope");
  await expect(items.nth(3)).toContainText("Executing → Completed");
  await expect(items.nth(3)).toContainText("1 reference");
  await expect(items.nth(0)).toHaveAttribute("data-provenance", "Derived from plan store");
  await shot(page, "tab-timeline");
  await page.goto(`${LIVE}?run=run%3A6b1673ee2869&view=timeline`);
  const legacy = page.locator(".afcc-lo-tl-item");
  await expect(legacy).toHaveCount(1);
  await expect(legacy.first()).toHaveClass(/is-legacy/);
  await expect(legacy.first()).toContainText("Legacy-derived");
  await expect(legacy.first()).toContainText("Execution (legacy record)");
});

test("evidence: verified artifact opens in a structured viewer, not raw JSON", async ({ page }) => {
  await openLive(page, { hash: "?run=run%3Aa1b2c3d4e5f6&view=evidence" });
  const panel = page.getByRole("tabpanel");
  await expect(panel.getByText("Execution result")).toBeVisible();
  await expect(panel.locator("[data-evidence-state]").first()).toHaveText(/Durable · verified/);
  const row = panel.locator("[data-storage-state='STORED']");
  await expect(row).toContainText("Stored (shared)");
  await expect(row).toContainText("Verified");
  await expect(row).toContainText("13.5 KB");
  await expect(row).toContainText("3f7a9c2e5b8d…");
  await row.getByRole("button", { name: /View artifact/ }).click();
  const viewer = page.locator(".afcc-lo-artifact");
  await expect(viewer.locator("[data-trust]")).toHaveText("Verified evidence");
  await expect(viewer).toContainText("Plan Draft · Layer23OrchestratorAgent");
  await expect(viewer).toContainText("After-school pilot, Franklin County");
  await expect(viewer.getByRole("button", { name: "Copy SHA-256 digest" })).toBeVisible();
  expect(await viewer.innerText()).not.toMatch(/\{"|":\s*"/);
  await shot(page, "tab-evidence");
});

test("evidence: legacy replica-local and integrity-failed artifacts are never presented as trusted", async ({ page }) => {
  await openLive(page, { hash: "?run=run%3A6b1673ee2869&view=evidence" });
  let panel = page.getByRole("tabpanel");
  await expect(panel.locator("[data-storage-state='LEGACY_REPLICA_LOCAL']")).toContainText("Legacy · replica-local");
  await expect(panel.locator("[data-storage-state='LEGACY_REPLICA_LOCAL']")).toContainText("Not verifiable");
  await panel.getByRole("button", { name: /View artifact/ }).click();
  await expect(page.locator("[data-trust]")).toHaveText("Not trusted — replica-local copy");
  await expect(page.getByRole("note")).toContainText("not trusted evidence");
  await expect(page.locator(".afcc-lo-artifact-body")).toHaveClass(/is-untrusted/);

  await page.goto(`${LIVE}?run=run%3Abadc0ffee001&view=evidence`);
  panel = page.getByRole("tabpanel");
  await expect(panel.locator("[data-evidence-state]").first()).toHaveText(/Integrity failed/);
  await expect(panel.locator("[data-verification-state='HASH_MISMATCH']")).toContainText("Hash mismatch");
  await panel.getByRole("button", { name: /View artifact/ }).click();
  await expect(page.locator("[data-trust]")).toHaveText("Integrity failed — body withheld");
  await expect(page.locator(".afcc-lo-artifact-body")).toHaveCount(0);
});

test("failed run: execution failure and evidence storage failure are shown separately", async ({ page }) => {
  await openLive(page, { hash: "?run=run%3Af00dfeed0001&view=overview" });
  const dock = page.locator(".afcc-lo-dock");
  await expect(dock.locator("[data-run-state]").first()).toHaveText(/Failed/);
  await expect(dock.locator("[data-evidence-state]").first()).toHaveText(/Storage failed/);
  await expect(dock.locator(".afcc-lo-failure")).toContainText("EVIDENCE_STORAGE_FAILED");
  await shot(page, "run-failed");
});

test("approval-required plan: overview only, other views explain there is no run yet", async ({ page }) => {
  await openLive(page, { hash: "?run=plan%3Aplan77880042aa&view=overview" });
  const dock = page.locator(".afcc-lo-dock");
  await expect(dock.getByRole("heading", { level: 2 })).toHaveText("Plan plan77880042aa");
  await expect(dock).toContainText("Pending");
  await shot(page, "run-approval-required");
  await dock.getByRole("tab", { name: "Evidence" }).click();
  await expect(dock).toContainText("has not executed");
});

test("dependencies show lineage and the same-plan anomaly only where published", async ({ page }) => {
  await openLive(page, { hash: "?run=run%3Ae1e2e3e4e5e6&view=dependencies" });
  const panel = page.getByRole("tabpanel");
  await expect(panel).toContainText("None recorded");
  await expect(panel.getByRole("note")).toContainText("not a retry chain");
  await panel.getByRole("button", { name: /f00dfeed0001/ }).click();
  await expect(page.locator(".afcc-lo-dock").getByRole("heading", { level: 2 })).toHaveText("f00dfeed0001");
});

// ------------------------------------------------------------------ failure modes

test("wrong organization / missing permission is a clear read-only notice", async ({ page }) => {
  await openLive(page, { overrides: { "/agent-fabric/command/runs": { status: 403, body: { detail: "Forbidden" } } } });
  await expect(page.locator("[data-source-state='FORBIDDEN']")).toBeVisible();
  await expect(page.locator(".afcc-lo-grid")).toHaveCount(0);
});

test("empty result set", async ({ page }) => {
  await openLive(page, { overrides: { "/agent-fabric/command/runs": { status: 200, body: { ...LIST, runs: [], count: 0 } } } });
  await expect(page.getByText("The run authority has no runs or plans recorded yet.")).toBeVisible();
  await expect(page.locator("[data-count-state]")).toHaveCount(5);
});

test("backend unavailable names the failing layer", async ({ page }) => {
  await openLive(page, { overrides: { "/agent-fabric/command/runs": { status: 502, body: { ok: false, contract: "afcc.bridge.v1", error: { code: "BACKEND_UNAVAILABLE", layer: "shs_to_fabric", reason_code: "FABRIC_UNREACHABLE", message: "Agent Fabric is unreachable." } } } } });
  await expect(page.locator("[data-source-state='BACKEND_UNAVAILABLE']")).toBeVisible();
  await expect(page.locator("[data-failed-layer='shs_to_fabric']")).toBeVisible();
});

test("malformed responses are rejected, not rendered", async ({ page }) => {
  await openLive(page, { overrides: { "/agent-fabric/command/runs": { status: 200, body: { contract: "afcc.read.v1", kind: "runs_recent", read_only: true, state: "AVAILABLE", runs: [] } } } });
  await expect(page.locator("[data-source-state='INVALID_RESPONSE']")).toBeVisible();
  await page.goto("about:blank");
  await openLive(page, { overrides: { "/agent-fabric/command/runs": { status: 200, body: "not json" } } });
  await expect(page.locator("[data-source-state='INVALID_RESPONSE']")).toBeVisible();
});

// ------------------------------------------------------------------ responsive

test("tablet 1024: list + overlay dialog; Escape returns focus", async ({ page }) => {
  await openLive(page, { width: 1024, height: 768 });
  await expect(page.locator(".afcc-lo-grid")).toBeVisible();
  const trigger = page.locator("tr[data-run-key='run:a1b2c3d4e5f6'] .afcc-lo-row-open");
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  await expect(dialog.getByRole("heading", { level: 2 })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("phone 430: stacked run items and a full-screen sheet; no squeezed table", async ({ page }) => {
  await openLive(page, { width: 430, height: 932 });
  await expect(page.locator(".afcc-lo-grid")).toHaveCount(0);
  await expect(page.locator(".afcc-lo-items > li")).toHaveCount(6);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await shot(page, "viewport-430x932");
  await page.locator(".afcc-lo-item").first().click();
  const sheet = page.getByRole("dialog");
  await expect(sheet).toHaveClass(/is-sheet/);
  const box = await sheet.boundingBox();
  expect(Math.round(box.width)).toBe(430);
  await page.waitForTimeout(300); // let the entrance animation settle before capturing
  await shot(page, "viewport-430x932-run-focus");
  await page.getByRole("button", { name: "Close run focus" }).click();
  await expect(sheet).toHaveCount(0);
});

// ------------------------------------------------------------------ accessibility

test("accessibility: names, focus visibility, non-colour states, reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openLive(page, { width: 1024, height: 768 });
  // Every button has an accessible name (icon-only ones use aria-label).
  const unnamed = await page.locator("button").evaluateAll((bs) => bs.filter((b) => !(b.getAttribute("aria-label") || b.innerText.trim())).length);
  expect(unnamed).toBe(0);
  // Status is text + screen-reader label, not colour only.
  await expect(page.locator("tr[data-run-key='run:f00dfeed0001'] [data-run-state] .afcc-sr-only")).toHaveText("Run state: ");
  // Visible focus ring, reached by keyboard (as :focus-visible requires).
  let reached = false;
  for (let i = 0; i < 80 && !reached; i++) {
    await page.keyboard.press("Tab");
    reached = await page.evaluate(() => document.activeElement?.classList.contains("afcc-lo-row-open"));
  }
  expect(reached).toBe(true);
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
  expect(outline).not.toBe("none");
  // Reduced motion: the overlay does not animate.
  await page.locator(".afcc-lo-row-open").first().click();
  const animation = await page.getByRole("dialog").evaluate((el) => getComputedStyle(el).animationName);
  expect(animation).toBe("none");
  // Headings: one h1, focus title is h2.
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("dialog").getByRole("heading", { level: 2 })).toHaveCount(1);
  // Timeline is an ordered list with a label.
  await page.getByRole("tab", { name: "Timeline" }).click();
  await expect(page.getByRole("list", { name: "Lifecycle events, oldest first" })).toBeVisible();
});

// ------------------------------------------------------------------ security

test("security: SHS bridge only, GET only, no secrets, no Fabric calls, no mutation", async ({ page }) => {
  const net = await openLive(page, { hash: "?run=run%3Aa1b2c3d4e5f6&view=evidence" });
  await page.getByRole("button", { name: /View artifact/ }).click();
  await expect(page.locator("[data-trust]")).toBeVisible();
  for (const view of ["Timeline", "Dependencies", "Overview"]) await page.getByRole("tab", { name: view }).click();
  const api = net.requests.filter((r) => /\/api\/|\/fabric-api\//.test(r.url));
  expect(api.length).toBeGreaterThan(5);
  expect(api.every((r) => r.method === "GET")).toBe(true);
  expect(api.filter((r) => r.url.includes("/fabric-api/"))).toEqual([]);
  // Live Operations reads only the SHS bridge. The admin shell itself makes three
  // SHS-owned identity/context GETs on every admin page; they are named here so
  // any other call fails this test.
  const SHELL_READS = /\/api\/(auth\/me|companion\/context\/me|accessibility\/profile\/me)(\?|$)/;
  expect(api.filter((r) => !/\/api\/agent-fabric\/command\//.test(r.url) && !SHELL_READS.test(r.url))).toEqual([]);
  expect(api.filter((r) => /\/api\/agent-fabric\/command\//.test(r.url)).length).toBeGreaterThan(4);
  expect(net.secretHeaders).toEqual([]);
  expect(net.bodies).toEqual([]);
  expect(net.requests.some((r) => r.url.includes(DECOY_KEY))).toBe(false);
  expect(await page.content()).not.toContain(DECOY_KEY);
  // No mutation affordances.
  const verbs = await page.locator("button").evaluateAll((bs) => bs.map((b) => b.innerText).filter((t) => /\b(Approve|Reject|Execute|Cancel|Revoke|Retry|Delete|Publish)\b/i.test(t)));
  expect(verbs).toEqual([]);
  expect(net.errors).toEqual([]);
});

test("topology page links to Live Operations (minimal integration)", async ({ page }) => {
  await openLive(page);
  await page.getByRole("link", { name: /Topology view/ }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Agent Fabric Command Center" })).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("link", { name: "Live Operations" }).first()).toBeVisible();
  // Recent Operations lane hands off to Live Operations (navigation only, no redesign).
  await page.getByRole("link", { name: "Open Live Operations" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Live Operations" })).toBeVisible({ timeout: 15000 });
});

// ------------------------------------------------------------------ screenshots

test("screenshots at the required viewports", async ({ page }) => {
  test.skip(process.env.AFCC_LIVE_SCREENSHOTS !== "1", "set AFCC_LIVE_SCREENSHOTS=1 to capture");
  for (const [w, h] of [[1440, 900], [1920, 1080], [1280, 800], [1024, 768], [430, 932]]) {
    await page.setViewportSize({ width: w, height: h });
    await openLive(page, { width: w, height: h, hash: w >= 1180 ? "?run=run%3Aa1b2c3d4e5f6&view=overview" : "" });
    await page.waitForTimeout(250);
    await shot(page, `viewport-${w}x${h}`);
  }
});
