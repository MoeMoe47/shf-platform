import { randomUUID } from "node:crypto";
import { query } from "../../../db/client.js";
import { withTransaction } from "../../../db/transaction.js";
import { IntegrationOutboxRepo } from "../../trusted-reporting/outbox-repo.js";
import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { isAdminTier } from "../../shared/audience-eligibility.js";
import {
  assertEligibleEvidenceSource,
  assertPortfolioScope,
  buildImmutableProvenance,
  buildPortfolioArtifactDraft,
  portfolioArtifactCanBeRemoved,
  type PortfolioArtifactStatus,
  type PortfolioVisibility,
} from "../model/portfolio-contract.js";

type Executor = { query: (sql: string, params?: unknown[]) => Promise<any> };
type Actor = { user_id?: string; id?: string; active_organization_id?: string; organization_id?: string; tenant_id?: string; roles?: string[]; permissions?: string[] };

const PRESENTATION_FIELDS = ["title", "summary", "reflection", "thumbnailRef", "collectionKey", "position", "visibility"] as const;
const LIFECYCLE_STATUSES = ["ACTIVE", "HIDDEN", "ARCHIVED", "REMOVED"] as const;

function scope(actor: Actor) {
  const learnerId = String(actor.user_id || actor.id || "");
  const organizationId = String(actor.active_organization_id || actor.organization_id || "");
  const tenantId = String(actor.tenant_id || `tenant:${organizationId}`);
  return assertPortfolioScope({ learnerId, organizationId, tenantId });
}

function requirePermission(actor: Actor, permission: string) {
  if (!hasPermission(actor.permissions || [], permission)) throw new Error(`${permission.replaceAll(".", "_")}_required`);
}

function rejectUnknown(input: Record<string, unknown>, allowed: readonly string[]) {
  const unknown = Object.keys(input).find((key) => !allowed.includes(key));
  if (unknown) throw new Error(`PORTFOLIO_FIELD_NOT_ALLOWED:${unknown}`);
}

