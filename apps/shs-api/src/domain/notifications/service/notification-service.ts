import { query } from "../../../db/client.js";
import { classifyNotificationType, notificationTypesByCategory } from "../contracts/notification-classification.js";
import { getPreferenceOverrides } from "./preference-service.js";
import { isOrganizationEntitled } from "./entitlement-resolver.js";

type Executor = { query: (sql: string, params?: unknown[]) => Promise<any> };
type Event = Record<string, any>;
function documentationPath(event: Event) {
  if (!event.subject_id) return "/documentation";
  const kind = event.subject_type === "signature_request" ? "signature" : event.subject_type === "manual_signature" ? "manual" : event.subject_type === "document_instance" ? "document" : event.subject_type === "packet_instance" ? "packet" : "requirement";
  return `/documentation/items/${encodeURIComponent(`${kind}:${event.subject_id}`)}`;
}

// NCA-2 §14 (Entitlement Resolution): a policy may optionally declare the
// service_key (apps/shs-api/migrations/084_service_catalog_entitlements.sql)
// its notification concerns. When present, createNotificationFromEvent
// checks isOrganizationEntitled() before persisting — fail-closed (no
// notification, not a wrong one) if the organization lacks that
// entitlement. Deliberately unset on every existing policy below: no
// evidence was found of an actual mis-notification incident, and this
// pass did not verify organization_service_entitlements is backfilled for
// every organization already relying on these ~19 already-working
// notification types. Retroactively gating them without that evidence
// would risk a silent regression. New, entitlement-gated policies should
// set this field going forward.
// NCA-4 §9/§10: recipient() may resolve to zero, one, or many users — e.g.
// a permission-scoped audience (all users in a receiving organization who
// hold a given permission) rather than a single named assignee. Every
// existing single-recipient policy is unaffected (a string return behaves
// exactly as before); createNotificationFromEvent only takes the
// multi-recipient path when an array comes back, projecting one
// independently-deduplicated row per recipient — never a second store,
// never a merged/broadcast row.
type NotificationPolicy = {
  type: string;
  title: string;
  message: string;
  recipient: (event: Event, db: Executor) => Promise<string | string[] | null>;
  path?: (event: Event) => string | null;
  requiresEntitlementService?: string;
};

// NCA-4 §9: resolves every user in `organizationId` who currently holds
// `permissionName`, via the same memberships/role_permissions tables the
// real permission system already uses (apps/shs-api/src/auth/security-permissions.ts) —
// not a new authority model. Used where a source event has no single named
// assignee (e.g. a newly created, not-yet-assigned CivicSure referral) but
// does have a clear, permission-scoped audience.
async function usersWithPermissionInOrganization(organizationId: string, permissionName: string, db: Executor): Promise<string[]> {
  if (!organizationId || !permissionName) return [];
  const result = await db.query(
    `SELECT DISTINCT m.user_id
     FROM memberships m
     JOIN role_permissions rp ON rp.role_id = m.role_id AND rp.permission_name = $2
     WHERE m.organization_id = $1
       AND m.status = 'active'
       AND m.effective_from <= NOW()
       AND (m.effective_to IS NULL OR m.effective_to > NOW())`,
    [organizationId, permissionName],
  );
  return result.rows.map((row: any) => String(row.user_id)).filter(Boolean);
}

