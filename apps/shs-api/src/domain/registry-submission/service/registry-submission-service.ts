import { randomUUID } from "node:crypto";
import { query } from "../../../db/client.js";
import { withTransaction } from "../../../db/transaction.js";
import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { IntegrationOutboxRepo } from "../../trusted-reporting/outbox-repo.js";
import { defaultRegistryProvider, type RegistryProvider } from "../provider/registry-provider.js";
import { REGISTRY_PROVIDER, type RegistrySubmissionStatus } from "../model/registry-submission-contract.js";

type Actor = { user_id?: string; id?: string; active_organization_id?: string; organization_id?: string; tenant_id?: string; permissions?: string[] };
type Executor = { query: (sql: string, params?: unknown[]) => Promise<any> };
function scope(actor: Actor) { const userId = String(actor.user_id || actor.id || ""); const organizationId = String(actor.active_organization_id || actor.organization_id || ""); const tenantId = String(actor.tenant_id || `tenant:${organizationId}`); if (!userId || !organizationId || tenantId !== `tenant:${organizationId}`) throw new Error("ORG_CONTEXT_REQUIRED"); return { userId, organizationId, tenantId }; }
function requirePermission(actor: Actor, permission: string) { if (!hasPermission(actor.permissions || [], permission)) throw new Error(`${permission.replaceAll(".", "_")}_required`); }
function canManage(actor: Actor) { return hasPermission(actor.permissions || [], SHS_SECURITY_PERMISSIONS.AGENT_REGISTRY_MANAGE); }
function mapRow(row: any) { return { submissionId: row.submission_id, organizationId: row.organization_id, tenantId: row.tenant_id, learnerId: row.learner_id, projectId: row.project_id, packageId: row.package_id, packageVersion: Number(row.package_version), packageHash: row.package_hash, registryProvider: row.registry_provider, status: row.status, registryReference: row.registry_reference, isTestRegistry: true, submittedAt: row.submitted_at, reviewedAt: row.reviewed_at, failureCode: row.failure_code, failureMessage: row.failure_message, resubmissionOf: row.resubmission_of, createdAt: row.created_at, updatedAt: row.updated_at }; }

