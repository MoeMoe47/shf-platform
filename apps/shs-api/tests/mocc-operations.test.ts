// Phase 9 — Core MOCC operations (API): authorization, audit persistence, organization isolation, read-only program
// and Mission/Arcade observability, and the authority boundary.
// The MOCC coordinates authorities; it does not replace them.
// Workforce program activation remains a workforce/program authority and is not owned by MOCC.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import express from "express";
import type { Server } from "node:http";
import { query } from "../src/db/client.js";
import { writeAuditEvent } from "../src/domain/audit/service/audit-helper.js";
import { SHS_SECURITY_PERMISSIONS } from "../src/auth/security-permissions.js";
import { registerMoccOperationsRoutes } from "../src/domain/metaverse/operations/api/routes.js";
import { MoccOperationsService } from "../src/domain/metaverse/operations/service/mocc-operations-service.js";
import { DATA_CENTER_PROGRAM_ID } from "../src/domain/workforce-foundation/registry/programs/data-center-community-workforce.js";
import { WorkforceFoundationService } from "../src/domain/workforce-foundation/service/workforce-foundation-service.js";

const RUN = `mocc9_${Date.now()}`;
const ORG = `org_${RUN}`;
const OTHER_ORG = `other_org_${RUN}`;
const VIEW = SHS_SECURITY_PERMISSIONS.METAVERSE_OPERATIONS_VIEW;
const OPERATE = SHS_SECURITY_PERMISSIONS.METAVERSE_OPERATIONS_OPERATE;
const operator = { user_id: `operator_${RUN}`, organization_id: ORG, permissions: [VIEW, OPERATE] };
const viewer = { user_id: `viewer_${RUN}`, organization_id: ORG, permissions: [VIEW] };
const outsider = { user_id: `outsider_${RUN}`, organization_id: OTHER_ORG, permissions: [VIEW, OPERATE] };
// Fail-closed fixtures: a separate organization whose service can be told to fail its audit writes.
const FC_ORG = `fc_org_${RUN}`;
const fcOperator = { user_id: `fc_operator_${RUN}`, organization_id: FC_ORG, permissions: [VIEW, OPERATE] };
const fcViewer = { user_id: `fc_viewer_${RUN}`, organization_id: FC_ORG, permissions: [VIEW] };
const ORGS = [ORG, OTHER_ORG, FC_ORG];
const USERS = [`operator_${RUN}`, `viewer_${RUN}`, `outsider_${RUN}`, fcOperator.user_id, fcViewer.user_id];
const PACKET = { programId: "SYNTHETIC_PROGRAM", status: "INTEGRATION_READINESS", executionLevel: "STANDALONE", activeMissionTypes: ["synthetic-mission@1"] };
const COUNTED = ["prepare_prove_evidence", "learner_competency_decisions", "learner_credentials", "truth_spine_records", "career_events", "mission_runtime_sessions", "arcade_results"];
// Keys that would carry personal data; boolean policy flags such as containsLearnerIdentity are not keys of this shape.
const PII = /"(learner_?id|user_?name|full_?name|email|accommodations?|diagnos\w*|medical\w*|credential_?id|ssn|\w*token|password|date_of_birth)"\s*:/i;

// Program and Mission/Arcade authorities are injected as aggregate-only stand-ins; audit goes to the real table.
const service = new MoccOperationsService({
  programImpact: async (actor) => (actor.organization_id === ORG ? [PACKET] : []),
  missionObservability: async () => ({ readOnly: true, missionRuntimesByStatus: { ACTIVE: 2 }, teams: { active: 1 }, containsLearnerIdentity: false }),
});

let server: Server;
let base = "";
async function counts() {
  return Object.fromEntries(await Promise.all(COUNTED.map(async (table) => [table, Number((await query(`SELECT COUNT(*)::int AS count FROM ${table}`)).rows[0].count)])));
}
async function auditRows(org = ORG) {
  return (await query(`SELECT actor_user_id, target_object_type, target_object_id, action_type, new_state_json, source_channel, organization_id
    FROM audit_events WHERE organization_id=$1 AND source_channel='mocc' ORDER BY created_at, audit_event_id`, [org])).rows;
}
let baseline: Record<string, number> = {};

