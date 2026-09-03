import { query } from "../../../db/client.js";

type Executor = { query: (sql: string, params?: unknown[]) => Promise<any> };
type Event = Record<string, any>;

const EVENT_POLICIES: Record<string, { type: string; title: string; message: string; recipient: (event: Event, db: Executor) => Promise<string | null>; path?: (event: Event) => string | null }> = {
  "studio.review.routed": {
    type: "REVIEW_ASSIGNED", title: "New review work", message: "New work is ready for your review.",
    recipient: async (event) => String(event.payload?.reviewer_user_id || "") || null,
    path: () => "/studio/reviewer-queue",
  },
  "studio.review.reassigned": {
    type: "REVIEW_ASSIGNED", title: "Review work reassigned", message: "Review work has been assigned to you.",
    recipient: async (event) => String(event.payload?.reviewer_user_id || "") || null,
    path: () => "/studio/reviewer-queue",
  },
  "studio.review.decision_recorded": {
    type: "REVIEW_DECISION", title: "Review update", message: "Your project review has been updated.",
    recipient: async (event, db) => {
      const result = await db.query("SELECT p.studio_learner_id AS user_id FROM projects p WHERE p.project_id=$1 AND p.organization_id=$2 AND p.tenant_id=$3", [event.payload?.project_id, event.organization_id, event.tenant_id]);
      return result.rows[0]?.user_id || null;
    },
    path: (event) => event.payload?.project_id ? `/studio/projects/${encodeURIComponent(event.payload.project_id)}` : null,
  },
  "credential.issued": {
    type: "CREDENTIAL_EARNED", title: "Credential earned", message: "You earned a credential.",
    recipient: async (event) => String(event.payload?.learner_user_id || "") || null,
    path: () => "/curriculum/asl/portfolio",
  },
  "credential.revoked": {
    type: "CREDENTIAL_REVOKED", title: "Credential status updated", message: "Your credential status has been updated.",
    recipient: async (event) => String(event.payload?.learner_user_id || "") || null,
    path: () => "/curriculum/asl/portfolio",
  },
  "deployment.live": {
    type: "DEPLOYMENT_LIVE", title: "Test deployment ready", message: "Your TEST deployment is ready to view.",
    recipient: async (event, db) => (await db.query("SELECT learner_id AS user_id FROM website_deployment_records WHERE deployment_id=$1 AND organization_id=$2 AND tenant_id=$3", [event.subject_id, event.organization_id, event.tenant_id])).rows[0]?.user_id || null,
    path: (event) => event.payload?.project_id ? `/studio/projects/${encodeURIComponent(event.payload.project_id)}` : null,
  },
  "deployment.failed": {
    type: "DEPLOYMENT_FAILED", title: "Test deployment failed", message: "Your TEST deployment could not be completed.",
    recipient: async (event, db) => (await db.query("SELECT learner_id AS user_id FROM website_deployment_records WHERE deployment_id=$1 AND organization_id=$2 AND tenant_id=$3", [event.subject_id, event.organization_id, event.tenant_id])).rows[0]?.user_id || null,
    path: (event) => event.payload?.project_id ? `/studio/projects/${encodeURIComponent(event.payload.project_id)}` : null,
  },
  "registry.submission.accepted": {
    type: "REGISTRY_ACCEPTED", title: "Agent package accepted", message: "Your agent package was accepted by the Registry.",
    recipient: async (event, db) => (await db.query("SELECT learner_id AS user_id FROM agent_registry_submissions WHERE submission_id=$1 AND organization_id=$2 AND tenant_id=$3", [event.subject_id, event.organization_id, event.tenant_id])).rows[0]?.user_id || null,
    path: (event) => event.payload?.project_id ? `/studio/projects/${encodeURIComponent(event.payload.project_id)}` : null,
  },
  "registry.submission.changes_requested": {
    type: "REGISTRY_CHANGES_REQUESTED", title: "Registry changes requested", message: "Your agent package needs changes before Registry acceptance.",
    recipient: async (event, db) => (await db.query("SELECT learner_id AS user_id FROM agent_registry_submissions WHERE submission_id=$1 AND organization_id=$2 AND tenant_id=$3", [event.subject_id, event.organization_id, event.tenant_id])).rows[0]?.user_id || null,
    path: (event) => event.payload?.project_id ? `/studio/projects/${encodeURIComponent(event.payload.project_id)}` : null,
  },
  "registry.submission.rejected": {
    type: "REGISTRY_REJECTED", title: "Registry submission rejected", message: "Your agent package was not accepted by the Registry.",
    recipient: async (event, db) => (await db.query("SELECT learner_id AS user_id FROM agent_registry_submissions WHERE submission_id=$1 AND organization_id=$2 AND tenant_id=$3", [event.subject_id, event.organization_id, event.tenant_id])).rows[0]?.user_id || null,
    path: (event) => event.payload?.project_id ? `/studio/projects/${encodeURIComponent(event.payload.project_id)}` : null,
  },
  "registry.submission.failed": {
    type: "REGISTRY_FAILED", title: "Registry submission failed", message: "Your agent package could not be submitted to the Registry.",
    recipient: async (event, db) => (await db.query("SELECT learner_id AS user_id FROM agent_registry_submissions WHERE submission_id=$1 AND organization_id=$2 AND tenant_id=$3", [event.subject_id, event.organization_id, event.tenant_id])).rows[0]?.user_id || null,
    path: (event) => event.payload?.project_id ? `/studio/projects/${encodeURIComponent(event.payload.project_id)}` : null,
  },
  "lesson.completed": {
    type: "COMPLETION_ACHIEVED", title: "Completion recorded", message: "Your learning completion was recorded.",
    recipient: async (event) => String(event.originating_actor_id || "") || null,
    path: () => "/curriculum/learning",
  },
};

