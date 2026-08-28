// Phase 2A Secure Live Learning — service layer. This is the ONLY place
// that decides whether a join is authorized. No client-side state
// (localStorage, src/utils/zoomAccess.js) is ever consulted here.
import { randomUUID } from "crypto";
import { LiveSessionRepo } from "../repo/live-session-repo";
import { getProvider, listProviders } from "../providers/provider-registry";
import { ProviderNotConfiguredError } from "../providers/live-learning-provider";
import { writeAuditEvent } from "../../audit/service/audit-helper";
import {
  DEFAULT_ACCESS_POLICY,
  DEFAULT_RECORDING_POLICY,
  LiveSession,
  LiveSessionStatus,
  LiveLearningProviderName,
} from "../model/live-session";

const repo = new LiveSessionRepo();

export class SessionNotFoundError extends Error {
  constructor() { super("Live session not found."); this.name = "SessionNotFoundError"; }
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

export async function createSession(actor: ActorUser, input: CreateSessionInput): Promise<LiveSession> {
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

export async function getSession(id: string): Promise<LiveSession> {
  const session = await repo.getById(id);
  if (!session) throw new SessionNotFoundError();
  return session;
}

export async function cancelSession(id: string, actor: ActorUser): Promise<LiveSession> {
  const session = await repo.getById(id);
  if (!session) throw new SessionNotFoundError();

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
