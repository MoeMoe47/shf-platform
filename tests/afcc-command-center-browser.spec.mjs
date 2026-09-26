// AFCC-1/2/2A/2A.1 + Visual V3 (operational topology) browser acceptance for the
// Agent Fabric Command Center.
// Fabric responses are mocked at the same-origin /fabric-api proxy so each
// source can fail independently. Requires a running Vite dev server.
// AFCC-2A.1: every test plants a decoy admin key in localStorage and asserts no
// request ever carries X-Admin-Key; admin-key-only Fabric routes are never called.
// Run: npx playwright test tests/afcc-command-center-browser.spec.mjs
import { test, expect } from "@playwright/test";

const frontend = process.env.SHS_TEST_FRONTEND_URL || "http://127.0.0.1:5173";
const COMMAND = `${frontend}/admin.html#/agent-fabric/command`;

const identity = {
  ok: true,
  authenticated: true,
  session_status: "active",
  user: { id: "admin-afcc", user_id: "admin-afcc", email: "admin@test.invalid", full_name: "AFCC Admin" },
  role: "shs_admin",
  permissions: ["audit.view"],
  memberships: [],
  authorized_organizations: [],
};

const OK = {
  "/health/live": { ok: true, status: "live" },
  "/health/ready": { ok: true, status: "ready", checks: { gate_g_startup: { ok: true } } },
  "/health/degraded": { ok: true, status: "healthy", degraded: false, checks: { gate_g_startup: { ok: true } }, warnings: [] },
  "/status": { fabric: { mode: "ON" }, security: { ok: true, mode: "stub" } },
  // AFCC-2A read projections (persisted state only).
  "/api/v1-command-center/agent-fabric/watchtower": {
    contract: "afcc.read.v1", kind: "watchtower", read_only: true, access: "shs_bridge", catalog_program_count: 2,
    alerts: { state: "NOT_PUBLISHED" }, integrity: { state: "NOT_PUBLISHED" }, state: "AVAILABLE",
    programs: [
      { program_id: "arena_observation_deck", state: "EVALUATED", risk_band: "RED", quarantined: false, action: "DEGRADE", reasons: ["health<0.40"], evaluated_at: "2026-09-01T21:40:54Z" },
      { program_id: "watchtower_demo_program", state: "NOT_YET_EVALUATED" },
    ],
    latest_evaluation: {
      worst_risk_band: "RED", risk_counts: { GREEN: 0, YELLOW: 0, RED: 1, QUARANTINE: 0 }, quarantined_count: 0,
      evaluated_program_count: 1, not_evaluated_program_count: 1, latest_evaluated_at: "2026-09-01T21:40:54Z",
      staleness: { age_seconds: 2071744, threshold: "NOT_DEFINED" },
    },
    non_catalog_snapshot_program_count: 1, manual_quarantine: { active_count: 0, programs: [] }, latest_attestation: { state: "NOT_RECORDED" },
  },
  "/api/v1-command-center/agent-fabric/infrastructure": {
    contract: "afcc.read.v1", kind: "infrastructure", read_only: true, access: "shs_bridge", state: "AVAILABLE",
    status: "DEGRADED", last_verified_at: "2026-09-25T17:00:00Z", trigger: "admin_infra_verify",
    checks: [{ name: "registry_contract", ok: true, reason_code: null }, { name: "watchtower_attestation", ok: false, reason_code: "CHECK_FAILED" }],
    degraded: ["watchtower_attestation"], staleness: { age_seconds: 10800, threshold: "NOT_DEFINED" },
  },
  "/api/v1-command-center/agent-fabric/observability": {
    contract: "afcc.read.v1", kind: "observability", read_only: true, access: "shs_bridge",
    state: "NOT_YET_VERIFIED", reason_code: "NO_VERIFICATION_RECORDED",
  },
};

