import { createHash, randomUUID } from "node:crypto";
import { query } from "../../../db/client.js";
import { withTransaction } from "../../../db/transaction.js";
import { IntegrationOutboxRepo } from "../../trusted-reporting/outbox-repo.js";
import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { defaultWebsiteDeploymentProvider, type WebsiteDeploymentProvider } from "../provider/deployment-provider.js";
import { validateWebsiteDeploymentPackage, WEBSITE_DEPLOYMENT_PROVIDER, type WebsiteDeploymentPackage } from "../model/deployment-contract.js";

type Actor = { user_id?: string; id?: string; active_organization_id?: string; organization_id?: string; tenant_id?: string; permissions?: string[]; roles?: string[] };
type Executor = { query: (sql: string, params?: unknown[]) => Promise<any> };

function scope(actor: Actor) {
  const organizationId = String(actor.active_organization_id || actor.organization_id || "");
  const tenantId = String(actor.tenant_id || `tenant:${organizationId}`);
  const userId = String(actor.user_id || actor.id || "");
  if (!organizationId || tenantId !== `tenant:${organizationId}` || !userId) throw new Error("ORG_CONTEXT_REQUIRED");
  return { organizationId, tenantId, userId, permissions: actor.permissions || [] };
}

function requirePermission(actor: Actor, permission: string) {
  if (!hasPermission(actor.permissions || [], permission)) throw new Error(`${permission.replaceAll(".", "_")}_required`);
}

function mapRow(row: any) {
  return { deploymentId: row.deployment_id, organizationId: row.organization_id, tenantId: row.tenant_id, learnerId: row.learner_id, projectId: row.project_id, deliveryRecordId: row.delivery_record_id, workspaceRevision: Number(row.workspace_revision), projectType: row.project_type, providerKey: row.provider_key, target: row.target, status: row.status, providerDeploymentId: row.provider_deployment_id, liveUrl: row.live_url, isPublic: false, packageHash: row.package_hash, failureCode: row.failure_code, failureMessage: row.failure_message, requestedAt: row.requested_at, startedAt: row.started_at, deployedAt: row.deployed_at, failedAt: row.failed_at, supersededAt: row.superseded_at, unpublishedAt: row.unpublished_at };
}

function packageFromWorkspace(row: any, projectId: string, revision: number): WebsiteDeploymentPackage {
  const work = row?.work_json || {};
  const pages = Array.isArray(work.pages) ? work.pages : [];
  const files = pages.map((page: any, index: number) => ({ path: index === 0 ? "index.html" : `page-${index + 1}.html`, content: `<h1>${String(page?.title || "")}</h1>\n${String(page?.content || "")}` }));
  const normalized = JSON.stringify({ projectId, revision, work });
  const packageHash = createHash("sha256").update(normalized).digest("hex");
  return validateWebsiteDeploymentPackage({ projectType: "WEBSITE", projectId, revision, files, packageHash });
}

export class WebsiteDeploymentService {
  constructor(private dbQuery: typeof query = query, private transaction: typeof withTransaction = withTransaction, private outbox = new IntegrationOutboxRepo(), private provider: WebsiteDeploymentProvider = defaultWebsiteDeploymentProvider()) {}

  private async source(executor: Executor, actor: Actor, deliveryId: string) {
    const s = scope(actor);
    const result = await executor.query(
      `SELECT d.*, p.studio_learner_id AS learner_id, p.studio_owner_type, p.studio_team_id, p.studio_destination, w.work_json, w.revision AS current_revision
         FROM studio_delivery_records d
         JOIN projects p ON p.project_id=d.project_id AND p.organization_id=d.organization_id AND p.tenant_id=d.tenant_id
         JOIN studio_builder_workspaces w ON w.project_id=d.project_id AND w.organization_id=d.organization_id AND w.tenant_id=d.tenant_id
        WHERE d.delivery_record_id=$1 AND d.organization_id=$2 AND d.tenant_id=$3
          AND d.status='FINALIZED' AND d.project_type='WEBSITE' AND d.destination='STUDENT'
          AND p.studio_project_type='WEBSITE' AND p.studio_destination='STUDENT'
          AND w.revision=d.workspace_revision
        FOR UPDATE`, [deliveryId, s.organizationId, s.tenantId]);
    const row = result.rows[0];
    if (!row) throw new Error("DEPLOYMENT_NOT_ELIGIBLE");
    const teamMember = row.studio_owner_type === "TEAM" && row.studio_team_id && (await executor.query("SELECT 1 FROM studio_team_members WHERE studio_team_id=$1 AND organization_id=$2 AND tenant_id=$3 AND user_id=$4 AND status='ACTIVE' AND left_at IS NULL", [row.studio_team_id, s.organizationId, s.tenantId, s.userId])).rows[0];
    if (row.learner_id !== s.userId && !teamMember && !s.permissions.includes(SHS_SECURITY_PERMISSIONS.WEBSITE_DEPLOYMENT_MANAGE)) throw new Error("DEPLOYMENT_FORBIDDEN");
    return { scope: s, row, package: packageFromWorkspace(row, row.project_id, Number(row.workspace_revision)) };
  }

