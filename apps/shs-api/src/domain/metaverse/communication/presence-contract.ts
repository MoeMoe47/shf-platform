export const METAVERSE_PRESENCE_STATUSES = [
  "ONLINE",
  "ACTIVE",
  "IN_ACTIVITY",
  "IN_CLASS",
  "IN_SIMULATION",
  "AVAILABLE",
  "AWAY",
  "DO_NOT_DISTURB",
  "OFFLINE",
] as const;

export type MetaversePresenceStatus = (typeof METAVERSE_PRESENCE_STATUSES)[number];

export const USER_SELECTABLE_PRESENCE_STATUSES: MetaversePresenceStatus[] = [
  "AVAILABLE",
  "AWAY",
  "DO_NOT_DISTURB",
  "OFFLINE",
];

export const SYSTEM_DERIVED_PRESENCE_STATUSES: MetaversePresenceStatus[] = [
  "ONLINE",
  "ACTIVE",
  "IN_ACTIVITY",
  "IN_CLASS",
  "IN_SIMULATION",
];

export const METAVERSE_VISIBILITY_SCOPES = [
  "SAME_FACILITY",
  "SAME_DISTRICT",
  "SAME_CLASS",
  "SAME_COHORT",
  "SAME_TEAM",
  "AUTHORIZED_STAFF",
  "CITY_AGGREGATE_ONLY",
] as const;

export type MetaverseVisibilityScope = (typeof METAVERSE_VISIBILITY_SCOPES)[number];

export type MetaverseRoleContext = {
  role: "STUDENT" | "INSTRUCTOR" | "MODERATOR" | "ORG_ADMIN" | "GUEST" | "EXTERNAL_PARTICIPANT";
  permissionRefs: string[];
};

export type MetaversePresenceSession = {
  presence_session_id: string;
  user_id: string;
  organization_id: string;
  tenant_id: string | null;
  role_context: MetaverseRoleContext;
  cohort_ids: string[];
  team_ids: string[];
  city_id: string;
  district_id: string;
  facility_id: string | null;
  activity_id: string | null;
  status: MetaversePresenceStatus;
  visibility_scope: MetaverseVisibilityScope;
  connected_at: string;
  last_seen_at: string;
  expires_at: string;
  client_instance_id: string;
  moderation_state: "CLEAR" | "MUTED" | "ROOM_MUTED" | "SUSPENDED" | "REMOVED" | "REVOKED";
  accessibility_presence_preferences_reference: string;
};

export type CanonicalMetaverseActorContext = {
  user_id: string | null;
  organization_id: string | null;
  tenant_id: string | null;
  role_context: MetaverseRoleContext | null;
  cohort_ids?: string[];
  team_ids?: string[];
  revoked?: boolean;
};

export const PRESENCE_HEARTBEAT_POLICY = {
  heartbeatIntervalSeconds: 30,
  staleSessionTimeoutSeconds: 90,
  maxClientDeclaredOnlineSeconds: 90,
  duplicateDevicePolicy: "keep_distinct_client_instances_and_coalesce_user_projection",
  networkLossBehavior: "expire_after_stale_timeout",
  signOutBehavior: "mark_offline_and_expire_immediately",
  revocationBehavior: "expire_presence_and_deny_projection",
} as const;

export function isUserSelectablePresenceStatus(status: MetaversePresenceStatus): boolean {
  return USER_SELECTABLE_PRESENCE_STATUSES.includes(status);
}

export function validatePresenceIdentity(input: Pick<MetaversePresenceSession, "user_id" | "organization_id" | "tenant_id">): string[] {
  const errors: string[] = [];
  if (!input.user_id) errors.push("canonical_user_identity_required");
  if (!input.organization_id) errors.push("canonical_organization_identity_required");
  if (input.tenant_id === undefined) errors.push("tenant_context_field_required");
  return errors;
}

export function isPresenceSessionCurrent(session: Pick<MetaversePresenceSession, "expires_at" | "last_seen_at">, now = new Date()): boolean {
  return new Date(session.expires_at).getTime() > now.getTime() && new Date(session.last_seen_at).getTime() <= now.getTime();
}

export function createPresenceSession(input: {
  actor: CanonicalMetaverseActorContext;
  presence_session_id: string;
  city_id: string;
  district_id: string;
  facility_id?: string | null;
  activity_id?: string | null;
  status?: MetaversePresenceStatus;
  visibility_scope?: MetaverseVisibilityScope;
  client_instance_id: string;
  connected_at: string;
  last_seen_at?: string;
  accessibility_presence_preferences_reference: string;
}): MetaversePresenceSession {
  if (!input.actor.user_id || !input.actor.organization_id || !input.actor.role_context) {
    throw new Error("presence_requires_canonical_identity_and_role_context");
  }
  if (input.actor.revoked) throw new Error("presence_denied_for_revoked_membership");

  const lastSeen = new Date(input.last_seen_at || input.connected_at);
  const expires = new Date(lastSeen.getTime() + PRESENCE_HEARTBEAT_POLICY.staleSessionTimeoutSeconds * 1000);

  return {
    presence_session_id: input.presence_session_id,
    user_id: input.actor.user_id,
    organization_id: input.actor.organization_id,
    tenant_id: input.actor.tenant_id,
    role_context: input.actor.role_context,
    cohort_ids: input.actor.cohort_ids || [],
    team_ids: input.actor.team_ids || [],
    city_id: input.city_id,
    district_id: input.district_id,
    facility_id: input.facility_id || null,
    activity_id: input.activity_id || null,
    status: input.status || "ONLINE",
    visibility_scope: input.visibility_scope || "CITY_AGGREGATE_ONLY",
    connected_at: input.connected_at,
    last_seen_at: lastSeen.toISOString(),
    expires_at: expires.toISOString(),
    client_instance_id: input.client_instance_id,
    moderation_state: "CLEAR",
    accessibility_presence_preferences_reference: input.accessibility_presence_preferences_reference,
  };
}

export function deriveCityAggregatePresence(sessions: MetaversePresenceSession[], now = new Date()): Array<{ city_id: string; district_id: string; online_count: number }> {
  const counts = new Map<string, { city_id: string; district_id: string; online_count: number }>();
  for (const session of sessions) {
    if (!isPresenceSessionCurrent(session, now) || session.status === "OFFLINE") continue;
    const key = `${session.city_id}:${session.district_id}`;
    const existing = counts.get(key) || { city_id: session.city_id, district_id: session.district_id, online_count: 0 };
    existing.online_count += 1;
    counts.set(key, existing);
  }
  return [...counts.values()];
}
