import { hasPermission, SHS_SECURITY_PERMISSIONS, SHS_SECURITY_ROLES } from "../../../auth/security-permissions.js";
import { assertValidMissionDefinition, validateMissionDefinition } from "../model/mission-definition.js";
import { MissionDraftRepo, type MissionDraftScope } from "../repo/mission-draft-repo.js";

export const MISSION_DRAFT_MAX_BYTES = 128 * 1024;
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

export class MissionDraftError extends Error {
  constructor(public code: string, message: string, public statusCode = 400, public details: Record<string, unknown> = {}) {
    super(message);
    this.name = "MissionDraftError";
  }
}

export interface MissionDraftActor {
  user_id: string;
  active_organization_id?: string;
  organization_id?: string;
  tenant_id?: string;
  permissions: string[];
  roles: string[];
}

function scopeFor(actor: MissionDraftActor, permission: string): MissionDraftScope {
  if (!hasPermission(actor.permissions || [], permission)) throw new MissionDraftError("FORBIDDEN", "Studio Mission authoring permission is required.", 403);
  if ((actor.roles || []).includes(SHS_SECURITY_ROLES.STUDENT)) throw new MissionDraftError("FORBIDDEN", "Learner accounts cannot author Mission drafts.", 403);
  const organizationId = String(actor.active_organization_id || actor.organization_id || "").trim();
  const userId = String(actor.user_id || "").trim();
  const tenantId = String(actor.tenant_id || "").trim();
  if (!organizationId || !userId || tenantId !== `tenant:${organizationId}`) {
    throw new MissionDraftError("SCOPE_MISSING", "Valid organization, tenant, and user context is required.", 403);
  }
  return { organizationId, tenantId, userId };
}

function definitionSnapshot(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new MissionDraftError("MISSION_DEFINITION_INVALID", "Mission definition must be an object.", 400, { errors: ["mission must be an object"] });
  }
  const definition = structuredClone(input as Record<string, unknown>);
  // Draft status is server-owned; client status can never make a draft publishable.
  definition.status = "DRAFT";
  let serialized: string;
  try { serialized = JSON.stringify(definition); } catch {
    throw new MissionDraftError("MISSION_DEFINITION_INVALID", "Mission definition must be JSON serializable.");
  }
  if (Buffer.byteLength(serialized, "utf8") > MISSION_DRAFT_MAX_BYTES) {
    throw new MissionDraftError("MISSION_DRAFT_TOO_LARGE", `Mission draft exceeds ${MISSION_DRAFT_MAX_BYTES} bytes.`);
  }
  const errors = validateMissionDefinition(definition);
  if (errors.length) throw new MissionDraftError("MISSION_DEFINITION_INVALID", "Mission definition validation failed.", 400, { errors });
  return definition;
}

export class MissionDraftService {
  constructor(private readonly repo = new MissionDraftRepo()) {}

  async list(actor: MissionDraftActor) {
    return this.repo.list(scopeFor(actor, SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW));
  }

  async get(actor: MissionDraftActor, draftId: string) {
    const id = String(draftId || "").trim();
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new MissionDraftError("MISSION_DRAFT_NOT_FOUND", "Mission draft was not found.", 404);
    const draft = await this.repo.get(scopeFor(actor, SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW), id);
    if (!draft) throw new MissionDraftError("MISSION_DRAFT_NOT_FOUND", "Mission draft was not found.", 404);
    return draft;
  }

  async create(actor: MissionDraftActor, input: unknown) {
    const scope = scopeFor(actor, SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_CREATE);
    const body = input && typeof input === "object" && !Array.isArray(input) ? input as Record<string, unknown> : {};
    if (Object.keys(body).some((key) => key !== "definition")) {
      throw new MissionDraftError("MISSION_DRAFT_REQUEST_INVALID", "Unsupported Mission draft creation field.");
    }
    const definition = definitionSnapshot(body.definition);
    try { return await this.repo.create(scope, definition); }
    catch (error: any) {
      if (error?.code === "23505") throw new MissionDraftError("MISSION_DRAFT_IDENTITY_CONFLICT", "A draft already exists for this Mission ID and version in this organization.", 409);
      throw error;
    }
  }

  async update(actor: MissionDraftActor, draftId: string, input: unknown) {
    const scope = scopeFor(actor, SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_UPDATE);
    const body = input && typeof input === "object" && !Array.isArray(input) ? input as Record<string, unknown> : {};
    if (Object.keys(body).some((key) => !["expectedRevision", "definition"].includes(key))) {
      throw new MissionDraftError("MISSION_DRAFT_REQUEST_INVALID", "Unsupported Mission draft update field.");
    }
    const expectedRevision = body.expectedRevision;
    if (!Number.isInteger(expectedRevision) || Number(expectedRevision) < 1) {
      throw new MissionDraftError("MISSION_DRAFT_REVISION_INVALID", "expectedRevision must be a positive integer.");
    }
    const definition = definitionSnapshot(body.definition);
    if (!ID_PATTERN.test(String(definition.missionId || "")) || !Number.isInteger(definition.version) || Number(definition.version) < 1) {
      throw new MissionDraftError("MISSION_DEFINITION_INVALID", "Mission identity and version are required.");
    }
    const result = await this.repo.update(scope, String(draftId || ""), Number(expectedRevision), definition);
    if (result.kind === "NOT_FOUND") throw new MissionDraftError("MISSION_DRAFT_NOT_FOUND", "Mission draft was not found.", 404);
    if (result.kind === "IDENTITY_IMMUTABLE") throw new MissionDraftError("MISSION_DRAFT_IDENTITY_IMMUTABLE", "Mission identity and content version cannot change on an existing draft.", 409);
    if (result.kind === "REVISION_CONFLICT") throw new MissionDraftError("MISSION_DRAFT_REVISION_CONFLICT", "This draft changed since it was loaded.", 409, { currentRevision: result.currentRevision });
    return result.draft;
  }
}

export function validateDraftDefinition(value: unknown) {
  try { assertValidMissionDefinition(definitionSnapshot(value)); return true; }
  catch { return false; }
}