export async function createNotificationFromEvent(event: Event, db: Executor = { query }) {
  const policy = EVENT_POLICIES[String(event.event_type || "")];
  if (!policy || !event.organization_id || !event.tenant_id || event.tenant_id !== `tenant:${event.organization_id}`) return null;
  const recipient = await policy.recipient(event, db);
  if (!recipient) return null;
  const sourceEventId = String(event.outbox_event_id || `${event.producer_id}:${event.event_type}:${event.idempotency_key}`);
  const id = `notification_${sourceEventId}_${recipient}`.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 240);
  const result = await db.query(`INSERT INTO notifications (notification_id, organization_id, tenant_id, recipient_user_id, notification_type, source_event_id, source_event_type, source_entity_type, source_entity_id, title, message, destination_path) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (organization_id, tenant_id, recipient_user_id, notification_type, source_event_id) DO NOTHING RETURNING *`, [id, event.organization_id, event.tenant_id, recipient, policy.type, sourceEventId, event.event_type, event.subject_type, event.subject_id, policy.title, policy.message, policy.path?.(event) || null]);
  return result.rows[0] || (await db.query("SELECT * FROM notifications WHERE notification_id=$1", [id])).rows[0] || null;
}

function scope(actor: any) {
  const userId = String(actor?.user_id || "");
  const organizationId = String(actor?.active_organization_id || actor?.organization_id || "");
  const tenantId = String(actor?.tenant_id || `tenant:${organizationId}`);
  if (!userId || !organizationId || tenantId !== `tenant:${organizationId}`) throw new Error("ORG_CONTEXT_REQUIRED");
  return { userId, organizationId, tenantId };
}

export async function listNotifications(actor: any) {
  const s = scope(actor);
  const result = await query("SELECT * FROM notifications WHERE organization_id=$1 AND tenant_id=$2 AND recipient_user_id=$3 ORDER BY created_at DESC, notification_id DESC", [s.organizationId, s.tenantId, s.userId]);
  return result.rows.map(mapNotification);
}

export async function unreadCount(actor: any) {
  const s = scope(actor);
  const result = await query("SELECT COUNT(*)::int AS count FROM notifications WHERE organization_id=$1 AND tenant_id=$2 AND recipient_user_id=$3 AND status='UNREAD'", [s.organizationId, s.tenantId, s.userId]);
  return { count: Number(result.rows[0]?.count || 0) };
}

export async function markRead(actor: any, notificationId: string) {
  const s = scope(actor);
  const result = await query("UPDATE notifications SET status='READ', read_at=COALESCE(read_at,NOW()) WHERE notification_id=$1 AND organization_id=$2 AND tenant_id=$3 AND recipient_user_id=$4 RETURNING *", [notificationId, s.organizationId, s.tenantId, s.userId]);
  if (!result.rows[0]) throw new Error("NOTIFICATION_NOT_FOUND");
  return mapNotification(result.rows[0]);
}

export async function markAllRead(actor: any) {
  const s = scope(actor);
  const result = await query("UPDATE notifications SET status='READ', read_at=COALESCE(read_at,NOW()) WHERE organization_id=$1 AND tenant_id=$2 AND recipient_user_id=$3 AND status='UNREAD'", [s.organizationId, s.tenantId, s.userId]);
  return { updated: result.rowCount || 0 };
}

function mapNotification(row: any) {
  return { notificationId: row.notification_id, type: row.notification_type, title: row.title, message: row.message, status: row.status, createdAt: row.created_at, readAt: row.read_at, destinationPath: row.destination_path };
}
