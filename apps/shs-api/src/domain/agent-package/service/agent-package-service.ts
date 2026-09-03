import { randomUUID } from "node:crypto";
import { query } from "../../../db/client.js";
import { withTransaction } from "../../../db/transaction.js";
import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { IntegrationOutboxRepo } from "../../trusted-reporting/outbox-repo.js";
import { canonicalPackageContent, normalizeAgentWork, packageHash, registryReadiness, validateAgentPackageDefinition, AGENT_PACKAGE_SCHEMA_VERSION, AGENT_PACKAGE_STANDARD_VERSION } from "../model/agent-package-contract.js";

type Actor = { user_id?: string; id?: string; active_organization_id?: string; organization_id?: string; tenant_id?: string; permissions?: string[] };
type Executor = { query: (sql: string, params?: unknown[]) => Promise<any> };

function scope(actor: Actor) {
  const userId = String(actor.user_id || actor.id || "");
  const organizationId = String(actor.active_organization_id || actor.organization_id || "");
  const tenantId = String(actor.tenant_id || `tenant:${organizationId}`);
  if (!userId || !organizationId || tenantId !== `tenant:${organizationId}`) throw new Error("ORG_CONTEXT_REQUIRED");
  return { userId, organizationId, tenantId };
}
function requirePermission(actor: Actor, permission: string) { if (!hasPermission(actor.permissions || [], permission)) throw new Error(`${permission.replaceAll(".", "_")}_required`); }
function canManage(actor: Actor) { return hasPermission(actor.permissions || [], SHS_SECURITY_PERMISSIONS.AGENT_PACKAGE_MANAGE); }
function mapRow(row: any) {
  const status = row.validation_status;
  return { packageId: row.package_id, organizationId: row.organization_id, tenantId: row.tenant_id, learnerId: row.learner_id, projectId: row.project_id, deliveryRecordId: row.delivery_record_id, workspaceRevision: Number(row.workspace_revision), projectType: row.project_type, packageVersion: Number(row.package_version), standardVersion: row.standard_version, schemaVersion: row.schema_version, definition: row.package_json?.definition, provenance: row.package_json?.provenance, packageHash: row.package_hash, validation: row.validation_results, status, registryReadiness: registryReadiness(status), createdAt: row.created_at, updatedAt: row.updated_at };
}

export class AgentPackageService {
  constructor(private dbQuery: typeof query = query, private transaction: typeof withTransaction = withTransaction, private outbox = new IntegrationOutboxRepo()) {}

  private async source(executor: Executor, actor: Actor, projectId: string) {
    const s = scope(actor);
    const result = await executor.query(`SELECT p.project_id, p.studio_learner_id AS learner_id, p.studio_owner_type, p.studio_team_id, p.organization_id, p.tenant_id, p.studio_project_type AS project_type, d.delivery_record_id, d.workspace_revision, d.finalized_at, w.work_json
      FROM projects p JOIN studio_delivery_records d ON d.project_id=p.project_id AND d.organization_id=p.organization_id AND d.tenant_id=p.tenant_id
      JOIN studio_builder_workspaces w ON w.project_id=p.project_id AND w.organization_id=p.organization_id AND w.tenant_id=p.tenant_id AND w.revision=d.workspace_revision
      WHERE p.project_id=$1 AND p.organization_id=$2 AND p.tenant_id=$3 AND p.studio_project_type='AI_AGENT' AND p.studio_destination='STUDENT' AND d.project_type='AI_AGENT' AND d.destination='STUDENT' AND d.status='FINALIZED' FOR UPDATE`, [projectId, s.organizationId, s.tenantId]);
    const row = result.rows[0];
    if (!row) throw new Error("AGENT_PACKAGE_NOT_ELIGIBLE");
    const teamMember = row.studio_owner_type === "TEAM" && row.studio_team_id && (await executor.query("SELECT 1 FROM studio_team_members WHERE studio_team_id=$1 AND organization_id=$2 AND tenant_id=$3 AND user_id=$4 AND status='ACTIVE' AND left_at IS NULL", [row.studio_team_id, s.organizationId, s.tenantId, s.userId])).rows[0];
    if (row.learner_id !== s.userId && !teamMember && !canManage(actor)) throw new Error("AGENT_PACKAGE_FORBIDDEN");
    return { scope: s, row };
  }

  private async emit(executor: Executor, type: string, row: any, s: any) {
    await this.outbox.enqueue({ producer_id: "shs-api.agent-package", event_type: type, subject_type: "studio_agent_package", subject_id: row.package_id, organization_id: s.organizationId, originating_actor_id: s.userId, originating_actor_type: "user", tenant_id: s.tenantId, occurred_at: new Date().toISOString(), idempotency_key: `${type}:${row.package_id}`, correlation_id: `agent-package:${row.package_id}`, destination: "shs-agent-package", payload: { project_id: row.project_id, delivery_record_id: row.delivery_record_id, workspace_revision: row.workspace_revision, package_hash: row.package_hash, validation_status: row.validation_status } }, executor);
  }

