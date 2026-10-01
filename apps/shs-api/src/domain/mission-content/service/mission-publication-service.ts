import { hasPermission, SHS_SECURITY_PERMISSIONS, SHS_SECURITY_ROLES } from "../../../auth/security-permissions.js";
import { assertValidMissionDefinition, validateMissionDefinition } from "../model/mission-definition.js";
import { MissionPublicationRepo, type MissionPublicationScope } from "../repo/mission-publication-repo.js";

const NOTE_MAX = 10_000;
const ID_PATTERN = /^[0-9a-f-]{36}$/i;
const MAX_SNAPSHOT_BYTES = 128 * 1024;

export class MissionPublicationError extends Error {
  constructor(public code: string, message: string, public statusCode = 400, public details: Record<string, unknown> = {}) {
    super(message);
    this.name = "MissionPublicationError";
  }
}

export interface MissionPublicationActor {
  user_id: string;
  active_organization_id?: string;
  organization_id?: string;
  tenant_id?: string;
  permissions: string[];
  roles: string[];
}

function scopeFor(actor: MissionPublicationActor, permission: string): MissionPublicationScope {
  if (!hasPermission(actor.permissions || [], permission)) throw new MissionPublicationError("FORBIDDEN", "Mission lifecycle permission is required.", 403);
  if ((actor.roles || []).includes(SHS_SECURITY_ROLES.STUDENT)) throw new MissionPublicationError("FORBIDDEN", "Learner accounts cannot govern Mission publication.", 403);
  const organizationId = String(actor.active_organization_id || actor.organization_id || "").trim();
  const tenantId = String(actor.tenant_id || "").trim();
  const userId = String(actor.user_id || "").trim();
  if (!organizationId || !userId || tenantId !== `tenant:${organizationId}`) throw new MissionPublicationError("SCOPE_MISSING", "Valid organization, tenant, and user context is required.", 403);
  return { organizationId, tenantId, userId };
}

function noteValue(value: unknown, required: boolean) {
  const note = typeof value === "string" ? value.trim() : "";
  if (required && !note) throw new MissionPublicationError("MISSION_DECISION_NOTE_REQUIRED", "A decision note is required.");
  if (note.length > NOTE_MAX) throw new MissionPublicationError("MISSION_DECISION_NOTE_TOO_LONG", `Decision note must be at most ${NOTE_MAX} characters.`);
  if (/<\/?[a-z][^>]*>/i.test(note)) throw new MissionPublicationError("MISSION_DECISION_NOTE_INVALID", "Decision notes must be plain text.");
  return note || null;
}

function validateSnapshot(input: unknown, expectedStatus: string) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new MissionPublicationError("MISSION_DEFINITION_INVALID", "Mission snapshot must be an object.");
  const definition = structuredClone(input as Record<string, unknown>);
  definition.status = expectedStatus;
  let serialized: string;
  try { serialized = JSON.stringify(definition); } catch { throw new MissionPublicationError("MISSION_DEFINITION_INVALID", "Mission snapshot must be JSON serializable."); }
  if (Buffer.byteLength(serialized, "utf8") > MAX_SNAPSHOT_BYTES) throw new MissionPublicationError("MISSION_DEFINITION_INVALID", "Mission snapshot exceeds the allowed size.", 413);
  const errors = validateMissionDefinition(definition);
  if (errors.length) throw new MissionPublicationError("MISSION_DEFINITION_INVALID", "Mission snapshot validation failed.", 409, { errors });
  return definition;
}

function id(value: unknown, label: string) {
  const candidate = String(value || "").trim();
  if (!ID_PATTERN.test(candidate)) throw new MissionPublicationError("MISSION_ID_INVALID", `${label} is invalid.`);
  return candidate;
}

function resultOrThrow(result: any) {
  if (result.kind === "NOT_FOUND") throw new MissionPublicationError("MISSION_SUBMISSION_NOT_FOUND", "Mission submission was not found.", 404);
  if (result.kind === "REVISION_CONFLICT") throw new MissionPublicationError("MISSION_DRAFT_REVISION_CONFLICT", "The draft changed before submission.", 409, { currentRevision: result.currentRevision });
  if (result.kind === "SELF_REVIEW") throw new MissionPublicationError("MISSION_SELF_APPROVAL_FORBIDDEN", "Authors cannot review their own submission.", 403);
  if (result.kind === "INVALID_STATE") throw new MissionPublicationError("MISSION_SUBMISSION_INVALID_STATE", "Submission is not in a state that permits this decision.", 409);
  if (result.kind === "NOT_APPROVED") throw new MissionPublicationError("MISSION_SUBMISSION_NOT_APPROVED", "Only an approved submission can be published.", 409);
  return result;
}

export class MissionPublicationService {
  constructor(private readonly repo = new MissionPublicationRepo()) {}

