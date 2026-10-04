// AFCC-3 Phase 7 — Live Operations model + client contracts. Pure modules only;
// browser behavior is covered by tests/afcc-live-operations-browser.spec.mjs.
// Run with: node --test tests/afccLiveOperations.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  applyFilters,
  attentionReason,
  display,
  evidenceCopy,
  filterOptions,
  formatBytes,
  normalizeRun,
  normalizeTimelineEvent,
  PRIMARY_STATES,
  runStateCopy,
  selectAwaitingApproval,
  selectNeedsAttention,
  selectRecentChanges,
  selectRunning,
  shortHash,
  sortByAttention,
  summarize,
  transitionText,
  validateEnvelope,
} from "../src/pages/admin/agent-fabric-command/liveOperationsModel.js";
import { artifactEndpoint, fetchLive, isSafeRunId, LIVE_ENDPOINTS, runEndpoint } from "../src/pages/admin/agent-fabric-command/liveOperationsClient.js";

const SUPPORTED = ["APPROVAL_DENIED", "APPROVAL_REQUIRED", "APPROVED", "COMPLETED", "EXECUTING", "FAILED", "ORPHANED", "TIMED_OUT"];
const raw = (id, state, extra = {}) => ({ run_id: id, current_state: state, operation: { type: "execute", plan_id: `plan-${id}` }, last_transition_at: extra.at || "2026-09-27T10:00:00Z", evidence: extra.evidence || { status: "NONE" }, agent: { name: extra.agent || "A" }, organization_id: extra.org || "NOT_APPLICABLE", approval: { state: extra.approval || "APPROVED" }, ...extra.more });

test("missing values always have a label; never blank or 'undefined'", () => {
  assert.deepEqual(display("NOT_CAPTURED"), { text: "Not captured", gap: true });
  assert.deepEqual(display("NOT_PUBLISHED"), { text: "Not published", gap: true });
  assert.deepEqual(display("NOT_AVAILABLE"), { text: "Not available", gap: true });
  assert.deepEqual(display("NOT_APPLICABLE"), { text: "Not applicable", gap: true });
  assert.deepEqual(display("[redacted]"), { text: "Redacted", gap: true });
  for (const v of [null, undefined, ""]) assert.deepEqual(display(v), { text: "Not available", gap: true });
  assert.deepEqual(display("demo_shs_admin"), { text: "demo_shs_admin", gap: false });
  const run = normalizeRun({});
  assert.equal(run.state, "UNKNOWN");
  assert.equal(display(run.agent.name).text, "Not available");
  assert.equal(normalizeRun(null).kind, "plan");
});

test("plans without a run are rows keyed by plan, not by a sentinel run id", () => {
  const plan = normalizeRun({ run_id: "NOT_AVAILABLE", current_state: "APPROVAL_REQUIRED", operation: { type: "plan", plan_id: "p77" } });
  assert.deepEqual([plan.kind, plan.key, plan.runId, plan.planId], ["plan", "plan:p77", null, "p77"]);
  const run = normalizeRun(raw("r1", "COMPLETED"));
  assert.deepEqual([run.kind, run.key, run.runId], ["run", "run:r1", "r1"]);
});

test("summary counts only backend-published states; deferred states never appear", () => {
  const runs = [raw("a", "COMPLETED"), raw("b", "COMPLETED"), raw("c", "FAILED"), raw("d", "TIMED_OUT"), raw("e", "QUEUED")].map(normalizeRun);
  const s = summarize(runs, SUPPORTED);
  assert.deepEqual(s.primary.map((p) => [p.state, p.count]), [["APPROVAL_REQUIRED", 0], ["APPROVED", 0], ["EXECUTING", 0], ["COMPLETED", 2], ["FAILED", 1]]);
  assert.deepEqual(s.secondary.map((p) => [p.state, p.count]), [["TIMED_OUT", 1]], "only present secondary states; QUEUED is not published");
  assert.deepEqual(summarize(runs, ["COMPLETED"]).primary.map((p) => p.state), ["COMPLETED"], "no KPI for an unpublished state");
  assert.deepEqual(summarize(runs, undefined).primary, []);
  for (const deferred of ["QUEUED", "WAITING", "CANCELLED", "REVOKED", "RETRYING"]) assert.equal(PRIMARY_STATES.includes(deferred), false);
  assert.equal(runStateCopy("QUEUED").label, "Unrecognized state");
});