// AFCC-2A.2: the formerly admin-key-only sources, served by the SHS bridge
// (/api/agent-fabric/command/*) as afcc.read.v1 envelopes. A small consistent fleet.
const envelope = (kind, body) => ({ contract: "afcc.read.v1", kind, read_only: true, state: "AVAILABLE", access: "shs_bridge", generated_at: "2026-09-26T10:00:00Z", ...body });
const BRIDGE = {
  "/agent-fabric/command/agents/health": envelope("agents_health", {
    ok: false, source: "contracts/agents/agents.json",
    summary: { total: 3, ready: 2, warning: 1, approval_required: 2 },
    agents: [
      { agent_id: "L23-ORCH-001", name: "Layer23OrchestratorAgent", layer: "L23", lifecycle: "active", enabled: true, status: "ready", missing: [] },
      { agent_id: "ai_analyst_agent", name: "AI Analyst", layer: "L24", lifecycle: "active", enabled: true, status: "ready", missing: [] },
      { agent_id: "draft_agent", name: "Draft Agent", layer: "L24", lifecycle: "draft", enabled: false, status: "warning", missing: ["policy.maxSteps"] },
    ],
  }),
  "/agent-fabric/command/agents/readiness": envelope("agents_readiness", {
    ok: false,
    summary: { total: 3, auto_ready: 1, approval_required: 2, blocked: 1 },
    agents: [
      { agent_id: "L23-ORCH-001", name: "Layer23OrchestratorAgent", execution_status: "approval_required", can_auto_execute: false, humanApproval: true, blockers: [], warnings: [] },
      { agent_id: "ai_analyst_agent", name: "AI Analyst", execution_status: "auto_ready", can_auto_execute: true, humanApproval: false, blockers: [], warnings: [] },
      { agent_id: "draft_agent", name: "Draft Agent", execution_status: "blocked", can_auto_execute: false, humanApproval: false, blockers: ["agent_disabled", "lifecycle_not_active"], warnings: [] },
    ],
  }),
  "/agent-fabric/command/gate/status": envelope("gate", { gate_pass: false, auditor_one_liner: "GATE FAIL: blockers=L08(not_enforced_ready)", gate_required_layers: ["L07", "L08"], gate_blockers: [{ layer: "L08", reason: "not_enforced_ready" }] }),
  "/agent-fabric/command/runs/recent": envelope("runs_recent", {
    window: 25,
    events: [
      { runId: "6b1673ee2869", planId: "082a6e6fc486810b", agentName: "Layer23OrchestratorAgent", agentId: "L23-ORCH-001", kind: "execute", outcome: "ok", ts: "2026-01-09T03:56:55+00:00", snapshotSha256: "a".repeat(64), artifacts: [{ artifactId: "draft_1", sha256: "b".repeat(64) }] },
      { runId: "b10dee4350f1", planId: "c22187d9", agentName: "Layer23OrchestratorAgent", kind: "execute", outcome: "ok", ts: "2026-01-08T22:49:00+00:00" },
    ],
  }),
};
// AFCC-2A.3: the three AFCC-2A safe reads are served by the SHS bridge too.
for (const name of ["watchtower", "infrastructure", "observability"]) {
  BRIDGE[`/agent-fabric/command/${name}`] = OK[`/api/v1-command-center/agent-fabric/${name}`];
  delete OK[`/api/v1-command-center/agent-fabric/${name}`];
}
const bridgeError = (code, layer, reason, status = 502) => ({ status, body: { ok: false, contract: "afcc.bridge.v1", kind: "x", error: { code, layer, reason_code: reason, message: "bridge failure" } } });
const BRIDGE_DOWN = Object.fromEntries(Object.keys(BRIDGE).map((k) => [k, bridgeError("BACKEND_UNAVAILABLE", "shs_to_fabric", "FABRIC_UNREACHABLE")]));

const UNSAFE = /\/watchtower\/summary|\/watchtower\/programs|\/admin\/infra\/verify|\/admin\/observability\/verify|\/watchtower\/quarantine/;
const ADMIN_ONLY = /\/admin\/agents|\/admin\/layers|\/runs\/recent/;
const DECOY_KEY = "decoy-browser-admin-key-must-never-be-sent";

async function watchNetwork(page) {
  const requests = [];
  const adminKeyHeaders = [];
  const errors = [];
  await page.addInitScript((decoy) => {
    localStorage.setItem("ADMIN_API_KEY", decoy);
    localStorage.setItem("shf_admin_key", decoy);
  }, DECOY_KEY);
  page.on("request", (r) => {
    requests.push(`${r.method()} ${r.url()}`);
    const headers = r.headers();
    if (headers["x-admin-key"] !== undefined) adminKeyHeaders.push(r.url());
    if ((r.postData() || "").includes(DECOY_KEY) || r.url().includes(DECOY_KEY)) adminKeyHeaders.push(`payload ${r.url()}`);
  });
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.text().includes(DECOY_KEY)) errors.push("admin key printed to console");
    if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(m.text());
  });
  return { requests, adminKeyHeaders, errors };
}

async function open(page, { overrides = {}, width = 1440 } = {}) {
  const net = await watchNetwork(page);
  await page.setViewportSize({ width, height: 900 });
  await page.route("**/api/auth/me*", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(identity) }));
  // SHS bridge (/api is SHS-owned). Mocked at the same-origin gateway like Fabric.
  await page.route("**/api/agent-fabric/command/**", (route) => {
    const p = new URL(route.request().url()).pathname.replace(/^\/api/, "");
    const override = overrides[p];
    if (override === "abort") return route.abort("failed");
    if (override) return route.fulfill({ status: override.status, contentType: override.contentType || "application/json", body: typeof override.body === "string" ? override.body : JSON.stringify(override.body ?? {}) });
    if (BRIDGE[p]) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(BRIDGE[p]) });
    return route.fulfill({ status: 404, contentType: "application/json", body: "{}" });
  });
  await page.route("**/fabric-api/**", (route) => {
    const url = new URL(route.request().url());
    const p = url.pathname.replace(/^\/fabric-api/, "");
    const override = overrides[p];
    if (override === "abort") return route.abort("failed");
    if (override) return route.fulfill({ status: override.status, contentType: override.contentType || "application/json", body: typeof override.body === "string" ? override.body : JSON.stringify(override.body ?? {}) });
    if (OK[p]) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(OK[p]) });
    return route.fulfill({ status: 404, contentType: "application/json", body: "{}" });
  });
  await page.goto(COMMAND);
  await expect(page.getByRole("heading", { level: 1, name: "Agent Fabric Command Center" })).toBeVisible({ timeout: 15000 });
  await page.waitForFunction(() => !document.body.innerText.includes("LOADING"), null, { timeout: 15000 });
  return net;
}