  async generate(actor: Actor, projectId: string) {
    requirePermission(actor, SHS_SECURITY_PERMISSIONS.AGENT_PACKAGE_CREATE);
    const source = await this.transaction(async (db: Executor) => {
      const found = await this.source(db, actor, projectId);
      const definition = normalizeAgentWork(found.row.work_json);
      const provenance = { projectId: found.row.project_id, deliveryRecordId: found.row.delivery_record_id, workspaceRevision: Number(found.row.workspace_revision), projectType: "AI_AGENT" as const, learnerId: found.row.learner_id, organizationId: found.row.organization_id, tenantId: found.row.tenant_id, finalizedAt: found.row.finalized_at };
      const content = canonicalPackageContent(provenance, definition);
      const validation = validateAgentPackageDefinition(definition);
      const hash = packageHash(content);
      const existing = await db.query("SELECT * FROM studio_agent_packages WHERE organization_id=$1 AND tenant_id=$2 AND project_id=$3 AND delivery_record_id=$4 AND workspace_revision=$5 AND standard_version=$6", [found.scope.organizationId, found.scope.tenantId, found.row.project_id, found.row.delivery_record_id, found.row.workspace_revision, AGENT_PACKAGE_STANDARD_VERSION]);
      if (existing.rows[0]) return { row: existing.rows[0], idempotent: true };
      const inserted = await db.query(`INSERT INTO studio_agent_packages (package_id, organization_id, tenant_id, learner_id, project_id, delivery_record_id, workspace_revision, project_type, package_version, standard_version, schema_version, package_json, package_hash, validation_status, validation_results) VALUES ($1,$2,$3,$4,$5,$6,$7,'AI_AGENT',$8,$9,$10,$11,$12,$13,$14) ON CONFLICT DO NOTHING RETURNING *`, [`agent_package_${randomUUID()}`, found.scope.organizationId, found.scope.tenantId, found.row.learner_id, found.row.project_id, found.row.delivery_record_id, found.row.workspace_revision, found.row.workspace_revision, AGENT_PACKAGE_STANDARD_VERSION, AGENT_PACKAGE_SCHEMA_VERSION, JSON.stringify(content), hash, validation.status, JSON.stringify(validation)]);
      const row = inserted.rows[0] || (await db.query("SELECT * FROM studio_agent_packages WHERE organization_id=$1 AND tenant_id=$2 AND project_id=$3 AND delivery_record_id=$4 AND workspace_revision=$5 AND standard_version=$6", [found.scope.organizationId, found.scope.tenantId, found.row.project_id, found.row.delivery_record_id, found.row.workspace_revision, AGENT_PACKAGE_STANDARD_VERSION])).rows[0];
      await this.emit(db, "agent.package.created", row, found.scope);
      await this.emit(db, validation.status === "VALID" ? "agent.package.validation_passed" : "agent.package.validation_failed", row, found.scope);
      return { row, idempotent: false };
    });
    return { package: mapRow(source.row), idempotent: source.idempotent };
  }

  async list(actor: Actor, projectId: string) {
    requirePermission(actor, SHS_SECURITY_PERMISSIONS.AGENT_PACKAGE_VIEW);
    const s = scope(actor);
    const result = await this.dbQuery("SELECT * FROM studio_agent_packages WHERE project_id=$1 AND organization_id=$2 AND tenant_id=$3 AND (learner_id=$4 OR $5 = ANY($6::text[])) ORDER BY workspace_revision DESC, created_at DESC", [projectId, s.organizationId, s.tenantId, s.userId, SHS_SECURITY_PERMISSIONS.AGENT_PACKAGE_MANAGE, actor.permissions || []]);
    return result.rows.map(mapRow);
  }

  async get(actor: Actor, packageId: string) {
    requirePermission(actor, SHS_SECURITY_PERMISSIONS.AGENT_PACKAGE_VIEW);
    const s = scope(actor);
    const result = await this.dbQuery("SELECT * FROM studio_agent_packages WHERE package_id=$1 AND organization_id=$2 AND tenant_id=$3 AND (learner_id=$4 OR $5 = ANY($6::text[]))", [packageId, s.organizationId, s.tenantId, s.userId, SHS_SECURITY_PERMISSIONS.AGENT_PACKAGE_MANAGE, actor.permissions || []]);
    if (!result.rows[0]) throw new Error("AGENT_PACKAGE_NOT_FOUND");
    return mapRow(result.rows[0]);
  }
}