const EVENT_POLICIES: Record<string, NotificationPolicy> = {
  "documentation.requirement.created": { type: "DOCUMENTATION_REQUIRED", title: "Document action required", message: "A document action is required in your organization workspace.", recipient: async (event) => String(event.originating_actor_id || event.payload?.recipient_user_id || "") || null, path: documentationPath },
  "documentation.requirement.correction_required": { type: "DOCUMENTATION_CORRECTION_REQUIRED", title: "Document correction required", message: "A document item needs correction before it can be completed.", recipient: async (event) => String(event.payload?.recipient_user_id || event.originating_actor_id || "") || null, path: documentationPath },
  "documentation.signature.requested": { type: "DOCUMENTATION_SIGNATURE_REQUIRED", title: "Signature required", message: "A document is waiting for an authorized signature.", recipient: async (event) => String(event.payload?.signer_user_id || event.originating_actor_id || "") || null, path: documentationPath },
  "documentation.signature.signed": { type: "DOCUMENTATION_SIGNATURE_COMPLETE", title: "Signature complete", message: "A document signature was completed.", recipient: async (event) => String(event.payload?.requester_user_id || event.originating_actor_id || "") || null, path: documentationPath },
  "documentation.signature.expired": { type: "DOCUMENTATION_SIGNATURE_EXPIRED", title: "Signature request expired", message: "A document signature request expired and may need to be sent again.", recipient: async (event) => String(event.payload?.requester_user_id || event.originating_actor_id || "") || null, path: documentationPath },
  "documentation.manual_signature.verification_required": { type: "DOCUMENTATION_MANUAL_VERIFICATION", title: "Manual signature needs review", message: "A returned paper document is waiting for authorized verification.", recipient: async (event) => String(event.payload?.verifier_user_id || event.originating_actor_id || "") || null, path: documentationPath },
  "documentation.manual_signature.rejected": { type: "DOCUMENTATION_MANUAL_CORRECTION", title: "Manual signature needs correction", message: "A returned paper document needs correction before verification.", recipient: async (event) => String(event.payload?.uploader_user_id || event.originating_actor_id || "") || null, path: documentationPath },
  "documentation.document.superseded": { type: "DOCUMENTATION_SUPERSEDED", title: "Document version updated", message: "A document version was superseded. Review the current version in your workspace.", recipient: async (event) => String(event.originating_actor_id || event.payload?.recipient_user_id || "") || null, path: documentationPath },
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

  // NCA-4 §5/§8: CivicSure — verified against apps/shs-api/src/domain/cases/service/case-service.ts.
  // `referral.created` is the ONLY real, currently-emitted outbox event in
  // the cases domain (case.assigned/case.transitioned only ever write an
  // audit_events row via writeAuditEvent, never outbox.enqueue — they are
  // not projectable without CivicSure's own program adding real event
  // emission; see the DEFERRED entries in NCA-4's domain inventory). A
  // newly created referral has no assigned reviewer yet, so recipient
  // resolution is permission-scoped (every user in the *receiving*
  // organization who holds `referrals.manage`, the same permission that
  // gates acting on a referral — apps/shs-api/src/domain/cases/api/routes.ts)
  // rather than a single named assignee. The receiving_organization_id is
  // not on the outbox event payload itself, so it's read from the
  // referral's own record. Verification/case-state authority remains
  // entirely in the cases/government-assurance domain — this only informs.
  "referral.created": {
    type: "CASE_REFERRAL_RECEIVED", title: "New referral received", message: "A new referral was created for your organization to review.",
    recipient: async (event, db) => {
      const details = await db.query("SELECT receiving_organization_id FROM referral_details WHERE case_id=$1", [event.subject_id]);
      const receivingOrganizationId = String(details.rows[0]?.receiving_organization_id || "");
      if (!receivingOrganizationId) return null;
      return usersWithPermissionInOrganization(receivingOrganizationId, "referrals.manage", db);
    },
    path: (event) => event.subject_id ? `/civic/cases/${encodeURIComponent(String(event.subject_id))}` : null,
  },

  // NCA-4 §5/§8: ARAG-1 — verified against apps/shs-api/src/domain/arag/service/arag-service.ts.
  // Every ARAG event's `subject_id` is the release_request_id; the
  // requester (`arag_release_requests.requested_by`) is the correct single
  // recipient for all four wired below — never the approver (who already
  // knows their own action) and never a fabricated "approver" recipient
  // (no such single assignee exists in the schema; a future policy could
  // extend to a permission-scoped audience the same way referral.created
  // does, if that becomes a real product need).
  //
  // IMPORTANT, discovered while wiring this: `arag.approval.required`'s
  // real emission site (AragService.approve()) fires *after* an approval
  // decision (APPROVED or REJECTED) has already been recorded — the event
  // name is misleading relative to its actual timing/semantics (it does
  // not mean "approval is now required"; NCA-0/NCA-1/decision-lock's
  // characterization of it as the approval-required case was incorrect,
  // inherited without re-verifying against the real service code). This
  // policy's title/message reflect what the event actually represents.
  // The real "something is blocking release, action may be needed" signal
  // is `arag.assurance.blocked`, wired separately below with an accurate
  // title. Neither this correction nor either policy changes ARAG's own
  // authority: the approval/authorization/release tables remain the only
  // place that decision lives; this is a read-only, generic-content
  // projection of it.
  "arag.approval.required": {
    type: "ARAG_APPROVAL_DECISION_RECORDED", title: "Release approval decision recorded", message: "A decision was recorded for your release request.",
    recipient: async (event, db) => {
      const result = await db.query("SELECT requested_by AS user_id FROM arag_release_requests WHERE release_request_id=$1 AND organization_id=$2 AND tenant_id=$3", [event.subject_id, event.organization_id, event.tenant_id]);
      return result.rows[0]?.user_id || null;
    },
    path: (event) => event.subject_id ? `/studio/release-assurance/${encodeURIComponent(String(event.subject_id))}` : null,
  },
  "arag.assurance.blocked": {
    type: "ARAG_ASSURANCE_BLOCKED", title: "Release assurance blocked", message: "Your release request cannot proceed yet — review what is required before release.",
    recipient: async (event, db) => {
      const result = await db.query("SELECT requested_by AS user_id FROM arag_release_requests WHERE release_request_id=$1 AND organization_id=$2 AND tenant_id=$3", [event.subject_id, event.organization_id, event.tenant_id]);
      return result.rows[0]?.user_id || null;
    },
    path: (event) => event.subject_id ? `/studio/release-assurance/${encodeURIComponent(String(event.subject_id))}` : null,
  },
  "arag.release.succeeded": {
    type: "ARAG_RELEASE_SUCCEEDED", title: "Release completed", message: "Your release completed successfully.",
    recipient: async (event, db) => {
      const result = await db.query("SELECT requested_by AS user_id FROM arag_release_requests WHERE release_request_id=$1 AND organization_id=$2 AND tenant_id=$3", [event.subject_id, event.organization_id, event.tenant_id]);
      return result.rows[0]?.user_id || null;
    },
    path: (event) => event.subject_id ? `/studio/release-assurance/${encodeURIComponent(String(event.subject_id))}` : null,
  },
  "arag.release.failed": {
    type: "ARAG_RELEASE_FAILED", title: "Release failed", message: "Your release could not be completed.",
    recipient: async (event, db) => {
      const result = await db.query("SELECT requested_by AS user_id FROM arag_release_requests WHERE release_request_id=$1 AND organization_id=$2 AND tenant_id=$3", [event.subject_id, event.organization_id, event.tenant_id]);
      return result.rows[0]?.user_id || null;
    },
    path: (event) => event.subject_id ? `/studio/release-assurance/${encodeURIComponent(String(event.subject_id))}` : null,
  },

  // NCA-4 §5/§8: Studio — the remaining real, already-emitting event types
  // NCA-0/NCA-1 identified as low-risk rollout targets, re-verified against
  // apps/shs-api/src/domain/studio/service/studio-project-service.ts.
  // `studio.qa.completed` and `studio.handoff.created` are genuinely
  // human-actionable (a QA outcome to review; new assigned work). By
  // contrast, `studio.project.created`, `studio.revision.created`, and
  // `studio.workspace.updated` were re-checked here and found to fire on
  // the acting learner's *own* save/create action — notifying someone
  // about their own just-taken action is exactly the low-value noise this
  // phase's human-actionable rule (§6) excludes; they are intentionally
  // left unwired (NO_HUMAN_NOTIFICATION_NEEDED — see the NCA-4 report).
  "studio.qa.completed": {
    type: "STUDIO_QA_COMPLETE", title: "QA run complete", message: "A QA run completed for your project.",
    recipient: async (event, db) => {
      const result = await db.query("SELECT p.studio_learner_id AS user_id FROM projects p WHERE p.project_id=$1 AND p.organization_id=$2 AND p.tenant_id=$3", [event.payload?.project_id, event.organization_id, event.tenant_id]);
      return result.rows[0]?.user_id || null;
    },
    path: (event) => event.payload?.project_id ? `/studio/projects/${encodeURIComponent(event.payload.project_id)}` : null,
  },
  "studio.handoff.created": {
    type: "STUDIO_HANDOFF_ASSIGNED", title: "New Studio work assigned", message: "New Studio project work is ready for you to start.",
    recipient: async (event, db) => {
      const result = await db.query("SELECT learner_id AS user_id FROM studio_handoffs WHERE handoff_id=$1 AND organization_id=$2", [event.subject_id, event.organization_id]);
      return result.rows[0]?.user_id || null;
    },
    path: (event) => event.subject_id ? `/studio/handoffs/${encodeURIComponent(String(event.subject_id))}` : null,
  },

  // MET-8 — Student Opportunity Exchange. Verified against
  // apps/shs-api/src/domain/metaverse/opportunities/service/{award,submission}-service.ts.
  // Every recipient below is a single named actor already present on the
  // event payload (the awarded student, or the award's own sponsor_user_id
  // looked up from the award row) — never a permission-scoped audience,
  // because an Opportunity always has exactly one sponsor and (for now)
  // one org-scoped awardee/team.
  "opportunity_exchange.bid.accepted": {
    type: "OPPORTUNITY_EXCHANGE_BID_ACCEPTED", title: "Your bid was accepted", message: "Your bid was accepted and an Opportunity award was created.",
    recipient: async (event) => String(event.payload?.student_user_id || "") || null,
    path: (event) => event.payload?.award_id ? `/metaverse/opportunity-exchange/awards/${encodeURIComponent(String(event.payload.award_id))}` : null,
  },
  "opportunity_exchange.submission.submitted": {
    type: "OPPORTUNITY_EXCHANGE_WORK_SUBMITTED", title: "Work submitted for review", message: "A student submitted work for your Opportunity award.",
    recipient: async (event) => String(event.payload?.sponsor_user_id || "") || null,
    path: (event) => event.payload?.award_id ? `/metaverse/opportunity-exchange/awards/${encodeURIComponent(String(event.payload.award_id))}` : null,
  },
  "opportunity_exchange.submission.accepted": {
    type: "OPPORTUNITY_EXCHANGE_WORK_ACCEPTED", title: "Your work was accepted", message: "Your submitted work was accepted.",
    recipient: async (event) => String(event.payload?.student_user_id || "") || null,
    path: (event) => event.payload?.award_id ? `/metaverse/opportunity-exchange/awards/${encodeURIComponent(String(event.payload.award_id))}` : null,
  },
  "opportunity_exchange.submission.revision_requested": {
    type: "OPPORTUNITY_EXCHANGE_REVISION_REQUESTED", title: "Revision requested", message: "The sponsor requested a revision to your submitted work.",
    recipient: async (event) => String(event.payload?.student_user_id || "") || null,
    path: (event) => event.payload?.award_id ? `/metaverse/opportunity-exchange/awards/${encodeURIComponent(String(event.payload.award_id))}` : null,
  },
  "opportunity_exchange.submission.declined": {
    type: "OPPORTUNITY_EXCHANGE_WORK_DECLINED", title: "Submitted work declined", message: "The sponsor declined your submitted work.",
    recipient: async (event) => String(event.payload?.student_user_id || "") || null,
    path: (event) => event.payload?.award_id ? `/metaverse/opportunity-exchange/awards/${encodeURIComponent(String(event.payload.award_id))}` : null,
  },
  "market.listing.review_requested": {
    type: "MARKET_LISTING_REVIEW_REQUESTED", title: "Market listing needs review", message: "A Student Market listing is waiting for governed review.",
    recipient: async (event) => String(event.payload?.created_by_user_id || event.originating_actor_id || "") || null,
    path: () => "/metaverse",
  },
  "market.listing.published": {
    type: "MARKET_LISTING_PUBLISHED", title: "Market listing published", message: "Your Student Market listing was published.",
    recipient: async (event) => String(event.payload?.seller_user_id || event.payload?.created_by_user_id || "") || null,
    path: () => "/metaverse",
  },
  "market.order.paid": {
    type: "MARKET_ORDER_PAID", title: "Market order paid", message: "Treasury settled your Student Market order.",
    recipient: async (event) => String(event.payload?.buyer_user_id || "") || null,
    path: () => "/metaverse",
  },
  "market.order.fulfilled": {
    type: "MARKET_ORDER_FULFILLED", title: "Market fulfillment ready", message: "Your Student Market order was fulfilled.",
    recipient: async (event) => String(event.payload?.buyer_user_id || "") || null,
    path: () => "/metaverse",
  },
  "market.refund.settled": {
    type: "MARKET_REFUND_SETTLED", title: "Market refund settled", message: "Treasury settled your Student Market refund.",
    recipient: async (event) => String(event.payload?.buyer_user_id || "") || null,
    path: () => "/metaverse",
  },
};