  private async emit(executor: Executor, type: string, row: any, s: any) {
    await this.outbox.enqueue({ producer_id: "shs-api.website-deployment", event_type: type, subject_type: "website_deployment", subject_id: row.deployment_id, organization_id: s.organizationId, originating_actor_id: s.userId, originating_actor_type: "user", tenant_id: s.tenantId, occurred_at: new Date().toISOString(), idempotency_key: `${type}:${row.deployment_id}`, correlation_id: `deployment:${row.deployment_id}`, destination: "shs-website-deployment", payload: { project_id: row.project_id, delivery_record_id: row.delivery_record_id, workspace_revision: row.workspace_revision, provider_key: row.provider_key, target: row.target } }, executor);
  }

  private async start(deployment: any, actor: Actor, source: any) {
    const s = source.scope;
    const claimed = await this.transaction(async (db: Executor) => {
      const updated = await db.query("UPDATE website_deployment_records SET status='DEPLOYING', started_at=NOW(), updated_at=NOW() WHERE deployment_id=$1 AND status IN ('REQUESTED','QUEUED') RETURNING *", [deployment.deployment_id]);
      if (updated.rows[0]) await this.emit(db, "deployment.started", updated.rows[0], s);
      return Boolean(updated.rows[0]);
    });
    if (!claimed) return this.waitForTerminal(deployment.deployment_id, s);
    try {
      const result = await this.provider.deploy(source.package);
      return this.transaction(async (db: Executor) => {
        const updated = await db.query("UPDATE website_deployment_records SET status='LIVE', provider_deployment_id=$2, live_url=NULL, deployed_at=NOW(), updated_at=NOW() WHERE deployment_id=$1 AND status='DEPLOYING' RETURNING *", [deployment.deployment_id, result.providerDeploymentId]);
        if (!updated.rows[0]) throw new Error("DEPLOYMENT_STATE_CONFLICT");
        await this.emit(db, "deployment.live", updated.rows[0], s);
        return mapRow(updated.rows[0]);
      });
    } catch (error: any) {
      await this.transaction(async (db: Executor) => {
        const updated = await db.query("UPDATE website_deployment_records SET status='FAILED', failure_code='PROVIDER_FAILED', failure_message=$2, failed_at=NOW(), updated_at=NOW() WHERE deployment_id=$1 RETURNING *", [deployment.deployment_id, String(error?.message || "provider failed").slice(0, 500)]);
        if (updated.rows[0]) await this.emit(db, "deployment.failed", updated.rows[0], s);
      });
      throw new Error("DEPLOYMENT_PROVIDER_FAILED");
    }
  }

  private async waitForTerminal(deploymentId: string, s: { organizationId: string; tenantId: string }) {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const result = await this.dbQuery("SELECT * FROM website_deployment_records WHERE deployment_id=$1 AND organization_id=$2 AND tenant_id=$3", [deploymentId, s.organizationId, s.tenantId]);
      const row = result.rows[0];
      if (!row) throw new Error("DEPLOYMENT_NOT_FOUND");
      if (!["REQUESTED", "QUEUED", "DEPLOYING"].includes(row.status)) return mapRow(row);
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    throw new Error("DEPLOYMENT_IN_PROGRESS");
  }

