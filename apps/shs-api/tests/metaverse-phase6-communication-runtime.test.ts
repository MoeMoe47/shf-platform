import assert from "node:assert/strict";
import test from "node:test";
import { metaverseCommunicationRepository } from "../src/domain/metaverse/communication/runtime/communication-repository";
import { MetaverseMessageService } from "../src/domain/metaverse/communication/runtime/message-service";
import { MetaversePresenceService } from "../src/domain/metaverse/communication/runtime/presence-service";
import { MetaverseRoomService } from "../src/domain/metaverse/communication/runtime/room-service";

function user(overrides: Record<string, any> = {}) {
  return {
    user_id: "student-a",
    id: "student-a",
    active_organization_id: "org-a",
    organization_id: "org-a",
    tenant_id: "tenant:org-a",
    status: "active",
    roles: ["learner"],
    permissions: ["metaverse.access"],
    memberships: [{ membership_id: "mem-a", organization_id: "org-a", tenant_id: "tenant:org-a", role: "learner", status: "active", organization_status: "active" }],
    metaverse_authority_facts: {
      cohorts: ["cohort-a"],
      teams: ["team-a"],
      projects: ["project-a"],
      classes: ["class-a"],
      simulations: ["simulation-a"],
    },
    ...overrides,
  };
}

function staff(overrides: Record<string, any> = {}) {
  return user({
    user_id: "staff-a",
    id: "staff-a",
    roles: ["moderator"],
    permissions: ["metaverse.moderation"],
    ...overrides,
  });
}

function runtime() {
  metaverseCommunicationRepository.clearForTests();
  const presence = new MetaversePresenceService(metaverseCommunicationRepository);
  const rooms = new MetaverseRoomService(metaverseCommunicationRepository);
  const messages = new MetaverseMessageService(metaverseCommunicationRepository, rooms);
  return { presence, rooms, messages };
}

test("MET-6 presence requires authenticated identity and active organization", () => {
  const { presence } = runtime();
  assert.throws(() => presence.start(null, {}), /Authentication required/);
  assert.throws(() => presence.start(user({ active_organization_id: "", organization_id: "" }), {}), /Valid active organization context/);
});

test("MET-6 presence expires stale sessions and revoked membership removes access", () => {
  const { presence } = runtime();
  const now = new Date("2026-09-15T12:00:00.000Z");
  presence.start(user(), { district_id: "data-center-district" }, now);
  assert.equal(presence.city(user(), now).at(0)?.online_count, 1);
  assert.equal(presence.city(user(), new Date("2026-09-15T12:02:00.000Z")).length, 0);
  assert.throws(() => presence.start(user({ memberships: [{ organization_id: "org-a", status: "revoked", organization_status: "active" }] }), {}), /Active organization membership/);
});

test("MET-6 city presence is org-scoped aggregate only and cannot be client forged", () => {
  const { presence } = runtime();
  const now = new Date("2026-09-15T12:00:00.000Z");
  presence.start(user(), { district_id: "data-center-district", online_count: 999, user_id: "fake" }, now);
  presence.start(user({ user_id: "student-b", id: "student-b" }), { district_id: "data-center-district" }, now);
  presence.start(user({ user_id: "student-c", id: "student-c", active_organization_id: "org-b", organization_id: "org-b", tenant_id: "tenant:org-b", memberships: [{ organization_id: "org-b", status: "active", organization_status: "active" }] }), { district_id: "data-center-district" }, now);
  const counts = presence.city(user(), now);
  assert.deepEqual(counts, [{ city_id: "silicon-heartland-city", district_id: "data-center-district", online_count: 2, exposes_identity: false }]);
  assert.equal(JSON.stringify(counts).includes("student-"), false);
});