const fabricRequests = (net) => net.requests.filter((r) => r.includes("/fabric-api/"));

test("AFCC-2A.1: existing Agent Fabric page sends no admin key and fails closed", async ({ page }) => {
  const net = await watchNetwork(page);
  await page.route("**/api/auth/me*", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(identity) }));
  await page.route("**/fabric-api/**", (route) => route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ detail: "Unauthorized" }) }));
  await page.goto(`${frontend}/admin.html#/agent-fabric`);
  await expect(page.getByRole("heading", { level: 1, name: "Agent Fabric" })).toBeVisible({ timeout: 15000 });
  await expect(page.locator(".agent-fabric-alert")).toContainText("server-side auth bridge");
  expect(net.adminKeyHeaders).toEqual([]);
  expect(await page.content()).not.toContain(DECOY_KEY);
});

test("AFCC-2A.2: fleet, runs and gate come through the SHS bridge — never an admin-key Fabric route", async ({ page }) => {
  const net = await open(page);
  expect(net.adminKeyHeaders).toEqual([]);
  const fabric = fabricRequests(net);
  expect(fabric.length).toBeGreaterThan(0);
  expect(fabric.filter((r) => ADMIN_ONLY.test(r))).toEqual([]);
  expect(fabric.filter((r) => UNSAFE.test(r))).toEqual([]);
  expect(fabric.every((r) => r.startsWith("GET "))).toBe(true);
  const bridge = net.requests.filter((r) => r.includes("/api/agent-fabric/command/"));
  expect([...new Set(bridge.map((r) => r.replace(frontend, "")))].sort()).toEqual([
    "GET /api/agent-fabric/command/agents/health",
    "GET /api/agent-fabric/command/agents/readiness",
    "GET /api/agent-fabric/command/gate/status",
    "GET /api/agent-fabric/command/infrastructure",
    "GET /api/agent-fabric/command/observability",
    "GET /api/agent-fabric/command/runs/recent",
    "GET /api/agent-fabric/command/watchtower",
  ]);
  // No lane reads Fabric session-only routes any more.
  expect(fabric.filter((r) => r.includes("/api/v1-command-center/"))).toEqual([]);
  for (const r of net.requests) expect(r).not.toMatch(/:8090|:8091|:8000|localhost:8/);
  // Real bridged data in the three lanes.
  const fleet = page.locator('[data-lane="agents"]');
  await expect(fleet.locator(".afcc-count", { hasText: "Registered" })).toContainText("3");
  await expect(fleet.locator(".afcc-count", { hasText: "Execution blocked" })).toContainText("1");
  await expect(fleet).toContainText("Draft Agent");
  await expect(page.locator('[data-lane="operations"] tbody tr')).toHaveCount(2);
  await expect(page.locator('[data-lane="operations"]')).toContainText("Layer23OrchestratorAgent");
  await expect(page.locator('[data-lane="gate"]')).toContainText("Gate blocked");
  await expect(page.locator('[data-lane="gate"]')).toContainText("not_enforced_ready");
  await expect(page.locator('[data-strip="agents"]')).toContainText("2 / 3 READY");
  // Needs Review now has a real, registry-reported item.
  await expect(page.locator('[data-priority="REVIEW"] .afcc-priority-count')).toHaveText("1");
  await expect(page.locator('[data-priority="CRITICAL"] .afcc-priority-count')).toHaveText("1");
  expect(net.errors).toEqual([]);
});

test("AFCC-2A.2: bridge failures say which hop failed", async ({ page }) => {
  await open(page, {
    overrides: {
      "/agent-fabric/command/agents/health": bridgeError("BRIDGE_NOT_CONFIGURED", "shs", "INTERNAL_SERVICE_CREDENTIALS_MISSING", 503),
      "/agent-fabric/command/agents/readiness": bridgeError("BACKEND_UNAVAILABLE", "shs_to_fabric", "FABRIC_UNREACHABLE"),
      "/agent-fabric/command/gate/status": bridgeError("FABRIC_ERROR", "fabric", "PROJECTION_READ_FAILED"),
      "/agent-fabric/command/runs/recent": bridgeError("BRIDGE_REJECTED", "shs_to_fabric", "FABRIC_HTTP_401"),
    },
  });
  const fleet = page.locator('[data-lane="agents"]');
  await expect(fleet.locator('[data-source-state="BRIDGE_NOT_CONFIGURED"]')).toContainText("Failed at: SHS API");
  await expect(fleet.locator('[data-source-state="BACKEND_UNAVAILABLE"]')).toContainText("Failed at: SHS API → Agent Fabric");
  await expect(page.locator('[data-lane="gate"] [data-source-state="FABRIC_ERROR"]')).toContainText("Failed at: Agent Fabric handler");
  await expect(page.locator('[data-lane="gate"]')).toContainText("PROJECTION_READ_FAILED");
  await expect(page.locator('[data-lane="operations"] [data-source-state="BRIDGE_REJECTED"]')).toContainText("Bridge rejected");
  // Nothing about the fleet is inferred: Needs Review cannot be computed.
  await expect(page.locator('[data-priority="REVIEW"] .afcc-priority-count')).toHaveText("—");
});

