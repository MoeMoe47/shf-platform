// Phase 9 — MOCC operator action contract (allow-listed) and operator audit.
//
// The MOCC coordinates authorities; it does not replace them. There is no generic executeCommand(system, payload):
// every control is declared here with its target, owning authority, permission and audit requirements. Controls
// execute only against simulated regional state the Regional Simulation Authority owns. Anything addressed to a
// domain authority is REQUEST_ONLY (a record, never executed). Workforce program activation remains a
// workforce/program authority and is not owned by MOCC.

import { createMolActionRequest } from "../mol/molCoordination.js";

export const MOCC_PERMISSIONS = Object.freeze({ VIEW: "metaverse.operations.view", OPERATE: "metaverse.operations.operate" });
export const MOCC_DECISIONS = Object.freeze(["AUTHORIZED", "EXECUTED", "REQUEST_ONLY", "NOT_AUTHORIZED", "NOT_ALLOWED", "REJECTED", "CONFIRMATION_REQUIRED", "REASON_REQUIRED", "AUDIT_FAILED"]);
// Domains MOCC can never act for, even by request.
export const MOCC_NEVER_CONTROLS = Object.freeze(["workforce-activation", "curriculum", "careers", "verified-evidence", "truth-spine", "credentials", "identity",
  "funding", "treasury", "mission-runtime", "arcade-runtime"]);

const control = (controlId, fields) => Object.freeze({
  controlId, targetSystem: "regional-simulation", requiredPermission: MOCC_PERMISSIONS.OPERATE, owningAuthority: "REGIONAL_SIMULATION",
  simulationOnly: true, liveAllowed: false, auditRequired: true, confirmationRequired: false, reasonRequired: false, ...fields,
});

export const MOCC_CONTROLS = Object.freeze([
  control("START_SIMULATION"),
  control("PAUSE_SIMULATION"),
  control("RESUME_SIMULATION"),
  control("RESET_SIMULATION", { confirmationRequired: true, reasonRequired: true }),
  control("ADVANCE_SIMULATION"),
  control("START_SCENARIO"),
  control("PAUSE_SCENARIO"),
  control("RESUME_SCENARIO"),
  control("STOP_SCENARIO", { confirmationRequired: true, reasonRequired: true }),
  control("REPLAY_EVENT_RANGE", { requiredPermission: MOCC_PERMISSIONS.VIEW }),
  control("TOGGLE_OVERLAY", { targetSystem: "mocc", owningAuthority: "MOCC_PRESENTATION", requiredPermission: MOCC_PERMISSIONS.VIEW }),
  // Addressed to a domain authority: always a record, never an execution.
  control("REQUEST_DOMAIN_ACTION", { targetSystem: "domain", owningAuthority: "TARGET_DOMAIN", simulationOnly: false, reasonRequired: true }),
]);

const BY_ID = new Map(MOCC_CONTROLS.map((item) => [item.controlId, item]));
export function getMoccControl(controlId) {
  return BY_ID.get(controlId) ?? null;
}

// Bounded, append-only operator audit. A sink (e.g. the API's audit_events writer) may persist each record.
export function createMoccAuditLog({ sink = null, limit = 500 } = {}) {
  const records = [];
  let sequence = 0;
  return Object.freeze({
    append(record) {
      sequence += 1;
      const entry = Object.freeze({ auditId: `mocc-audit-${sequence}`, sequence, ...record });
      records.push(entry);
      while (records.length > limit) records.shift();
      if (sink) sink(entry);
      return entry;
    },
    list: () => records.map((item) => ({ ...item })),
  });
}