before(async () => {
  await query(`INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status) VALUES ($1,$2,$2,'nonprofit','active'),($3,$4,$4,'partner','active'),($5,$6,$6,'partner','active')`,
    [ORG, RUN, OTHER_ORG, `${RUN} Other`, FC_ORG, `${RUN} Fail-closed`]);
  for (const [userId, org] of [[operator.user_id, ORG], [viewer.user_id, ORG], [outsider.user_id, OTHER_ORG], [fcOperator.user_id, FC_ORG], [fcViewer.user_id, FC_ORG]]) {
    await query(`INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source) VALUES ($1,$2,$3,$4,'active','local')`, [userId, org, `${userId}@test.invalid`, `Person ${userId.split("_")[0]}`]);
  }
  baseline = await counts();
  const app = express();
  app.use(express.json());
  // Test identity middleware: the authenticated user comes from the header, never from the body.
  app.use((req: any, _res, next) => {
    const raw = req.header("x-test-user");
    if (raw) { const user = JSON.parse(raw); req.user = { ...user, active_organization_id: user.organization_id, tenant_id: `tenant:${user.organization_id}` }; }
    next();
  });
  registerMoccOperationsRoutes(app, { service });
  await new Promise<void>((resolve) => { server = app.listen(0, () => resolve()); });
  base = `http://127.0.0.1:${(server.address() as any).port}`;
});

after(async () => {
  server?.close();
  service.dispose(ORG);
  service.dispose(OTHER_ORG);
  fcService.dispose(FC_ORG);
  await query(`DELETE FROM audit_events WHERE organization_id = ANY($1::text[]) AND source_channel='mocc'`, [ORGS]);
  await query(`DELETE FROM users WHERE user_id = ANY($1::text[])`, [USERS]);
  await query(`DELETE FROM organizations WHERE organization_id = ANY($1::text[])`, [ORGS]);
  assert.equal(Number((await query(`SELECT COUNT(*)::int AS count FROM audit_events WHERE organization_id = ANY($1::text[])`, [ORGS])).rows[0].count), 0, "audit residue");
});