// NCA-4 §5: several real, already-emitting Studio events (studio.qa.completed,
// studio.handoff.created, and their siblings project.created/revision.created/
// workspace.updated) omit `tenant_id` from the JS event object they enqueue
// (verified directly in studio-project-service.ts) — an omission, not a
// mismatch. The strict equality guard below would otherwise silently drop
// every notification for these real events forever, even with a correct
// policy. Rather than edit Studio's own domain service (outside NCA's
// ownership — NCA-D002: each domain's own program owns its emission code)
// to backfill a field the outbox table doesn't even persist (migration 007
// has no tenant_id column at all; only this JS-level guard cares), this
// derives the canonical value when absent and still rejects a tenant_id
// that is present but *wrong* — the actual security property (detecting a
// producer that got its own tenant scoping wrong) is unchanged; only the
// tolerance for a merely-omitted, fully-derivable field is added.
function resolveEventTenantId(event: Event): string {
  if (!event.organization_id) return "";
  const canonical = `tenant:${event.organization_id}`;
  if (!event.tenant_id) return canonical;
  return event.tenant_id === canonical ? canonical : "";
}

export async function createNotificationFromEvent(event: Event, db: Executor = { query }) {
  const policy = EVENT_POLICIES[String(event.event_type || "")];
  const tenantId = resolveEventTenantId(event);
  if (!policy || !event.organization_id || !tenantId) return null;
  if (policy.requiresEntitlementService) {
    const entitled = await isOrganizationEntitled(event.organization_id, policy.requiresEntitlementService, db);
    if (!entitled) {
      console.warn("[notifications] skipped: organization is not entitled to the required service", {
        event_type: event.event_type,
        organization_id: event.organization_id,
        service_key: policy.requiresEntitlementService,
      });
      return null;
    }
  }
  const resolved = await policy.recipient(event, db);
  const recipients = Array.isArray(resolved) ? Array.from(new Set(resolved.filter(Boolean))) : (resolved ? [resolved] : []);
  if (!recipients.length) return null;
  const sourceEventId = String(event.outbox_event_id || `${event.producer_id}:${event.event_type}:${event.idempotency_key}`);
  const rows = [];
  for (const recipient of recipients) {
    const id = `notification_${sourceEventId}_${recipient}`.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 240);
    const result = await db.query(`INSERT INTO notifications (notification_id, organization_id, tenant_id, recipient_user_id, notification_type, source_event_id, source_event_type, source_entity_type, source_entity_id, title, message, destination_path) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (organization_id, tenant_id, recipient_user_id, notification_type, source_event_id) DO NOTHING RETURNING *`, [id, event.organization_id, tenantId, recipient, policy.type, sourceEventId, event.event_type, event.subject_type, event.subject_id, policy.title, policy.message, policy.path?.(event) || null]);
    rows.push(result.rows[0] || (await db.query("SELECT * FROM notifications WHERE notification_id=$1", [id])).rows[0] || null);
  }
  // Single-recipient policies (every existing policy prior to NCA-4, and
  // most NCA-4 additions) return the one row directly, exactly as before —
  // no existing caller or test observes a shape change. Only a policy whose
  // recipient() itself resolves an array (currently just referral.created)
  // returns an array here.
  return Array.isArray(resolved) ? rows : (rows[0] || null);
}