const STATE_CONTROLS = Object.freeze({
  START_SIMULATION: (sim) => sim.start(),
  PAUSE_SIMULATION: (sim) => sim.pause(),
  RESUME_SIMULATION: (sim) => sim.resume(),
  RESET_SIMULATION: (sim) => sim.reset(),
  ADVANCE_SIMULATION: (sim, params) => sim.advance(Number(params.advanceMs ?? 0)),
  START_SCENARIO: (sim, params) => sim.startScenario(String(params.regionalScenarioId ?? ""), { seed: params.seed }),
  PAUSE_SCENARIO: (sim, params) => sim.pauseScenario(String(params.regionalScenarioId ?? "")),
  RESUME_SCENARIO: (sim, params) => sim.resumeScenario(String(params.regionalScenarioId ?? "")),
  STOP_SCENARIO: (sim, params) => sim.stopScenario(String(params.regionalScenarioId ?? "")),
});
// Controls that change Regional Simulation state. No durable audit record, no MOCC-owned simulation mutation.
export const MOCC_MUTATING_CONTROL_IDS = Object.freeze(Object.keys(STATE_CONTROLS));

// Pure decision step: validates operator, control, permission, confirmation and reason, and decides what would
// happen. It never mutates anything; mutations are returned as a deferred `apply` the caller runs only after the
// intent record is audited.
export function planMoccOperatorAction({ simulation, operator, controlId, params = {}, presentation = null, correlationId = null }) {
  const item = getMoccControl(controlId);
  const operatorId = String(operator?.operatorId ?? "");
  const permissions = Array.isArray(operator?.permissions) ? operator.permissions : [];
  // Read at call time, so an intent record carries pre-mutation state and a result record post-mutation state.
  const record = (decision, result, phase) => {
    const state = simulation?.getState?.();
    return {
      operatorId, controlId: String(controlId), targetSystem: item?.targetSystem ?? null, owningAuthority: item?.owningAuthority ?? null,
      simulationId: state?.simulationId ?? null, simulationMode: state?.environmentMode ?? null, simulationTime: state?.clock.simulationTime ?? null,
      decision, phase, reason: typeof params.reason === "string" ? params.reason.slice(0, 200) : null, result,
      correlationId: correlationId ?? `mocc:${state?.simulationId ?? "none"}:${controlId}`,
    };
  };
  const final = (decision, result) => ({ record, final: { decision, result }, mutatesSimulation: false, apply: null });

  if (!operatorId) return final("NOT_AUTHORIZED", { ok: false, reason: "ANONYMOUS_OPERATOR" });
  if (!item) return final("NOT_ALLOWED", { ok: false, reason: "CONTROL_NOT_ALLOW_LISTED" });
  if (!permissions.includes(item.requiredPermission)) return final("NOT_AUTHORIZED", { ok: false, reason: `MISSING_PERMISSION:${item.requiredPermission}` });
  if (item.confirmationRequired && params.confirmed !== true) return final("CONFIRMATION_REQUIRED", { ok: false, reason: "CONFIRMATION_REQUIRED" });
  if (item.reasonRequired && !(typeof params.reason === "string" && params.reason.trim())) return final("REASON_REQUIRED", { ok: false, reason: "JUSTIFICATION_REQUIRED" });

  if (controlId === "REQUEST_DOMAIN_ACTION") {
    const target = String(params.targetSystem ?? "");
    if (MOCC_NEVER_CONTROLS.includes(target)) {
      return final("NOT_AUTHORIZED", { ok: false, reason: target === "workforce-activation" ? "WORKFORCE_ACTIVATION_OWNED_BY_WORKFORCE_AUTHORITY" : "TARGET_OUTSIDE_MOCC_AUTHORITY" });
    }
    const request = createMolActionRequest({ targetSystem: target, action: String(params.action ?? ""), causationEventId: String(params.causationEventId ?? "operator"),
      correlationId: correlationId ?? "mocc", subjectRef: String(params.subjectRef ?? "none") });
    if (!request.ok) return final("NOT_AUTHORIZED", { ok: false, reason: request.reason });
    return final("REQUEST_ONLY", { ok: true, request: request.request, executed: false });
  }
  if (controlId === "TOGGLE_OVERLAY") {
    if (!presentation) return final("REJECTED", { ok: false, reason: "NO_PRESENTATION_STATE" });
    // Presentation state only (the operator's own overlay visibility); not simulation state.
    return { record, final: null, mutatesSimulation: false, apply: () => ({ decision: "EXECUTED", result: presentation.toggleOverlay(String(params.overlayId ?? "")) }) };
  }
  if (controlId === "REPLAY_EVENT_RANGE") {
    // Replay is read-only over the simulation's own log; the caller builds the session from this range.
    const events = simulation?.getEvents?.() ?? [];
    const from = Number(params.fromSequence ?? 1);
    const to = Number(params.toSequence ?? events.length);
    const valid = Number.isInteger(from) && Number.isInteger(to) && from >= 1 && to <= events.length && from <= to;
    return final(valid ? "EXECUTED" : "REJECTED", valid ? { ok: true, range: { fromSequence: from, toSequence: to }, label: "REPLAY" } : { ok: false, reason: "REPLAY_RANGE_INVALID" });
  }
  if (!simulation) return final("REJECTED", { ok: false, reason: "NO_SIMULATION" });
  return {
    record, final: null, mutatesSimulation: true,
    apply: () => {
      const outcome = STATE_CONTROLS[controlId](simulation, params);
      return { decision: outcome.ok ? "EXECUTED" : "REJECTED", result: outcome };
    },
  };
}

