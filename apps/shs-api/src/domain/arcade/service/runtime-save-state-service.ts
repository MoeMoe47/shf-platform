import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { ARCADE_RUNTIME_SAVE_STATE_MAX_BYTES } from "../model/runtime-save-state.js";
import { ArcadeRuntimeSessionRepo } from "../repo/runtime-session-repo.js";
import { ArcadeRuntimeSaveStateRepo } from "../repo/runtime-save-state-repo.js";
import type { ArcadeRuntimeActor } from "./runtime-session-service.js";
import { ArcadeRuntimeSessionError } from "./runtime-session-service.js";

function scopeFor(actor: ArcadeRuntimeActor) {
  if (!hasPermission(actor.permissions, SHS_SECURITY_PERMISSIONS.ARCADE_ATTEMPT)) {
    throw new ArcadeRuntimeSessionError("FORBIDDEN", "Missing arcade.attempt permission.", 403);
  }
  const organizationId = String(actor.organization_id || "").trim();
  const userId = String(actor.user_id || "").trim();
  if (!organizationId || !userId) throw new ArcadeRuntimeSessionError("SCOPE_MISSING", "Actor organization/user is required.", 403);
  return { organizationId, tenantId: `tenant:${organizationId}`, userId };
}

function sessionIdFrom(value: unknown): string {
  const id = String(value ?? "").trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(id)) {
    throw new ArcadeRuntimeSessionError("SESSION_ID_INVALID", "SESSION_ID_INVALID must be a 1-160 character identifier.");
  }
  return id;
}

function validatePayload(payload: unknown): string {
  if (!payload || typeof payload !== "object" || Array.isArray(payload) || Object.getPrototypeOf(payload) !== Object.prototype) {
    throw new ArcadeRuntimeSessionError("SAVE_PAYLOAD_INVALID", "payload must be a JSON object.");
  }
  const seen = new Set<object>();
  const assertJsonValue = (value: unknown): void => {
    if (value === null || typeof value === "string" || typeof value === "boolean") return;
    if (typeof value === "number" && Number.isFinite(value)) return;
    if (typeof value !== "object") throw new ArcadeRuntimeSessionError("SAVE_PAYLOAD_INVALID", "payload must contain only JSON values.");
    if (seen.has(value)) throw new ArcadeRuntimeSessionError("SAVE_PAYLOAD_INVALID", "payload cannot contain circular references.");
    seen.add(value);
    if (Array.isArray(value)) {
      value.forEach(assertJsonValue);
    } else {
      if (Object.getPrototypeOf(value) !== Object.prototype) throw new ArcadeRuntimeSessionError("SAVE_PAYLOAD_INVALID", "payload must contain only JSON objects and arrays.");
      Object.values(value).forEach(assertJsonValue);
    }
    seen.delete(value);
  };
  assertJsonValue(payload);
  const serialized = JSON.stringify(payload);
  if (Buffer.byteLength(serialized, "utf8") > ARCADE_RUNTIME_SAVE_STATE_MAX_BYTES) {
    throw new ArcadeRuntimeSessionError("SAVE_PAYLOAD_TOO_LARGE", `payload must not exceed ${ARCADE_RUNTIME_SAVE_STATE_MAX_BYTES} bytes.`, 413);
  }
  return serialized;
}

export class ArcadeRuntimeSaveStateService {
  constructor(
    private readonly sessions = new ArcadeRuntimeSessionRepo(),
    private readonly saveStates = new ArcadeRuntimeSaveStateRepo(),
  ) {}

  async get(actor: ArcadeRuntimeActor, rawSessionId: string) {
    const scope = scopeFor(actor);
    const sessionId = sessionIdFrom(rawSessionId);
    const session = await this.sessions.getForOwner(sessionId, scope.organizationId, scope.tenantId, scope.userId);
    if (!session) throw new ArcadeRuntimeSessionError("SESSION_NOT_FOUND", "Runtime session not found.", 404);
    const saveState = await this.saveStates.getForOwner(sessionId, scope.organizationId, scope.tenantId, scope.userId);
    return { sessionId, saveState };
  }

  async save(actor: ArcadeRuntimeActor, rawSessionId: string, body: any) {
    const scope = scopeFor(actor);
    const sessionId = sessionIdFrom(rawSessionId);
    const expectedRevision = body?.expectedRevision;
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) {
      throw new ArcadeRuntimeSessionError("SAVE_REVISION_INVALID", "expectedRevision must be a non-negative integer.");
    }
    const payload = validatePayload(body?.payload);
    const session = await this.sessions.getForOwner(sessionId, scope.organizationId, scope.tenantId, scope.userId);
    if (!session) throw new ArcadeRuntimeSessionError("SESSION_NOT_FOUND", "Runtime session not found.", 404);
    if (session.status !== "ACTIVE" && session.status !== "PAUSED") {
      throw new ArcadeRuntimeSessionError("SAVE_SESSION_NOT_WRITABLE", `Save state cannot be changed while the session is ${session.status.toLowerCase()}.`, 409);
    }

    const saved = await this.saveStates.saveWithExpectedRevision({
      sessionId, ...scope, expectedRevision, payload,
    });
    if (saved) return saved;

    const latestSession = await this.sessions.getForOwner(sessionId, scope.organizationId, scope.tenantId, scope.userId);
    if (!latestSession) throw new ArcadeRuntimeSessionError("SESSION_NOT_FOUND", "Runtime session not found.", 404);
    if (latestSession.status !== "ACTIVE" && latestSession.status !== "PAUSED") {
      throw new ArcadeRuntimeSessionError("SAVE_SESSION_NOT_WRITABLE", `Save state cannot be changed while the session is ${latestSession.status.toLowerCase()}.`, 409);
    }
    const latestSave = await this.saveStates.getForOwner(sessionId, scope.organizationId, scope.tenantId, scope.userId);
    const currentRevision = latestSave?.revision ?? 0;
    throw new ArcadeRuntimeSessionError(
      "SAVE_REVISION_CONFLICT",
      `Save state revision is stale; reload before retrying. Current revision is ${currentRevision}.`,
      409,
      { currentRevision },
    );
  }
}
