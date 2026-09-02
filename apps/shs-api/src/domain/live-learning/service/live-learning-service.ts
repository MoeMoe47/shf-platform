// Phase 2A Secure Live Learning — service layer. This is the ONLY place
// that decides whether a join is authorized. No client-side state
// (localStorage, src/utils/zoomAccess.js) is ever consulted here.
import { randomUUID } from "crypto";
import { LiveSessionRepo } from "../repo/live-session-repo.js";
import { getProvider, listProviders } from "../providers/provider-registry.js";
import { ProviderNotConfiguredError } from "../providers/live-learning-provider.js";
import { writeAuditEvent } from "../../audit/service/audit-helper.js";
import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { IntegrationOutboxRepo } from "../../trusted-reporting/outbox-repo.js";
import { EnrollmentRepo } from "../../enrollments/repo/enrollment-repo.js";
import {
  DEFAULT_ACCESS_POLICY,
  DEFAULT_RECORDING_POLICY,
  LiveSession,
  LiveSessionStatus,
  LiveLearningProviderName,
} from "../model/live-session.js";

const repo = new LiveSessionRepo();
const outbox = new IntegrationOutboxRepo();
const enrollmentRepo = new EnrollmentRepo();
const ADMIN_TIER_ROLES = ["shf_admin", "shs_admin", "org_admin", "super_admin", "program_manager"];

export async function confirmAttendance(actor: any, joinEventId: string) {
  if (!hasPermission(actor?.permissions, SHS_SECURITY_PERMISSIONS.LIVE_LEARNING_JOIN_AUTHORIZE)) throw new LiveLearningEligibilityError("FORBIDDEN", "Attendance confirmation permission is required.", 403);
  const organizationId = String(actor?.organization_id || "");
  if (!organizationId) throw new LiveLearningEligibilityError("SCOPE_MISSING", "Organization is required.", 403);
  const row = await repo.confirmAttendance(joinEventId, organizationId);
  if (!row) throw new SessionNotFoundError();
  await outbox.enqueue({
    producer_id: "live-learning.attendance",
    event_type: "attendance.confirmed",
    schema_version: "1.0",
    subject_type: "attendance",
    subject_id: row.join_event_id,
    organization_id: organizationId,
    originating_actor_id: String(actor.user_id),
    originating_actor_type: "user",
    tenant_id: String(actor.tenant_id || `tenant:${organizationId}`),
    occurred_at: new Date(row.created_at).toISOString(),
    idempotency_key: `attendance.confirmed:${row.join_event_id}`,
    correlation_id: `attendance:${row.join_event_id}`,
    payload: { source_record_id: row.join_event_id, learner_id: row.user_id },
    destination: "shs-verified-evidence",
  });
  return row;
}

export class SessionNotFoundError extends Error {
  constructor() { super("Live session not found."); this.name = "SessionNotFoundError"; }
}

export class LiveLearningEligibilityError extends Error {
  constructor(public code: string, message: string, public statusCode = 403) {
    super(message);
    this.name = "LiveLearningEligibilityError";
  }
}

export interface CreateSessionInput {
  provider?: LiveLearningProviderName;
  title: string;
  description?: string;
  courseId?: string;
  moduleId?: string;
  lessonId?: string;
  cohortId?: string;
  startsAt: string;
  durationMinutes: number;
  timezone?: string;
  accessPolicy?: Partial<typeof DEFAULT_ACCESS_POLICY>;
}

export interface ActorUser {
  user_id: string;
  organization_id: string;
  roles: string[];
}

export interface ListSessionsInput {
  organizationId: string;
  lessonId?: string;
  instructorId?: string;
  actor: ActorUser;
}

function isAdminTier(roles: string[]): boolean {
  return roles.some((role) => ADMIN_TIER_ROLES.includes(role));
}

function isStudentOnly(roles: string[]): boolean {
  return roles.includes("student") && !roles.includes("instructor") && !isAdminTier(roles);
}