export class RegistrySubmissionService {
  constructor(private dbQuery: typeof query = query, private transaction: typeof withTransaction = withTransaction, private outbox = new IntegrationOutboxRepo(), private provider: RegistryProvider = defaultRegistryProvider()) {}
  private async packageSource(executor: Executor, actor: Actor, packageId: string) {
    const s = scope(actor);
    const result = await executor.query("SELECT p.*, pr.studio_owner_type, pr.studio_team_id FROM studio_agent_packages p JOIN projects pr ON pr.project_id=p.project_id AND pr.organization_id=p.organization_id AND pr.tenant_id=p.tenant_id WHERE p.package_id=$1 AND p.organization_id=$2 AND p.tenant_id=$3 AND p.validation_status='VALID' FOR UPDATE", [packageId, s.organizationId, s.tenantId]);
    const row = result.rows[0];
    if (!row) throw new Error("REGISTRY_PACKAGE_NOT_ELIGIBLE");
    const teamMember = row.studio_owner_type === "TEAM" && row.studio_team_id && (await executor.query("SELECT 1 FROM studio_team_members WHERE studio_team_id=$1 AND organization_id=$2 AND tenant_id=$3 AND user_id=$4 AND status='ACTIVE' AND left_at IS NULL", [row.studio_team_id, s.organizationId, s.tenantId, s.userId])).rows[0];
    if (row.learner_id !== s.userId && !teamMember && !canManage(actor)) throw new Error("REGISTRY_SUBMISSION_FORBIDDEN");
    if (!/^[0-9a-f]{64}$/.test(row.package_hash) || (!row.package_json || typeof row.package_json !== "object")) throw new Error("REGISTRY_PACKAGE_HASH_MISMATCH");
    return { scope: s, row };
  }
  private async emit(executor: Executor, type: string, row: any, s: any) { await this.outbox.enqueue({ producer_id: "shs-api.registry-submission", event_type: type, subject_type: "registry_submission", subject_id: row.submission_id, organization_id: s.organizationId, originating_actor_id: s.userId, originating_actor_type: "user", tenant_id: s.tenantId, occurred_at: new Date().toISOString(), idempotency_key: `${type}:${row.submission_id}`, correlation_id: `registry-submission:${row.submission_id}`, destination: "shs-autonomous-registry", payload: { package_id: row.package_id, package_version: row.package_version, package_hash: row.package_hash, project_id: row.project_id, status: row.status, registry_provider: row.registry_provider } }, executor); }
  private async deliver(row: any, actor: Actor, source: any) {
    try {
      return await this.transaction(async (db: Executor) => {
        await db.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`registry-submission:${row.submission_id}`]);
        const current = (await db.query("SELECT * FROM agent_registry_submissions WHERE submission_id=$1 FOR UPDATE", [row.submission_id])).rows[0];
        if (!current || !["SUBMITTED", "UNDER_REVIEW"].includes(current.status)) return mapRow(current || row);
        const result = await this.provider.submit({ packageId: current.package_id, packageVersion: Number(current.package_version), packageHash: current.package_hash, packageJson: current.package_json });
        const updated = await db.query("UPDATE agent_registry_submissions SET status=$2, registry_reference=$3, reviewed_at=NOW(), updated_at=NOW() WHERE submission_id=$1 AND status IN ('SUBMITTED','UNDER_REVIEW') RETURNING *", [row.submission_id, result.status, result.registryReference]);
        const eventType = result.status === "ACCEPTED" ? "registry.submission.accepted" : result.status === "CHANGES_REQUIRED" ? "registry.submission.changes_requested" : result.status === "SUBMITTED" ? "registry.submission.sent" : result.status === "UNDER_REVIEW" ? "registry.submission.under_review" : "registry.submission.rejected";
        await this.emit(db, eventType, updated.rows[0], source.scope);
        return mapRow(updated.rows[0]);
      });
    } catch (error: any) {
      await this.transaction(async (db: Executor) => { const updated = await db.query("UPDATE agent_registry_submissions SET status='FAILED', failure_code='REGISTRY_PROVIDER_FAILED', failure_message=$2, updated_at=NOW() WHERE submission_id=$1 AND status IN ('SUBMITTED','UNDER_REVIEW') RETURNING *", [row.submission_id, String(error?.message || "Registry provider failed").slice(0, 500)]); if (updated.rows[0]) await this.emit(db, "registry.submission.failed", updated.rows[0], source.scope); });
      throw new Error("REGISTRY_SUBMISSION_FAILED");
    }
  }
  async submit(actor: Actor, packageId: string, resubmissionOf: string | null = null) {
    requirePermission(actor, SHS_SECURITY_PERMISSIONS.AGENT_REGISTRY_SUBMIT);
    const source = await this.transaction(async (db: Executor) => {
      const found = await this.packageSource(db, actor, packageId);
      const existing = await db.query("SELECT * FROM agent_registry_submissions WHERE organization_id=$1 AND tenant_id=$2 AND package_id=$3 AND registry_provider=$4 AND status NOT IN ('FAILED','REJECTED','WITHDRAWN') ORDER BY created_at DESC LIMIT 1", [found.scope.organizationId, found.scope.tenantId, packageId, REGISTRY_PROVIDER]);
      if (existing.rows[0]) return { source: found, row: existing.rows[0], idempotent: true };
      const priorChanges = resubmissionOf ? null : (await db.query("SELECT submission_id FROM agent_registry_submissions WHERE organization_id=$1 AND tenant_id=$2 AND project_id=$3 AND status='CHANGES_REQUIRED' ORDER BY created_at DESC LIMIT 1", [found.scope.organizationId, found.scope.tenantId, found.row.project_id])).rows[0];
      const lineage = resubmissionOf || priorChanges?.submission_id || null;
      const inserted = await db.query(`INSERT INTO agent_registry_submissions (submission_id, organization_id, tenant_id, learner_id, project_id, package_id, package_version, package_hash, registry_provider, status, resubmission_of) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'SUBMITTED',$10) ON CONFLICT DO NOTHING RETURNING *`, [`registry_submission_${randomUUID()}`, found.scope.organizationId, found.scope.tenantId, found.row.learner_id, found.row.project_id, found.row.package_id, found.row.package_version, found.row.package_hash, REGISTRY_PROVIDER, lineage]);
      const row = inserted.rows[0] || (await db.query("SELECT * FROM agent_registry_submissions WHERE organization_id=$1 AND tenant_id=$2 AND package_id=$3 AND registry_provider=$4 AND status NOT IN ('FAILED','REJECTED','WITHDRAWN')", [found.scope.organizationId, found.scope.tenantId, packageId, REGISTRY_PROVIDER])).rows[0];
      await this.emit(db, "registry.submission.created", row, found.scope);
      return { source: found, row, idempotent: false };
    });
    if (source.idempotent && ["ACCEPTED", "CHANGES_REQUIRED", "REJECTED"].includes(source.row.status)) return { submission: mapRow(source.row), idempotent: true };
    return { submission: await this.deliver(source.row, actor, source.source), idempotent: source.idempotent };
  }
  async list(actor: Actor, packageId: string) { requirePermission(actor, SHS_SECURITY_PERMISSIONS.AGENT_REGISTRY_VIEW); const s = scope(actor); const result = await this.dbQuery("SELECT * FROM agent_registry_submissions WHERE package_id=$1 AND organization_id=$2 AND tenant_id=$3 AND (learner_id=$4 OR $5 = ANY($6::text[])) ORDER BY created_at DESC", [packageId, s.organizationId, s.tenantId, s.userId, SHS_SECURITY_PERMISSIONS.AGENT_REGISTRY_MANAGE, actor.permissions || []]); return result.rows.map(mapRow); }
  async get(actor: Actor, submissionId: string) { requirePermission(actor, SHS_SECURITY_PERMISSIONS.AGENT_REGISTRY_VIEW); const s = scope(actor); const result = await this.dbQuery("SELECT * FROM agent_registry_submissions WHERE submission_id=$1 AND organization_id=$2 AND tenant_id=$3 AND (learner_id=$4 OR $5 = ANY($6::text[]))", [submissionId, s.organizationId, s.tenantId, s.userId, SHS_SECURITY_PERMISSIONS.AGENT_REGISTRY_MANAGE, actor.permissions || []]); if (!result.rows[0]) throw new Error("REGISTRY_SUBMISSION_NOT_FOUND"); return mapRow(result.rows[0]); }
  async retry(actor: Actor, submissionId: string) {
    requirePermission(actor, SHS_SECURITY_PERMISSIONS.AGENT_REGISTRY_SUBMIT);
    const s = scope(actor);
    return this.transaction(async (db: Executor) => {
      await db.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`registry-retry:${submissionId}`]);
      const prior = (await db.query("SELECT * FROM agent_registry_submissions WHERE submission_id=$1 AND organization_id=$2 AND tenant_id=$3 AND (learner_id=$4 OR $5 = ANY($6::text[]))", [submissionId, s.organizationId, s.tenantId, s.userId, SHS_SECURITY_PERMISSIONS.AGENT_REGISTRY_MANAGE, actor.permissions || []])).rows[0];
      if (!prior) throw new Error("REGISTRY_SUBMISSION_NOT_FOUND");
      if (prior.status !== "FAILED") throw new Error("REGISTRY_RETRY_INVALID");
      const existingRetry = (await db.query("SELECT * FROM agent_registry_submissions WHERE resubmission_of=$1 AND organization_id=$2 AND tenant_id=$3 ORDER BY created_at ASC LIMIT 1", [submissionId, s.organizationId, s.tenantId])).rows[0];
      if (existingRetry) return { submission: mapRow(existingRetry), idempotent: true };
      return this.submit(actor, prior.package_id, submissionId);
    });
  }
}