test("AFCC-2A.2: SHS 401 is auth required and 403 is access restricted, at the Browser -> SHS hop", async ({ page }) => {
  await open(page, {
    overrides: {
      "/agent-fabric/command/agents/health": { status: 403, body: { ok: false, error: { code: "FORBIDDEN", message: "Missing permission: bos.governance.read" } } },
      "/agent-fabric/command/agents/readiness": { status: 403, body: { ok: false, error: { code: "FORBIDDEN" } } },
      "/agent-fabric/command/gate/status": { status: 401, body: { ok: false, error: { code: "AUTH_REQUIRED" } } },
    },
  });
  await expect(page.locator('[data-lane="agents"] [data-source-state="FORBIDDEN"]').first()).toContainText("Access restricted");
  await expect(page.locator('[data-lane="agents"]')).toContainText("bos.governance.read");
  await expect(page.locator('[data-lane="gate"] [data-source-state="UNAUTHENTICATED"]')).toContainText("Failed at: Browser → SHS API");
  await expect(page.locator('[data-node="agent-fabric"]')).not.toHaveAttribute("data-node-status", "Restricted"); // Fabric health is public and separate
});

test("Phase 9: Fabric not running (empty proxy 500s) reads as unavailable, not as Fabric handler errors", async ({ page }) => {
  const down = { status: 500, contentType: "text/plain", body: "" };
  await open(page, { overrides: { ...Object.fromEntries(Object.keys(OK).map((k) => [k, down])), ...BRIDGE_DOWN } });
  await expect(page.locator("[data-posture]")).toHaveAttribute("data-posture", "OFFLINE");
  await expect(page.locator('[data-lane="watchtower"] [data-source-state="BACKEND_UNAVAILABLE"]')).toContainText("Failed at: SHS API → Agent Fabric");
  await expect(page.locator('[data-verifier="infrastructure"]')).toContainText("Backend unavailable");
  await expect(page.locator('[data-lane="agents"] [data-source-state="BACKEND_UNAVAILABLE"]').first()).toContainText("Failed at: SHS API → Agent Fabric");
  await expect(page.locator(".afcc-root")).not.toContainText("Fabric error");
});

