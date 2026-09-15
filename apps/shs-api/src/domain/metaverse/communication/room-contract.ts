export const METAVERSE_ROOM_TYPES = [
  "FACILITY_ROOM",
  "DISTRICT_ROOM",
  "CLASS_ROOM",
  "COHORT_ROOM",
  "TEAM_ROOM",
  "PROJECT_ROOM",
  "CIVIC_SESSION_ROOM",
  "JOB_SIMULATION_ROOM",
  "EVENT_ROOM",
  "HELP_SUPPORT_ROOM",
  "STAFF_MODERATION_ROOM",
] as const;

export type MetaverseRoomType = (typeof METAVERSE_ROOM_TYPES)[number];

export type MetaverseRoomContract = {
  room_id: string;
  organization_id: string;
  room_type: MetaverseRoomType;
  city_id?: string | null;
  district_id?: string | null;
  facility_id?: string | null;
  class_id?: string | null;
  cohort_id?: string | null;
  team_id?: string | null;
  project_id?: string | null;
  civic_session_id?: string | null;
  job_simulation_id?: string | null;
  owner_domain: "metaverse-communication" | "curriculum" | "career" | "shf-civic" | "studio" | "support";
  membership_rule: "SERVER_AUTHORIZED_CONTEXT" | "CLASS_MEMBERSHIP" | "COHORT_MEMBERSHIP" | "TEAM_MEMBERSHIP" | "PROJECT_MEMBERSHIP" | "STAFF_ONLY" | "HELP_REQUEST_CONTEXT";
  posting_rule: "MEMBERS" | "INSTRUCTORS_AND_MODERATORS" | "ANNOUNCEMENTS_ONLY" | "STAFF_ONLY" | "LOCKED";
  moderation_policy: string;
  retention_policy_reference: string;
  status: "ACTIVE" | "LOCKED" | "ARCHIVED" | "CLOSED";
  created_at: string;
  expires_at?: string | null;
  anonymous_allowed: false;
};

export type RoomMembershipDecision = {
  allowed: boolean;
  reason: string;
  server_authoritative: true;
};

export function validateRoomContract(room: MetaverseRoomContract): string[] {
  const errors: string[] = [];
  if (!room.room_id) errors.push("room_id_required");
  if (!room.organization_id) errors.push("organization_id_required");
  if (!METAVERSE_ROOM_TYPES.includes(room.room_type)) errors.push("room_type_invalid");
  if (room.anonymous_allowed !== false) errors.push("anonymous_rooms_prohibited");
  if (!room.membership_rule) errors.push("membership_rule_required");
  if (!room.posting_rule) errors.push("posting_rule_required");
  if (!room.moderation_policy) errors.push("moderation_policy_required");
  if (!room.retention_policy_reference) errors.push("retention_policy_reference_required");
  return errors;
}

export function resolveRoomMembership(input: {
  room: MetaverseRoomContract;
  actor: {
    user_id?: string | null;
    organization_id?: string | null;
    role?: string | null;
    class_ids?: string[];
    cohort_ids?: string[];
    team_ids?: string[];
    project_ids?: string[];
    revoked?: boolean;
  };
}): RoomMembershipDecision {
  const { room, actor } = input;
  if (!actor.user_id) return { allowed: false, reason: "canonical_user_required", server_authoritative: true };
  if (actor.revoked) return { allowed: false, reason: "revoked_membership", server_authoritative: true };
  if (actor.organization_id !== room.organization_id) return { allowed: false, reason: "cross_org_room_access_denied", server_authoritative: true };
  if (room.status === "CLOSED" || room.status === "ARCHIVED") return { allowed: false, reason: "room_not_active", server_authoritative: true };
  if (room.membership_rule === "STAFF_ONLY") {
    return ["INSTRUCTOR", "MODERATOR", "ORG_ADMIN"].includes(String(actor.role))
      ? { allowed: true, reason: "authorized_staff", server_authoritative: true }
      : { allowed: false, reason: "staff_only", server_authoritative: true };
  }
  if (room.class_id && room.membership_rule === "CLASS_MEMBERSHIP" && !(actor.class_ids || []).includes(room.class_id)) {
    return { allowed: false, reason: "class_membership_required", server_authoritative: true };
  }
  if (room.cohort_id && room.membership_rule === "COHORT_MEMBERSHIP" && !(actor.cohort_ids || []).includes(room.cohort_id)) {
    return { allowed: false, reason: "cohort_membership_required", server_authoritative: true };
  }
  if (room.team_id && room.membership_rule === "TEAM_MEMBERSHIP" && !(actor.team_ids || []).includes(room.team_id)) {
    return { allowed: false, reason: "team_membership_required", server_authoritative: true };
  }
  if (room.project_id && room.membership_rule === "PROJECT_MEMBERSHIP" && !(actor.project_ids || []).includes(room.project_id)) {
    return { allowed: false, reason: "project_membership_required", server_authoritative: true };
  }
  return { allowed: true, reason: "authorized_context", server_authoritative: true };
}