// Pure, exported for unit-testability: the set of organization ids this
// user is authorized to see notifications for, sourced from the auth
// layer's already-verified `actor.memberships` (see
// apps/shs-api/src/auth/organization-context.ts) plus the current active
// organization as a safety net for callers/tests that only set that field.
export function resolveAuthorizedOrganizationIds(actor: any): string[] {
  const activeOrganizationId = String(actor?.active_organization_id || actor?.organization_id || "");
  const membershipOrganizationIds = Array.isArray(actor?.memberships)
    ? actor.memberships.map((membership: any) => String(membership?.organization_id || "")).filter(Boolean)
    : [];
  return Array.from(new Set([...membershipOrganizationIds, activeOrganizationId].filter(Boolean)));
}

// NCA-2 §11/§34: server-authoritative organization scoping. `requestedOrganizationId`
// may come from client-supplied query input (see routes.ts), but it is only
// ever honored if it appears in resolveAuthorizedOrganizationIds(actor) —
// which is derived from actor.memberships, populated exclusively by the
// auth layer from the database (apps/shs-api/src/auth/organization-context.ts),
// never from client-controlled request data. A client cannot widen its own
// access by supplying an arbitrary organization id.
function scope(actor: any, requestedOrganizationId?: string) {
  const userId = String(actor?.user_id || "");
  const activeOrganizationId = String(actor?.active_organization_id || actor?.organization_id || "");
  const activeTenantId = String(actor?.tenant_id || `tenant:${activeOrganizationId}`);
  if (!userId || !activeOrganizationId || activeTenantId !== `tenant:${activeOrganizationId}`) {
    throw new Error("ORG_CONTEXT_REQUIRED");
  }
  if (!requestedOrganizationId || requestedOrganizationId === activeOrganizationId) {
    return { userId, organizationId: activeOrganizationId, tenantId: activeTenantId };
  }
  if (!resolveAuthorizedOrganizationIds(actor).includes(requestedOrganizationId)) {
    throw new Error("ORG_CONTEXT_FORBIDDEN");
  }
  return { userId, organizationId: requestedOrganizationId, tenantId: `tenant:${requestedOrganizationId}` };
}