test("Phase 8: the Command Center renders full-bleed; other admin routes keep the admin shell", async ({ page }) => {
  await open(page);
  await expect(page.locator(".app-header")).toHaveCount(0);
  await expect(page.locator(".adm-rail")).toHaveCount(0);
  await expect(page.locator('[data-shell-mode="full-bleed"]')).toHaveCount(1);
  const root = await page.locator(".afcc-root").boundingBox();
  expect(root.y).toBeLessThan(5);
  const exit = page.getByRole("navigation", { name: "Command Center sections" }).getByRole("link", { name: /Admin home/ });
  await expect(exit).toHaveAttribute("href", /#\/hub$/);
  await page.goto(`${frontend}/admin.html#/agent-fabric`);
  await expect(page.getByRole("heading", { level: 1, name: "Agent Fabric" })).toBeVisible({ timeout: 15000 });
  await expect(page.locator(".adm-rail")).toHaveCount(1);
  await expect(page.locator('[data-shell-mode="full-bleed"]')).toHaveCount(0);
});

test("routing + contract: Command Center renders session-readable and public sources", async ({ page }) => {
  const net = await open(page);
  await expect(page.locator("[data-posture]")).toHaveAttribute("data-posture", "DEGRADED");
  await expect(page.locator("[data-posture]")).toHaveText("Fabric Degraded");
  await expect(page.locator('[data-strip="fabric"]')).toContainText("Infrastructure verification: last recorded DEGRADED (3 hours ago).");
  await expect(page.locator('[data-strip="risk"]')).toContainText("RED");
  await expect(page.locator('[data-strip="risk"]')).toContainText("Evaluated 23 days ago");
  await expect(page.locator('[data-strip="readiness"]')).toContainText("READY");
  const text = await page.locator(".afcc-root").innerText();
  for (const invented of ["RUNNING", "WAITING", "TIMED OUT", "REVOKED", "Unknown"]) expect(text).not.toContain(invented);
  expect(net.errors).toEqual([]);
});

test("AFCC-2A.3: without an SHS session, safe reads are auth required at Browser -> SHS, not a Fabric fault", async ({ page }) => {
  const denied = { status: 401, body: { ok: false, error: { code: "AUTH_REQUIRED" } } };
  const net = await open(page, {
    overrides: {
      "/agent-fabric/command/watchtower": denied,
      "/agent-fabric/command/infrastructure": denied,
      "/agent-fabric/command/observability": denied,
    },
  });
  await expect(page.locator('[data-lane="watchtower"] [data-source-state="UNAUTHENTICATED"]')).toContainText("Failed at: Browser → SHS API");
  await expect(page.locator('[data-verifier="infrastructure"]')).toContainText("Auth required");
  await expect(page.locator('[data-strip="risk"]')).toContainText("AUTH REQUIRED");
  // Health probes are public; posture stays computable and viewer access is not a Fabric fault.
  await expect(page.locator("[data-posture]")).toHaveAttribute("data-posture", "OPERATIONAL");
  await page.locator('[data-strip="fabric"]').click();
  await expect(page.locator(".afcc-drawer")).toContainText("Infrastructure verification (auth required)");
  expect(net.adminKeyHeaders).toEqual([]);
});

test("AFCC-2A.3: no lane shows Auth bridge required once all six read through the bridge", async ({ page }) => {
  await open(page);
  await expect(page.locator('[data-source-state="AUTH_BRIDGE_REQUIRED"]')).toHaveCount(0);
  await expect(page.locator(".afcc-root")).not.toContainText(/auth bridge required/i);
  await expect(page.locator('[data-node="watchtower"]')).toHaveAttribute("data-node-status", "Degraded");
  await expect(page.locator('[data-verifier="observability"]')).toContainText("Not yet verified");
});

test("independent failure: one failed source does not blank the others", async ({ page }) => {
  await open(page, { overrides: { "/agent-fabric/command/watchtower": bridgeError("FABRIC_ERROR", "fabric", "PROJECTION_READ_FAILED") } });
  const wt = page.locator('[data-lane="watchtower"]');
  await expect(wt.locator("[data-source-state]")).toHaveAttribute("data-source-state", "FABRIC_ERROR");
  await expect(wt).toContainText("PROJECTION_READ_FAILED");
  await expect(wt).toContainText("Failed at: Agent Fabric handler");
  await expect(page.locator('[data-verifier="infrastructure"]')).toContainText("DEGRADED");
  await expect(page.locator('[data-strip="readiness"]')).toContainText("READY");
  await expect(page.locator("[data-posture]")).not.toHaveAttribute("data-posture", "OFFLINE");
});

test("permission denied: a session without the read permission is access restricted", async ({ page }) => {
  await open(page, { overrides: { "/agent-fabric/command/watchtower": { status: 403, body: { ok: false, error: { code: "FORBIDDEN" } } } } });
  await expect(page.locator('[data-lane="watchtower"] [data-source-state="FORBIDDEN"]')).toContainText("Access restricted");
  await expect(page.locator('[data-strip="risk"]')).toContainText("ACCESS RESTRICTED");
});

test("invalid: a contract-breaking read payload is rejected whole", async ({ page }) => {
  await open(page, { overrides: { "/agent-fabric/command/infrastructure": { status: 200, body: { contract: "afcc.read.v1", kind: "infrastructure", read_only: true, state: "AVAILABLE", status: "GREAT", checks: [] } } } });
  await expect(page.locator('[data-verifier="infrastructure"]')).toContainText("Invalid response");
});

test("offline: Fabric unreachable shows offline posture without crashing", async ({ page }) => {
  const overrides = { ...Object.fromEntries(Object.keys(OK).map((k) => [k, "abort"])), ...BRIDGE_DOWN };
  const net = await open(page, { overrides });
  await expect(page.locator("[data-posture]")).toHaveAttribute("data-posture", "OFFLINE");
  await expect(page.locator('[data-strip="fabric"]')).toContainText("Fabric Offline");
  await expect(page.locator('[data-node="agent-fabric"]')).toHaveAttribute("data-node-status", "Unavailable");
  await expect(page.locator('[data-priority="CRITICAL"] .afcc-priority-count')).toHaveText("1");
  // AFCC-2A.3: Watchtower is read through SHS, so an unreachable Fabric is reported at the SHS -> Fabric hop.
  await expect(page.locator('[data-lane="watchtower"] [data-source-state="BACKEND_UNAVAILABLE"]')).toContainText("Failed at: SHS API → Agent Fabric");
  expect(net.errors).toEqual([]);
});

test("not ready: a 503 readiness payload is data and degrades posture", async ({ page }) => {
  await open(page, { overrides: { "/health/ready": { status: 503, body: { ok: false, status: "not_ready", checks: { registry_contract: { ok: false, error: "health_check_failed" } } } } } });
  await expect(page.locator("[data-posture]")).toHaveAttribute("data-posture", "DEGRADED");
  await expect(page.locator('[data-strip="readiness"]')).toContainText("NOT READY");
  await expect(page.locator('[data-strip="fabric"]')).toContainText("registry_contract");
});

test("keyboard + drawer: modal drawer traps focus, Escape closes and returns focus", async ({ page }) => {
  await open(page, { width: 1024 });
  const trigger = page.locator('[data-lane="watchtower"]').getByRole("button", { name: "Watchtower detail" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  await expect(page.locator("#afcc-drawer-title")).toBeFocused();
  for (let i = 0; i < 6; i += 1) {
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => Boolean(document.activeElement?.closest(".afcc-drawer")))).toBe(true);
  }
  await page.keyboard.press("Shift+Tab");
  expect(await page.evaluate(() => Boolean(document.activeElement?.closest(".afcc-drawer")))).toBe(true);
  expect(await page.locator(".afcc-frame").evaluate((el) => el.inert)).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("keyboard: global health items open the drawer; navigation marks unavailable sections", async ({ page }) => {
  await open(page);
  await page.locator('[data-strip="risk"]').focus();
  await page.keyboard.press("Enter");
  const drawer = page.locator(".afcc-drawer");
  await expect(drawer).toContainText("SHS session with SHS bos.governance.read");
  await expect(drawer).toContainText("never evaluates risk");
  await page.getByRole("button", { name: "Close context drawer" }).click();
  const nav = page.getByRole("navigation", { name: "Command Center sections" });
  await expect(nav.getByRole("link", { name: "Command Center", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(nav).toContainText("planned for AFCC-10");
  await expect(nav).toContainText("planned for AFCC-12");
  // In-page destinations scroll to and focus the region they name.
  await nav.getByRole("button", { name: "Watchtower & Risk" }).click();
  await expect(page.locator("#afcc-lane-watchtower-title")).toBeFocused();
  await expect(nav.getByRole("link", { name: "Truth & Evidence" })).toHaveAttribute("href", /#\/truth-spine$/);
  await expect(nav.getByRole("link", { name: /^OAS/ })).toHaveAttribute("href", "/oas.html");
});

test("tablet/mobile: sections navigation is collapsed until toggled", async ({ page }) => {
  await open(page, { width: 768 });
  const toggle = page.getByRole("button", { name: "Sections" });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#afcc-section-list")).toBeHidden();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#afcc-section-list")).toBeVisible();
});

test("AFCC-2A: Watchtower lane renders persisted state with its age and marks unpublished fields", async ({ page }) => {
  await open(page);
  const lane = page.locator('[data-lane="watchtower"]');
  await expect(lane).toContainText("RED");
  await expect(lane).toContainText("Last evaluated 23 days ago");
  await expect(lane.locator(".afcc-count", { hasText: "Programs evaluated" })).toContainText("1");
  await expect(lane.locator(".afcc-count", { hasText: "Not yet evaluated" })).toContainText("1");
  await expect(lane.locator(".afcc-count", { hasText: "Alerts" }).locator(".afcc-gap")).toHaveText("Not published");
  await expect(lane.locator(".afcc-count", { hasText: "Integrity" }).locator(".afcc-gap")).toHaveText("Not published");
  await lane.getByRole("button", { name: "Watchtower detail" }).click();
  const drawer = page.locator(".afcc-drawer");
  await expect(drawer).toContainText("arena_observation_deck");
  await expect(drawer).toContainText("health<0.40");
  await expect(drawer).toContainText("Not defined by Watchtower");
  await expect(drawer).toContainText("SHS bridge");
  await expect(drawer).toContainText("1 program(s) with snapshots are not in the current catalog");
});

test("AFCC-2A: verifier lane shows last-known result with age, and not-yet-verified", async ({ page }) => {
  await open(page);
  const infra = page.locator('[data-verifier="infrastructure"]');
  await expect(infra).toContainText("DEGRADED");
  await expect(infra).toContainText("Verified 3 hours ago");
  await expect(page.locator('[data-verifier="observability"]')).toContainText("Not yet verified");
  await infra.click();
  const drawer = page.locator(".afcc-drawer");
  await expect(drawer).toContainText("Last recorded DEGRADED");
  await expect(drawer).toContainText("watchtower_attestation");
  await expect(drawer).toContainText("CHECK_FAILED");
  await expect(drawer).toContainText("Reading it runs nothing");
  await expect(page.locator(".afcc-root")).not.toContainText(/Run verification|Verify now|Re-run/i);
});

test("AFCC-2A: no secrets, paths or stack traces reach the page", async ({ page }) => {
  await open(page);
  await page.locator('[data-verifier="infrastructure"]').click();
  const text = await page.locator("body").innerText();
  for (const leak of ["/Users/", "/private/", "Traceback", "stderr", "stdout", "baseUrl", "ADMIN_API_KEY=", "SHF_ATTEST", DECOY_KEY]) expect(text).not.toContain(leak);
  expect(await page.content()).not.toContain(DECOY_KEY);
});

test("reduced motion: drawer does not animate when the user prefers reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, { width: 1024 });
  await page.locator('[data-verifier="infrastructure"]').click();
  const name = await page.locator(".afcc-drawer").evaluate((el) => getComputedStyle(el).animationName);
  expect(name).toBe("none");
});

for (const [width, layout, mode] of [[1920, "ultra", "docked"], [1600, "wide", "overlay"], [1440, "wide", "overlay"], [1280, "wide", "overlay"], [1024, "medium", "overlay"], [768, "narrow", "sheet"], [430, "narrow", "sheet"], [390, "narrow", "sheet"]]) {
  test(`responsive ${width}: ${layout} layout, ${mode} drawer, no horizontal scroll`, async ({ page }) => {
    const net = await open(page, { width });
    await expect(page.locator(".afcc-root")).toHaveAttribute("data-layout", layout);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const spans = await page.evaluate(() => {
      const board = document.querySelector(".afcc-board").getBoundingClientRect().width;
      return ["gaps"].map((id) => Math.abs(document.querySelector(`[data-lane="${id}"]`).getBoundingClientRect().width - board) < 2);
    });
    expect(spans).toEqual([true]);
    // Labels wrap or carry their full text instead of being cut (AFCC-2A.3 responsive fix).
    const clipped = await page.evaluate(() => [...document.querySelectorAll(".afcc-node-name, .afcc-strip-value, .afcc-priority-name")]
      .filter((el) => el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1).map((el) => el.textContent));
    expect(clipped).toEqual([]);
    // Every canonical system is on the map at every width.
    await expect(page.locator("[data-node]")).toHaveCount(16); // hub + 15 systems
    await page.locator('[data-verifier="infrastructure"]').click();
    await expect(page.locator(".afcc-drawer")).toHaveAttribute("data-drawer-mode", mode);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    const small = await page.locator(".afcc-root button:visible").evaluateAll((els) =>
      els.filter((el) => el.offsetHeight < 44).map((el) => `${el.textContent.trim()} ${el.offsetHeight}`));
    expect(small).toEqual([]);
    expect(net.adminKeyHeaders).toEqual([]);
  });
}

// ============================================ AFCC Visual V3 — operational topology
test("V3 topology: canonical systems and relationships render with source-backed status only", async ({ page }) => {
  const net = await open(page);
  await expect(page.locator("[data-node]")).toHaveCount(16); // hub + 15 systems
  await expect(page.locator('[data-node="oas"]')).toHaveCount(0);
  await expect(page.locator(".afcc-legend")).toContainText("Not drawn: OAS (no confirmed Fabric connection)");
  await expect(page.locator("[data-edge]")).toHaveCount(19);
  await expect(page.locator('[data-node="agent-fabric"]')).toHaveAttribute("data-node-status", "Degraded");
  await expect(page.locator('[data-node="watchtower"]')).toHaveAttribute("data-node-status", "Degraded");
  await expect(page.locator('[data-node="watchtower"]')).toContainText("23d ago");
  // No admitted source: never borrows Fabric health.
  for (const id of ["truth", "oracle", "civicsure", "treasury", "loo"]) {
    await expect(page.locator(`[data-node="${id}"]`)).toHaveAttribute("data-node-status", "Not published");
  }
  await expect(page.locator('[data-edge="shs-fabric"]')).toHaveAttribute("data-edge-state", "unobserved"); // SHS API publishes no status here
  await expect(page.locator('[data-edge="fabric-truth"]')).toHaveAttribute("data-edge-state", "degraded"); // upstream Fabric is degraded
  await expect(page.locator('[data-edge="watchtower-loo"]')).toHaveAttribute("data-edge-state", "degraded");
  const text = await page.locator(".afcc-root").innerText();
  for (const invented of ["Running", "Waiting", "Timed Out", "Revoked", "Unknown", "1,284", "98.7%", "99.9%"]) expect(text).not.toContain(invented);
  expect(net.errors).toEqual([]);
});

test("V3 workflow: priority filter -> map -> drawer tabs -> dependencies", async ({ page }) => {
  await open(page);
  const degraded = page.locator('[data-priority="DEGRADED"]');
  await expect(degraded.locator(".afcc-priority-count")).toHaveText("2");
  await degraded.click();
  await expect(degraded).toHaveAttribute("aria-pressed", "true");
  const matches = page.locator(".afcc-matches");
  await expect(matches).toContainText("arena_observation_deck");
  await expect(matches).toContainText("Infrastructure verification");
  await expect(page.locator('[data-node="watchtower"]')).toHaveClass(/is-matched/);
  await expect(page.locator('[data-node="civicsure"]')).toHaveClass(/is-dimmed/);

  await page.locator('[data-node="watchtower"]').click();
  const drawer = page.getByRole("dialog");
  await expect(drawer.locator("#afcc-drawer-title")).toHaveText("Watchtower");
  await expect(drawer).toContainText("Evaluated 23 days ago");
  await expect(drawer).toContainText("Watchtower DEGRADE");
  const views = drawer.getByRole("tab");
  await expect(views).toHaveText(["Overview", "Authority", "Timeline", "Evidence", "Dependencies"]);
  await drawer.getByRole("tab", { name: "Authority" }).click();
  await expect(drawer).toContainText("Watchtower observes and quarantines");
  await expect(drawer).toContainText("Command Center reads only");
  await drawer.getByRole("tab", { name: "Timeline" }).click();
  await expect(drawer).toContainText("Risk evaluated: arena_observation_deck");
  await drawer.getByRole("tab", { name: "Evidence" }).click();
  await expect(drawer).toContainText("Risk snapshots and attestations.");
  await drawer.getByRole("tab", { name: "Dependencies" }).click();
  await expect(drawer).toContainText("Depends on");
  await expect(drawer.locator(".afcc-chain", { hasText: "CivicSure" })).toContainText("Truth Spine");
  // Map shows the selected path and dims the rest.
  await expect(page.locator('[data-edge="truth-watchtower"]')).toHaveClass(/is-on/);
  await expect(page.locator('[data-edge="fabric-treasury"]')).toHaveClass(/is-dim/);
  // Drawer navigation to a dependency re-targets drawer and map.
  await drawer.locator(".afcc-edge-list").getByRole("button", { name: "Truth Spine" }).click();
  await expect(drawer.locator("#afcc-drawer-title")).toHaveText("Truth Spine");
  await expect(drawer).toContainText("No admitted Command Center source publishes this system's status");
});

test("V3 dependency highlighting: CivicSure lineage reaches Truth consumers, not unrelated systems", async ({ page }) => {
  await open(page);
  await page.locator('[data-node="civicsure"]').click();
  await page.keyboard.press("Escape"); // close drawer; selection persists on the map
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator('[data-node="civicsure"]')).toHaveAttribute("aria-pressed", "true");
  for (const e of ["civicsure-shs", "shs-fabric", "fabric-truth", "truth-reporting", "truth-watchtower", "watchtower-loo"]) {
    await expect(page.locator(`[data-edge="${e}"]`)).toHaveClass(/is-on/);
  }
  for (const n of ["treasury", "metaverse", "registry", "guardrails", "shf", "bos"]) {
    await expect(page.locator(`[data-node="${n}"]`)).toHaveClass(/is-dimmed/);
  }
  // Escape inside the map clears the selection; background click also clears.
  await page.locator('[data-node="civicsure"]').focus();
  await page.keyboard.press("Escape");
  await expect(page.locator('[data-node="civicsure"]')).toHaveAttribute("aria-pressed", "false");
  await page.locator('[data-node="oracle"]').click();
  await page.keyboard.press("Escape");
  await page.locator(".afcc-map-canvas").click({ position: { x: 5, y: 110 } });
  await expect(page.locator('[data-node="oracle"]')).toHaveAttribute("aria-pressed", "false");
});

test("V3 keyboard: nodes are focusable, Enter opens, arrows move views, Escape returns focus", async ({ page }) => {
  await open(page, { width: 1440 });
  const node = page.locator('[data-node="truth"]');
  await node.focus();
  await expect(page.locator("#afcc-map-tip")).toContainText("Truth Spine");
  await page.keyboard.press("Enter");
  await expect(page.locator("#afcc-drawer-title")).toBeFocused();
  await page.getByRole("tab", { name: "Overview" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Authority" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tab", { name: "Authority" })).toBeFocused();
  await page.keyboard.press("End");
  await expect(page.getByRole("tab", { name: "Dependencies" })).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(node).toBeFocused();
});

test("V3 search: Cmd/Ctrl+K searches loaded systems and opens the selection", async ({ page }) => {
  await open(page);
  await page.keyboard.press("ControlOrMeta+k");
  const box = page.getByRole("combobox");
  await expect(box).toBeFocused();
  await expect(page.locator(".afcc-find")).toContainText("does not search the backend");
  await box.fill("watch");
  await expect(page.getByRole("option").first()).toContainText("Watchtower");
  await page.keyboard.press("Enter");
  await expect(page.locator("#afcc-drawer-title")).toHaveText("Watchtower");
  await page.keyboard.press("Escape");
  await page.keyboard.press("ControlOrMeta+k");
  await page.getByRole("combobox").fill("no-such-system-zz");
  await expect(page.locator(".afcc-find-empty")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("combobox")).toHaveCount(0);
  await expect(page.locator(".afcc-find-trigger")).toBeFocused();
});

test("V3 modes: dependency view labels relationships; geography is disabled with a reason", async ({ page }) => {
  await open(page);
  await page.getByRole("button", { name: "Dependency View" }).click();
  await expect(page.locator(".afcc-map")).toHaveAttribute("data-map-mode", "dependency");
  await expect(page.locator(".afcc-rel-line")).toContainText("Select or hover a system");
  await page.locator('[data-node="shs"]').hover();
  const rels = page.locator(".afcc-rel-list li");
  await expect(rels).toHaveCount(4);
  await expect(page.locator('[data-rel="shs-fabric"]')).toHaveText(/→ Agent Fabric HMAC internal ingestion · /);
  await expect(page.locator('[data-rel="civicsure-shs"]')).toHaveText(/← CivicSure referral.created events · not observed/);
  await expect(page.locator("[data-edge] path[marker-end]")).toHaveCount(19); // every edge shows direction
  const geo = page.getByRole("button", { name: /Geography/ });
  await expect(geo).toHaveAttribute("aria-disabled", "true");
  // aria-disabled (not native disabled) so it stays focusable and can explain itself.
  await geo.focus();
  await page.keyboard.press("Enter");
  await expect(geo).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#afcc-geo-note")).toContainText("no canonical geographic data is published");
  await expect(page.locator(".afcc-map")).toHaveAttribute("data-map-mode", "dependency");
});

test("V3 1440x900: topology is not oversized and Recent Operations starts above the fold", async ({ page }) => {
  await open(page, { width: 1440 });
  const m = await page.evaluate(() => {
    const root = document.querySelector(".afcc-root").getBoundingClientRect().top;
    const box = (s) => document.querySelector(s).getBoundingClientRect();
    return { canvas: box(".afcc-map-canvas").height, ops: box('[data-lane="operations"]').top - root, wt: box('[data-lane="watchtower"]').top - root, overflow: document.documentElement.scrollWidth - window.innerWidth };
  });
  // Measured from the Command Center's own top edge (the admin shell above it is outside AFCC).
  expect(m.canvas).toBeLessThanOrEqual(0.3 * 900);
  expect(m.ops).toBeLessThan(700);
  expect(m.wt).toBeLessThan(700);
  expect(m.overflow).toBeLessThanOrEqual(0);
  // Labels on the map are not clipped at 1440.
  const clipped = await page.locator(".afcc-node-name").evaluateAll((els) => els.filter((el) => el.scrollWidth > el.clientWidth + 1).map((el) => el.textContent));
  expect(clipped).toEqual([]);
});