test("MET-6 facility participant visibility obeys server policy and cross-org visibility is denied", () => {
  const { presence } = runtime();
  const now = new Date("2026-09-15T12:00:00.000Z");
  presence.start(user({ user_id: "student-b", id: "student-b" }), { district_id: "data-center-district", facility_id: "training-lab" }, now);
  presence.start(user({ user_id: "other", id: "other", active_organization_id: "org-b", organization_id: "org-b", tenant_id: "tenant:org-b", memberships: [{ organization_id: "org-b", status: "active", organization_status: "active" }] }), { district_id: "data-center-district", facility_id: "training-lab" }, now);
  const result = presence.participants(user(), { district_id: "data-center-district", facility_id: "training-lab" }, now);
  assert.equal(result.participant_count, 1);
  assert.equal(result.participants[0].display_name, "Participant");
  assert.equal(JSON.stringify(result).includes("other"), false);
});

test("MET-6 room membership is server-authoritative and anonymous rooms are denied", () => {
  const { rooms } = runtime();
  assert.throws(() => rooms.getOrCreate(user(), { room_type: "TEAM_ROOM", team_id: "team-b" }), /team_membership_required/);
  assert.throws(() => rooms.getOrCreate(user(), { room_type: "FACILITY_ROOM", anonymous: true }), /Anonymous rooms/);
  assert.ok(rooms.getOrCreate(user(), { room_type: "TEAM_ROOM", team_id: "team-a" }).room_id);
});

test("MET-6 sender and moderator status cannot be forged by clients", () => {
  const { rooms, messages } = runtime();
  const room = rooms.getOrCreate(user(), { room_type: "TEAM_ROOM", team_id: "team-a" });
  assert.throws(() => messages.send(user(), room.room_id, { body: "hello", sender_user_id: "staff-a", source_client_id: "c1" }), /sender_identity_cannot_be_client_forged/);
  assert.throws(() => messages.moderate(user({ roles: ["learner"], permissions: ["metaverse.moderation"] }), { room_id: room.room_id, action: "WARN" }), /Moderation authority required/);
});

test("MET-6 student direct messaging is disabled by default", () => {
  const { rooms } = runtime();
  assert.equal(rooms.directMessagingPolicy().studentOneToOneDmEnabledByDefault, false);
  assert.throws(() => rooms.getOrCreate(user(), { room_type: "DIRECT_MESSAGE" }), /Student direct messaging is disabled/);
});

test("MET-6 cohort/team/project/simulation room membership is enforced", () => {
  const { rooms } = runtime();
  assert.ok(rooms.getOrCreate(user(), { room_type: "COHORT_ROOM", cohort_id: "cohort-a" }).room_id);
  assert.ok(rooms.getOrCreate(user(), { room_type: "TEAM_ROOM", team_id: "team-a" }).room_id);
  assert.ok(rooms.getOrCreate(user(), { room_type: "PROJECT_ROOM", project_id: "project-a" }).room_id);
  assert.ok(rooms.getOrCreate(user(), { room_type: "JOB_SIMULATION_ROOM", job_simulation_id: "simulation-a" }).room_id);
  assert.throws(() => rooms.getOrCreate(user(), { room_type: "COHORT_ROOM", cohort_id: "cohort-b" }), /cohort_membership_required/);
  assert.throws(() => rooms.getOrCreate(user(), { room_type: "PROJECT_ROOM", project_id: "project-b" }), /project_membership_required/);
  assert.throws(() => rooms.getOrCreate(user(), { room_type: "JOB_SIMULATION_ROOM", job_simulation_id: "simulation-b" }), /simulation_authorization_required/);
});

test("MET-6 CivicSure is not civic authority and unresolved SHF Civic fails closed", () => {
  const { rooms } = runtime();
  assert.throws(() => rooms.getOrCreate(user({ metaverse_authority_facts: { civic_eligibilities: ["civicsure-approved"] } }), { room_type: "CIVIC_SESSION_ROOM", civic_session_id: "civic-a" }), /SHF Civic authority is unresolved/);
});