// NCA-2 §16: translates a user's stored preference overrides into the
// concrete notification_type values to exclude from a read. Only
// SUPPRESSIBLE_CATEGORIES (OPTIONAL_PRODUCT, DIGEST_ELIGIBLE) can ever
// appear here — notificationTypesByCategory only enumerates types the
// static classification registry itself assigned to those categories, so a
// MANDATORY_OPERATIONAL/REQUIRED_ACTION/TRANSACTIONAL type can never be
// excluded by a preference, even if a bad row somehow existed.
async function excludedNotificationTypes(userId: string, db: Executor): Promise<string[]> {
  const overrides = await getPreferenceOverrides(userId, db);
  const excluded: string[] = [];
  for (const [category, enabled] of overrides) {
    if (enabled) continue;
    excluded.push(...notificationTypesByCategory(category));
  }
  return excluded;
}

export interface NotificationQueryOptions {
  organizationId?: string;
  db?: Executor;
}

export async function listNotifications(actor: any, options: NotificationQueryOptions = {}) {
  const db = options.db || { query };
  const s = scope(actor, options.organizationId);
  const excludedTypes = await excludedNotificationTypes(s.userId, db);
  const params: unknown[] = [s.organizationId, s.tenantId, s.userId];
  let sql = "SELECT * FROM notifications WHERE organization_id=$1 AND tenant_id=$2 AND recipient_user_id=$3";
  if (excludedTypes.length) {
    params.push(excludedTypes);
    sql += ` AND notification_type <> ALL($${params.length}::text[])`;
  }
  sql += " ORDER BY created_at DESC, notification_id DESC";
  const result = await db.query(sql, params);
  return result.rows.map(mapNotification);
}

