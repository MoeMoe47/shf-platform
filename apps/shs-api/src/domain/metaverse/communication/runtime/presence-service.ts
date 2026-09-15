import { randomUUID } from "node:crypto";
import { SILICON_HEARTLAND_CITY_ID } from "../../registry/city-registry.js";
import {
  createPresenceSession,
  deriveCityAggregatePresence,
  isPresenceSessionCurrent,
  isUserSelectablePresenceStatus,
  type MetaversePresenceSession,
  type MetaversePresenceStatus,
  type MetaverseRoleContext,
  type MetaverseVisibilityScope,
  PRESENCE_HEARTBEAT_POLICY,
} from "../presence-contract.js";
import { resolvePresenceVisibility } from "../communication-policy.js";
import { metaverseCommunicationRepository, type MetaverseCommunicationRepository } from "./communication-repository.js";

export class MetaverseCommunicationError extends Error {
  constructor(public code: string, message = code, public statusCode = 403) {
    super(message);
  }
}

function normalize(value: unknown) {
  const text = String(value || "").trim();
  return text || null;
}

function array(value: unknown): string[] {
  return Array.isArray(value) ? Array.from(new Set(value.map(normalize).filter(Boolean))) as string[] : [];
}

function isActive(user: any) {
  if (!user) return false;
  if (user.org_context_error) return false;
  const status = String(user.status || "active").toLowerCase();
  if (["suspended", "revoked", "inactive"].includes(status)) return false;
  const orgId = normalize(user.active_organization_id || user.organization_id);
  const membership = (Array.isArray(user.memberships) ? user.memberships : []).find((item: any) => item.organization_id === orgId) || user;
  return String(membership?.status || "active").toLowerCase() === "active" && String(membership?.organization_status || "active").toLowerCase() === "active";
}

export function metaverseRoleContext(user: any): MetaverseRoleContext {
  const roles = array(user?.organization_scoped_roles || user?.roles || [user?.role, user?.role_name, user?.role_id]);
  const permissions = array(user?.organization_scoped_permissions || user?.permissions);
  const joined = roles.join(" ").toLowerCase();
  let role: MetaverseRoleContext["role"] = "STUDENT";
  if (/super_admin|org_admin|admin/.test(joined)) role = "ORG_ADMIN";
  else if (/moderator|support/.test(joined)) role = "MODERATOR";
  else if (/instructor|teacher|coach/.test(joined)) role = "INSTRUCTOR";
  else if (/guest/.test(joined)) role = "GUEST";
  return { role, permissionRefs: permissions };
}

export function actorContext(user: any) {
  const organizationId = normalize(user?.active_organization_id || user?.organization_id);
  return {
    user_id: normalize(user?.user_id || user?.id),
    organization_id: organizationId,
    tenant_id: user?.tenant_id === undefined ? null : normalize(user?.tenant_id),
    role_context: metaverseRoleContext(user),
    cohort_ids: array(user?.metaverse_authority_facts?.cohorts || user?.cohort_ids),
    team_ids: array(user?.metaverse_authority_facts?.teams || user?.team_ids),
    class_ids: array(user?.metaverse_authority_facts?.classes || user?.class_ids),
    project_ids: array(user?.metaverse_authority_facts?.projects || user?.project_ids),
    simulation_ids: array(user?.metaverse_authority_facts?.simulations || user?.simulation_ids),
    revoked: !isActive(user),
  };
}

function requireActor(user: any) {
  if (!user) throw new MetaverseCommunicationError("AUTH_REQUIRED", "Authentication required.", 401);
  if (user.org_context_error) throw new MetaverseCommunicationError(user.org_context_error, "Valid active organization context is required.", 403);
  const actor = actorContext(user);
  if (!actor.organization_id) throw new MetaverseCommunicationError("ORG_CONTEXT_REQUIRED", "Valid active organization context is required.", 403);
  if (!actor.user_id) throw new MetaverseCommunicationError("AUTH_REQUIRED", "Authentication required.", 401);
  if (actor.revoked) throw new MetaverseCommunicationError("MEMBERSHIP_REVOKED", "Active organization membership is required.", 403);
  return actor;
}

function visibilityFor(input: any): MetaverseVisibilityScope {
  if (input?.facility_id || input?.facilityId) return "SAME_FACILITY";
  if (input?.district_id || input?.districtId) return "SAME_DISTRICT";
  return "CITY_AGGREGATE_ONLY";
}

function statusFor(input: any): MetaversePresenceStatus {
  const requested = String(input?.status || "").trim() as MetaversePresenceStatus;
  if (requested && isUserSelectablePresenceStatus(requested)) return requested;
  if (input?.activity_id || input?.activityId) return "IN_ACTIVITY";
  if (input?.facility_id || input?.facilityId) return "ACTIVE";
  return "ONLINE";
}

export class MetaversePresenceService {
  constructor(private repo: MetaverseCommunicationRepository = metaverseCommunicationRepository) {}