async function isActiveCohortLearner(actor: ActorUser, cohortId: string): Promise<boolean> {
  const active = await enrollmentRepo.listActiveEnrollmentsForLearner(actor.organization_id, actor.user_id);
  return active.some((enrollment) => enrollment.cohortId === cohortId);
}

async function canViewSession(actor: ActorUser, session: LiveSession): Promise<boolean> {
  if (session.organizationId !== actor.organization_id) return false;
  if (isAdminTier(actor.roles)) return true;
  if (session.audienceScope === "ORGANIZATION") return true;
  if (!session.cohortId) return false;
  if (isStudentOnly(actor.roles)) return isActiveCohortLearner(actor, session.cohortId);
  return session.instructorId === actor.user_id ||
    enrollmentRepo.isActiveCohortStaff(actor.organization_id, session.cohortId, actor.user_id);
}

export async function canManageSession(actor: ActorUser, session: LiveSession): Promise<boolean> {
  if (session.organizationId !== actor.organization_id) return false;
  if (isAdminTier(actor.roles)) return true;
  if (session.instructorId === actor.user_id) return true;
  if (session.audienceScope === "COHORT" && session.cohortId) {
    return enrollmentRepo.isActiveCohortStaff(actor.organization_id, session.cohortId, actor.user_id);
  }
  return false;
}

async function validateCohortScope(actor: ActorUser, cohortId: string): Promise<void> {
  const cohort = await enrollmentRepo.getCohortById(cohortId);
  if (!cohort || cohort.organizationId !== actor.organization_id) {
    throw new LiveLearningEligibilityError("COHORT_NOT_FOUND", "Cohort not found in organization.", 400);
  }
  if (cohort.status !== "ACTIVE") {
    throw new LiveLearningEligibilityError("COHORT_INACTIVE", "Live sessions may only be scheduled for ACTIVE cohorts.", 400);
  }
  if (!isAdminTier(actor.roles) && !(await enrollmentRepo.isActiveCohortStaff(actor.organization_id, cohortId, actor.user_id))) {
    throw new LiveLearningEligibilityError("COHORT_STAFF_REQUIRED", "Instructor must be active cohort staff to schedule for this cohort.", 403);
  }
}

export async function createSession(actor: ActorUser, input: CreateSessionInput): Promise<LiveSession> {
  if (input.cohortId) await validateCohortScope(actor, input.cohortId);

  const providerName = input.provider || "mock";
  const provider = getProvider(providerName);
  const health = await provider.healthCheck();
  if (health === "not_configured") {
    throw new ProviderNotConfiguredError(providerName);
  }

  const id = `live_${randomUUID()}`;
  const providerSession = await provider.createSession({
    title: input.title,
    startsAt: input.startsAt,
    durationMinutes: input.durationMinutes,
    hostId: actor.user_id,
  });

  const endsAt = new Date(new Date(input.startsAt).getTime() + input.durationMinutes * 60_000).toISOString();

  const created = await repo.create({
    id,
    organizationId: actor.organization_id,
    provider: providerName,
    providerSessionId: providerSession.providerSessionId,
    title: input.title,
    description: input.description ?? null,
    courseId: input.courseId ?? null,
    moduleId: input.moduleId ?? null,
    lessonId: input.lessonId ?? null,
    instructorId: actor.user_id,
    cohortId: input.cohortId ?? null,
    audienceScope: input.cohortId ? "COHORT" : "ORGANIZATION",
    startsAt: input.startsAt,
    endsAt,
    timezone: input.timezone || "UTC",
    status: "scheduled",
    accessPolicy: { ...DEFAULT_ACCESS_POLICY, ...(input.accessPolicy || {}) },
    recordingPolicy: { ...DEFAULT_RECORDING_POLICY, autoPublish: false },
  });

  await writeAuditEvent({
    audit_event_id: `audit_${randomUUID()}`,
    organization_id: actor.organization_id,
    actor_user_id: actor.user_id,
    target_object_type: "live_session",
    target_object_id: id,
    action_type: "liveLearning.session.created",
    new_state_json: { title: created.title, provider: created.provider, startsAt: created.startsAt, status: created.status },
    correlation_id: `corr_${id}`,
    source_channel: "api",
  });

  return created;
}

