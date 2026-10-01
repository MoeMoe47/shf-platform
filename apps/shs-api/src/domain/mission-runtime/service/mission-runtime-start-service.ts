import type { MissionDefinition } from "../../mission-content/model/mission-definition.js";
import type { PublishedMissionIdentity, PublishedMissionResolver } from "../../mission-content/catalog/published-mission-catalog.js";
import { MissionRuntimeError, MissionRuntimeService, type MissionRuntimeActor } from "./mission-runtime-service.js";

const MISSION_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const START_FIELDS = new Set(["missionId", "missionVersion", "idempotencyKey", "arcadeRuntimeSessionId"]);

export interface StartPublishedMissionRequest {
  missionId?: unknown;
  missionVersion?: unknown;
  idempotencyKey?: unknown;
  arcadeRuntimeSessionId?: unknown;
}

export function validateMissionRuntimeStartRequest(input: unknown): asserts input is StartPublishedMissionRequest {
  if (!input || typeof input !== "object" || Array.isArray(input) || Object.getPrototypeOf(input) !== Object.prototype) {
    throw new MissionRuntimeError("MISSION_RUNTIME_START_BODY_INVALID", "Request body must be an object.");
  }
  const body = input as Record<string, unknown>;
  const unknownFields = Object.keys(body).filter((key) => !START_FIELDS.has(key));
  if (unknownFields.length) {
    throw new MissionRuntimeError("MISSION_RUNTIME_START_FIELD_INVALID", `Unsupported start field: ${unknownFields[0]}.`);
  }
  if (typeof body.missionId !== "string" || !MISSION_ID_PATTERN.test(body.missionId)) {
    throw new MissionRuntimeError("MISSION_ID_INVALID", "missionId is required and must be a canonical identifier.");
  }
  if (!Number.isSafeInteger(body.missionVersion) || Number(body.missionVersion) < 1) {
    throw new MissionRuntimeError("MISSION_VERSION_INVALID", "missionVersion is required and must be a positive integer.");
  }
  for (const field of ["idempotencyKey", "arcadeRuntimeSessionId"] as const) {
    const value = body[field];
    if (value !== undefined && value !== null && (typeof value !== "string" || !ID_PATTERN.test(value.trim()))) {
      throw new MissionRuntimeError(field === "idempotencyKey" ? "MISSION_RUNTIME_IDEMPOTENCY_KEY_INVALID" : "ARCADE_RUNTIME_SESSION_ID_INVALID", `${field} is invalid.`);
    }
  }
}

function runtimeStartDto(session: Awaited<ReturnType<MissionRuntimeService["start"]>>["session"]) {
  return {
    id: session.id,
    missionId: session.missionId,
    missionVersion: session.missionVersion,
    status: session.status,
    revision: session.revision,
    startedAt: session.startedAt,
    pausedAt: session.pausedAt,
    completedAt: session.completedAt,
    failedAt: session.failedAt,
    abandonedAt: session.abandonedAt,
    expiredAt: session.expiredAt,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    objectiveStates: session.objectiveStates,
    stageStates: session.stageStates,
    runtimeState: session.runtimeState,
    arcadeRuntimeSessionId: session.arcadeRuntimeSessionId,
  };
}

export class MissionRuntimeStartService {
  constructor(
    private readonly resolver: PublishedMissionResolver,
    private readonly runtimeService = new MissionRuntimeService(),
  ) {}

  async startPublishedMission(actor: MissionRuntimeActor, input: StartPublishedMissionRequest) {
    validateMissionRuntimeStartRequest(input);
    const identity: PublishedMissionIdentity = { missionId: String(input.missionId), version: Number(input.missionVersion) };
    const definition: MissionDefinition | null = await this.resolver.resolvePublishedMission(identity);
    if (!definition) throw new MissionRuntimeError("PUBLISHED_MISSION_NOT_FOUND", "Published Mission version was not found.", 404);

    const result = await this.runtimeService.start(actor, definition, {
      idempotencyKey: input.idempotencyKey == null ? null : String(input.idempotencyKey).trim(),
      arcadeRuntimeSessionId: input.arcadeRuntimeSessionId == null ? null : String(input.arcadeRuntimeSessionId).trim(),
    });
    return { session: runtimeStartDto(result.session), reused: result.reused };
  }
}
