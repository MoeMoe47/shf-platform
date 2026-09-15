import test from "node:test";
import assert from "node:assert/strict";

import {
  METAVERSE_ACCESSIBILITY_COMMUNICATION_CONTRACT,
  METAVERSE_COMMUNICATION_AUTHORITY_BOUNDARY,
  METAVERSE_DIRECT_MESSAGING_POLICY,
  METAVERSE_NOTIFICATION_INTEGRATION,
  METAVERSE_RETENTION_ARCHITECTURE,
  METAVERSE_STUDENT_SAFETY_CONTROLS,
  canCreateMetaverseRoom,
  resolvePresenceVisibility,
} from "../src/domain/metaverse/communication/communication-policy.ts";
import {
  PRESENCE_HEARTBEAT_POLICY,
  createPresenceSession,
  deriveCityAggregatePresence,
  isPresenceSessionCurrent,
  validatePresenceIdentity,
  type MetaversePresenceSession,
} from "../src/domain/metaverse/communication/presence-contract.ts";
import {
  buildServerAuthoredMessage,
  canDeleteMessageWithoutEvidenceLoss,
  validateSafeMessageLinks,
} from "../src/domain/metaverse/communication/message-contract.ts";
import {
  COMMUNICATION_PREFERENCE_SEMANTICS,
  METAVERSE_MODERATOR_BOUNDARY,
  isModeratorActionInScope,
} from "../src/domain/metaverse/communication/moderation-contract.ts";
import {
  resolveRoomMembership,
  validateRoomContract,
  type MetaverseRoomContract,
} from "../src/domain/metaverse/communication/room-contract.ts";
import { METAVERSE_REALTIME_REPOSITORY_AUDIT } from "../src/domain/metaverse/communication/transport-contract.ts";

const now = "2026-09-15T12:00:00.000Z";

function studentPresence(overrides: Partial<MetaversePresenceSession> = {}): MetaversePresenceSession {
  return {
    presence_session_id: "presence-1",
    user_id: "student-1",
    organization_id: "org-1",
    tenant_id: "tenant:org-1",
    role_context: { role: "STUDENT", permissionRefs: [] },
    cohort_ids: ["cohort-1"],
    team_ids: ["team-1"],
    city_id: "silicon-heartland-city",
    district_id: "data-center-district",
    facility_id: "main-data-center",
    activity_id: null,
    status: "ONLINE",
    visibility_scope: "SAME_FACILITY",
    connected_at: now,
    last_seen_at: now,
    expires_at: "2026-09-15T12:01:30.000Z",
    client_instance_id: "client-1",
    moderation_state: "CLEAR",
    accessibility_presence_preferences_reference: "accessibility-profile:student-1",
    ...overrides,
  };
}

function teamRoom(overrides: Partial<MetaverseRoomContract> = {}): MetaverseRoomContract {
  return {
    room_id: "room-1",
    organization_id: "org-1",
    room_type: "TEAM_ROOM",
    city_id: "silicon-heartland-city",
    district_id: "data-center-district",
    facility_id: "main-data-center",
    team_id: "team-1",
    owner_domain: "metaverse-communication",
    membership_rule: "TEAM_MEMBERSHIP",
    posting_rule: "MEMBERS",
    moderation_policy: "metaverse-communication-moderation-policy:v1",
    retention_policy_reference: "retention-policy:metaverse-communication:org-1",
    status: "ACTIVE",
    created_at: now,
    expires_at: null,
    anonymous_allowed: false,
    ...overrides,
  };
}

test("presence requires canonical user and organization identity", () => {
  assert.deepEqual(validatePresenceIdentity({ user_id: "", organization_id: "org-1", tenant_id: "tenant:org-1" }), ["canonical_user_identity_required"]);
  assert.throws(
    () => createPresenceSession({
      actor: { user_id: null, organization_id: "org-1", tenant_id: "tenant:org-1", role_context: { role: "STUDENT", permissionRefs: [] } },
      presence_session_id: "presence-new",
      city_id: "silicon-heartland-city",
      district_id: "data-center-district",
      client_instance_id: "client-new",
      connected_at: now,
      accessibility_presence_preferences_reference: "accessibility-profile:student-1",
    }),
    /presence_requires_canonical_identity/,
  );
});

test("stale presence expires safely and cannot remain online forever", () => {
  const session = studentPresence({ expires_at: "2026-09-15T12:00:30.000Z" });
  assert.equal(isPresenceSessionCurrent(session, new Date("2026-09-15T12:00:29.000Z")), true);
  assert.equal(isPresenceSessionCurrent(session, new Date("2026-09-15T12:00:31.000Z")), false);
  assert.equal(PRESENCE_HEARTBEAT_POLICY.staleSessionTimeoutSeconds, 90);
  assert.equal(PRESENCE_HEARTBEAT_POLICY.networkLossBehavior, "expire_after_stale_timeout");
});

