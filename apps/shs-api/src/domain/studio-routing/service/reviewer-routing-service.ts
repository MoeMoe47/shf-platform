import { randomUUID } from "node:crypto";
import { query } from "../../../db/client.js";
import { withTransaction } from "../../../db/transaction.js";
import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { IntegrationOutboxRepo } from "../../trusted-reporting/outbox-repo.js";

type Actor = { user_id?: string; id?: string; active_organization_id?: string; organization_id?: string; tenant_id?: string; permissions?: string[]; roles?: string[] };
type Executor = { query: (sql: string, params?: unknown[]) => Promise<any> };

function scope(actor: Actor) {
  const userId = String(actor.user_id || actor.id || "");
  const organizationId = String(actor.active_organization_id || actor.organization_id || "");
  const tenantId = String(actor.tenant_id || `tenant:${organizationId}`);
  if (!userId || !organizationId || tenantId !== `tenant:${organizationId}`) throw new Error("ORG_CONTEXT_REQUIRED");
  return { userId, organizationId, tenantId };
}

function requirePermission(actor: Actor, permission: string) {
  if (!hasPermission(actor.permissions || [], permission)) throw new Error(`${permission.replaceAll(".", "_")}_required`);
}

function mapAssignment(row: any) {
  return {
    assignmentId: row.review_assignment_id,
    submissionId: row.review_submission_id,
    organizationId: row.organization_id,
    tenantId: row.tenant_id,
    reviewerUserId: row.reviewer_user_id,
    reviewerName: row.reviewer_name || null,
    projectId: row.project_id || null,
    learnerId: row.learner_id || null,
    projectType: row.project_type || null,
    projectTitle: row.project_title || null,
    assignmentIdContext: row.studio_assignment_id || null,
    workspaceRevision: row.workspace_revision == null ? null : Number(row.workspace_revision),
    reviewStatus: row.review_status || null,
    status: row.status,
    routingPolicy: row.routing_policy_key,
    assignmentReason: row.assignment_reason,
    assignedAt: row.assigned_at,
    completedAt: row.completed_at,
    reassignedFromId: row.reassigned_from_id,
    cohortId: row.cohort_id || null,
    programId: row.program_id || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class ReviewerRoutingService {
  constructor(
    private dbQuery: typeof query = query,
    private transaction: typeof withTransaction = withTransaction,
    private outbox = new IntegrationOutboxRepo(),
  ) {}

  private async eligibleReviewer(executor: Executor, organizationId: string, tenantId: string, learnerId: string, cohortId: string | null, requestedUserId: string | null = null) {
    const result = await executor.query(
      `SELECT u.user_id,
              COUNT(a.review_assignment_id) FILTER (WHERE a.status IN ('ASSIGNED','IN_PROGRESS')) AS active_load,
              MAX(a.assigned_at) AS last_assigned_at
       FROM memberships m
       JOIN users u ON u.user_id=m.user_id AND u.organization_id=m.organization_id AND u.status IN ('active','ACTIVE')
       JOIN roles r ON r.role_id=m.role_id
       JOIN role_permissions rp ON rp.role_id=m.role_id AND rp.permission_name=$4
       LEFT JOIN studio_review_assignments a ON a.reviewer_user_id=u.user_id AND a.organization_id=m.organization_id AND a.tenant_id=$2
       WHERE m.organization_id=$1 AND m.status IN ('active','ACTIVE')
         AND (m.effective_to IS NULL OR m.effective_to > NOW())
         AND lower(r.role_name) IN ('reviewer','instructor')
         AND (($5::text IS NOT NULL AND EXISTS (
           SELECT 1 FROM cohort_staff cs
           WHERE cs.organization_id=$1 AND cs.tenant_id=$2 AND cs.cohort_id=$5
             AND cs.user_id=u.user_id AND cs.status='ACTIVE'
         )) OR ($5::text IS NULL AND EXISTS (
           SELECT 1 FROM cohort_staff cs
           WHERE cs.organization_id=$1 AND cs.tenant_id=$2
             AND cs.user_id=u.user_id AND cs.status='ACTIVE'
         )))
         AND u.user_id<>$3
         AND NOT EXISTS (
           SELECT 1 FROM projects tp
           JOIN studio_team_members tm ON tm.studio_team_id=tp.studio_team_id
             AND tm.organization_id=tp.organization_id AND tm.tenant_id=tp.tenant_id
             AND tm.status='ACTIVE' AND tm.left_at IS NULL
           WHERE tp.studio_learner_id=$3 AND tp.studio_owner_type='TEAM'
             AND tp.studio_team_id IS NOT NULL AND tm.user_id=u.user_id
         )
         AND ($6::text IS NULL OR u.user_id=$6)
       GROUP BY u.user_id, r.role_name
       ORDER BY COUNT(a.review_assignment_id) FILTER (WHERE a.status IN ('ASSIGNED','IN_PROGRESS')) ASC,
                MAX(a.assigned_at) ASC NULLS FIRST,
                u.user_id ASC
       LIMIT 1`, [organizationId, tenantId, learnerId, SHS_SECURITY_PERMISSIONS.PROJECT_SUBMISSION_REVIEW, cohortId, requestedUserId],
    );
    return result.rows[0] || null;
  }

  async route(actor: Actor, submissionId: string) {
    requirePermission(actor, SHS_SECURITY_PERMISSIONS.STUDIO_REVIEW_ROUTE);
    const s = scope(actor);
    return this.transaction(async (db: Executor) => {
      await db.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`studio-review-route:${s.organizationId}:${submissionId}`]);
      const submission = (await db.query(
        `SELECT s.*, p.title AS project_title, p.studio_learner_id AS learner_id, p.studio_assignment_id,
                h.cohort_id, c.program_id
         FROM studio_review_submissions s JOIN projects p ON p.project_id=s.project_id
         LEFT JOIN studio_handoffs h ON h.project_id=p.project_id AND h.organization_id=s.organization_id AND h.tenant_id=s.tenant_id
         LEFT JOIN cohorts c ON c.cohort_id=h.cohort_id AND c.organization_id=s.organization_id AND c.tenant_id=s.tenant_id
         WHERE s.review_submission_id=$1 AND s.organization_id=$2 AND s.tenant_id=$3`, [submissionId, s.organizationId, s.tenantId],
      )).rows[0];
      if (!submission) throw new Error("REVIEW_SUBMISSION_NOT_FOUND");
      const existing = (await db.query("SELECT * FROM studio_review_assignments WHERE review_submission_id=$1 AND organization_id=$2 AND tenant_id=$3 AND status IN ('ASSIGNED','IN_PROGRESS') ORDER BY created_at DESC LIMIT 1", [submissionId, s.organizationId, s.tenantId])).rows[0];
      if (existing) return mapAssignment(existing);
      const reviewer = await this.eligibleReviewer(db, s.organizationId, s.tenantId, submission.learner_id, submission.cohort_id || null);
      if (!reviewer) throw new Error("REVIEWER_NOT_AVAILABLE");
      const assignmentId = `studio_review_assignment_${randomUUID()}`;
      const inserted = await db.query(
        `INSERT INTO studio_review_assignments
         (review_assignment_id, review_submission_id, organization_id, tenant_id, reviewer_user_id, status, routing_policy_key, assignment_reason, assigned_at)
         VALUES ($1,$2,$3,$4,$5,'ASSIGNED','LEAST_ACTIVE_LOAD','Lowest active review load.',NOW())
         RETURNING *`, [assignmentId, submissionId, s.organizationId, s.tenantId, reviewer.user_id],
      );
      const row = { ...inserted.rows[0], project_id: submission.project_id, learner_id: submission.learner_id, project_type: submission.project_type, project_title: submission.project_title, studio_assignment_id: submission.studio_assignment_id, cohort_id: submission.cohort_id, program_id: submission.program_id, workspace_revision: submission.workspace_revision, review_status: submission.status };
      await this.outbox.enqueue({ producer_id: "shs-api.studio-routing", event_type: "studio.review.routed", subject_type: "studio_review_assignment", subject_id: assignmentId, organization_id: s.organizationId, originating_actor_id: s.userId, occurred_at: new Date().toISOString(), idempotency_key: assignmentId, correlation_id: `studio:review:${submissionId}`, destination: "shs-studio", tenant_id: s.tenantId, payload: { submission_id: submissionId, project_id: submission.project_id, workspace_revision: submission.workspace_revision, reviewer_user_id: reviewer.user_id, routing_policy: "LEAST_ACTIVE_LOAD" } }, db);
      return mapAssignment(row);
    });
  }

  async routeForSubmission(submissionId: string, actor: Actor) {
    try { return await this.route({ ...actor, permissions: Array.from(new Set([...(actor.permissions || []), SHS_SECURITY_PERMISSIONS.STUDIO_REVIEW_ROUTE])) }, submissionId); }
    catch (error: any) {
      if (String(error?.message) !== "REVIEWER_NOT_AVAILABLE") throw error;
      const s = scope(actor);
      await this.outbox.enqueue({ producer_id: "shs-api.studio-routing", event_type: "studio.review.routing_failed", subject_type: "studio_review_submission", subject_id: submissionId, organization_id: s.organizationId, originating_actor_id: s.userId, occurred_at: new Date().toISOString(), idempotency_key: `studio.review.routing_failed:${submissionId}`, correlation_id: `studio:review:${submissionId}`, destination: "shs-studio", tenant_id: s.tenantId, payload: { submission_id: submissionId, reason: "REVIEWER_NOT_AVAILABLE" } });
      return { status: "UNROUTED", submissionId, reason: "REVIEWER_NOT_AVAILABLE" };
    }
  }

  async queue(actor: Actor) {
    requirePermission(actor, SHS_SECURITY_PERMISSIONS.STUDIO_REVIEW_QUEUE_VIEW);
    const s = scope(actor);
    const result = await this.dbQuery(
      `SELECT a.*, s.project_id, s.workspace_revision, s.project_type, s.status AS review_status,
              p.title AS project_title, p.studio_learner_id AS learner_id, p.studio_assignment_id,
              h.cohort_id, c.program_id,
              u.full_name AS reviewer_name
       FROM studio_review_assignments a
       JOIN studio_review_submissions s ON s.review_submission_id=a.review_submission_id
       JOIN projects p ON p.project_id=s.project_id
       LEFT JOIN studio_handoffs h ON h.project_id=p.project_id AND h.organization_id=s.organization_id AND h.tenant_id=s.tenant_id
       LEFT JOIN cohorts c ON c.cohort_id=h.cohort_id AND c.organization_id=s.organization_id AND c.tenant_id=s.tenant_id
       JOIN users u ON u.user_id=a.reviewer_user_id
       WHERE a.organization_id=$1 AND a.tenant_id=$2 AND a.reviewer_user_id=$3 AND a.status IN ('ASSIGNED','IN_PROGRESS')
       ORDER BY a.assigned_at ASC, a.review_assignment_id ASC`, [s.organizationId, s.tenantId, s.userId],
    );
    return result.rows.map(mapAssignment);
  }

  async get(actor: Actor, assignmentId: string) {
    requirePermission(actor, SHS_SECURITY_PERMISSIONS.STUDIO_REVIEW_QUEUE_VIEW);
    const s = scope(actor);
    const result = await this.dbQuery(
      `SELECT a.*, s.project_id, s.workspace_revision, s.project_type, s.status AS review_status,
              p.title AS project_title, p.studio_learner_id AS learner_id, p.studio_assignment_id,
              h.cohort_id, c.program_id,
              u.full_name AS reviewer_name
       FROM studio_review_assignments a JOIN studio_review_submissions s ON s.review_submission_id=a.review_submission_id
       JOIN projects p ON p.project_id=s.project_id JOIN users u ON u.user_id=a.reviewer_user_id
       LEFT JOIN studio_handoffs h ON h.project_id=p.project_id AND h.organization_id=s.organization_id AND h.tenant_id=s.tenant_id
       LEFT JOIN cohorts c ON c.cohort_id=h.cohort_id AND c.organization_id=s.organization_id AND c.tenant_id=s.tenant_id
       WHERE a.review_assignment_id=$1 AND a.organization_id=$2 AND a.tenant_id=$3
         AND (a.reviewer_user_id=$4 OR $5 = ANY($6::text[]))`, [assignmentId, s.organizationId, s.tenantId, s.userId, SHS_SECURITY_PERMISSIONS.STUDIO_REVIEW_REASSIGN, actor.permissions || []],
    );
    if (!result.rows[0]) throw new Error("REVIEW_ASSIGNMENT_NOT_FOUND");
    return mapAssignment(result.rows[0]);
  }

  async reassign(actor: Actor, assignmentId: string, reviewerUserId: string, reason: string) {
    requirePermission(actor, SHS_SECURITY_PERMISSIONS.STUDIO_REVIEW_REASSIGN);
    const s = scope(actor);
    const trimmedReason = String(reason || "").trim().slice(0, 500);
    if (!trimmedReason) throw new Error("REASSIGNMENT_REASON_REQUIRED");
    return this.transaction(async (db: Executor) => {
      await db.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`studio-review-route:${s.organizationId}:${assignmentId}`]);
      const current = (await db.query("SELECT * FROM studio_review_assignments WHERE review_assignment_id=$1 AND organization_id=$2 AND tenant_id=$3 AND status IN ('ASSIGNED','IN_PROGRESS') FOR UPDATE", [assignmentId, s.organizationId, s.tenantId])).rows[0];
      if (!current) throw new Error("REVIEW_ASSIGNMENT_NOT_FOUND");
      const submission = (await db.query(
        `SELECT p.studio_learner_id AS learner_id, h.cohort_id
         FROM studio_review_submissions s
         JOIN projects p ON p.project_id=s.project_id
         LEFT JOIN studio_handoffs h ON h.project_id=s.project_id AND h.organization_id=s.organization_id AND h.tenant_id=s.tenant_id
         WHERE s.review_submission_id=$1 AND s.organization_id=$2 AND s.tenant_id=$3`, [current.review_submission_id, s.organizationId, s.tenantId],
      )).rows[0];
      const reviewer = submission && await this.eligibleReviewer(db, s.organizationId, s.tenantId, submission.learner_id, submission.cohort_id || null, reviewerUserId);
      if (!reviewer || reviewer.user_id === current.reviewer_user_id) throw new Error("REVIEWER_NOT_ELIGIBLE");
      await db.query("UPDATE studio_review_assignments SET status='REASSIGNED', updated_at=NOW() WHERE review_assignment_id=$1", [assignmentId]);
      const created = (await db.query(`INSERT INTO studio_review_assignments (review_assignment_id, review_submission_id, organization_id, tenant_id, reviewer_user_id, status, routing_policy_key, assignment_reason, reassigned_from_id) VALUES ($1,$2,$3,$4,$5,'ASSIGNED','LEAST_ACTIVE_LOAD',$6,$7) RETURNING *`, [`studio_review_assignment_${randomUUID()}`, current.review_submission_id, s.organizationId, s.tenantId, reviewer.user_id, trimmedReason, assignmentId])).rows[0];
      await this.outbox.enqueue({ producer_id: "shs-api.studio-routing", event_type: "studio.review.reassigned", subject_type: "studio_review_assignment", subject_id: created.review_assignment_id, organization_id: s.organizationId, originating_actor_id: s.userId, occurred_at: new Date().toISOString(), idempotency_key: created.review_assignment_id, correlation_id: `studio:review:${current.review_submission_id}`, destination: "shs-studio", tenant_id: s.tenantId, payload: { submission_id: current.review_submission_id, previous_assignment_id: assignmentId, reviewer_user_id: reviewer.user_id, reason: trimmedReason } }, db);
      return mapAssignment(created);
    });
  }

  async completeForDecision(executor: Executor, submissionId: string, organizationId: string, tenantId: string) {
    await executor.query("UPDATE studio_review_assignments SET status='COMPLETED', completed_at=NOW(), updated_at=NOW() WHERE review_submission_id=$1 AND organization_id=$2 AND tenant_id=$3 AND status IN ('ASSIGNED','IN_PROGRESS')", [submissionId, organizationId, tenantId]);
  }

  async authorizeDecision(actor: Actor, submissionId: string) {
    const s = scope(actor);
    if (hasPermission(actor.permissions || [], SHS_SECURITY_PERMISSIONS.STUDIO_REVIEW_REASSIGN)) return s;
    const result = await this.dbQuery("SELECT 1 FROM studio_review_assignments WHERE review_submission_id=$1 AND organization_id=$2 AND tenant_id=$3 AND reviewer_user_id=$4 AND status IN ('ASSIGNED','IN_PROGRESS')", [submissionId, s.organizationId, s.tenantId, s.userId]);
    if (!result.rows[0]) throw new Error("REVIEW_ASSIGNMENT_REQUIRED");
    return s;
  }
}
