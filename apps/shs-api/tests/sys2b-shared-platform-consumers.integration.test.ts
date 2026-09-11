import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { query } from "../src/db/client.ts";
import { createNotificationFromEvent, listNotifications, markRead } from "../src/domain/notifications/service/notification-service.ts";
import { OperationalAwarenessService } from "../src/domain/operational-awareness/service/operational-awareness-service.ts";
import { SHS_SECURITY_PERMISSIONS } from "../src/auth/security-permissions.ts";

const RUN = `sys2b-${Date.now()}`;
const org = `org_${RUN}`;
const user = `user_${RUN}`;
const tenant = `tenant:${org}`;
const actor = {
  user_id: user,
  organization_id: org,
  active_organization_id: org,
  tenant_id: tenant,
  permissions: [
    SHS_SECURITY_PERMISSIONS.OPERATIONS_AWARENESS_MANAGE,
    SHS_SECURITY_PERMISSIONS.REPORTING_DAILY_BRIEF_GENERATE,
    SHS_SECURITY_PERMISSIONS.REPORTING_DAILY_BRIEF_READ,
  ],
};

before(async () => {
  await query(
    `INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status)
     VALUES ($1, $1, $1, 'nonprofit', 'active') ON CONFLICT DO NOTHING`, [org],
  );
  await query(
    `INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source)
     VALUES ($1, $2, $3, $1, 'active', 'local') ON CONFLICT DO NOTHING`, [user, org, `${user}@test.invalid`],
  );
});

after(async () => {
  await query("DELETE FROM notifications WHERE organization_id=$1", [org]);
  await query("DELETE FROM daily_operating_briefs WHERE organization_id=$1", [org]);
  await query("DELETE FROM operational_awareness_findings WHERE organization_id=$1", [org]);
  await query("DELETE FROM integration_outbox WHERE organization_id=$1", [org]);
  await query("DELETE FROM users WHERE user_id=$1", [user]);
  await query("DELETE FROM organizations WHERE organization_id=$1", [org]);
});

test("notification event consumer persists an idempotent scoped projection and reaches READ", async () => {
  const event = {
    outbox_event_id: `evt_${RUN}`,
    producer_id: "sys2b.test",
    event_type: "lesson.completed",
    subject_type: "lesson",
    subject_id: `lesson_${RUN}`,
    organization_id: org,
    tenant_id: tenant,
    originating_actor_id: user,
    payload: {},
  };
  const first = await createNotificationFromEvent(event);
  const replay = await createNotificationFromEvent(event);
  assert.ok(first?.notification_id);
  assert.equal(replay?.notification_id, first?.notification_id);
  const listed = await listNotifications(actor);
  assert.equal(listed.length, 1);
  assert.equal(listed[0].status, "UNREAD");
  const read = await markRead(actor, listed[0].notificationId);
  assert.equal(read.status, "READ");
});

test("operational awareness persists a scoped brief through its real repository and outbox", async () => {
  const service = new OperationalAwarenessService();
  const brief = await service.generateBrief(actor, { periodDays: 1 });
  assert.ok(brief.briefId);
  assert.equal(brief.organizationId, org);
  const persisted = await query("SELECT brief_id, organization_id, tenant_id FROM daily_operating_briefs WHERE brief_id=$1", [brief.briefId]);
  assert.deepEqual(persisted.rows[0], { brief_id: brief.briefId, organization_id: org, tenant_id: tenant });
  const emitted = await query("SELECT event_type, delivery_status FROM integration_outbox WHERE organization_id=$1 AND event_type='daily_brief.generated'", [org]);
  assert.equal(emitted.rows.length, 1);
  assert.equal(emitted.rows[0].delivery_status, "PENDING");
});