  async submit(actor: MissionPublicationActor, draftIdInput: unknown, expectedRevisionInput: unknown, noteInput?: unknown) {
    const scope = scopeFor(actor, SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_UPDATE);
    const draftId = id(draftIdInput, "draftId");
    if (!Number.isSafeInteger(expectedRevisionInput) || Number(expectedRevisionInput) < 1) throw new MissionPublicationError("MISSION_DRAFT_REVISION_INVALID", "expectedRevision must be a positive integer.");
    const note = noteValue(noteInput, false);
    const result = await this.repo.submit(scope, draftId, Number(expectedRevisionInput), note);
    if (result.kind === "OK") return result;
    resultOrThrow(result);
  }

  async listSubmissions(actor: MissionPublicationActor, statusInput?: unknown) {
    const scope = scopeFor(actor, SHS_SECURITY_PERMISSIONS.STUDIO_REVIEW_QUEUE_VIEW);
    if (!hasPermission(actor.permissions || [], SHS_SECURITY_PERMISSIONS.PROJECT_SUBMISSION_REVIEW)) throw new MissionPublicationError("FORBIDDEN", "Mission review permission is required.", 403);
    const status = statusInput == null || statusInput === "" ? "SUBMITTED" : String(statusInput);
    if (!new Set(["SUBMITTED", "APPROVED", "REJECTED"]).has(status)) throw new MissionPublicationError("MISSION_SUBMISSION_STATUS_INVALID", "Unsupported submission status.");
    return this.repo.listSubmissions(scope, status);
  }

  async listApprovedForPublication(actor: MissionPublicationActor) {
    const scope = scopeFor(actor, SHS_SECURITY_PERMISSIONS.CURRICULUM_CATALOG_PUBLISH);
    return this.repo.listSubmissions(scope, "APPROVED");
  }

  async listAuthorSubmissions(actor: MissionPublicationActor, draftIdInput: unknown) {
    const scope = scopeFor(actor, SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW);
    return this.repo.listAuthorSubmissions(scope, id(draftIdInput, "draftId"));
  }

  async getSubmission(actor: MissionPublicationActor, submissionIdInput: unknown) {
    const scope = scopeFor(actor, SHS_SECURITY_PERMISSIONS.STUDIO_REVIEW_QUEUE_VIEW);
    if (!hasPermission(actor.permissions || [], SHS_SECURITY_PERMISSIONS.PROJECT_SUBMISSION_REVIEW)) throw new MissionPublicationError("FORBIDDEN", "Mission review permission is required.", 403);
    const submission = await this.repo.getSubmission(scope, id(submissionIdInput, "submissionId"));
    if (!submission) throw new MissionPublicationError("MISSION_SUBMISSION_NOT_FOUND", "Mission submission was not found.", 404);
    const definition = validateSnapshot(submission.definition, "DRAFT");
    return { ...submission, definition, validation: { valid: true, errors: [] } };
  }

  async decide(actor: MissionPublicationActor, submissionIdInput: unknown, decision: "APPROVED" | "REJECTED", noteInput?: unknown) {
    const scope = scopeFor(actor, SHS_SECURITY_PERMISSIONS.PROJECT_SUBMISSION_REVIEW);
    const submissionId = id(submissionIdInput, "submissionId");
    const note = noteValue(noteInput, decision === "REJECTED");
    return resultOrThrow(await this.repo.decide(scope, submissionId, decision, note));
  }

  async publish(actor: MissionPublicationActor, submissionIdInput: unknown) {
    const scope = scopeFor(actor, SHS_SECURITY_PERMISSIONS.CURRICULUM_CATALOG_PUBLISH);
    const submissionId = id(submissionIdInput, "submissionId");
    const submission = await this.repo.getSubmission(scope, submissionId);
    if (!submission) throw new MissionPublicationError("MISSION_SUBMISSION_NOT_FOUND", "Mission submission was not found.", 404);
    if (submission.status !== "APPROVED") throw new MissionPublicationError("MISSION_SUBMISSION_NOT_APPROVED", "Only an approved submission can be published.", 409);
    const definition = validateSnapshot(submission.definition, "PUBLISHED");
    try { return resultOrThrow(await this.repo.publish(scope, submissionId, definition)); }
    catch (error: any) {
      if (error?.code === "23505") throw new MissionPublicationError("MISSION_RELEASE_IDENTITY_CONFLICT", "A release already exists for this Mission version.", 409);
      throw error;
    }
  }

  async retire(actor: MissionPublicationActor, releaseIdInput: unknown, noteInput: unknown) {
    const scope = scopeFor(actor, SHS_SECURITY_PERMISSIONS.CURRICULUM_CATALOG_RETIRE);
    const releaseId = id(releaseIdInput, "releaseId");
    const note = noteValue(noteInput, true)!;
    return resultOrThrow(await this.repo.retire(scope, releaseId, note));
  }

  async listReleases(actor: MissionPublicationActor) {
    return this.repo.listReleases(scopeFor(actor, SHS_SECURITY_PERMISSIONS.CURRICULUM_CATALOG_PUBLISH));
  }
}

export function validatePublishedSnapshot(value: unknown) {
  try {
    const definition = validateSnapshot(value, "PUBLISHED");
    assertValidMissionDefinition(definition);
    return definition;
  } catch { return null; }
}
