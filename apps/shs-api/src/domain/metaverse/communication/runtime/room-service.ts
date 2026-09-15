import { randomUUID } from "node:crypto";
import { SILICON_HEARTLAND_CITY_ID } from "../../registry/city-registry.js";
import { METAVERSE_DIRECT_MESSAGING_POLICY } from "../communication-policy.js";
import { resolveRoomMembership, validateRoomContract, type MetaverseRoomContract, type MetaverseRoomType } from "../room-contract.js";
import { metaverseCommunicationRepository, type MetaverseCommunicationRepository } from "./communication-repository.js";
import { actorContext, MetaverseCommunicationError } from "./presence-service.js";

function normalize(value: unknown) {
  const text = String(value || "").trim();
  return text || null;
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

function roomIdFor(type: MetaverseRoomType, organizationId: string, body: any) {
  return [
    "met6",
    organizationId,
    type.toLowerCase(),
    normalize(body.class_id || body.classId),
    normalize(body.cohort_id || body.cohortId),
    normalize(body.team_id || body.teamId),
    normalize(body.project_id || body.projectId),
    normalize(body.civic_session_id || body.civicSessionId),
    normalize(body.job_simulation_id || body.jobSimulationId),
    normalize(body.facility_id || body.facilityId),
    normalize(body.district_id || body.districtId),
  ].filter(Boolean).join(":");
}

function membershipRule(type: MetaverseRoomType): MetaverseRoomContract["membership_rule"] {
  if (type === "CLASS_ROOM") return "CLASS_MEMBERSHIP";
  if (type === "COHORT_ROOM") return "COHORT_MEMBERSHIP";
  if (type === "TEAM_ROOM") return "TEAM_MEMBERSHIP";
  if (type === "PROJECT_ROOM") return "PROJECT_MEMBERSHIP";
  if (type === "STAFF_MODERATION_ROOM") return "STAFF_ONLY";
  if (type === "HELP_SUPPORT_ROOM") return "HELP_REQUEST_CONTEXT";
  return "SERVER_AUTHORIZED_CONTEXT";
}

export class MetaverseRoomService {
  constructor(private repo: MetaverseCommunicationRepository = metaverseCommunicationRepository) {}

  requireActor(user: any) {
    return requireActor(user);
  }

  getOrCreate(user: any, body: any = {}, now = new Date()) {
    const actor = requireActor(user);
    const type = String(body.room_type || body.roomType || "FACILITY_ROOM") as MetaverseRoomType;
    if (String(body.room_type || body.roomType || "").toUpperCase() === "DIRECT_MESSAGE") {
      throw new MetaverseCommunicationError("STUDENT_DM_DISABLED_BY_DEFAULT", "Student direct messaging is disabled by default.", 403);
    }
    if (body.anonymous === true || body.anonymous_allowed === true) throw new MetaverseCommunicationError("ANONYMOUS_ROOM_DENIED", "Anonymous rooms are not allowed.", 403);
    if (type === "CIVIC_SESSION_ROOM" && !actorContext(user).role_context.permissionRefs.includes("shf.civic.session")) {
      throw new MetaverseCommunicationError("SHF_CIVIC_AUTHORITY_UNRESOLVED", "SHF Civic authority is unresolved for metaverse rooms.", 403);
    }

    const organizationId = actor.organization_id as string;
    const room: MetaverseRoomContract = {
      room_id: normalize(body.room_id || body.roomId) || roomIdFor(type, organizationId, body) || randomUUID(),
      organization_id: organizationId,
      room_type: type,
      city_id: normalize(body.city_id || body.cityId) || SILICON_HEARTLAND_CITY_ID,
      district_id: normalize(body.district_id || body.districtId),
      facility_id: normalize(body.facility_id || body.facilityId),
      class_id: normalize(body.class_id || body.classId),
      cohort_id: normalize(body.cohort_id || body.cohortId),
      team_id: normalize(body.team_id || body.teamId),
      project_id: normalize(body.project_id || body.projectId),
      civic_session_id: normalize(body.civic_session_id || body.civicSessionId),
      job_simulation_id: normalize(body.job_simulation_id || body.jobSimulationId),
      owner_domain: type === "PROJECT_ROOM" ? "studio" : type === "JOB_SIMULATION_ROOM" ? "career" : type === "CIVIC_SESSION_ROOM" ? "shf-civic" : "metaverse-communication",
      membership_rule: membershipRule(type),
      posting_rule: type === "STAFF_MODERATION_ROOM" ? "STAFF_ONLY" : "MEMBERS",
      moderation_policy: "metaverse.communication.moderation.policy-reference.v1",
      retention_policy_reference: "metaverse.communication.retention.policy-reference.v1",
      status: "ACTIVE",
      created_at: now.toISOString(),
      expires_at: null,
      anonymous_allowed: false,
    };
    const errors = validateRoomContract(room);
    if (errors.length) throw new MetaverseCommunicationError("ROOM_CONTRACT_INVALID", errors.join(","), 400);
    const decision = this.membershipDecision(user, room);
    if (!decision.allowed) throw new MetaverseCommunicationError(decision.reason.toUpperCase(), decision.reason, 403);
    return this.repo.saveRoom(room);
  }

  getAuthorized(user: any, roomId: string) {
    requireActor(user);
    const room = this.repo.getRoom(roomId);
    if (!room) throw new MetaverseCommunicationError("ROOM_NOT_FOUND", "Room not found.", 404);
    const decision = this.membershipDecision(user, room);
    if (!decision.allowed) throw new MetaverseCommunicationError(decision.reason.toUpperCase(), decision.reason, 403);
    return room;
  }

  membershipDecision(user: any, room: MetaverseRoomContract) {
    const actor = requireActor(user);
    if (room.room_type === "JOB_SIMULATION_ROOM" && room.job_simulation_id && !actor.simulation_ids.includes(room.job_simulation_id)) {
      return { allowed: false, reason: "simulation_authorization_required", server_authoritative: true as const };
    }
    return resolveRoomMembership({
      room,
      actor: {
        user_id: actor.user_id,
        organization_id: actor.organization_id,
        role: actor.role_context.role,
        class_ids: actor.class_ids,
        cohort_ids: actor.cohort_ids,
        team_ids: actor.team_ids,
        project_ids: actor.project_ids,
        revoked: actor.revoked,
      },
    });
  }

  directMessagingPolicy() {
    return METAVERSE_DIRECT_MESSAGING_POLICY;
  }
}