const call = async (method: string, path: string, user: unknown, body?: unknown) => {
  const response = await fetch(`${base}${path}`, { method, headers: { "content-type": "application/json", ...(user ? { "x-test-user": JSON.stringify(user) } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: response.status, body: await response.json() as any };
};

test("anonymous and unpermitted callers are refused; no anonymous control action", async () => {
  assert.equal((await call("GET", "/metaverse/operations", null)).status, 401);
  assert.equal((await call("POST", "/metaverse/operations/actions/START_SIMULATION", null)).status, 401);
  assert.equal((await call("GET", "/metaverse/operations", { ...viewer, permissions: [] })).status, 403);
  await assert.rejects(service.act({ organization_id: ORG, permissions: [VIEW, OPERATE] }, "START_SIMULATION"), (error: any) => error.code === "ANONYMOUS_OPERATOR");
  // The new permissions are not granted to any role by default.
  assert.equal(VIEW, "metaverse.operations.view");
  assert.equal(OPERATE, "metaverse.operations.operate");
});

test("authorized operator actions execute against simulated state only and are persisted to audit_events", async () => {
  const started = await call("POST", "/metaverse/operations/actions/START_SIMULATION", operator);
  assert.deepEqual([started.status, started.body.data.decision], [200, "EXECUTED"]);
  const scenario = await call("POST", "/metaverse/operations/actions/START_SCENARIO", operator, { regionalScenarioId: "REGIONAL_POWER_DISRUPTION" });
  assert.equal(scenario.body.data.decision, "EXECUTED");
  const denied = await call("POST", "/metaverse/operations/actions/START_SIMULATION", viewer);
  assert.deepEqual([denied.status, denied.body.data.decision, denied.body.data.result.reason], [200, "NOT_AUTHORIZED", `MISSING_PERMISSION:${OPERATE}`]);
  const bypass = await call("POST", "/metaverse/operations/actions/executeCommand", operator, { system: "road-traffic", payload: { close: true } });
  assert.equal(bypass.body.data.decision, "NOT_ALLOWED");
  const rows = await auditRows();
  assert.deepEqual(rows.map((row: any) => [row.target_object_id, row.action_type]),
    [["START_SIMULATION", "MOCC_AUTHORIZED"], ["START_SIMULATION", "MOCC_EXECUTED"], ["START_SCENARIO", "MOCC_AUTHORIZED"], ["START_SCENARIO", "MOCC_EXECUTED"],
      ["START_SIMULATION", "MOCC_NOT_AUTHORIZED"], ["executeCommand", "MOCC_NOT_ALLOWED"]], "mutations write a durable AUTHORIZED intent before their result");
  for (const row of rows) {
    assert.deepEqual([row.target_object_type, row.source_channel, row.organization_id], ["mocc_operator_action", "mocc", ORG]);
    assert.equal(row.new_state_json.simulationMode, "SIMULATED");
    assert.doesNotMatch(JSON.stringify(row.new_state_json), PII);
  }
});

test("domain actions are REQUEST_ONLY; MOCC never activates workforce programs", async () => {
  const request = await call("POST", "/metaverse/operations/actions/REQUEST_DOMAIN_ACTION", operator, { targetSystem: "road-traffic", action: "CONSIDER_CLOSURE", subjectRef: "route-1", reason: "storm" });
  assert.deepEqual([request.body.data.decision, request.body.data.result.executed], ["REQUEST_ONLY", false]);
  const activation = await call("POST", "/metaverse/operations/actions/REQUEST_DOMAIN_ACTION", operator, { targetSystem: "workforce-activation", action: "ACTIVATE", reason: "go live" });
  assert.deepEqual([activation.body.data.decision, activation.body.data.result.reason], ["NOT_AUTHORIZED", "WORKFORCE_ACTIVATION_OWNED_BY_WORKFORCE_AUTHORITY"]);
  const view = (await call("GET", "/metaverse/operations", viewer)).body.data;
  assert.equal(view.contract.ownsWorkforceActivation, false);
  assert.ok(!view.operatorActions.some((item: any) => /ACTIVATE/.test(item.controlId)));
});

test("reads are organization-scoped: another organization sees neither the session nor its audit", async () => {
  const mine = (await call("GET", "/metaverse/operations", viewer)).body.data;
  const theirs = (await call("GET", "/metaverse/operations", outsider)).body.data;
  assert.equal(mine.topBar.simulationStatus, "RUNNING");
  assert.equal(theirs.topBar.simulationStatus, "STOPPED");
  assert.deepEqual([theirs.audit, theirs.timeline.entries, theirs.programImpact.programs], [[], [], []]);
  assert.ok(mine.audit.length >= 4 && mine.audit.every((record: any) => record.simulationId === `regional:${ORG}`));
  // An org in the request body cannot redirect the session.
  await call("POST", "/metaverse/operations/actions/PAUSE_SIMULATION", outsider, { organization_id: ORG });
  assert.equal((await call("GET", "/metaverse/operations", viewer)).body.data.topBar.simulationStatus, "RUNNING");
});

test("program impact uses Phase 8 packets and Mission/Arcade observability is aggregate, without PII", async () => {
  const view = (await call("GET", "/metaverse/operations", viewer)).body.data;
  assert.deepEqual(view.programImpact, { readOnly: true, programs: [PACKET] });
  assert.deepEqual(view.missionObservability.containsLearnerIdentity, false);
  const { permissions: _permissions, ...rest } = view;
  const leak = JSON.stringify(rest).match(PII);
  assert.equal(leak, null, `PII-like key: ${leak?.[0]} near ${leak ? JSON.stringify(rest).slice(Math.max(0, leak.index! - 80), leak.index! + 40) : ""}`);
  // A failing upstream authority degrades to UNAVAILABLE rather than breaking the MOCC.
  const failing = new MoccOperationsService({ audit: async () => null, programImpact: async () => { throw new Error("down"); }, missionObservability: async () => { throw new Error("down"); } });
  const degraded = await failing.getView(viewer);
  assert.deepEqual([degraded.programImpact.programs, degraded.missionObservability.status], [[], "UNAVAILABLE"]);
});

test("67/68 simulation, scenario and replay create no evidence, credential, career, Mission or Arcade rows", async () => {
  await call("POST", "/metaverse/operations/actions/ADVANCE_SIMULATION", operator, { advanceMs: 1300 * 1000 });
  const replay = await call("POST", "/metaverse/operations/actions/REPLAY_EVENT_RANGE", operator, { fromSequence: 1, toSequence: 3 });
  assert.deepEqual([replay.body.data.decision, replay.body.data.result.label], ["EXECUTED", "REPLAY"]);
  assert.deepEqual(await counts(), baseline);
});

test("69/70 the Data Center program is re-evaluated against regional simulation and does not become LIVING_WORLD", async () => {
  const packets = await new WorkforceFoundationService().moccProgramPackets({ user_id: "phase9-read-only-check", organization_id: "org_shf_001" });
  const dataCenter = packets.programs.find((item) => item.programId === DATA_CENTER_PROGRAM_ID);
  assert.ok(dataCenter);
  assert.notEqual(dataCenter.executionLevel, "LIVING_WORLD");
  assert.equal(dataCenter.executionLevel, "STANDALONE");
});

// ---------------------------------------------------------------- fail-closed audit
// No durable audit record, no MOCC-owned simulation mutation.
let failAudit = false;
const fcService = new MoccOperationsService({
  audit: async (row) => { if (failAudit) throw new Error("audit store unavailable"); return writeAuditEvent(row); },
  programImpact: async () => [],
  missionObservability: async () => ({ readOnly: true, containsLearnerIdentity: false }),
});
const fcState = async () => {
  const view = await fcService.getView(fcViewer);
  return { status: view.topBar.simulationStatus, clock: view.topBar.worldClock, scenario: view.topBar.scenario, scenarios: view.scenarios.length, events: view.timeline.entries.length };
};
const failing = async (actor: any, controlId: string, params: Record<string, unknown> = {}) => {
  failAudit = true;
  try {
    await assert.rejects(fcService.act(actor, controlId, params), (error: any) => error.code === "AUDIT_PERSISTENCE_FAILED" && error.statusCode === 503);
  } finally { failAudit = false; }
};
const fcRows = async () => (await query(`SELECT action_type, target_object_id, correlation_id, new_state_json FROM audit_events WHERE organization_id=$1 AND source_channel='mocc'`, [FC_ORG])).rows;

test("fail-closed 2: START_SIMULATION with a failing audit write fails and the simulation stays STOPPED", async () => {
  const before = await fcState();
  assert.equal(before.status, "STOPPED");
  await failing(fcOperator, "START_SIMULATION");
  assert.deepEqual(await fcState(), before);
  assert.equal((await fcRows()).length, 0, "nothing was audited, so nothing was applied");
});

test("fail-closed 1/9: START_SIMULATION with a successful audit runs, with durable intent and result rows", async () => {
  const outcome = await fcService.act(fcOperator, "START_SIMULATION");
  assert.deepEqual([outcome.decision, outcome.resultAuditPersisted], ["EXECUTED", true]);
  assert.equal((await fcState()).status, "RUNNING");
  const rows = await fcRows();
  assert.deepEqual(rows.map((row: any) => row.action_type).sort(), ["MOCC_AUTHORIZED", "MOCC_EXECUTED"]);
  assert.equal(new Set(rows.map((row: any) => row.correlation_id)).size, 1);
  assert.deepEqual(rows.map((row: any) => row.new_state_json.phase).sort(), ["INTENT", "RESULT"]);
});

test("fail-closed 3/4/5/6: PAUSE, ADVANCE, START_SCENARIO and RESET with a failing audit change nothing", async () => {
  await fcService.act(fcOperator, "ADVANCE_SIMULATION", { advanceMs: 60000 });
  const before = await fcState();
  assert.deepEqual([before.status, before.clock], ["RUNNING", "2026-01-01T08:01:00.000Z"]);
  await failing(fcOperator, "PAUSE_SIMULATION");
  assert.equal((await fcState()).status, "RUNNING", "3: still RUNNING");
  await failing(fcOperator, "ADVANCE_SIMULATION", { advanceMs: 3600000 });
  assert.equal((await fcState()).clock, before.clock, "4: simulation time did not advance");
  await failing(fcOperator, "START_SCENARIO", { regionalScenarioId: "REGIONAL_POWER_DISRUPTION" });
  assert.deepEqual([(await fcState()).scenario, (await fcState()).scenarios], [null, 0], "5: scenario not activated");
  await failing(fcOperator, "RESET_SIMULATION", { confirmed: true, reason: "drill" });
  assert.deepEqual(await fcState(), before, "6: state was not reset");
  for (const controlId of ["PAUSE_SCENARIO", "RESUME_SCENARIO", "STOP_SCENARIO", "RESUME_SIMULATION"]) {
    await failing(fcOperator, controlId, { regionalScenarioId: "REGIONAL_POWER_DISRUPTION", confirmed: true, reason: "drill" });
  }
  assert.deepEqual(await fcState(), before);
});

test("fail-closed 7/8: unauthorized and REQUEST_ONLY actions change no state, with or without audit", async () => {
  const before = await fcState();
  assert.equal((await fcService.act(fcViewer, "RESET_SIMULATION", { confirmed: true, reason: "x" })).decision, "NOT_AUTHORIZED");
  await failing(fcViewer, "START_SCENARIO", { regionalScenarioId: "REGIONAL_POWER_DISRUPTION" });
  const request = await fcService.act(fcOperator, "REQUEST_DOMAIN_ACTION", { targetSystem: "road-traffic", action: "CONSIDER_CLOSURE", subjectRef: "route-1", reason: "storm" });
  assert.deepEqual([request.decision, request.result.executed], ["REQUEST_ONLY", false]);
  const activation = await fcService.act(fcOperator, "REQUEST_DOMAIN_ACTION", { targetSystem: "workforce-activation", action: "ACTIVATE", reason: "go" });
  assert.equal(activation.decision, "NOT_AUTHORIZED");
  assert.deepEqual(await fcState(), before);
});

test("fail-closed 10: every committed mutation has a durable AUTHORIZED intent with the same correlation id", async () => {
  await fcService.act(fcOperator, "START_SCENARIO", { regionalScenarioId: "REGIONAL_POWER_DISRUPTION" });
  await fcService.act(fcOperator, "PAUSE_SIMULATION");
  const rows = await fcRows();
  const mutating = new Set(["START_SIMULATION", "PAUSE_SIMULATION", "RESUME_SIMULATION", "RESET_SIMULATION", "ADVANCE_SIMULATION", "START_SCENARIO", "PAUSE_SCENARIO", "RESUME_SCENARIO", "STOP_SCENARIO"]);
  const results = rows.filter((row: any) => mutating.has(row.target_object_id) && row.new_state_json.phase === "RESULT" && row.action_type === "MOCC_EXECUTED");
  assert.equal(results.length, 4, "START_SIMULATION, ADVANCE, START_SCENARIO, PAUSE");
  for (const result of results) {
    assert.ok(rows.some((row: any) => row.action_type === "MOCC_AUTHORIZED" && row.correlation_id === result.correlation_id && row.target_object_id === result.target_object_id), result.target_object_id);
  }
  // Every intent belongs to an attempt that was allowed to run: failed-audit attempts left no rows at all.
  assert.equal(rows.filter((row: any) => row.action_type === "MOCC_AUTHORIZED").length, 4);
  assert.equal((await fcState()).status, "PAUSED");
});