export async function unreadCount(actor: any, options: NotificationQueryOptions = {}) {
  const db = options.db || { query };
  const s = scope(actor, options.organizationId);
  const excludedTypes = await excludedNotificationTypes(s.userId, db);
  const params: unknown[] = [s.organizationId, s.tenantId, s.userId];
  let sql = "SELECT COUNT(*)::int AS count FROM notifications WHERE organization_id=$1 AND tenant_id=$2 AND recipient_user_id=$3 AND status='UNREAD'";
  if (excludedTypes.length) {
    params.push(excludedTypes);
    sql += ` AND notification_type <> ALL($${params.length}::text[])`;
  }
  const result = await db.query(sql, params);
  return { count: Number(result.rows[0]?.count || 0) };
}

export async function markRead(actor: any, notificationId: string, options: NotificationQueryOptions = {}) {
  const db = options.db || { query };
  const s = scope(actor, options.organizationId);
  const result = await db.query("UPDATE notifications SET status='READ', read_at=COALESCE(read_at,NOW()) WHERE notification_id=$1 AND organization_id=$2 AND tenant_id=$3 AND recipient_user_id=$4 AND status <> 'ARCHIVED' RETURNING *", [notificationId, s.organizationId, s.tenantId, s.userId]);
  if (!result.rows[0]) throw new Error("NOTIFICATION_NOT_FOUND");
  return mapNotification(result.rows[0]);
}