export async function listSessions(filters: { organizationId?: string; lessonId?: string; instructorId?: string; status?: LiveSessionStatus }) {
  return repo.list(filters);
}

export async function listSessionsForActor(input: ListSessionsInput): Promise<LiveSession[]> {
  if (input.organizationId !== input.actor.organization_id) return [];
  if (isAdminTier(input.actor.roles)) {
    return repo.list({ organizationId: input.organizationId, lessonId: input.lessonId, instructorId: input.instructorId });
  }
  if (isStudentOnly(input.actor.roles)) {
    return repo.listVisibleForStudent({ organizationId: input.organizationId, userId: input.actor.user_id, lessonId: input.lessonId, instructorId: input.instructorId });
  }
  return repo.listVisibleForInstructor({ organizationId: input.organizationId, userId: input.actor.user_id, lessonId: input.lessonId, instructorId: input.instructorId });
}

export async function getSession(id: string): Promise<LiveSession> {
  const session = await repo.getById(id);
  if (!session) throw new SessionNotFoundError();
  return session;
}

export async function getSessionForActor(id: string, actor: ActorUser): Promise<LiveSession | null> {
  const session = await repo.getById(id);
  if (!session) return null;
  return await canViewSession(actor, session) ? session : null;
}

export async function cancelSession(id: string, actor: ActorUser): Promise<LiveSession> {
  const session = await repo.getById(id);
  if (!session) throw new SessionNotFoundError();
  if (!(await canManageSession(actor, session))) {
    throw new LiveLearningEligibilityError("FORBIDDEN", "Only the session's instructor, authorized cohort staff, or an admin may cancel it.");
  }

  if (session.providerSessionId) {
    try {
      const provider = getProvider(session.provider);
      await provider.cancelSession(session.providerSessionId);
    } catch (err) {
      if (!(err instanceof ProviderNotConfiguredError)) throw err;
      // Not-configured providers have nothing real to cancel — proceed to
      // mark the SHF record cancelled regardless (fail safe, not open).
    }
  }

  const updated = await repo.updateStatus(id, "cancelled");

  await writeAuditEvent({
    audit_event_id: `audit_${randomUUID()}`,
    organization_id: session.organizationId,
    actor_user_id: actor.user_id,
    target_object_type: "live_session",
    target_object_id: id,
    action_type: "liveLearning.session.cancelled",
    previous_state_json: { status: session.status },
    new_state_json: { status: "cancelled" },
    correlation_id: `corr_${id}`,
    source_channel: "api",
  });

  return updated as LiveSession;
}

export interface JoinDecision {
  allowed: boolean;
  reason?: string;
  launchUrl?: string;
  expiresAt?: string;
  provider?: LiveLearningProviderName;
}

async function recordDecision(session: LiveSession, userId: string, decision: JoinDecision, actorUserId: string) {
  await repo.recordJoinEvent({
    joinEventId: `join_${randomUUID()}`,
    liveSessionId: session.id,
    userId,
    decision: decision.allowed ? "allow" : "deny",
    reason: decision.reason || null,
    attendanceStatus: decision.allowed ? "authorized" : "registered",
  });

  await writeAuditEvent({
    audit_event_id: `audit_${randomUUID()}`,
    organization_id: session.organizationId,
    actor_user_id: actorUserId,
    target_object_type: "live_session",
    target_object_id: session.id,
    action_type: decision.allowed ? "liveLearning.join.authorized" : "liveLearning.join.denied",
    reason_text: decision.reason || null,
    new_state_json: { userId, allowed: decision.allowed },
    correlation_id: `corr_${session.id}_${userId}`,
    source_channel: "api",
  });
}

