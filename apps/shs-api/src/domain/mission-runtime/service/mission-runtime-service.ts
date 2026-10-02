import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { assertValidMissionDefinition, type MissionCondition, type MissionDefinition } from "../../mission-content/model/mission-definition.js";
import {
  MISSION_RUNTIME_EVENT_MAX_BYTES,
  MISSION_RUNTIME_MAX_EVENTS,
  MISSION_RUNTIME_MAX_STATE_DEPTH,
  MISSION_RUNTIME_STATE_MAX_BYTES,
  type MissionObjectiveState,
  type MissionRuntimeEvent,
  type MissionRuntimeSession,
  type MissionRuntimeStatus,
  type MissionStageState,
} from "../model/mission-runtime.js";
import { MissionRuntimeRepo, type MissionDirectorDecisionWrite, type MissionRuntimeMutation, type MissionRuntimeScope } from "../repo/mission-runtime-repo.js";
import { evaluateMissionCondition } from "./condition-evaluator.js";
import type { MissionDirectorAction } from "../../mission-director/model/mission-director.js";
import { MISSION_SYSTEM_EVENTS, initialScenarioState, isReservedStateKey, isSystemEventType } from "../../mission-content/model/mission-scenario.js";
import { isScenarioAction, scenarioActionDenial, scenarioActionEffect } from "../../mission-director/service/mission-director-scenario-rules.js";
import { randomUUID } from "node:crypto";
import { getMissionAccommodationProjection, type MissionAccommodationProvider } from "../../accessibility-accommodations/service/mission-accommodation-projection.js";
import { buildMissionWorldContext, defaultMissionWorldContextProvider, type MissionWorldContextProvider } from "../world/mission-world-context.js";

export interface MissionRuntimeIntegrations {
  world?: MissionWorldContextProvider;
  accommodations?: MissionAccommodationProvider;
}

// Accommodation requirements are frozen at start (MISSION_ACCOMMODATION_PROJECTED) but Mission Runtime
// executes no timing semantics: the accommodation authority has no validated normalized timing policy yet,
// and Mission Runtime must never infer one (extended time is not unlimited time; breaks are not disabled
// expiration). Stage time limits, objectives and mastery rules behave exactly as without accommodation.

const SENSITIVE_KEYS = new Set(["password", "token", "authorization", "cookie", "secret", "credential", "latitude", "longitude", "location", "geolocation", "gps", "clipboard", "microphone", "camera", "keystrokes", "browserhistory", "fingerprint"]);
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;

export class MissionRuntimeError extends Error {
  constructor(public code: string, message: string, public statusCode = 400, public details: Record<string, unknown> = {}) {
    super(message);
    this.name = "MissionRuntimeError";
  }
}

export interface MissionRuntimeActor {
  user_id: string;
  organization_id: string;
  permissions: string[];
}

function scopeFor(actor: MissionRuntimeActor): MissionRuntimeScope {
  if (!hasPermission(actor.permissions, SHS_SECURITY_PERMISSIONS.ARCADE_ATTEMPT)) {
    throw new MissionRuntimeError("FORBIDDEN", "Missing arcade.attempt permission.", 403);
  }
  const organizationId = String(actor.organization_id || "").trim();
  const userId = String(actor.user_id || "").trim();
  if (!organizationId || !userId) throw new MissionRuntimeError("SCOPE_MISSING", "Actor organization/user is required.", 403);
  return { organizationId, tenantId: `tenant:${organizationId}`, userId };
}