export async function markAllRead(actor: any, options: NotificationQueryOptions = {}) {
  const db = options.db || { query };
  const s = scope(actor, options.organizationId);
  const result = await db.query("UPDATE notifications SET status='READ', read_at=COALESCE(read_at,NOW()) WHERE organization_id=$1 AND tenant_id=$2 AND recipient_user_id=$3 AND status='UNREAD'", [s.organizationId, s.tenantId, s.userId]);
  return { updated: result.rowCount || 0 };
}

// NCA-2 §19 (Dismiss/Archive): inbox-presentation-only. Archiving only ever
// changes this row's own `status` column — it has no code path into any
// source-domain table, cannot be applied to an already-archived row twice
// in a way that fabricates history, and (like markRead) never touches
// Evidence, Truth, or workflow-completion state. The schema already
// reserved ARCHIVED as a valid status (migration 081); this is the first
// code path that actually sets it.
export async function archiveNotification(actor: any, notificationId: string, options: NotificationQueryOptions = {}) {
  const db = options.db || { query };
  const s = scope(actor, options.organizationId);
  const result = await db.query("UPDATE notifications SET status='ARCHIVED' WHERE notification_id=$1 AND organization_id=$2 AND tenant_id=$3 AND recipient_user_id=$4 RETURNING *", [notificationId, s.organizationId, s.tenantId, s.userId]);
  if (!result.rows[0]) throw new Error("NOTIFICATION_NOT_FOUND");
  return mapNotification(result.rows[0]);
}

