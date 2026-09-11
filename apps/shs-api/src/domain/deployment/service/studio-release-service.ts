import { randomUUID } from "node:crypto";
import { query } from "../../../db/client.js";
import { withTransaction } from "../../../db/transaction.js";
import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { WebsiteDeploymentService } from "./website-deployment-service.js";

type Actor = { user_id?: string; id?: string; active_organization_id?: string; organization_id?: string; tenant_id?: string; permissions?: string[] };
function scope(actor: Actor) {
  const organizationId = String(actor.active_organization_id || actor.organization_id || "");
  const tenantId = String(actor.tenant_id || `tenant:${organizationId}`);
  const userId = String(actor.user_id || actor.id || "");
  if (!organizationId || !userId || tenantId !== `tenant:${organizationId}`) throw new Error("ORG_CONTEXT_REQUIRED");
  return { organizationId, tenantId, userId };
}
function requirePermission(actor: Actor, permission: string) { if (!hasPermission(actor.permissions || [], permission)) throw new Error("RELEASE_PERMISSION_REQUIRED"); }
function map(row: any) { return { releaseId: row.release_id, organizationId: row.organization_id, tenantId: row.tenant_id, projectId: row.project_id, artifactId: row.artifact_id, reviewSubmissionId: row.review_submission_id, qaRunId: row.qa_run_id, deliveryRecordId: row.delivery_record_id, target: row.target, providerKey: row.provider_key, status: row.status, gateDecision: row.gate_decision, gateCodes: row.gate_codes, contentHash: row.content_hash, providerDeploymentId: row.provider_deployment_id, requestedByUserId: row.requested_by_user_id, createdAt: row.created_at, updatedAt: row.updated_at, releasedAt: row.released_at }; }

export class StudioReleaseService {
  constructor(private dbQuery: typeof query = query, private transaction: typeof withTransaction = withTransaction, private deployment = new WebsiteDeploymentService()) {}

  private async gate(actor: Actor, deliveryId: string) {
    const s = scope(actor);
    const result = await this.dbQuery(`SELECT d.*, a.content_hash, q.status AS qa_status, r.status AS review_status
      FROM studio_delivery_records d
      JOIN studio_build_artifacts a ON a.artifact_id=d.artifact_id AND a.project_id=d.project_id AND a.organization_id=d.organization_id AND a.tenant_id=d.tenant_id
      JOIN studio_qa_runs q ON q.qa_run_id=d.qa_run_id AND q.artifact_id=d.artifact_id AND q.status='PASSED'
      JOIN studio_review_submissions r ON r.review_submission_id=d.submission_id AND r.artifact_id=d.artifact_id AND r.status='APPROVED'
      WHERE d.delivery_record_id=$1 AND d.organization_id=$2 AND d.tenant_id=$3 AND d.status='FINALIZED'`, [deliveryId, s.organizationId, s.tenantId]);
    if (!result.rows[0]) throw new Error("RELEASE_GATE_DENIED");
    return { scope: s, row: result.rows[0] };
  }

  async create(actor: Actor, input: any) {
    requirePermission(actor, SHS_SECURITY_PERMISSIONS.WEBSITE_DEPLOYMENT_CREATE);
    const deliveryId = String(input?.deliveryId || "").trim();
    const idempotencyKey = String(input?.idempotencyKey || input?.idempotency_key || "").trim();
    if (!deliveryId || !idempotencyKey) throw new Error("RELEASE_INPUT_REQUIRED");
    const found = await this.gate(actor, deliveryId);
    return this.transaction(async (db: any) => {
      const prior = await db.query("SELECT * FROM studio_release_requests WHERE organization_id=$1 AND tenant_id=$2 AND idempotency_key=$3", [found.scope.organizationId, found.scope.tenantId, idempotencyKey]);
      if (prior.rows[0]) return { release: map(prior.rows[0]), idempotent: true };
      const releaseId = `studio_release_${randomUUID()}`;
      const inserted = await db.query(`INSERT INTO studio_release_requests (release_id, organization_id, tenant_id, project_id, artifact_id, review_submission_id, qa_run_id, delivery_record_id, target, provider_key, status, gate_decision, gate_codes, requested_by_user_id, content_hash, idempotency_key)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'TEST','local_mock','AUTHORIZED','ALLOW','[]'::jsonb,$9,$10,$11) RETURNING *`, [releaseId, found.scope.organizationId, found.scope.tenantId, found.row.project_id, found.row.artifact_id, found.row.submission_id, found.row.qa_run_id, deliveryId, found.scope.userId, found.row.content_hash, idempotencyKey]);
      return { release: map(inserted.rows[0]), idempotent: false };
    });
  }