  async requestFromStudioDelivery(actor: Actor, input: any) {
    requirePermission(actor, SHS_SECURITY_PERMISSIONS.WEBSITE_DEPLOYMENT_CREATE);
    if (!input || typeof input !== "object" || Object.keys(input).some((key) => key !== "deliveryId")) throw new Error("DEPLOYMENT_FIELD_NOT_ALLOWED");
    const deliveryId = String(input.deliveryId || "").trim();
    if (!deliveryId) throw new Error("DEPLOYMENT_DELIVERY_REQUIRED");
    const source = await this.transaction(async (db: Executor) => {
      const found = await this.source(db, actor, deliveryId);
      const existing = await db.query(`SELECT * FROM website_deployment_records WHERE organization_id=$1 AND tenant_id=$2 AND project_id=$3 AND delivery_record_id=$4 AND workspace_revision=$5 AND provider_key=$6 AND target='TEST' AND status NOT IN ('FAILED','SUPERSEDED','UNPUBLISHED') ORDER BY created_at DESC LIMIT 1`, [found.scope.organizationId, found.scope.tenantId, found.row.project_id, deliveryId, found.row.workspace_revision, WEBSITE_DEPLOYMENT_PROVIDER]);
      if (existing.rows[0]) return { found, deployment: existing.rows[0], idempotent: true };
      const inserted = await db.query(`INSERT INTO website_deployment_records (deployment_id, organization_id, tenant_id, learner_id, project_id, delivery_record_id, workspace_revision, project_type, provider_key, target, status, package_hash) VALUES ($1,$2,$3,$4,$5,$6,$7,'WEBSITE',$8,'TEST','REQUESTED',$9) ON CONFLICT DO NOTHING RETURNING *`, [`deployment_${randomUUID()}`, found.scope.organizationId, found.scope.tenantId, found.row.learner_id, found.row.project_id, deliveryId, found.row.workspace_revision, WEBSITE_DEPLOYMENT_PROVIDER, found.package.packageHash]);
      if (!inserted.rows[0]) return { found, deployment: (await db.query(`SELECT * FROM website_deployment_records WHERE organization_id=$1 AND tenant_id=$2 AND delivery_record_id=$3 AND status NOT IN ('FAILED','SUPERSEDED','UNPUBLISHED')`, [found.scope.organizationId, found.scope.tenantId, deliveryId])).rows[0], idempotent: true };
      await this.emit(db, "deployment.requested", inserted.rows[0], found.scope);
      return { found, deployment: inserted.rows[0], idempotent: false };
    });
    if (source.idempotent && source.deployment.status === "LIVE") return { deployment: mapRow(source.deployment), idempotent: true };
    return { deployment: await this.start(source.deployment, actor, source.found), idempotent: source.idempotent };
  }

  async get(actor: Actor, deploymentId: string) {
    requirePermission(actor, SHS_SECURITY_PERMISSIONS.WEBSITE_DEPLOYMENT_VIEW);
    const s = scope(actor);
    const result = await this.dbQuery("SELECT * FROM website_deployment_records WHERE deployment_id=$1 AND organization_id=$2 AND tenant_id=$3 AND (learner_id=$4 OR $5 = ANY($6::text[]))", [deploymentId, s.organizationId, s.tenantId, s.userId, SHS_SECURITY_PERMISSIONS.WEBSITE_DEPLOYMENT_MANAGE, actor.permissions || []]);
    if (!result.rows[0]) throw new Error("DEPLOYMENT_NOT_FOUND");
    return mapRow(result.rows[0]);
  }

  async listForProject(actor: Actor, projectId: string) {
    requirePermission(actor, SHS_SECURITY_PERMISSIONS.WEBSITE_DEPLOYMENT_VIEW);
    const s = scope(actor);
    const result = await this.dbQuery("SELECT * FROM website_deployment_records WHERE project_id=$1 AND organization_id=$2 AND tenant_id=$3 AND (learner_id=$4 OR $5 = ANY($6::text[])) ORDER BY created_at DESC", [projectId, s.organizationId, s.tenantId, s.userId, SHS_SECURITY_PERMISSIONS.WEBSITE_DEPLOYMENT_MANAGE, actor.permissions || []]);
    return result.rows.map(mapRow);
  }

  async retry(actor: Actor, deploymentId: string) {
    requirePermission(actor, SHS_SECURITY_PERMISSIONS.WEBSITE_DEPLOYMENT_CREATE);
    const s = scope(actor);
    const prior = (await this.dbQuery("SELECT * FROM website_deployment_records WHERE deployment_id=$1 AND organization_id=$2 AND tenant_id=$3", [deploymentId, s.organizationId, s.tenantId])).rows[0];
    if (!prior) throw new Error("DEPLOYMENT_NOT_FOUND");
    if (prior.status !== "FAILED") throw new Error("DEPLOYMENT_RETRY_INVALID");
    return this.requestFromStudioDelivery(actor, { deliveryId: prior.delivery_record_id });
  }
}
