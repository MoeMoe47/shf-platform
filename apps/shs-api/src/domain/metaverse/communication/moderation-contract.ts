export const METAVERSE_MODERATION_ACTIONS = [
  "WARN",
  "MUTE",
  "ROOM_MUTE",
  "REMOVE_FROM_ROOM",
  "TEMPORARY_COMMUNICATION_SUSPENSION",
  "BLOCK_INTERACTION",
  "REPORT",
  "ESCALATE_TO_AUTHORIZED_STAFF",
  "RETAIN_EVIDENCE",
  "CLOSE_ROOM",
  "LOCK_POSTING",
  "ARCHIVE_CONVERSATION",
] as const;

export type MetaverseModerationAction = (typeof METAVERSE_MODERATION_ACTIONS)[number];
export type MetaverseModerationScope = "ROOM" | "FACILITY" | "DISTRICT" | "ORGANIZATION";

export type MetaverseModerationDecision = {
  action: MetaverseModerationAction;
  scope: MetaverseModerationScope;
  actor_user_id: string;
  target_user_id?: string | null;
  room_id?: string | null;
  organization_id: string;
  reason_code: string;
  evidence_reference?: string | null;
  audit_reference: string;
};

export const METAVERSE_MODERATOR_BOUNDARY = {
  grantsUnrelatedPlatformAuthority: false,
  allowedScopes: ["ROOM", "FACILITY", "DISTRICT", "ORGANIZATION"] as MetaverseModerationScope[],
  prohibitedAuthorities: [
    "identity_role_assignment",
    "organization_membership_management",
    "credential_issuance",
    "civic_authority",
    "economy_authority",
    "evidence_truth_authority",
  ],
} as const;

export function isModeratorActionInScope(input: {
  moderatorScope: MetaverseModerationScope;
  targetScope: MetaverseModerationScope;
  sameOrganization: boolean;
}): boolean {
  if (!input.sameOrganization) return false;
  const rank: Record<MetaverseModerationScope, number> = { ROOM: 1, FACILITY: 2, DISTRICT: 3, ORGANIZATION: 4 };
  return rank[input.moderatorScope] >= rank[input.targetScope];
}

export type CommunicationPreferenceAction =
  | { kind: "MUTE"; hides_messages_for_user: true; changes_target_permissions: false }
  | { kind: "BLOCK"; prevents_direct_interaction_paths: true; expels_target_from_platform: false }
  | { kind: "REPORT"; creates_reviewable_record: true; declares_guilt: false; preserves_context: true };

export const COMMUNICATION_PREFERENCE_SEMANTICS = {
  mute: { kind: "MUTE", hides_messages_for_user: true, changes_target_permissions: false },
  block: { kind: "BLOCK", prevents_direct_interaction_paths: true, expels_target_from_platform: false },
  report: { kind: "REPORT", creates_reviewable_record: true, declares_guilt: false, preserves_context: true },
} as const satisfies Record<string, CommunicationPreferenceAction>;
