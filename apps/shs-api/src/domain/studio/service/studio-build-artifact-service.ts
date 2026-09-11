import { createHash, randomUUID } from "node:crypto";
import { query } from "../../../db/client.js";
import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { isAdminTier } from "../../shared/audience-eligibility.js";
import { validateStudioWorkspaceWork, workspaceFromRow } from "../model/studio-workspace.js";

type Actor = { user_id?: string; id?: string; active_organization_id?: string; organization_id?: string; tenant_id?: string; permissions?: string[]; roles?: string[] };

function scope(actor: Actor) {
  const userId = String(actor.user_id || actor.id || "");
  const organizationId = String(actor.active_organization_id || actor.organization_id || "");
  const tenantId = String(actor.tenant_id || `tenant:${organizationId}`);
  if (!userId || !organizationId || tenantId !== `tenant:${organizationId}`) throw new Error("ORG_CONTEXT_REQUIRED");
  return { userId, organizationId, tenantId };
}

function mapArtifact(row: any) {
  return {
    artifactId: row.artifact_id,
    organizationId: row.organization_id,
    tenantId: row.tenant_id,
    projectId: row.project_id,
    workspaceId: row.workspace_id,
    workspaceRevision: Number(row.workspace_revision),
    studioRevisionId: row.studio_revision_id || null,
    artifactType: row.artifact_type,
    manifest: row.manifest_json,
    contentHash: row.content_hash,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
  };
}

function hashManifest(manifest: unknown) {
  return createHash("sha256").update(JSON.stringify(manifest), "utf8").digest("hex");
}

export class BuildArtifactService {
  constructor(private dbQuery: typeof query = query) {}

  private async projectFor(dbQuery: typeof query, actor: Actor, projectId: string) {
    const s = scope(actor);
    const row = (await dbQuery("SELECT * FROM projects WHERE project_id=$1 AND studio_origin IS NOT NULL AND organization_id=$2 AND tenant_id=$3", [projectId, s.organizationId, s.tenantId])).rows[0];
    if (!row) throw new Error("PROJECT_NOT_FOUND");
    const roles = actor.roles || [];
    const teamMember = row.studio_team_id && (await dbQuery("SELECT 1 FROM studio_team_members WHERE studio_team_id=$1 AND organization_id=$2 AND tenant_id=$3 AND user_id=$4 AND status='ACTIVE' AND left_at IS NULL", [row.studio_team_id, s.organizationId, s.tenantId, s.userId])).rows[0];
    if (isAdminTier(roles) || row.studio_learner_id === s.userId || teamMember) return { scope: s, row };
    throw new Error("ARTIFACT_MATERIALIZATION_FORBIDDEN");
  }

  async materialize(actor: Actor, projectId: string, requestedRevision?: number) {
    if (!hasPermission(actor.permissions || [], SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_UPDATE)) throw new Error("studio_project_update_required");
    return this.materializeForWorkflow(actor, projectId, requestedRevision);
  }

  async materializeForWorkflow(actor: Actor, projectId: string, requestedRevision?: number) {
    const found = await this.projectFor(this.dbQuery, actor, projectId);
    const workspaceRow = (await this.dbQuery("SELECT * FROM studio_builder_workspaces WHERE project_id=$1 AND organization_id=$2 AND tenant_id=$3", [projectId, found.scope.organizationId, found.scope.tenantId])).rows[0];
    if (!workspaceRow) throw new Error("WORKSPACE_REQUIRED_FOR_ARTIFACT");
    const workspace = workspaceFromRow(workspaceRow, found.row.studio_project_type);
    const revision = requestedRevision == null ? workspace.revision : Number(requestedRevision);
    if (!Number.isInteger(revision) || revision < 1) throw new Error("ARTIFACT_REVISION_INVALID");
    const revisionRow = (await this.dbQuery("SELECT * FROM studio_project_revisions WHERE project_id=$1 AND organization_id=$2 AND tenant_id=$3 AND revision_number=$4", [projectId, found.scope.organizationId, found.scope.tenantId, revision])).rows[0];
    if (!revisionRow) throw new Error("REVISION_NOT_FOUND");
    const sourceWork = validateStudioWorkspaceWork(revisionRow.project_type, revisionRow.work_json);
    const manifest = {
      artifactVersion: 1,
      artifactType: "WORKSPACE_MATERIALIZATION",
      project: { projectId, organizationId: found.scope.organizationId, tenantId: found.scope.tenantId, projectType: found.row.studio_project_type },
      workspace: { workspaceId: workspaceRow.workspace_id, revision, revisionId: revisionRow.revision_id, work: sourceWork },
      // Materialization identity is derived only from the immutable source revision.
      // Actor and wall-clock metadata live on the persisted row, not in the hash.
      provenance: { sourceContentHash: revisionRow.content_hash, sourceCreatedAt: revisionRow.created_at },
    };
    const contentHash = hashManifest(manifest);
    const existing = (await this.dbQuery("SELECT * FROM studio_build_artifacts WHERE project_id=$1 AND organization_id=$2 AND tenant_id=$3 AND workspace_revision=$4", [projectId, found.scope.organizationId, found.scope.tenantId, revision])).rows[0];
    if (existing) {
      if (existing.content_hash !== contentHash) throw new Error("ARTIFACT_IDENTITY_CONFLICT");
      return { artifact: mapArtifact(existing), idempotent: true };
    }
    const artifactId = `studio_artifact_${randomUUID()}`;
    const inserted = await this.dbQuery(
      `INSERT INTO studio_build_artifacts (artifact_id, organization_id, tenant_id, project_id, workspace_id, workspace_revision, studio_revision_id, artifact_type, manifest_json, content_hash, created_by_user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'WORKSPACE_MATERIALIZATION',$8,$9,$10) ON CONFLICT (project_id, workspace_revision) DO NOTHING RETURNING *`,
      [artifactId, found.scope.organizationId, found.scope.tenantId, projectId, workspaceRow.workspace_id, revision, revisionRow.revision_id, JSON.stringify(manifest), contentHash, found.scope.userId],
    );
    const row = inserted.rows[0] || (await this.dbQuery("SELECT * FROM studio_build_artifacts WHERE project_id=$1 AND organization_id=$2 AND tenant_id=$3 AND workspace_revision=$4", [projectId, found.scope.organizationId, found.scope.tenantId, revision])).rows[0];
    if (!row) throw new Error("ARTIFACT_MATERIALIZATION_FAILED");
    return { artifact: mapArtifact(row), idempotent: false };
  }

  async get(actor: Actor, artifactId: string) {
    if (!hasPermission(actor.permissions || [], SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW)) throw new Error("studio_project_view_required");
    const s = scope(actor);
    const row = (await this.dbQuery("SELECT a.* FROM studio_build_artifacts a WHERE a.artifact_id=$1 AND a.organization_id=$2 AND a.tenant_id=$3", [artifactId, s.organizationId, s.tenantId])).rows[0];
    if (!row) throw new Error("ARTIFACT_NOT_FOUND");
    await this.projectFor(this.dbQuery, actor, row.project_id);
    return mapArtifact(row);
  }

  async list(actor: Actor, projectId: string) {
    if (!hasPermission(actor.permissions || [], SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW)) throw new Error("studio_project_view_required");
    const s = scope(actor);
    await this.projectFor(this.dbQuery, actor, projectId);
    const rows = (await this.dbQuery("SELECT * FROM studio_build_artifacts WHERE project_id=$1 AND organization_id=$2 AND tenant_id=$3 ORDER BY workspace_revision DESC", [projectId, s.organizationId, s.tenantId])).rows;
    return rows.map(mapArtifact);
  }
}