test("attention ordering is deterministic and based on actual state only", () => {
  const runs = [
    raw("done-old", "COMPLETED", { at: "2026-01-01T00:00:00Z" }),
    raw("done-new", "COMPLETED", { at: "2026-09-27T12:00:00Z" }),
    raw("pending", "APPROVAL_REQUIRED"),
    raw("tampered", "COMPLETED", { evidence: { status: "INTEGRITY_FAILED" } }),
    raw("failed", "FAILED"),
    raw("conflict", "UNKNOWN"),
    raw("storage", "COMPLETED", { evidence: { status: "STORAGE_FAILED" } }),
    raw("running", "EXECUTING"),
  ].map(normalizeRun);
  const order = sortByAttention(runs).map((r) => r.runId);
  assert.deepEqual(order, ["failed", "tampered", "storage", "conflict", "pending", "running", "done-new", "done-old"]);
  assert.deepEqual(sortByAttention([...runs].reverse()).map((r) => r.runId), order, "input order does not matter");
  assert.equal(attentionReason(runs.find((r) => r.runId === "running")), null);
  assert.equal(attentionReason(runs.find((r) => r.runId === "tampered")), "INTEGRITY_FAILED");
});

test("execution result and evidence completeness stay separate", () => {
  const done = normalizeRun(raw("x", "COMPLETED", { evidence: { status: "NOT_DURABLE" } }));
  assert.equal(runStateCopy(done.state).label, "Completed");
  assert.equal(evidenceCopy(done.evidence).label, "Not durable");
  assert.equal(evidenceCopy({ status: "DURABLE", verified: false }).label, "Durable");
  assert.equal(evidenceCopy({ status: "DURABLE", verified: true }).label, "Durable · verified");
  assert.equal(evidenceCopy({ status: "SOMETHING_NEW" }).tone, "gap");
});

test("filters and options derive from loaded rows only", () => {
  const runs = [raw("a", "COMPLETED", { agent: "A", org: "org_a" }), raw("b", "FAILED", { agent: "B" }), raw("c", "COMPLETED", { agent: "B", evidence: { status: "DURABLE" } })].map(normalizeRun);
  const opts = filterOptions(runs);
  assert.deepEqual(opts.agent, ["A", "B"]);
  assert.deepEqual(opts.organization, ["Not applicable", "org_a"]);
  assert.deepEqual(applyFilters(runs, { agent: "B", state: "COMPLETED" }).map((r) => r.runId), ["c"]);
  assert.deepEqual(applyFilters(runs, { evidence: "DURABLE" }).map((r) => r.runId), ["c"]);
  assert.equal(applyFilters(runs, {}).length, 3);
});

test("Simple Home selectors reuse the same run logic", () => {
  const runs = [raw("a", "EXECUTING"), raw("b", "APPROVAL_REQUIRED"), raw("c", "FAILED", { at: "2026-09-27T12:00:00Z" }), raw("d", "COMPLETED", { at: "2026-09-27T13:00:00Z" })].map(normalizeRun);
  assert.deepEqual(selectNeedsAttention(runs).map((r) => r.runId), ["c", "b"]);
  assert.deepEqual(selectRunning(runs).map((r) => r.runId), ["a"]);
  assert.deepEqual(selectAwaitingApproval(runs).map((r) => r.runId), ["b"]);
  assert.deepEqual(selectRecentChanges(runs, 2).map((r) => r.runId), ["d", "c"]);
});

test("timeline events keep provenance; legacy is distinguishable", () => {
  const legacy = normalizeTimelineEvent({ event_type: "run.execute", provenance: "LEGACY_DERIVED", from_state: "NOT_CAPTURED", to_state: "COMPLETED" });
  assert.equal(legacy.provenance.legacy, true);
  assert.equal(legacy.label, "Execution (legacy record)");
  assert.equal(transitionText(legacy.from, legacy.to), "Completed");
  const recorded = normalizeTimelineEvent({ event_type: "run.completed", provenance: "RECORDED", from_state: "EXECUTING", to_state: "COMPLETED", evidence_refs: ["a", "b"] });
  assert.deepEqual([recorded.provenance.legacy, recorded.evidenceCount, transitionText(recorded.from, recorded.to)], [false, 2, "Executing → Completed"]);
  assert.equal(normalizeTimelineEvent({ event_type: "made.up" }).label, "made.up");
});

test("formatters never expose more than a short digest", () => {
  assert.equal(shortHash("a".repeat(64)), "aaaaaaaaaaaa…");
  assert.equal(shortHash("NOT_CAPTURED"), "Not captured");
  assert.equal(formatBytes(13826), "13.5 KB");
  assert.equal(formatBytes("NOT_CAPTURED"), "Not captured");
});

test("envelopes must be the exact read contract for their kind", () => {
  const ok = { contract: "afcc.read.v1", kind: "runs_live", read_only: true, state: "AVAILABLE", runs: [] };
  assert.equal(validateEnvelope(ok, "runs_live"), true);
  assert.equal(validateEnvelope({ ...ok, kind: "runs_recent" }, "runs_live"), false);
  assert.equal(validateEnvelope({ ...ok, read_only: false }, "runs_live"), false);
  assert.equal(validateEnvelope({ ...ok, runs: "nope" }, "runs_live"), false);
  assert.equal(validateEnvelope([], "runs_live"), false);
  assert.equal(validateEnvelope({ ...ok, kind: "run_detail" }, "run_detail"), false, "detail needs a run object");
  assert.equal(validateEnvelope({ contract: "afcc.read.v1", kind: "run_detail", read_only: true, state: "NOT_AVAILABLE" }, "run_detail"), true);
});