  requireActor(user: any) {
    return requireActor(user);
  }

  cleanup(now = new Date()) {
    for (const session of this.repo.listPresence()) {
      if (!isPresenceSessionCurrent(session, now) || session.moderation_state === "REVOKED") this.repo.deletePresence(session.presence_session_id);
    }
  }

  start(user: any, body: any = {}, now = new Date()): MetaversePresenceSession {
    const actor = requireActor(user);
    const session = createPresenceSession({
      actor,
      presence_session_id: randomUUID(),
      city_id: normalize(body.city_id || body.cityId) || SILICON_HEARTLAND_CITY_ID,
      district_id: normalize(body.district_id || body.districtId) || "public-realm",
      facility_id: normalize(body.facility_id || body.facilityId),
      activity_id: normalize(body.activity_id || body.activityId),
      status: statusFor(body),
      visibility_scope: visibilityFor(body),
      client_instance_id: normalize(body.client_instance_id || body.clientInstanceId) || randomUUID(),
      connected_at: now.toISOString(),
      accessibility_presence_preferences_reference: `accessibility-presence:${actor.organization_id}:${actor.user_id}`,
    });
    return this.repo.upsertPresence(session);
  }

  heartbeat(user: any, body: any = {}, now = new Date()) {
    const actor = requireActor(user);
    const sessionId = normalize(body.presence_session_id || body.presenceSessionId);
    if (!sessionId) throw new MetaverseCommunicationError("PRESENCE_SESSION_REQUIRED", "Presence session id is required.", 400);
    const existing = this.repo.getPresence(sessionId);
    if (!existing || existing.user_id !== actor.user_id || existing.organization_id !== actor.organization_id) {
      throw new MetaverseCommunicationError("PRESENCE_SESSION_NOT_FOUND", "Presence session unavailable.", 404);
    }
    const expires = new Date(now.getTime() + PRESENCE_HEARTBEAT_POLICY.staleSessionTimeoutSeconds * 1000);
    const next = { ...existing, last_seen_at: now.toISOString(), expires_at: expires.toISOString(), status: statusFor({ ...existing, ...body }) };
    return this.repo.upsertPresence(next);
  }

  revoke(user: any, sessionId: string | null) {
    const actor = requireActor(user);
    if (!sessionId) return { revoked: 0 };
    const existing = this.repo.getPresence(sessionId);
    if (existing && existing.user_id === actor.user_id && existing.organization_id === actor.organization_id) {
      this.repo.deletePresence(sessionId);
      return { revoked: 1 };
    }
    return { revoked: 0 };
  }

  city(user: any, now = new Date()) {
    const actor = requireActor(user);
    this.cleanup(now);
    const sessions = this.repo.listPresence().filter((session) => session.organization_id === actor.organization_id);
    return deriveCityAggregatePresence(sessions, now).map((item) => ({ ...item, exposes_identity: false }));
  }

  participants(user: any, input: { district_id?: string | null; facility_id?: string | null; room_id?: string | null; scope?: MetaverseVisibilityScope }, now = new Date()) {
    const actor = requireActor(user);
    this.cleanup(now);
    const viewer = {
      user_id: actor.user_id as string,
      organization_id: actor.organization_id as string,
      role: actor.role_context.role,
      authorizedScopes: ["SAME_FACILITY", "SAME_DISTRICT", "SAME_COHORT", "SAME_TEAM", "AUTHORIZED_STAFF"] as MetaverseVisibilityScope[],
      cohort_ids: actor.cohort_ids,
      team_ids: actor.team_ids,
      class_ids: actor.class_ids,
    };
    const requestedScope = input.scope || (input.facility_id ? "SAME_FACILITY" : "SAME_DISTRICT");
    const rows = this.repo.listPresence()
      .filter((session) => session.organization_id === actor.organization_id)
      .filter((session) => !input.district_id || session.district_id === input.district_id)
      .filter((session) => !input.facility_id || session.facility_id === input.facility_id)
      .filter((session) => isPresenceSessionCurrent(session, now))
      .map((session) => ({ session, decision: resolvePresenceVisibility({ viewer, target: session, requestedScope }) }))
      .filter((item) => item.decision.visible && item.decision.exposesIdentity)
      .map(({ session }) => ({
        presence_session_id: session.presence_session_id,
        display_name: session.user_id === actor.user_id ? "You" : "Participant",
        role_label: ["INSTRUCTOR", "MODERATOR", "ORG_ADMIN"].includes(session.role_context.role) ? session.role_context.role.replace("_", " ") : "Participant",
        status: session.status,
        relationship: session.team_ids.some((id) => actor.team_ids.includes(id)) ? "TEAM" : session.cohort_ids.some((id) => actor.cohort_ids.includes(id)) ? "COHORT" : "LOCATION",
      }));
    return { participant_count: rows.length, participants: rows };
  }
}