test("MET-6 mute and block do not revoke unrelated room permissions or expel targets", () => {
  const { rooms, messages } = runtime();
  const room = rooms.getOrCreate(user(), { room_type: "TEAM_ROOM", team_id: "team-a" });
  const mute = messages.mute(user(), "student-b", room.room_id);
  const block = messages.block(user(), "student-b", room.room_id);
  assert.equal(mute.semantics.changes_target_permissions, false);
  assert.equal(block.semantics.expels_target_from_platform, false);
  assert.doesNotThrow(() => rooms.getAuthorized(user({ user_id: "student-b", id: "student-b" }), room.room_id));
});

test("MET-6 reports preserve evidence, do not declare guilt, and normal delete cannot destroy reported evidence", () => {
  const { rooms, messages } = runtime();
  const room = rooms.getOrCreate(user(), { room_type: "TEAM_ROOM", team_id: "team-a" });
  const message = messages.send(user(), room.room_id, { body: "needs review", source_client_id: "c1" });
  const report = messages.report(user({ user_id: "student-b", id: "student-b" }), room.room_id, { message_id: message.message_id, category: "SAFETY" });
  assert.equal(report.declares_guilt, false);
  assert.equal(report.preserved_context.message?.message_id, message.message_id);
  const deleted = messages.delete(user(), room.room_id, message.message_id);
  assert.equal(deleted.moderation_state, "REDACTED");
  assert.equal(deleted.body, "[preserved for review]");
});

test("MET-6 unsafe javascript/data links and raw executable markup are rejected or sanitized", () => {
  const { rooms, messages } = runtime();
  const room = rooms.getOrCreate(user(), { room_type: "TEAM_ROOM", team_id: "team-a" });
  assert.throws(() => messages.send(user(), room.room_id, { body: "javascript:alert(1)", source_client_id: "c1" }), /Unsafe message link/);
  assert.throws(() => messages.send(user(), room.room_id, { body: "data:text/html,boom", source_client_id: "c1" }), /Unsafe message link/);
  const message = messages.send(user(), room.room_id, { body: "<script>alert(1)</script> ok", source_client_id: "c1" });
  assert.equal(message.body.includes("<script>"), false);
});

test("MET-6 rate limiting blocks abusive flood and duplicate submissions", () => {
  const { rooms, messages } = runtime();
  const room = rooms.getOrCreate(user(), { room_type: "TEAM_ROOM", team_id: "team-a" });
  messages.send(user(), room.room_id, { body: "dup", source_client_id: "c1" });
  messages.send(user(), room.room_id, { body: "dup", source_client_id: "c1" });
  messages.send(user(), room.room_id, { body: "dup", source_client_id: "c1" });
  assert.throws(() => messages.send(user(), room.room_id, { body: "dup", source_client_id: "c1" }), /rate limit/i);
});

test("MET-6 revoked auth and org suspension stop room access", () => {
  const { rooms } = runtime();
  const room = rooms.getOrCreate(user(), { room_type: "TEAM_ROOM", team_id: "team-a" });
  assert.throws(() => rooms.getAuthorized(user({ memberships: [{ organization_id: "org-a", status: "revoked", organization_status: "active" }] }), room.room_id), /Active organization membership/);
  assert.throws(() => rooms.getAuthorized(user({ memberships: [{ organization_id: "org-a", status: "active", organization_status: "suspended" }] }), room.room_id), /Active organization membership/);
});

test("MET-6 authorized moderation is bounded and NCA notification integration is reused", () => {
  const { rooms, messages } = runtime();
  const room = rooms.getOrCreate(user(), { room_type: "TEAM_ROOM", team_id: "team-a" });
  const action = messages.moderate(staff(), { room_id: room.room_id, action: "WARN", scope: "ROOM", target_user_id: "student-a" });
  assert.equal(action.scope, "ROOM");
  assert.equal(messages.notificationIntegration().canonicalOwner, "NCA");
  assert.equal(messages.notificationIntegration().createsSecondNotificationCenter, false);
});
