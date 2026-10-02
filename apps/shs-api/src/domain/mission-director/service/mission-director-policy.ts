import { MISSION_RUNTIME_EVENT_MAX_BYTES } from "../../mission-runtime/model/mission-runtime.js";
import type { MissionDirectorAction, MissionDirectorContext, MissionDirectorEscalationReason } from "../model/mission-director.js";
import { MISSION_DIRECTOR_ESCALATION_REASONS } from "../model/mission-director.js";

const MAX_ACTION_BYTES = 8192;
const MAX_DEPTH = 4;
const FORBIDDEN_KEYS = new Set(["evidence", "credential", "truthspine", "reward", "treasury", "careereligibility", "mastery", "userid", "organizationid", "tenantid", "missionid", "missionversion"]);
const EXECUTABLE = /<\s*script\b|javascript\s*:|\beval\s*\(|\bnew\s+Function\b|\bDROP\s+TABLE\b|\bSELECT\s+.+\s+FROM\b|https?:\/\//i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function exactKeys(value: Record<string, unknown>, keys: string[]) {
  return Object.keys(value).every((key) => keys.includes(key));
}

function inspectJson(value: unknown, depth = 0): boolean {
  if (depth > MAX_DEPTH) return false;
  if (value === null || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "string") return value.length <= 2048 && !EXECUTABLE.test(value);
  if (Array.isArray(value)) return value.length <= 64 && value.every((item) => inspectJson(item, depth + 1));
  if (!isRecord(value)) return false;
  return Object.entries(value).every(([key, item]) => {
    const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    return !FORBIDDEN_KEYS.has(normalized) && !normalized.includes("token") && !EXECUTABLE.test(key) && inspectJson(item, depth + 1);
  });
}

function declaredEventTypes(context: MissionDirectorContext) {
  const types = new Set<string>();
  const visit = (condition: any) => { if (condition?.type === "EVENT_OCCURRED" && typeof condition.eventType === "string") types.add(condition.eventType); };
  context.definitionSnapshot.objectives.forEach((item) => visit(item.completionRule));
  context.definitionSnapshot.stages.forEach((stage) => [...stage.entryConditions, ...stage.exitConditions].forEach(visit));
  [...context.definitionSnapshot.successConditions, ...context.definitionSnapshot.failureConditions].forEach(visit);
  return types;
}

function declaredStateConditions(context: MissionDirectorContext, key: string) {
  const found: Array<{ value: unknown; type: string }> = [];
  const visit = (condition: any) => {
    if ((condition?.type === "STATE_EQUALS" || condition?.type === "STATE_THRESHOLD") && condition.stateKey === key) {
      found.push({ value: condition.value, type: condition.type });
    }
  };
  context.definitionSnapshot.objectives.forEach((item) => visit(item.completionRule));
  context.definitionSnapshot.stages.forEach((stage) => [...stage.entryConditions, ...stage.exitConditions].forEach(visit));
  [...context.definitionSnapshot.successConditions, ...context.definitionSnapshot.failureConditions].forEach(visit);
  return found;
}

export type MissionDirectorPolicyResult = { ok: true; action: MissionDirectorAction } | { ok: false; reason: string };

export function validateMissionDirectorAction(
  context: MissionDirectorContext,
  expectedRevision: number,
  proposal: unknown,
  scope: { organizationId: string; tenantId: string },
): MissionDirectorPolicyResult {
  if (context.organizationId !== scope.organizationId) return { ok: false, reason: "ORGANIZATION_MISMATCH" };
  if (context.tenantId !== scope.tenantId) return { ok: false, reason: "TENANT_MISMATCH" };
  if (!context.aiCapabilities.missionDirector) return { ok: false, reason: "CAPABILITY_DENIED" };
  if (!Number.isSafeInteger(expectedRevision) || context.runtimeRevision !== expectedRevision) return { ok: false, reason: "STALE_REVISION" };
  if (context.runtimeStatus !== "ACTIVE") return { ok: false, reason: "RUNTIME_NOT_ACTIVE" };
  if (!isRecord(proposal) || Buffer.byteLength(JSON.stringify(proposal), "utf8") > MAX_ACTION_BYTES || !inspectJson(proposal)) return { ok: false, reason: "PROPOSAL_INVALID_OR_OVERSIZED" };
  if (proposal.type === "NO_OP" && exactKeys(proposal, ["type"])) return { ok: true, action: { type: "NO_OP" } };
  if (proposal.type === "EMIT_DECLARED_EVENT" && exactKeys(proposal, ["type", "eventType", "payload"])) {
    if (!context.aiCapabilities.scenarioVariation) return { ok: false, reason: "SCENARIO_VARIATION_DENIED" };
    if (typeof proposal.eventType !== "string" || !declaredEventTypes(context).has(proposal.eventType)) return { ok: false, reason: "EVENT_NOT_DECLARED" };
    const payload = proposal.payload === undefined ? {} : proposal.payload;
    if (!isRecord(payload) || Buffer.byteLength(JSON.stringify(payload), "utf8") > MISSION_RUNTIME_EVENT_MAX_BYTES) return { ok: false, reason: "EVENT_PAYLOAD_INVALID" };
    return { ok: true, action: { type: "EMIT_DECLARED_EVENT", eventType: proposal.eventType, payload } };
  }
  if (proposal.type === "SET_DECLARED_RUNTIME_STATE" && exactKeys(proposal, ["type", "key", "value"])) {
    if (typeof proposal.key !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(proposal.key)) return { ok: false, reason: "STATE_KEY_INVALID" };
    const conditions = declaredStateConditions(context, proposal.key);
    if (!conditions.length) return { ok: false, reason: "STATE_KEY_NOT_DECLARED" };
    if (!["string", "number", "boolean"].includes(typeof proposal.value) || (typeof proposal.value === "number" && !Number.isFinite(proposal.value))) return { ok: false, reason: "STATE_VALUE_INVALID" };
    if (conditions.some(({ value }) => typeof value !== typeof proposal.value)) return { ok: false, reason: "STATE_VALUE_TYPE_INVALID" };
    return { ok: true, action: { type: "SET_DECLARED_RUNTIME_STATE", key: proposal.key, value: proposal.value as string | number | boolean } };
  }
  if (proposal.type === "ESCALATE" && exactKeys(proposal, ["type", "reasonCode", "message"])) {
    if (!MISSION_DIRECTOR_ESCALATION_REASONS.includes(proposal.reasonCode as MissionDirectorEscalationReason)) return { ok: false, reason: "ESCALATION_REASON_INVALID" };
    if (proposal.message !== undefined && (typeof proposal.message !== "string" || proposal.message.length > 500 || EXECUTABLE.test(proposal.message))) return { ok: false, reason: "ESCALATION_MESSAGE_INVALID" };
    return { ok: true, action: { type: "ESCALATE", reasonCode: proposal.reasonCode as MissionDirectorEscalationReason, ...(typeof proposal.message === "string" ? { message: proposal.message } : {}) } };
  }
  return { ok: false, reason: "ACTION_UNSUPPORTED_OR_FIELDS_INVALID" };
}