// NCA-1: the canonical attention-item projection (NCA-0 §33, decision lock
// §11) — the actionRequired-filtered subset of the same notifications a
// recipient already has, meant to feed the existing SeaAttention primitive.
// This is a derived read, not a new store: it reuses listNotifications and
// the same org/tenant/recipient scoping (and, as of NCA-2, the same
// organization-filter and preference-suppression rules), so it inherits
// every existing security/isolation guarantee rather than re-implementing
// them.
export async function listAttentionItems(actor: any, options: NotificationQueryOptions = {}) {
  const items = await listNotifications(actor, options);
  return items
    .filter((item) => item.actionRequired)
    .map((item) => ({
      notificationId: item.notificationId,
      organizationId: item.organizationId,
      type: item.type,
      title: item.title,
      message: item.message,
      destinationPath: item.destinationPath,
      urgency: item.urgency,
      readState: item.status,
      createdAt: item.createdAt,
    }));
}

// NCA-1/NCA-2: multi-org visibility (NCA_OWNER_DECISION_LOCK.md — Canonical
// User Inbox). The active-organization-scoped inbox stays the default
// view; this supplies the aggregate, non-blocking cross-org signal the
// owner approval requires, without silently hiding or merging another
// organization's notifications into the active view. Reuses the
// memberships the auth layer has already resolved and verified as active
// for this user rather than re-deriving membership authorization here.
// Preference suppression is applied per-organization so the aggregate
// signal stays consistent with what listNotifications would actually show
// for that organization.
export async function unreadCountsByOrganization(actor: any, options: { db?: Executor } = {}) {
  const db = options.db || { query };
  const userId = String(actor?.user_id || actor?.id || "");
  const activeOrganizationId = String(actor?.active_organization_id || actor?.organization_id || "");
  if (!userId) throw new Error("ORG_CONTEXT_REQUIRED");
  const organizationIds = resolveAuthorizedOrganizationIds(actor);
  if (!organizationIds.length) throw new Error("ORG_CONTEXT_REQUIRED");
  const excludedTypes = await excludedNotificationTypes(userId, db);
  const params: unknown[] = [userId, organizationIds];
  let sql = "SELECT organization_id, COUNT(*)::int AS count FROM notifications WHERE recipient_user_id=$1 AND status='UNREAD' AND organization_id = ANY($2::text[])";
  if (excludedTypes.length) {
    params.push(excludedTypes);
    sql += ` AND notification_type <> ALL($${params.length}::text[])`;
  }
  sql += " GROUP BY organization_id";
  const result = await db.query(sql, params);
  const counts = new Map<string, number>(result.rows.map((row: any) => [String(row.organization_id), Number(row.count || 0)]));
  return organizationIds.map((organizationId) => ({
    organizationId,
    isActive: organizationId === activeOrganizationId,
    unreadCount: counts.get(organizationId) || 0,
  }));
}

function mapNotification(row: any) {
  const classification = classifyNotificationType(row.notification_type);
  const readState = row.status;
  const actionState = !classification.actionRequired
    ? "NO_ACTION"
    : "ACTION_REQUIRED"; // ACTION_COMPLETED/EXPIRED are reserved — see communication-contracts.ts; never derived from read state.
  return {
    notificationId: row.notification_id,
    organizationId: row.organization_id,
    type: row.notification_type,
    title: row.title,
    message: row.message,
    status: readState,
    createdAt: row.created_at,
    readAt: row.read_at,
    destinationPath: row.destination_path,
    category: classification.category,
    actionRequired: classification.actionRequired,
    urgency: classification.urgency,
    channelEligibility: classification.channelEligibility,
    actionState,
  };
}