// Synchronous executor for in-memory audit logs (dev/test surface). Every attempt is audited — allowed, rejected or
// unauthorized. For a mutating control the AUTHORIZED intent is appended before the mutation runs, so a throwing
// audit sink prevents the mutation. Operator identity is the operator's id only.
export function executeMoccOperatorAction({ simulation, operator, controlId, params = {}, auditLog, presentation = null, correlationId = null }) {
  const plan = planMoccOperatorAction({ simulation, operator, controlId, params, presentation, correlationId });
  if (plan.final) return { ...plan.final, audit: auditLog.append(plan.record(plan.final.decision, plan.final.result, "RESULT")) };
  if (plan.mutatesSimulation) auditLog.append(plan.record("AUTHORIZED", { ok: true, reason: null }, "INTENT"));
  const outcome = plan.apply();
  return { ...outcome, audit: auditLog.append(plan.record(outcome.decision, outcome.result, "RESULT")) };
}

// Durable executor: `persistAudit(record)` writes to a durable store and may reject.
// No durable audit record, no MOCC-owned simulation mutation: for a mutating control the AUTHORIZED intent is
// persisted first and the simulation mutation runs only after that write has succeeded. If it fails, the mutation is
// never applied and the decision is AUDIT_FAILED. The RESULT record is then persisted; if only that write fails, the
// mutation is still covered by its durable intent record and `resultAuditPersisted` is false.
export async function executeMoccOperatorActionDurable({ simulation, operator, controlId, params = {}, auditLog, persistAudit, presentation = null, correlationId = null }) {
  const plan = planMoccOperatorAction({ simulation, operator, controlId, params, presentation, correlationId });
  const persist = async (entry) => {
    try { await persistAudit(entry); return true; } catch { return false; }
  };
  const failed = { decision: "AUDIT_FAILED", result: { ok: false, reason: "AUDIT_PERSISTENCE_FAILED" }, audit: null, mutated: false };
  let intentAudit = null;
  if (plan.mutatesSimulation) {
    const intent = plan.record("AUTHORIZED", { ok: true, reason: null }, "INTENT");
    if (!(await persist(intent))) return failed;
    intentAudit = auditLog.append(intent);
  }
  if (plan.final) {
    const entry = plan.record(plan.final.decision, plan.final.result, "RESULT");
    if (!(await persist(entry))) return { ...failed, deniedDecision: plan.final.decision };
    return { ...plan.final, audit: auditLog.append(entry), mutated: false, resultAuditPersisted: true };
  }
  const outcome = plan.apply();
  const entry = plan.record(outcome.decision, outcome.result, "RESULT");
  const resultAuditPersisted = await persist(entry);
  return { ...outcome, audit: auditLog.append(entry), intentAudit, mutated: plan.mutatesSimulation && outcome.decision === "EXECUTED", resultAuditPersisted };
}