/**
 * The single, server-side authorization boundary. Evaluates session
 * status and the configured join window, then (only if both pass) asks
 * the provider to issue a short-lived, per-user launch authorization.
 * No client-supplied state influences this decision — see §11/§38.
 *
 * Known gap (documented, not fabricated — see Phase 2A report §L/§N):
 * there is no course-enrollment/cohort-membership data model yet in this
 * repository, so this cannot yet verify "is this student enrolled in this
 * course" — only role, session status, and time window. Flagged as a
 * Phase 2B item, not silently pretended to be a complete enrollment check.
 */
export async function requestJoin(sessionId: string, requestingUser: ActorUser): Promise<JoinDecision> {
  const session = await repo.getById(sessionId);
  if (!session) throw new SessionNotFoundError();

  if (!(await canViewSession(requestingUser, session))) {
    const decision: JoinDecision = { allowed: false, reason: "Learner is not eligible for this live session." };
    await recordDecision(session, requestingUser.user_id, decision, requestingUser.user_id);
    return decision;
  }

  const nonJoinableStatuses: LiveSessionStatus[] = ["draft", "cancelled", "completed", "expired"];
  if (nonJoinableStatuses.includes(session.status)) {
    const decision: JoinDecision = { allowed: false, reason: `Session is ${session.status}.` };
    await recordDecision(session, requestingUser.user_id, decision, requestingUser.user_id);
    return decision;
  }

  const now = Date.now();
  const startMs = new Date(session.startsAt).getTime();
  const endMs = new Date(session.endsAt).getTime();
  const windowStart = startMs - session.accessPolicy.joinWindowMinutesBefore * 60_000;
  const windowEnd = endMs + session.accessPolicy.joinGraceMinutesAfterEnd * 60_000;

  if (now < windowStart) {
    const decision: JoinDecision = { allowed: false, reason: "Join window has not opened yet." };
    await recordDecision(session, requestingUser.user_id, decision, requestingUser.user_id);
    return decision;
  }
  if (now > windowEnd) {
    const decision: JoinDecision = { allowed: false, reason: "Join window has closed (session expired)." };
    await recordDecision(session, requestingUser.user_id, decision, requestingUser.user_id);
    return decision;
  }
  if (!session.providerSessionId) {
    const decision: JoinDecision = { allowed: false, reason: "Session has no provider session configured." };
    await recordDecision(session, requestingUser.user_id, decision, requestingUser.user_id);
    return decision;
  }

  let authResult;
  try {
    const provider = getProvider(session.provider);
    authResult = await provider.issueJoinAccess(session.providerSessionId, requestingUser.user_id);
  } catch (err) {
    if (err instanceof ProviderNotConfiguredError) {
      const decision: JoinDecision = { allowed: false, reason: "Live session provider is not configured." };
      await recordDecision(session, requestingUser.user_id, decision, requestingUser.user_id);
      return decision;
    }
    const decision: JoinDecision = { allowed: false, reason: "Provider error." };
    await recordDecision(session, requestingUser.user_id, decision, requestingUser.user_id);
    return decision;
  }

  if (!authResult.allowed) {
    const decision: JoinDecision = { allowed: false, reason: authResult.reason || "Provider denied access." };
    await recordDecision(session, requestingUser.user_id, decision, requestingUser.user_id);
    return decision;
  }

  const decision: JoinDecision = {
    allowed: true,
    launchUrl: authResult.launchUrl,
    expiresAt: authResult.expiresAt,
    provider: session.provider,
  };
  await recordDecision(session, requestingUser.user_id, decision, requestingUser.user_id);
  return decision;
}

export async function getProviderHealth() {
  const results = await Promise.all(
    listProviders().map(async (p) => ({ provider: p.name, health: await p.healthCheck() }))
  );
  return results;
}