test("client cannot self-grant visibility", () => {
  const result = resolvePresenceVisibility({
    viewer: { user_id: "student-2", organization_id: "org-1", role: "STUDENT", authorizedScopes: ["CITY_AGGREGATE_ONLY"] },
    target: studentPresence(),
    requestedScope: "SAME_FACILITY",
    clientRequestedScope: "SAME_FACILITY",
  });
  assert.equal(result.visible, false);
  assert.equal(result.reason, "server_visibility_policy_required");
});

test("cross-org presence is denied", () => {
  const result = resolvePresenceVisibility({
    viewer: { user_id: "student-2", organization_id: "org-2", role: "STUDENT", authorizedScopes: ["SAME_FACILITY"] },
    target: studentPresence(),
    requestedScope: "SAME_FACILITY",
  });
  assert.deepEqual(result, { visible: false, reason: "cross_org_presence_denied", exposesIdentity: false });
});

test("city overview exposes aggregate counts only", () => {
  const projection = deriveCityAggregatePresence([studentPresence(), studentPresence({ presence_session_id: "presence-2", user_id: "student-2" })], new Date(now));
  assert.deepEqual(projection, [{ city_id: "silicon-heartland-city", district_id: "data-center-district", online_count: 2 }]);
  assert.equal("user_id" in projection[0], false);
});

test("facility presence obeys server visibility policy", () => {
  const denied = resolvePresenceVisibility({
    viewer: { user_id: "student-2", organization_id: "org-1", role: "STUDENT", authorizedScopes: ["SAME_TEAM"], team_ids: ["team-2"] },
    target: studentPresence(),
    requestedScope: "SAME_FACILITY",
  });
  assert.equal(denied.visible, false);

  const allowed = resolvePresenceVisibility({
    viewer: { user_id: "student-2", organization_id: "org-1", role: "STUDENT", authorizedScopes: ["SAME_FACILITY"] },
    target: studentPresence(),
    requestedScope: "SAME_FACILITY",
  });
  assert.equal(allowed.visible, true);
  assert.equal(allowed.exposesIdentity, true);
});

test("room membership is server-authoritative", () => {
  const decision = resolveRoomMembership({
    room: teamRoom(),
    actor: { user_id: "student-2", organization_id: "org-1", role: "STUDENT", team_ids: ["team-2"] },
  });
  assert.deepEqual(decision, { allowed: false, reason: "team_membership_required", server_authoritative: true });
});

test("anonymous rooms are prohibited", () => {
  assert.equal(canCreateMetaverseRoom({ authenticated: true, organization_id: "org-1", anonymous: true }), false);
  assert.deepEqual(validateRoomContract({ ...teamRoom(), anonymous_allowed: true as false }), ["anonymous_rooms_prohibited"]);
});

test("student direct messaging is disabled by default", () => {
  assert.equal(METAVERSE_DIRECT_MESSAGING_POLICY.studentOneToOneDmEnabledByDefault, false);
  assert.equal(METAVERSE_DIRECT_MESSAGING_POLICY.requiresExplicitOrganizationPolicy, true);
  assert.ok(METAVERSE_DIRECT_MESSAGING_POLICY.approvedStudentCommunicationContexts.includes("team"));
});

test("mute, block, and report have distinct semantics", () => {
  assert.equal(COMMUNICATION_PREFERENCE_SEMANTICS.mute.changes_target_permissions, false);
  assert.equal(COMMUNICATION_PREFERENCE_SEMANTICS.block.expels_target_from_platform, false);
  assert.equal(COMMUNICATION_PREFERENCE_SEMANTICS.report.creates_reviewable_record, true);
  assert.equal(COMMUNICATION_PREFERENCE_SEMANTICS.report.declares_guilt, false);
});

test("reported message evidence cannot be silently destroyed", () => {
  assert.equal(canDeleteMessageWithoutEvidenceLoss({
    moderation_state: "FLAGGED",
    audit_reference: "audit:incident-1",
    safety_flags: ["REPORTED"],
  }), false);
  assert.equal(METAVERSE_RETENTION_ARCHITECTURE.reportedIncidentRetention, "policy_reference_required_and_not_destroyed_by_user_delete");
});