function runtimeId(value: unknown) {
  const id = String(value ?? "").trim();
  if (!ID_PATTERN.test(id)) throw new MissionRuntimeError("MISSION_RUNTIME_ID_INVALID", "Mission runtime id is invalid.");
  return id;
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson((value as any)[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function allConditions(conditions: MissionCondition[], context: Parameters<typeof evaluateMissionCondition>[1]) {
  return conditions.every((condition) => evaluateMissionCondition(condition, context));
}

function conditionEventTypes(definition: MissionDefinition): Set<string> {
  const types = new Set<string>();
  const visit = (condition: MissionCondition) => {
    if (condition.type === "EVENT_OCCURRED" || condition.type === "ROLE_EVENT_OCCURRED") types.add(condition.eventType!);
  };
  definition.objectives.forEach((objective) => visit(objective.completionRule));
  definition.stages.forEach((stage) => [...stage.entryConditions, ...stage.exitConditions].forEach(visit));
  [...definition.successConditions, ...definition.failureConditions].forEach(visit);
  return types;
}

function conditionStateKeys(definition: MissionDefinition): Set<string> {
  const keys = new Set<string>();
  const visit = (condition: MissionCondition) => {
    if (condition.type === "STATE_EQUALS" || condition.type === "STATE_THRESHOLD") keys.add(condition.stateKey!);
  };
  definition.objectives.forEach((objective) => visit(objective.completionRule));
  definition.stages.forEach((stage) => [...stage.entryConditions, ...stage.exitConditions].forEach(visit));
  [...definition.successConditions, ...definition.failureConditions].forEach(visit);
  return keys;
}

function assertRunnableDefinition(definition: MissionDefinition) {
  assertValidMissionDefinition(definition);
  if (definition.status !== "PUBLISHED") throw new MissionRuntimeError("MISSION_VERSION_NOT_RUNNABLE", "Only an authorized PUBLISHED Mission Definition snapshot can start runtime.", 409);
  if (!definition.successConditions.length) throw new MissionRuntimeError("MISSION_SUCCESS_RULE_REQUIRED", "A runnable Mission requires at least one success condition.");
  for (const objective of definition.objectives) {
    const condition = objective.completionRule;
    if (condition.type === "OBJECTIVE_COMPLETE" && condition.objectiveId === objective.objectiveId) {
      throw new MissionRuntimeError("MISSION_OBJECTIVE_CYCLE", "An objective cannot require itself to complete.");
    }
  }
  for (const stage of definition.stages) {
    const hasRequiredObjective = stage.objectiveIds.some((id) => definition.objectives.find((objective) => objective.objectiveId === id)?.required);
    if (!hasRequiredObjective && !stage.exitConditions.length) {
      throw new MissionRuntimeError("MISSION_STAGE_NOT_RUNNABLE", `Stage '${stage.stageId}' has no completion condition.`);
    }
  }
}

function initObjectiveStates(definition: MissionDefinition): MissionObjectiveState[] {
  return definition.objectives.map((objective) => ({ objectiveId: objective.objectiveId, status: "PENDING", completedAt: null }));
}

function initStageStates(definition: MissionDefinition): MissionStageState[] {
  return definition.stages.map((stage) => ({ stageId: stage.stageId, status: "LOCKED", startedAt: null, completedAt: null, optional: stage.optional }));
}

function conditionContext(
  objectiveStates: MissionObjectiveState[], stageStates: MissionStageState[], runtimeState: Record<string, unknown>,
  events: readonly (Pick<MissionRuntimeEvent, "eventType"> & { payload?: Record<string, unknown> })[], startedAt: string, now: string,
) {
  return { objectiveStates, stageStates, runtimeState, events, startedAt, now };
}

function advance(
  definition: MissionDefinition,
  current: Pick<MissionRuntimeSession, "objectiveStates" | "stageStates" | "runtimeState" | "startedAt">,
  events: readonly MissionRuntimeEvent[],
  now: string,
): MissionRuntimeMutation {
  const objectiveStates = current.objectiveStates.map((state) => ({ ...state }));
  const stageStates = current.stageStates.map((state) => ({ ...state }));
  const runtimeState = { ...current.runtimeState };

  const expiredStage = definition.stages.find((stage) => {
    const state = stageStates.find((item) => item.stageId === stage.stageId);
    return state?.status === "ACTIVE" && stage.timeLimitSeconds !== null && state.startedAt !== null
      && Date.parse(now) - Date.parse(state.startedAt) >= stage.timeLimitSeconds * 1000;
  });
  if (expiredStage) return { status: "EXPIRED", objectiveStates, stageStates, runtimeState, expiredAt: now };

  for (let pass = 0; pass <= definition.stages.length + definition.objectives.length; pass += 1) {
    let changed = false;
    const context = conditionContext(objectiveStates, stageStates, runtimeState, events, current.startedAt, now);

    definition.stages.forEach((stage, index) => {
      const state = stageStates[index];
      if (state.status !== "LOCKED") return;
      const previousComplete = index === 0 || stageStates[index - 1].status === "COMPLETED";
      if (previousComplete && allConditions(stage.entryConditions, context)) {
        state.status = "ACTIVE";
        state.startedAt = now;
        changed = true;
      }
    });

    definition.objectives.forEach((objective, index) => {
      const state = objectiveStates[index];
      if (state.status !== "PENDING") return;
      const stageIndex = definition.stages.findIndex((stage) => stage.objectiveIds.includes(objective.objectiveId));
      if (stageIndex < 0 || stageStates[stageIndex]?.status === "ACTIVE") {
        state.status = "ACTIVE";
        changed = true;
      }
    });

    definition.objectives.forEach((objective, index) => {
      const state = objectiveStates[index];
      if (state.status === "ACTIVE" && evaluateMissionCondition(objective.completionRule, context)) {
        state.status = "COMPLETED";
        state.completedAt = now;
        changed = true;
      }
    });

    definition.stages.forEach((stage, index) => {
      const state = stageStates[index];
      if (state.status !== "ACTIVE") return;
      const requiredIds = stage.objectiveIds.filter((id) => definition.objectives.find((objective) => objective.objectiveId === id)?.required);
      const objectivesComplete = requiredIds.length > 0 && requiredIds.every((id) => objectiveStates.find((item) => item.objectiveId === id)?.status === "COMPLETED");
      const exitConditionsComplete = stage.exitConditions.length > 0 && allConditions(stage.exitConditions, context);
      const hasObjectiveGate = requiredIds.length > 0;
      const objectivesSatisfied = !hasObjectiveGate || objectivesComplete;
      const exitsSatisfied = stage.exitConditions.length === 0 || exitConditionsComplete;
      if ((hasObjectiveGate || stage.exitConditions.length > 0) && objectivesSatisfied && exitsSatisfied) {
        state.status = "COMPLETED";
        state.completedAt = now;
        changed = true;
      }
    });
    if (!changed) break;
  }

  const context = conditionContext(objectiveStates, stageStates, runtimeState, events, current.startedAt, now);
  const failure = definition.failureConditions.some((condition) => evaluateMissionCondition(condition, context));
  const success = definition.successConditions.length > 0 && allConditions(definition.successConditions, context);
  if (failure) return { status: "FAILED", objectiveStates, stageStates, runtimeState, failedAt: now };
  if (success) return { status: "SUCCEEDED", objectiveStates, stageStates, runtimeState, completedAt: now };
  return { status: "ACTIVE", objectiveStates, stageStates, runtimeState };
}

function validateJsonObject(value: unknown, code: string, maxBytes: number, maxDepth: number, forbiddenKeys: Set<string>): Record<string, any> {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) {
    throw new MissionRuntimeError(code, "Value must be a plain JSON object.");
  }
  const seen = new Set<object>();
  const inspect = (item: unknown, depth: number) => {
    if (depth > maxDepth) throw new MissionRuntimeError(code, "JSON nesting exceeds the allowed depth.");
    if (item === null || typeof item === "string" || typeof item === "boolean") return;
    if (typeof item === "number" && Number.isFinite(item)) return;
    if (typeof item !== "object") throw new MissionRuntimeError(code, "Only JSON values are accepted.");
    if (seen.has(item)) throw new MissionRuntimeError(code, "Circular JSON values are not accepted.");
    seen.add(item);
    if (Array.isArray(item)) item.forEach((child) => inspect(child, depth + 1));
    else {
      if (Object.getPrototypeOf(item) !== Object.prototype) throw new MissionRuntimeError(code, "Only plain JSON objects and arrays are accepted.");
      for (const [key, child] of Object.entries(item)) {
        const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (forbiddenKeys.has(normalized) || normalized.includes("token")) throw new MissionRuntimeError("MISSION_RUNTIME_SENSITIVE_STATE", `Field '${key}' is not permitted.`);
        inspect(child, depth + 1);
      }
    }
    seen.delete(item);
  };
  inspect(value, 0);
  if (Buffer.byteLength(JSON.stringify(value), "utf8") > maxBytes) throw new MissionRuntimeError(code, `JSON object exceeds ${maxBytes} bytes.`, 413);
  return value as Record<string, any>;
}

// Reserved `mission.*` keys are runtime-managed: rejected in any patch, permitted in merged state.
function validateRuntimeState(definition: MissionDefinition, patch: unknown, { allowReserved = false } = {}): Record<string, string | number | boolean> {
  const object = validateJsonObject(patch, "MISSION_RUNTIME_STATE_INVALID", MISSION_RUNTIME_STATE_MAX_BYTES, MISSION_RUNTIME_MAX_STATE_DEPTH, SENSITIVE_KEYS);
  const allowedKeys = conditionStateKeys(definition);
  for (const [key, value] of Object.entries(object)) {
    if (isReservedStateKey(key)) {
      if (!allowReserved) throw new MissionRuntimeError("MISSION_RUNTIME_STATE_KEY_RESERVED", `State key '${key}' is managed by Mission Runtime.`);
      continue;
    }
    if (!allowedKeys.has(key)) throw new MissionRuntimeError("MISSION_RUNTIME_STATE_KEY_INVALID", `State key '${key}' is not declared by this Mission Definition.`);
    if (!["string", "number", "boolean"].includes(typeof value)) throw new MissionRuntimeError("MISSION_RUNTIME_STATE_INVALID", "Mission runtime state supports scalar values only.");
  }
  return object;
}

export const PARTICIPANT_ATTRIBUTION_KEY = "participant";
// Server-set origin marker on declared events emitted by the Mission Director: such events are never learner actions.
export const DIRECTOR_ORIGIN_KEY = "emittedBy";
export const DIRECTOR_ORIGIN = "MISSION_DIRECTOR";

function expiredDuringDirectorApply() {
  return new MissionRuntimeError("MISSION_RUNTIME_EXPIRED", "Mission runtime time limit elapsed; the Director action was not applied.", 409);
}

function validateExpectedRevision(value: unknown) {
  if (!Number.isSafeInteger(value) || Number(value) < 1) throw new MissionRuntimeError("MISSION_RUNTIME_REVISION_INVALID", "expectedRevision must be a positive integer.");
  return Number(value);
}

function resultOrThrow(result: Awaited<ReturnType<MissionRuntimeRepo["mutateOwned"]>>) {
  if (result.kind === "NOT_FOUND") throw new MissionRuntimeError("MISSION_RUNTIME_NOT_FOUND", "Mission runtime was not found.", 404);
  if (result.kind === "REVISION_CONFLICT") throw new MissionRuntimeError("MISSION_RUNTIME_REVISION_CONFLICT", "Mission runtime revision is stale; reload before retrying.", 409, { currentRevision: result.currentRevision });
  if (result.kind === "EVENT_LIMIT") throw new MissionRuntimeError("MISSION_RUNTIME_EVENT_LIMIT", `Mission runtime history is limited to ${MISSION_RUNTIME_MAX_EVENTS} events.`, 409);
  return result;
}

export class MissionRuntimeService {
  private readonly world: MissionWorldContextProvider;
  private readonly accommodations: MissionAccommodationProvider;

  constructor(private readonly repo = new MissionRuntimeRepo(), private readonly now: () => Date = () => new Date(), integrations: MissionRuntimeIntegrations = {}) {
    this.world = integrations.world ?? defaultMissionWorldContextProvider;
    this.accommodations = integrations.accommodations ?? getMissionAccommodationProjection;
  }

  // Frozen start-time projections, recorded as runtime-owned events in the start transaction.
  private async startProjections(scope: MissionRuntimeScope, definition: MissionDefinition, runtimeId: string, startedAt: string) {
    const events: Array<{ eventType: string; payload: Record<string, unknown>; occurredAt: string }> = [];
    if (definition.metaverseContext) {
      const { binding, context } = buildMissionWorldContext({ definition, runtimeId, startedAt, now: startedAt, contextKind: "FROZEN", provider: this.world });
      if (binding.blocked) {
        throw new MissionRuntimeError("MISSION_WORLD_CONTEXT_UNAVAILABLE", "Required Metaverse context is unavailable for this Mission.", 409, { reasons: binding.blockReasons });
      }
      events.push({ eventType: MISSION_SYSTEM_EVENTS.worldContextCaptured, payload: context as unknown as Record<string, unknown>, occurredAt: startedAt });
    }
    const accommodation = await this.accommodations({ organizationId: scope.organizationId, userId: scope.userId, at: startedAt });
    if (accommodation) events.push({ eventType: MISSION_SYSTEM_EVENTS.accommodationProjected, payload: { ...accommodation }, occurredAt: startedAt });
    return events;
  }

  async start(actor: MissionRuntimeActor, definitionInput: MissionDefinition, options: { idempotencyKey?: string | null; arcadeRuntimeSessionId?: string | null } = {}) {
    const scope = scopeFor(actor);
    assertRunnableDefinition(definitionInput);
    const definition = JSON.parse(JSON.stringify(definitionInput)) as MissionDefinition;
    const idempotencyKey = options.idempotencyKey == null ? null : String(options.idempotencyKey).trim();
    if (idempotencyKey !== null && !ID_PATTERN.test(idempotencyKey)) throw new MissionRuntimeError("MISSION_RUNTIME_IDEMPOTENCY_KEY_INVALID", "idempotencyKey is invalid.");
    const arcadeRuntimeSessionId = options.arcadeRuntimeSessionId == null ? null : runtimeId(options.arcadeRuntimeSessionId);
    const startedAt = this.now().toISOString();
    const objectiveStates = initObjectiveStates(definition);
    const stageStates = initStageStates(definition);
    const initial = { objectiveStates, stageStates, runtimeState: initialScenarioState(definition), startedAt };
    const missionRuntimeId = `mission_runtime_${randomUUID()}`;
    const initialEvents = await this.startProjections(scope, definition, missionRuntimeId, startedAt);
    const initialMutation = advance(definition, initial, [], startedAt);
    const created = await this.repo.start({
      ...scope,
      missionId: definition.missionId,
      missionVersion: definition.version,
      definition,
      objectiveStates: initialMutation.objectiveStates,
      stageStates: initialMutation.stageStates,
      runtimeState: initialMutation.runtimeState,
      startedAt,
      arcadeRuntimeSessionId,
      idempotencyKey,
      missionRuntimeId,
      initialEvents,
    });
    if (!created.session) throw new MissionRuntimeError("ARCADE_RUNTIME_SESSION_NOT_FOUND", "Explicit Arcade Runtime Session reference is not owned by this actor.", 404);
    if (created.reused && (created.session.missionId !== definition.missionId || created.session.missionVersion !== definition.version
      || created.session.arcadeRuntimeSessionId !== arcadeRuntimeSessionId || stableJson(created.session.definitionSnapshot) !== stableJson(definition))) {
      throw new MissionRuntimeError("MISSION_RUNTIME_IDEMPOTENCY_KEY_REUSED", "idempotencyKey was already used for another Mission version or Arcade Runtime Session.", 409);
    }
    if (initialMutation.status !== "ACTIVE" && !created.reused) {
      const settled = await this.repo.mutateOwned({
        id: created.session.id, scope, expectedRevision: created.session.revision,
        derive: () => initialMutation,
      });
      return { session: resultOrThrow(settled).session, reused: false };
    }
    return created;
  }

  async get(actor: MissionRuntimeActor, rawId: string) {
    const scope = scopeFor(actor);
    const session = await this.repo.getOwned(runtimeId(rawId), scope);
    if (!session) throw new MissionRuntimeError("MISSION_RUNTIME_NOT_FOUND", "Mission runtime was not found.", 404);
    return session;
  }

  // Phase 5 internal reads for an owner scope already resolved server-side by the multiplayer domain
  // (participants are authorized there). Read-only; no actor-supplied scope reaches these.
  async getScoped(scope: MissionRuntimeScope, rawId: string) {
    const session = await this.repo.getOwned(runtimeId(rawId), scope);
    if (!session) throw new MissionRuntimeError("MISSION_RUNTIME_NOT_FOUND", "Mission runtime was not found.", 404);
    return session;
  }

  async listEventsScoped(scope: MissionRuntimeScope, rawId: string) {
    const events = await this.repo.listEventsOwned(runtimeId(rawId), scope);
    if (!events) throw new MissionRuntimeError("MISSION_RUNTIME_NOT_FOUND", "Mission runtime was not found.", 404);
    return events;
  }

  async list(actor: MissionRuntimeActor) {
    return this.repo.listOwned(scopeFor(actor));
  }

  // LIVE world context for an already-loaded session: recomputed from the same deterministic,
  // simulated source and never stored. Null when the Mission declares no Metaverse context.
  liveWorldContextFor(session: MissionRuntimeSession, options: { ambientEvents?: readonly unknown[] } = {}) {
    if (!session.definitionSnapshot.metaverseContext) return null;
    return buildMissionWorldContext({
      definition: session.definitionSnapshot, runtimeId: session.id, startedAt: session.startedAt,
      now: this.now().toISOString(), contextKind: "LIVE", provider: this.world, ambientEvents: options.ambientEvents,
    }).context;
  }

  // Read-only Mission ↔ Metaverse context: FROZEN (captured at start) and LIVE (current) are reported
  // separately and never merged. Owner-scoped like every other runtime read.
  async getWorldContext(actor: MissionRuntimeActor, rawId: string, options: { ambientEvents?: readonly unknown[] } = {}) {
    const session = await this.get(actor, rawId);
    const events = await this.listEvents(actor, rawId);
    const frozen = events.find((event) => event.eventType === MISSION_SYSTEM_EVENTS.worldContextCaptured)?.payload ?? null;
    const accommodation = events.find((event) => event.eventType === MISSION_SYSTEM_EVENTS.accommodationProjected)?.payload ?? null;
    return {
      runtimeId: session.id,
      missionId: session.missionId,
      missionVersion: session.missionVersion,
      integrated: Boolean(session.definitionSnapshot.metaverseContext),
      frozen,
      live: this.liveWorldContextFor(session, options),
      accommodation,
      missionAuthority: "MISSION_RUNTIME" as const,
    };
  }

  async listEvents(actor: MissionRuntimeActor, rawId: string) {
    const scope = scopeFor(actor);
    const events = await this.repo.listEventsOwned(runtimeId(rawId), scope);
    if (!events) throw new MissionRuntimeError("MISSION_RUNTIME_NOT_FOUND", "Mission runtime was not found.", 404);
    return events;
  }

  async transition(actor: MissionRuntimeActor, rawId: string, action: "PAUSE" | "RESUME" | "ABANDON", expectedRevisionInput: unknown) {
    const scope = scopeFor(actor);
    const id = runtimeId(rawId);
    const expectedRevision = validateExpectedRevision(expectedRevisionInput);
    const idempotentStatus = action === "ABANDON" ? "ABANDONED" : undefined;
    const result = await this.repo.mutateOwned({ id, scope, expectedRevision, idempotentStatus,
      derive: (session, events) => {
        const now = this.now().toISOString();
        const advanced = advance(session.definitionSnapshot, session, events, now);
        if (advanced.status !== "ACTIVE") return advanced;
        if (action === "PAUSE" && session.status === "ACTIVE") return { ...advanced, status: "PAUSED", pausedAt: now };
        if (action === "RESUME" && session.status === "PAUSED") return { ...advanced, status: "ACTIVE", pausedAt: null };
        if (action === "ABANDON" && ["ACTIVE", "PAUSED"].includes(session.status)) return { ...advanced, status: "ABANDONED", abandonedAt: now };
        if ((action === "PAUSE" && session.status === "PAUSED") || (action === "RESUME" && session.status === "ACTIVE")) return { ...advanced, noChange: true };
        throw new MissionRuntimeError("MISSION_RUNTIME_TRANSITION_INVALID", `Cannot ${action.toLowerCase()} a ${session.status.toLowerCase()} Mission runtime.`, 409);
      },
    });
    return resultOrThrow(result).session;
  }

  async updateState(actor: MissionRuntimeActor, rawId: string, body: { expectedRevision: unknown; patch: unknown }, directorDecision?: MissionDirectorDecisionWrite) {
    const scope = scopeFor(actor);
    const id = runtimeId(rawId);
    const expectedRevision = validateExpectedRevision(body?.expectedRevision);
    const result = await this.repo.mutateOwned({ id, scope, expectedRevision, directorDecision,
      derive: (session, events) => {
        if (session.status !== "ACTIVE") throw new MissionRuntimeError("MISSION_RUNTIME_NOT_ACTIVE", "Runtime state may be updated only while ACTIVE.", 409);
        const patch = validateRuntimeState(session.definitionSnapshot, body.patch);
        const next = { ...session.runtimeState, ...patch };
        validateRuntimeState(session.definitionSnapshot, next, { allowReserved: true });
        const advanced = advance(session.definitionSnapshot, { ...session, runtimeState: next }, events, this.now().toISOString());
        if (advanced.status === "EXPIRED" && directorDecision) throw expiredDuringDirectorApply();
        if (advanced.status === "EXPIRED") return { ...advanced, runtimeState: session.runtimeState };
        return { ...advanced, runtimeState: next };
      },
    });
    return resultOrThrow(result).session;
  }

  async appendEvent(actor: MissionRuntimeActor, rawId: string, body: { expectedRevision: unknown; sequence: unknown; eventType: unknown; payload?: unknown }, directorDecision?: MissionDirectorDecisionWrite) {
    const scope = scopeFor(actor);
    const id = runtimeId(rawId);
    const expectedRevision = validateExpectedRevision(body?.expectedRevision);
    if (!Number.isSafeInteger(body?.sequence) || Number(body.sequence) < 1) throw new MissionRuntimeError("MISSION_RUNTIME_SEQUENCE_INVALID", "sequence must be a positive integer.");
    const eventType = typeof body?.eventType === "string" ? body.eventType.trim() : "";
    const payload = validateJsonObject(body?.payload ?? {}, "MISSION_RUNTIME_EVENT_PAYLOAD_INVALID", MISSION_RUNTIME_EVENT_MAX_BYTES, 4, SENSITIVE_KEYS);
    // Participant attribution and Director origin are set only by the server; they can never be supplied.
    if (Object.hasOwn(payload, PARTICIPANT_ATTRIBUTION_KEY) || Object.hasOwn(payload, DIRECTOR_ORIGIN_KEY)) {
      throw new MissionRuntimeError("MISSION_RUNTIME_EVENT_PAYLOAD_INVALID", "participant attribution and event origin are reserved.");
    }
    // Stamp a copy: never mutate the caller's object.
    const eventPayload: Record<string, any> = directorDecision ? { ...payload, [DIRECTOR_ORIGIN_KEY]: DIRECTOR_ORIGIN } : payload;
    const result = await this.repo.mutateOwned({ id, scope, expectedRevision, directorDecision,
      derive: (session, events) => {
        // In a team Mission, learner actions must arrive as attributed team actions (Director events are not learner actions).
        if (session.definitionSnapshot.multiplayer && !directorDecision) {
          throw new MissionRuntimeError("MISSION_RUNTIME_TEAM_ACTION_REQUIRED", "Learner actions in a team Mission are submitted as team actions.", 409);
        }
        if (session.status !== "ACTIVE") throw new MissionRuntimeError("MISSION_RUNTIME_NOT_ACTIVE", "Events may be appended only while ACTIVE.", 409);
        if (Number(body.sequence) !== events.length + 1) throw new MissionRuntimeError("MISSION_RUNTIME_SEQUENCE_CONFLICT", `sequence must be exactly ${events.length + 1}.`, 409, { expectedSequence: events.length + 1 });
        const allowed = conditionEventTypes(session.definitionSnapshot);
        if (isSystemEventType(eventType) || !allowed.has(eventType)) throw new MissionRuntimeError("MISSION_RUNTIME_EVENT_TYPE_INVALID", "eventType is not declared by this Mission Definition.");
        const now = this.now().toISOString();
        const event: MissionRuntimeEvent = { id: "pending", sequence: Number(body.sequence), eventType, payload: eventPayload, occurredAt: now, serverReceivedAt: now };
        const advanced = advance(session.definitionSnapshot, session, [...events, event], now);
        if (advanced.status === "EXPIRED" && directorDecision) throw expiredDuringDirectorApply();
        if (advanced.status === "EXPIRED") return advanced;
        return { ...advanced, event: { eventType, payload: eventPayload, occurredAt: now } };
      },
    });
    return resultOrThrow(result);
  }

  // Phase 5: an attributed team action. The multiplayer domain authorizes the participant and resolves the
  // runtime owner scope server-side; Mission Runtime still applies CAS, declared-event validation, the one
  // condition engine, sequencing and idempotency under its own row lock. Attribution is server-set.
  async appendParticipantEvent(scope: MissionRuntimeScope, rawId: string, body: {
    expectedRevision: unknown; eventType: unknown; payload?: unknown;
    participant: { participantId: string; missionRole: string }; actionKey: unknown;
  }) {
    const id = runtimeId(rawId);
    const expectedRevision = validateExpectedRevision(body?.expectedRevision);
    const eventType = typeof body?.eventType === "string" ? body.eventType.trim() : "";
    const actionKey = typeof body?.actionKey === "string" ? body.actionKey.trim() : "";
    if (!ID_PATTERN.test(actionKey)) throw new MissionRuntimeError("MISSION_TEAM_ACTION_KEY_INVALID", "A bounded idempotencyKey is required for team actions.");
    const payload = validateJsonObject(body?.payload ?? {}, "MISSION_RUNTIME_EVENT_PAYLOAD_INVALID", MISSION_RUNTIME_EVENT_MAX_BYTES, 4, SENSITIVE_KEYS);
    if (Object.hasOwn(payload, PARTICIPANT_ATTRIBUTION_KEY) || Object.hasOwn(payload, DIRECTOR_ORIGIN_KEY)) {
      throw new MissionRuntimeError("MISSION_RUNTIME_EVENT_PAYLOAD_INVALID", "participant attribution and event origin are reserved.");
    }
    const attribution = { participantId: body.participant.participantId, missionRole: body.participant.missionRole, actionKey, attributedBy: "MISSION_TEAM" };
    // Idempotent retry: the same participant + key returns the original event; conflicting reuse is rejected.
    const matchPrior = (events: readonly MissionRuntimeEvent[]) => {
      const prior = events.find((event) => {
        const participant = event.payload?.[PARTICIPANT_ATTRIBUTION_KEY] as any;
        return participant?.participantId === attribution.participantId && participant?.actionKey === actionKey;
      });
      if (!prior) return null;
      const { [PARTICIPANT_ATTRIBUTION_KEY]: _attribution, ...priorPayload } = prior.payload;
      if (prior.eventType !== eventType || stableJson(priorPayload) !== stableJson(payload)) {
        throw new MissionRuntimeError("MISSION_TEAM_ACTION_KEY_REUSED", "idempotencyKey was already used for a different team action.", 409);
      }
      return prior;
    };
    const replay = async () => {
      const prior = matchPrior((await this.repo.listEventsOwned(id, scope)) ?? []);
      return prior ? { session: (await this.repo.getOwned(id, scope))!, event: prior, replayed: true } : null;
    };
    // Resolved before the revision check so a retry of a successful action is not mistaken for a stale one.
    const early = await replay();
    if (early) return early;
    let replayed: MissionRuntimeEvent | null = null;
    const result = await this.repo.mutateOwned({ id, scope, expectedRevision,
      derive: (session, events) => {
        const prior = matchPrior(events);
        if (prior) {
          replayed = prior;
          return { ...session, noChange: true };
        }
        if (!session.definitionSnapshot.multiplayer) throw new MissionRuntimeError("MISSION_RUNTIME_NOT_MULTIPLAYER", "This Mission is not a team Mission.", 409);
        if (session.status !== "ACTIVE") throw new MissionRuntimeError("MISSION_RUNTIME_NOT_ACTIVE", "Team actions may be submitted only while ACTIVE.", 409);
        if (isSystemEventType(eventType) || !conditionEventTypes(session.definitionSnapshot).has(eventType)) {
          throw new MissionRuntimeError("MISSION_RUNTIME_EVENT_TYPE_INVALID", "eventType is not declared by this Mission Definition.");
        }
        const now = this.now().toISOString();
        const fullPayload = { ...payload, [PARTICIPANT_ATTRIBUTION_KEY]: attribution };
        const event: MissionRuntimeEvent = { id: "pending", sequence: events.length + 1, eventType, payload: fullPayload, occurredAt: now, serverReceivedAt: now };
        const advanced = advance(session.definitionSnapshot, session, [...events, event], now);
        if (advanced.status === "EXPIRED") return advanced;
        return { ...advanced, event: { eventType, payload: fullPayload, occurredAt: now } };
      },
    });
    // A concurrent identical retry that lost the revision race resolves to the winner's event.
    if (result.kind === "REVISION_CONFLICT") {
      const late = await replay();
      if (late) return late;
    }
    const ok = resultOrThrow(result);
    return { session: ok.session, event: ok.event ?? replayed, replayed: replayed !== null };
  }

  async applyDirectorAction(actor: MissionRuntimeActor, rawId: string, expectedRevisionInput: unknown, action: MissionDirectorAction, directorDecision: MissionDirectorDecisionWrite) {
    const current = await this.get(actor, rawId);
    if (current.revision !== validateExpectedRevision(expectedRevisionInput)) {
      throw new MissionRuntimeError("MISSION_RUNTIME_REVISION_CONFLICT", "Mission Director proposal is stale.", 409, { currentRevision: current.revision });
    }
    if (current.status !== "ACTIVE") throw new MissionRuntimeError("MISSION_RUNTIME_NOT_ACTIVE", "Mission Director actions require an ACTIVE runtime.", 409);
    if (!current.definitionSnapshot.aiCapabilities.missionDirector) throw new MissionRuntimeError("MISSION_DIRECTOR_CAPABILITY_DENIED", "Mission Director is not declared for this Mission.", 403);
    if (action.type === "NO_OP") return current;
    if (action.type === "SET_DECLARED_RUNTIME_STATE") {
      return this.updateState(actor, rawId, { expectedRevision: expectedRevisionInput, patch: { [action.key]: action.value } }, directorDecision);
    }
    if (action.type === "EMIT_DECLARED_EVENT") {
      if (!current.definitionSnapshot.aiCapabilities.scenarioVariation) throw new MissionRuntimeError("MISSION_DIRECTOR_CAPABILITY_DENIED", "Scenario variation is not declared for this Mission.", 403);
      const events = await this.listEvents(actor, rawId);
      return (await this.appendEvent(actor, rawId, { expectedRevision: expectedRevisionInput, sequence: events.length + 1, eventType: action.eventType, payload: action.payload ?? {} }, directorDecision)).session;
    }
    if (!isScenarioAction(action) && action.type !== "ESCALATE") throw new MissionRuntimeError("MISSION_DIRECTOR_ACTION_UNSUPPORTED", "Mission Director action is not supported.");
    const result = await this.repo.mutateOwned({ id: runtimeId(rawId), scope: scopeFor(actor), expectedRevision: validateExpectedRevision(expectedRevisionInput), directorDecision,
      derive: (session, currentEvents) => {
        if (session.status !== "ACTIVE") throw new MissionRuntimeError("MISSION_RUNTIME_NOT_ACTIVE", "Mission Director actions require an ACTIVE runtime.", 409);
        const definition = session.definitionSnapshot;
        let statePatch: Record<string, string> = {};
        let eventType: string = MISSION_SYSTEM_EVENTS.escalated;
        let payload: Record<string, unknown>;
        if (action.type === "ESCALATE") {
          payload = { reasonCode: action.reasonCode, ...(action.message === undefined ? {} : { message: action.message }) };
        } else {
          // Re-check declarations against the row-locked session; the frozen snapshot is the only source.
          const denial = scenarioActionDenial(definition, session, action);
          if (denial) throw new MissionRuntimeError(denial, "Mission Director action is not declared or not available.", 409);
          ({ statePatch, event: { eventType, payload } } = scenarioActionEffect(definition, session, action));
        }
        const now = this.now().toISOString();
        const runtimeState = { ...session.runtimeState, ...statePatch };
        const pending: MissionRuntimeEvent = { id: "pending", sequence: currentEvents.length + 1, eventType, payload, occurredAt: now, serverReceivedAt: now };
        // Branch/tier changes feed the one existing condition engine; there is no parallel state machine.
        const advanced = advance(definition, { ...session, runtimeState }, [...currentEvents, pending], now);
        if (advanced.status === "EXPIRED") throw expiredDuringDirectorApply();
        return { ...advanced, runtimeState, event: { eventType, payload, occurredAt: now } };
      },
    });
    return resultOrThrow(result).session;
  }
}