test("client: SHS bridge paths only, ids validated and encoded, reserved words refused", () => {
  assert.equal(LIVE_ENDPOINTS.runs.path, "/agent-fabric/command/runs");
  assert.equal(LIVE_ENDPOINTS.runs.transport, "shs");
  assert.equal(runEndpoint("timeline", "a1b2c3").path, "/agent-fabric/command/runs/a1b2c3/timeline");
  assert.equal(artifactEndpoint("a1b2c3", "draft_1").path, "/agent-fabric/command/runs/a1b2c3/artifacts/draft_1");
  for (const bad of ["execute", "CANCEL", "../x", "a b", "NOT_AVAILABLE", "", null]) {
    assert.equal(runEndpoint("detail", bad), null, String(bad));
    assert.equal(isSafeRunId(bad), false);
  }
  assert.equal(runEndpoint("mutate", "a1b2c3"), null, "only the four read views exist");
  assert.equal(artifactEndpoint("a1b2c3", "../secret"), null);
});

test("client: GET only, cookies only, rejects malformed payloads", async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return { status: 200, text: async () => JSON.stringify({ contract: "afcc.read.v1", kind: "runs_recent", read_only: true, state: "AVAILABLE", runs: [] }) };
  };
  const r = await fetchLive(LIVE_ENDPOINTS.runs, { fetchImpl, shsBase: "/api" });
  assert.equal(r.state, "INVALID_RESPONSE");
  assert.equal(calls[0].init.method, "GET");
  assert.equal(calls[0].init.credentials, "include");
  assert.deepEqual(Object.keys(calls[0].init.headers).filter((h) => !/^(accept|x-shs-preferred-organization-id)$/i.test(h)), [], "no credential headers");
  assert.equal(calls[0].url, "/api/agent-fabric/command/runs");
  assert.equal((await fetchLive(null)).state, "INVALID_RESPONSE", "an unsafe id never reaches the network");
});

test("source: Live Operations has no mutation path and no privileged transport", () => {
  const dir = new URL("../src/pages/admin/agent-fabric-command/", import.meta.url);
  const files = ["liveOperationsModel.js", "liveOperationsClient.js", "useLiveOperations.js", "components/LiveOperations.jsx", "components/RunFocus.jsx", "components/LiveOperationsParts.jsx"];
  const code = files.map((f) => fs.readFileSync(new URL(f, dir), "utf8")).join("\n").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(code, /method:\s*["'](POST|PUT|PATCH|DELETE)/i);
  assert.doesNotMatch(code, /x-admin-key|ADMIN_API_KEY|x-shf-service|localStorage|sessionStorage/i);
  assert.doesNotMatch(code, /fabricUrl|FABRIC_API_BASE|\/fabric-api/, "never a direct Fabric call");
});

test("UNKNOWN labels do not claim a conflict the backend did not report", () => {
  // Fabric derives UNKNOWN for conflicts, missing run events and unsupported plan statuses alike.
  assert.equal(runStateCopy("UNKNOWN").label, "State undetermined");
  const run = normalizeRun({ ...raw("r-unk", "UNKNOWN"), state_derivation: { state: "UNKNOWN", reason_code: "RUN_EVENT_MISSING", conflict: false } });
  assert.equal(run.stateReason, "RUN_EVENT_MISSING", "the reason travels with the state");
  assert.equal(attentionReason(run), "UNKNOWN");
});

test("agent version falls back to the execution record when the agent block lacks it", () => {
  const fromExecution = normalizeRun({ ...raw("r-v1", "COMPLETED"), agent: { name: "A", version: "NOT_CAPTURED" }, execution: { agent_version: "2.4.0" } });
  assert.equal(fromExecution.agent.version, "2.4.0");
  const fromAgent = normalizeRun({ ...raw("r-v2", "COMPLETED"), agent: { name: "A", version: "1.0.0" }, execution: { agent_version: "2.4.0" } });
  assert.equal(fromAgent.agent.version, "1.0.0", "the agent record wins when it has a value");
  assert.equal(display(normalizeRun(raw("r-v3", "COMPLETED")).agent.version).text, "Not available");
});

test("topology hands off to Live Operations by navigation only", () => {
  const dir = new URL("../src/pages/admin/agent-fabric-command/components/", import.meta.url);
  const drawer = fs.readFileSync(new URL("CommandDrawer.jsx", dir), "utf8");
  const overview = fs.readFileSync(new URL("CommandOverview.jsx", dir), "utf8");
  for (const code of [drawer, overview]) assert.match(code, /to="\/agent-fabric\/command\/operations"/);
  assert.match(drawer, /selection\.key === HUB_ID/, "the Agent Fabric hub node links to Live Operations");
});
