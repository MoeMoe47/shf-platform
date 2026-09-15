import type { NotificationCategory } from "../../notifications/contracts/communication-contracts.js";
import type { MetaversePresenceSession, MetaverseVisibilityScope } from "./presence-contract.js";

export const METAVERSE_COMMUNICATION_AUTHORITY_BOUNDARY = {
  ownsOnly: [
    "presence_session_state",
    "room_channel_definitions",
    "room_participation_state",
    "message_records_if_canonical_store_is_justified",
    "metaverse_communication_moderation_actions",
    "block_mute_preferences",
    "communication_presence_reports",
    "derived_online_nearby_projections",
  ],
  doesNotOwn: [
    "identity",
    "organization_membership",
    "role",
    "cohort_membership",
    "authorization",
    "civic_authority",
    "job_eligibility",
    "credential_authority",
    "economy_authority",
    "notification_center",
    "evidence_truth_authority",
  ],
  duplicateIdentityAuthority: false,
  duplicateNotificationAuthority: false,
  civicSureCommunicationAuthority: false,
} as const;

export const METAVERSE_DIRECT_MESSAGING_POLICY = {
  studentOneToOneDmEnabledByDefault: false,
  requiresExplicitOrganizationPolicy: true,
  requiresAgeRoleRules: true,
  approvedStudentCommunicationContexts: ["class", "cohort", "team", "project", "civic_session", "simulation", "event"],
  rationale: "School-safe communication should happen in approved, moderated, organization-bounded shared contexts rather than uncontrolled direct messaging.",
} as const;

export const METAVERSE_NOTIFICATION_INTEGRATION = {
  canonicalOwner: "NCA",
  createsSecondNotificationCenter: false,
  allowedNotificationTypes: [
    "METAVERSE_TEAM_MESSAGE",
    "METAVERSE_INSTRUCTOR_ANNOUNCEMENT",
    "METAVERSE_HELP_RESPONSE",
    "METAVERSE_CIVIC_SESSION_STARTING",
    "METAVERSE_JOB_SIMULATION_INVITATION",
    "METAVERSE_MODERATION_NOTICE",
  ],
  categoryByType: {
    METAVERSE_TEAM_MESSAGE: "OPTIONAL_PRODUCT",
    METAVERSE_INSTRUCTOR_ANNOUNCEMENT: "MANDATORY_OPERATIONAL",
    METAVERSE_HELP_RESPONSE: "REQUIRED_ACTION",
    METAVERSE_CIVIC_SESSION_STARTING: "TRANSACTIONAL",
    METAVERSE_JOB_SIMULATION_INVITATION: "TRANSACTIONAL",
    METAVERSE_MODERATION_NOTICE: "MANDATORY_OPERATIONAL",
  } satisfies Record<string, NotificationCategory>,
} as const;

export const METAVERSE_ACCESSIBILITY_COMMUNICATION_CONTRACT = {
  keyboardOperation: true,
  screenReaderParticipantLists: true,
  semanticRoomNames: true,
  accessibleMessageChronology: true,
  reducedMotion: true,
  nonColorOnlyPresenceStatus: true,
  futureCaptionsTranscripts: true,
  textFirstCommunicationBaseline: true,
  mobileTabletUsability: true,
  focusManagement: true,
  accessibleModerationActions: true,
} as const;

export const METAVERSE_STUDENT_SAFETY_CONTROLS = [
  "no_anonymous_contact",
  "no_unrestricted_external_messaging",
  "no_default_city_wide_student_directory",
  "no_client_side_role_spoofing",
  "no_hidden_unmoderated_rooms",
  "no_disappearing_evidence_for_reported_incidents",
  "bounded_staff_visibility",
  "organization_policy_controls",
  "cohort_team_scoping",
  "age_grade_policy_hooks",
  "safe_links",
  "message_rate_limiting",
  "spam_flood_protection",
  "account_session_revocation_propagation",
  "report_block_mute_availability",
  "moderation_audit_trail",
] as const;

export const METAVERSE_RETENTION_ARCHITECTURE = {
  ordinaryMessageRetention: "policy_reference_required",
  moderationEvidenceRetention: "policy_reference_required_and_incident_preserving",
  reportedIncidentRetention: "policy_reference_required_and_not_destroyed_by_user_delete",
  presenceRetention: "short_lived_state_with_optional_policy_bounded_audit_projection",
  aggregateAnalytics: "deidentified_or_aggregate_policy_reference_required",
  hardcodedDuration: false,
} as const;

export type VisibilityViewerContext = {
  user_id: string;
  organization_id: string;
  role: "STUDENT" | "INSTRUCTOR" | "MODERATOR" | "ORG_ADMIN" | "GUEST" | "EXTERNAL_PARTICIPANT";
  authorizedScopes: MetaverseVisibilityScope[];
  cohort_ids?: string[];
  team_ids?: string[];
  class_ids?: string[];
};

export function resolvePresenceVisibility(input: {
  viewer: VisibilityViewerContext;
  target: MetaversePresenceSession;
  requestedScope: MetaverseVisibilityScope;
  clientRequestedScope?: MetaverseVisibilityScope;
}): { visible: boolean; reason: string; exposesIdentity: boolean } {
  const { viewer, target, requestedScope } = input;
  if (viewer.organization_id !== target.organization_id) return { visible: false, reason: "cross_org_presence_denied", exposesIdentity: false };
  if (requestedScope === "CITY_AGGREGATE_ONLY") return { visible: true, reason: "aggregate_only", exposesIdentity: false };
  if (!viewer.authorizedScopes.includes(requestedScope)) return { visible: false, reason: "server_visibility_policy_required", exposesIdentity: false };
  if (input.clientRequestedScope && input.clientRequestedScope !== requestedScope) {
    return { visible: false, reason: "client_cannot_self_grant_visibility", exposesIdentity: false };
  }
  if (["INSTRUCTOR", "MODERATOR", "ORG_ADMIN"].includes(viewer.role) && requestedScope === "AUTHORIZED_STAFF") {
    return { visible: true, reason: "authorized_staff_visibility", exposesIdentity: true };
  }
  if (requestedScope === "SAME_FACILITY" && target.facility_id) return { visible: true, reason: "same_facility_policy", exposesIdentity: true };
  if (requestedScope === "SAME_DISTRICT") return { visible: true, reason: "same_district_policy", exposesIdentity: true };
  if (requestedScope === "SAME_COHORT" && target.cohort_ids.some((id) => (viewer.cohort_ids || []).includes(id))) {
    return { visible: true, reason: "same_cohort_policy", exposesIdentity: true };
  }
  if (requestedScope === "SAME_TEAM" && target.team_ids.some((id) => (viewer.team_ids || []).includes(id))) {
    return { visible: true, reason: "same_team_policy", exposesIdentity: true };
  }
  return { visible: false, reason: "visibility_relationship_not_authorized", exposesIdentity: false };
}

export function canCreateMetaverseRoom(input: { authenticated: boolean; organization_id?: string | null; anonymous?: boolean }): boolean {
  return Boolean(input.authenticated && input.organization_id && input.anonymous !== true);
}