  async execute(actor: Actor, releaseId: string) {
    requirePermission(actor, SHS_SECURITY_PERMISSIONS.WEBSITE_DEPLOYMENT_CREATE);
    const s = scope(actor);
    const release = (await this.dbQuery("SELECT * FROM studio_release_requests WHERE release_id=$1 AND organization_id=$2 AND tenant_id=$3", [releaseId, s.organizationId, s.tenantId])).rows[0];
    if (!release) throw new Error("RELEASE_NOT_FOUND");
    if (release.status === "RELEASED") return { release: map(release), idempotent: true };
    if (!['AUTHORIZED','FAILED'].includes(release.status)) throw new Error("RELEASE_STATE_INVALID");
    const attemptNumber = Number((await this.dbQuery("SELECT COALESCE(MAX(attempt_number),0)+1 AS next FROM studio_release_attempts WHERE release_id=$1", [releaseId])).rows[0].next);
    const attemptId = `studio_release_attempt_${randomUUID()}`;
    await this.transaction(async (db: any) => {
      await db.query("INSERT INTO studio_release_attempts (attempt_id, release_id, organization_id, tenant_id, attempt_number, artifact_id, content_hash, provider_key, status, idempotency_key) VALUES ($1,$2,$3,$4,$5,$6,$7,'local_mock','RELEASING',$8)", [attemptId, releaseId, s.organizationId, s.tenantId, attemptNumber, release.artifact_id, release.content_hash, `${releaseId}:attempt:${attemptNumber}`]);
      await db.query("UPDATE studio_release_requests SET status='RELEASING', updated_at=NOW() WHERE release_id=$1", [releaseId]);
    });
    try {
      const delivery = await this.deployment.requestFromStudioDelivery(actor, { deliveryId: release.delivery_record_id });
      await this.transaction(async (db: any) => {
        await db.query("UPDATE studio_release_attempts SET status='RELEASED', provider_deployment_id=$2, completed_at=NOW() WHERE attempt_id=$1", [attemptId, delivery.deployment.providerDeploymentId]);
        await db.query("UPDATE studio_release_requests SET status='RELEASED', provider_deployment_id=$2, released_at=NOW(), updated_at=NOW() WHERE release_id=$1", [releaseId, delivery.deployment.providerDeploymentId]);
      });
    } catch (error: any) {
      await this.transaction(async (db: any) => { await db.query("UPDATE studio_release_attempts SET status='FAILED', error_code='PROVIDER_FAILED', error_message=$2, completed_at=NOW() WHERE attempt_id=$1", [attemptId, String(error?.message || "provider failed").slice(0, 500)]); await db.query("UPDATE studio_release_requests SET status='FAILED', updated_at=NOW() WHERE release_id=$1", [releaseId]); });
      throw new Error("RELEASE_DELIVERY_FAILED");
    }
    return { release: map((await this.dbQuery("SELECT * FROM studio_release_requests WHERE release_id=$1", [releaseId])).rows[0]), idempotent: false };
  }

  async get(actor: Actor, releaseId: string) { requirePermission(actor, SHS_SECURITY_PERMISSIONS.WEBSITE_DEPLOYMENT_VIEW); const s = scope(actor); const row = (await this.dbQuery("SELECT * FROM studio_release_requests WHERE release_id=$1 AND organization_id=$2 AND tenant_id=$3", [releaseId, s.organizationId, s.tenantId])).rows[0]; if (!row) throw new Error("RELEASE_NOT_FOUND"); const attempts = (await this.dbQuery("SELECT attempt_id, attempt_number, status, provider_deployment_id, error_code, error_message, started_at, completed_at FROM studio_release_attempts WHERE release_id=$1 AND organization_id=$2 AND tenant_id=$3 ORDER BY attempt_number", [releaseId, s.organizationId, s.tenantId])).rows; return { release: map(row), attempts }; }
}