function artifactFromRow(row: any) {
  return {
    artifactId: row.artifact_id,
    portfolioId: row.portfolio_id,
    learnerId: row.learner_id,
    organizationId: row.organization_id,
    tenantId: row.tenant_id,
    status: row.status,
    provenance: {
      sourceType: row.source_type,
      evidenceId: row.evidence_id,
      learnerId: row.learner_id,
      organizationId: row.organization_id,
      tenantId: row.tenant_id,
      studioProjectId: row.studio_project_id,
      studioDeliveryId: row.studio_delivery_id,
      workspaceRevision: Number(row.workspace_revision),
      projectType: row.project_type,
      finalizedAt: row.finalized_at,
      assignmentId: row.assignment_id,
      curriculumReleaseId: row.curriculum_release_id,
      competencyIds: Array.isArray(row.competency_ids) ? row.competency_ids : [],
    },
    presentation: {
      title: row.display_title,
      summary: row.summary,
      reflection: row.reflection,
      thumbnailRef: row.thumbnail_reference,
      collectionKey: row.collection_key,
      position: row.position,
      visibility: row.visibility,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function presentationInput(input: any) {
  const result: any = {};
  if (input.title !== undefined) result.title = input.title;
  if (input.summary !== undefined) result.summary = input.summary;
  if (input.reflection !== undefined) result.reflection = input.reflection;
  if (input.thumbnailRef !== undefined) result.thumbnailRef = input.thumbnailRef;
  if (input.collectionKey !== undefined) result.collectionKey = input.collectionKey;
  if (input.position !== undefined) result.position = input.position;
  if (input.visibility !== undefined) result.visibility = input.visibility;
  return result;
}

function validatePresentationSafety(input: any) {
  if (input.thumbnailRef == null || input.thumbnailRef === "") return;
  const value = String(input.thumbnailRef).trim().toLowerCase();
  if (/^(javascript|vbscript):/.test(value) || /^data:text\/html/.test(value)) {
    throw new Error("PORTFOLIO_THUMBNAIL_REFERENCE_UNSAFE");
  }
}

export class PortfolioService {
  constructor(
    private dbQuery: typeof query = query,
    private transaction: typeof withTransaction = withTransaction,
    private outbox = new IntegrationOutboxRepo(),
  ) {}

  private async eligibleSource(executor: Executor, evidenceId: string, expected: ReturnType<typeof scope>) {
    const result = await executor.query(
      `SELECT e.evidence_id, e.source_type, e.status AS evidence_status,
              e.user_id AS learner_id, e.organization_id, e.tenant_id,
              e.source_record_id AS studio_delivery_id, e.competency_id,
              e.assignment_id, e.curriculum_release_id,
              d.project_id AS studio_project_id, d.workspace_revision,
              d.project_type, d.destination, d.finalized_at,
              p.studio_learner_id, p.studio_destination
         FROM prepare_prove_evidence e
         JOIN studio_delivery_records d
           ON d.delivery_record_id=e.source_record_id
          AND d.organization_id=e.organization_id
          AND d.tenant_id=e.tenant_id
         JOIN projects p
           ON p.project_id=d.project_id
          AND p.organization_id=d.organization_id
          AND p.tenant_id=d.tenant_id
        WHERE e.evidence_id=$1
          AND e.source_type='STUDIO_DELIVERY'
          AND e.organization_id=$2 AND e.tenant_id=$3 AND e.user_id=$4
          AND e.status <> 'SUPERSEDED'
          AND d.status='FINALIZED' AND d.destination='STUDENT'
          AND p.studio_destination='STUDENT'
          AND p.studio_learner_id=e.user_id
          AND e.user_id=p.studio_learner_id
        FOR UPDATE OF e, d, p`,
      [evidenceId, expected.organizationId, expected.tenantId, expected.learnerId],
    );
    const row = result.rows[0];
    if (!row) throw new Error("PORTFOLIO_SOURCE_NOT_ELIGIBLE");
    const source = {
      sourceType: "STUDIO_EVIDENCE" as const,
      evidenceId: row.evidence_id,
      evidenceStatus: row.evidence_status,
      portfolioEligible: true,
      learnerId: row.learner_id,
      organizationId: row.organization_id,
      tenantId: row.tenant_id,
      studioProjectId: row.studio_project_id,
      studioDeliveryId: row.studio_delivery_id,
      workspaceRevision: Number(row.workspace_revision),
      projectType: row.project_type,
      finalizedAt: row.finalized_at,
      assignmentId: row.assignment_id,
      curriculumReleaseId: row.curriculum_release_id,
      competencyIds: row.competency_id ? [row.competency_id] : [],
    } as const;
    assertEligibleEvidenceSource(source, expected);
    return source;
  }

  private async getOrCreateProfile(executor: Executor, expected: ReturnType<typeof scope>) {
    const existing = await executor.query(
      `SELECT * FROM portfolio_profiles WHERE organization_id=$1 AND tenant_id=$2 AND learner_id=$3 AND status='ACTIVE' FOR UPDATE`,
      [expected.organizationId, expected.tenantId, expected.learnerId],
    );
    if (existing.rows[0]) return existing.rows[0];
    const inserted = await executor.query(
      `INSERT INTO portfolio_profiles (portfolio_id, organization_id, tenant_id, learner_id)
       VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING RETURNING *`,
      [`portfolio_${randomUUID()}`, expected.organizationId, expected.tenantId, expected.learnerId],
    );
    if (inserted.rows[0]) return inserted.rows[0];
    const retry = await executor.query(
      `SELECT * FROM portfolio_profiles WHERE organization_id=$1 AND tenant_id=$2 AND learner_id=$3 AND status='ACTIVE' FOR UPDATE`,
      [expected.organizationId, expected.tenantId, expected.learnerId],
    );
    if (!retry.rows[0]) throw new Error("PORTFOLIO_CREATE_CONFLICT");
    return retry.rows[0];
  }

  private async emit(executor: Executor, eventType: string, subjectType: string, subjectId: string, expected: ReturnType<typeof scope>, payload: Record<string, unknown>) {
    await this.outbox.enqueue({
      producer_id: "shs-api.portfolio",
      event_type: eventType,
      subject_type: subjectType,
      subject_id: subjectId,
      organization_id: expected.organizationId,
      originating_actor_id: expected.learnerId,
      originating_actor_type: "user",
      tenant_id: expected.tenantId,
      occurred_at: new Date().toISOString(),
      idempotency_key: `${eventType}:${subjectId}`,
      correlation_id: `portfolio:${subjectId}`,
      destination: "shs-portfolio",
      payload,
    }, executor);
  }

  async createFromEvidence(actor: Actor, input: any) {
    requirePermission(actor, SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_UPDATE);
    const expected = scope(actor);
    const body = input || {};
    rejectUnknown(body, ["evidenceId", ...PRESENTATION_FIELDS]);
    validatePresentationSafety(body);
    const evidenceId = String(body.evidenceId || "").trim();
    if (!evidenceId) throw new Error("PORTFOLIO_EVIDENCE_REQUIRED");
    return this.transaction(async (executor) => {
      const source = await this.eligibleSource(executor, evidenceId, expected);
      const portfolio = await this.getOrCreateProfile(executor, expected);
      const draft = buildPortfolioArtifactDraft({
        portfolioId: portfolio.portfolio_id,
        source,
        presentation: presentationInput(body),
      }, expected);
      const existing = await executor.query(
        `SELECT * FROM portfolio_artifacts WHERE portfolio_id=$1 AND source_type='STUDIO_EVIDENCE' AND evidence_id=$2 AND status <> 'REMOVED'`,
        [portfolio.portfolio_id, source.evidenceId],
      );
      if (existing.rows[0]) return { portfolio: portfolioFromRow(portfolio), artifact: artifactFromRow(existing.rows[0]), idempotent: true };
      const inserted = await executor.query(
        `INSERT INTO portfolio_artifacts (
          artifact_id, portfolio_id, organization_id, tenant_id, learner_id,
          source_type, evidence_id, studio_project_id, studio_delivery_id,
          workspace_revision, project_type, assignment_id, curriculum_release_id,
          competency_ids, finalized_at, display_title, summary, reflection,
          thumbnail_reference, collection_key, position, visibility
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
        ON CONFLICT (portfolio_id, source_type, evidence_id) WHERE status <> 'REMOVED'
        DO NOTHING RETURNING *`,
        [
          `artifact_${randomUUID()}`, portfolio.portfolio_id, draft.organizationId, draft.tenantId, draft.learnerId,
          draft.provenance.sourceType, draft.provenance.evidenceId, draft.provenance.studioProjectId, draft.provenance.studioDeliveryId,
          draft.provenance.workspaceRevision, draft.provenance.projectType, draft.provenance.assignmentId, draft.provenance.curriculumReleaseId,
          JSON.stringify(draft.provenance.competencyIds), draft.provenance.finalizedAt, draft.presentation.title, draft.presentation.summary,
          draft.presentation.reflection, draft.presentation.thumbnailRef, draft.presentation.collectionKey, draft.presentation.position, draft.presentation.visibility,
        ],
      );
      if (!inserted.rows[0]) {
        const retry = await executor.query(`SELECT * FROM portfolio_artifacts WHERE portfolio_id=$1 AND source_type='STUDIO_EVIDENCE' AND evidence_id=$2 AND status <> 'REMOVED'`, [portfolio.portfolio_id, source.evidenceId]);
        if (!retry.rows[0]) throw new Error("PORTFOLIO_ARTIFACT_CREATE_CONFLICT");
        return { portfolio: portfolioFromRow(portfolio), artifact: artifactFromRow(retry.rows[0]), idempotent: true };
      }
      await this.emit(executor, "portfolio.created", "portfolio", portfolio.portfolio_id, expected, { learner_id: expected.learnerId });
      await this.emit(executor, "portfolio.artifact.created", "portfolio_artifact", inserted.rows[0].artifact_id, expected, { evidence_id: source.evidenceId, studio_delivery_id: source.studioDeliveryId, workspace_revision: source.workspaceRevision });
      return { portfolio: portfolioFromRow(portfolio), artifact: artifactFromRow(inserted.rows[0]), idempotent: false };
    });
  }

  async getPortfolio(actor: Actor) {
    requirePermission(actor, SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW);
    const expected = scope(actor);
    const result = await this.dbQuery(`SELECT * FROM portfolio_profiles WHERE organization_id=$1 AND tenant_id=$2 AND learner_id=$3 AND status='ACTIVE'`, [expected.organizationId, expected.tenantId, expected.learnerId]);
    if (!result.rows[0]) return { portfolio: null, artifacts: [] };
    const artifacts = await this.dbQuery(`SELECT * FROM portfolio_artifacts WHERE portfolio_id=$1 AND status <> 'REMOVED' ORDER BY position ASC, created_at ASC`, [result.rows[0].portfolio_id]);
    return { portfolio: portfolioFromRow(result.rows[0]), artifacts: artifacts.rows.map(artifactFromRow) };
  }

  async listArtifacts(actor: Actor) {
    return (await this.getPortfolio(actor)).artifacts;
  }

  async findArtifactsForEvidence(actor: Actor, evidenceIds: string[]) {
    requirePermission(actor, SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW);
    const expected = scope(actor);
    const ids = evidenceIds.map((value) => String(value || "").trim()).filter(Boolean);
    if (!ids.length) return new Map<string, ReturnType<typeof artifactFromRow>>();
    const result = await this.dbQuery(
      `SELECT * FROM portfolio_artifacts
       WHERE evidence_id = ANY($1::text[])
         AND organization_id=$2 AND tenant_id=$3 AND learner_id=$4
         AND status <> 'REMOVED'`,
      [ids, expected.organizationId, expected.tenantId, expected.learnerId],
    );
    return new Map(result.rows.map((row: any) => [row.evidence_id, artifactFromRow(row)]));
  }

  private async getArtifactRow(actor: Actor, artifactId: string, executor: Executor = { query: this.dbQuery }) {
    const expected = scope(actor);
    const result = await executor.query(
      `SELECT a.* FROM portfolio_artifacts a
       WHERE a.artifact_id=$1 AND a.organization_id=$2 AND a.tenant_id=$3
         AND (a.learner_id=$4 OR (a.visibility='ORGANIZATION' AND a.status <> 'REMOVED' AND $5))`,
      [artifactId, expected.organizationId, expected.tenantId, expected.learnerId, hasPermission(actor.permissions || [], SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW)],
    );
    if (!result.rows[0]) throw new Error("PORTFOLIO_ARTIFACT_NOT_FOUND");
    return { expected, row: result.rows[0] };
  }

  async getArtifact(actor: Actor, artifactId: string) {
    requirePermission(actor, SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW);
    return artifactFromRow((await this.getArtifactRow(actor, artifactId)).row);
  }

  async updateArtifact(actor: Actor, artifactId: string, input: any) {
    requirePermission(actor, SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_UPDATE);
    const body = input || {};
    rejectUnknown(body, [...PRESENTATION_FIELDS, "status"]);
    return this.transaction(async (executor) => {
      const found = await this.getArtifactRow(actor, artifactId, executor);
      if (found.row.learner_id !== found.expected.learnerId) throw new Error("PORTFOLIO_ARTIFACT_UPDATE_FORBIDDEN");
      const changes = presentationInput(body);
      validatePresentationSafety(changes);
      let status = found.row.status as PortfolioArtifactStatus;
      if (status === "REMOVED") throw new Error("PORTFOLIO_STATUS_TRANSITION_INVALID");
      if (body.status !== undefined) {
        if (!LIFECYCLE_STATUSES.includes(body.status)) throw new Error("PORTFOLIO_STATUS_NOT_SUPPORTED");
        if (body.status === "REMOVED" && !portfolioArtifactCanBeRemoved(status)) throw new Error("PORTFOLIO_STATUS_TRANSITION_INVALID");
        status = body.status;
      }
      const provenance = {
        sourceType: found.row.source_type, evidenceId: found.row.evidence_id, evidenceStatus: found.row.evidence_status || "REVIEWABLE", portfolioEligible: true,
        learnerId: found.row.learner_id, organizationId: found.row.organization_id, tenantId: found.row.tenant_id,
        studioProjectId: found.row.studio_project_id, studioDeliveryId: found.row.studio_delivery_id, workspaceRevision: Number(found.row.workspace_revision), projectType: found.row.project_type, finalizedAt: found.row.finalized_at,
        assignmentId: found.row.assignment_id, curriculumReleaseId: found.row.curriculum_release_id, competencyIds: found.row.competency_ids || [],
      } as const;
      const draft = buildPortfolioArtifactDraft({ portfolioId: found.row.portfolio_id, source: provenance, presentation: { title: found.row.display_title, summary: found.row.summary, reflection: found.row.reflection, thumbnailRef: found.row.thumbnail_reference, collectionKey: found.row.collection_key, position: found.row.position, visibility: found.row.visibility, ...changes } }, found.expected);
      const updated = await executor.query(
        `UPDATE portfolio_artifacts SET display_title=$2, summary=$3, reflection=$4, thumbnail_reference=$5, collection_key=$6, position=$7, visibility=$8, status=$9,
          archived_at=CASE WHEN $9='ARCHIVED' THEN COALESCE(archived_at,NOW()) ELSE archived_at END,
          removed_at=CASE WHEN $9='REMOVED' THEN COALESCE(removed_at,NOW()) ELSE removed_at END, updated_at=NOW()
         WHERE artifact_id=$1 AND learner_id=$10 AND organization_id=$11 AND tenant_id=$12 RETURNING *`,
        [artifactId, draft.presentation.title, draft.presentation.summary, draft.presentation.reflection, draft.presentation.thumbnailRef, draft.presentation.collectionKey, draft.presentation.position, draft.presentation.visibility, status, found.expected.learnerId, found.expected.organizationId, found.expected.tenantId],
      );
      if (!updated.rows[0]) throw new Error("PORTFOLIO_ARTIFACT_UPDATE_FORBIDDEN");
      const eventType = body.visibility !== undefined && Object.keys(changes).length === 1 ? "portfolio.artifact.visibility_changed" : (status !== found.row.status ? "portfolio.artifact.archived" : "portfolio.artifact.updated");
      await this.emit(executor, eventType, "portfolio_artifact", artifactId, found.expected, { status, visibility: draft.presentation.visibility });
      return artifactFromRow(updated.rows[0]);
    });
  }
}

function portfolioFromRow(row: any) {
  return { portfolioId: row.portfolio_id, learnerId: row.learner_id, organizationId: row.organization_id, tenantId: row.tenant_id, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at };
}