test("moderator scope is bounded and does not grant platform authority", () => {
  assert.equal(isModeratorActionInScope({ moderatorScope: "ROOM", targetScope: "ORGANIZATION", sameOrganization: true }), false);
  assert.equal(isModeratorActionInScope({ moderatorScope: "DISTRICT", targetScope: "ROOM", sameOrganization: true }), true);
  assert.equal(METAVERSE_MODERATOR_BOUNDARY.grantsUnrelatedPlatformAuthority, false);
  assert.ok(METAVERSE_MODERATOR_BOUNDARY.prohibitedAuthorities.includes("credential_issuance"));
});

test("notification integration reuses canonical NCA", () => {
  assert.equal(METAVERSE_NOTIFICATION_INTEGRATION.canonicalOwner, "NCA");
  assert.equal(METAVERSE_NOTIFICATION_INTEGRATION.createsSecondNotificationCenter, false);
  assert.equal(METAVERSE_NOTIFICATION_INTEGRATION.categoryByType.METAVERSE_MODERATION_NOTICE, "MANDATORY_OPERATIONAL");
});

test("no duplicate identity authority", () => {
  assert.equal(METAVERSE_COMMUNICATION_AUTHORITY_BOUNDARY.duplicateIdentityAuthority, false);
  assert.ok(METAVERSE_COMMUNICATION_AUTHORITY_BOUNDARY.doesNotOwn.includes("identity"));
});

test("no duplicate notification authority", () => {
  assert.equal(METAVERSE_COMMUNICATION_AUTHORITY_BOUNDARY.duplicateNotificationAuthority, false);
  assert.ok(METAVERSE_COMMUNICATION_AUTHORITY_BOUNDARY.doesNotOwn.includes("notification_center"));
});

test("no CivicSure communication authority", () => {
  assert.equal(METAVERSE_COMMUNICATION_AUTHORITY_BOUNDARY.civicSureCommunicationAuthority, false);
  assert.ok(METAVERSE_COMMUNICATION_AUTHORITY_BOUNDARY.doesNotOwn.includes("civic_authority"));
});

test("accessibility fields and contracts exist", () => {
  assert.equal(METAVERSE_ACCESSIBILITY_COMMUNICATION_CONTRACT.keyboardOperation, true);
  assert.equal(METAVERSE_ACCESSIBILITY_COMMUNICATION_CONTRACT.screenReaderParticipantLists, true);
  assert.equal(METAVERSE_ACCESSIBILITY_COMMUNICATION_CONTRACT.nonColorOnlyPresenceStatus, true);
  assert.equal(studentPresence().accessibility_presence_preferences_reference, "accessibility-profile:student-1");
});

test("safe-link rule exists for messages", () => {
  assert.deepEqual(validateSafeMessageLinks(["/metaverse/rooms/room-1"]).ok, true);
  assert.deepEqual(validateSafeMessageLinks(["https://example.test/phish"]).ok, false);
  assert.ok(METAVERSE_STUDENT_SAFETY_CONTROLS.includes("safe_links"));
});

test("sender identity cannot be client-forged", () => {
  assert.throws(
    () => buildServerAuthoredMessage({
      server_message_id: "message-1",
      actor_user_id: "student-1",
      sent_at: now,
      submitted: {
        room_id: "room-1",
        organization_id: "org-1",
        body: "Hello",
        source_client_id: "client-1",
        client_claimed_sender_user_id: "student-2",
      },
    }),
    /sender_identity_cannot_be_client_forged/,
  );
});

test("revoked membership invalidates room and presence access", () => {
  assert.throws(
    () => createPresenceSession({
      actor: { user_id: "student-1", organization_id: "org-1", tenant_id: "tenant:org-1", role_context: { role: "STUDENT", permissionRefs: [] }, revoked: true },
      presence_session_id: "presence-revoked",
      city_id: "silicon-heartland-city",
      district_id: "data-center-district",
      client_instance_id: "client-1",
      connected_at: now,
      accessibility_presence_preferences_reference: "accessibility-profile:student-1",
    }),
    /presence_denied_for_revoked_membership/,
  );
  assert.deepEqual(resolveRoomMembership({
    room: teamRoom(),
    actor: { user_id: "student-1", organization_id: "org-1", role: "STUDENT", team_ids: ["team-1"], revoked: true },
  }), { allowed: false, reason: "revoked_membership", server_authoritative: true });
});

test("realtime transport boundary does not introduce new dependencies", () => {
  assert.equal(METAVERSE_REALTIME_REPOSITORY_AUDIT.websocketDependencyPresent, false);
  assert.equal(METAVERSE_REALTIME_REPOSITORY_AUDIT.socketIoDependencyPresent, false);
  assert.match(METAVERSE_REALTIME_REPOSITORY_AUDIT.recommendation, /short polling|SSE/);
});
