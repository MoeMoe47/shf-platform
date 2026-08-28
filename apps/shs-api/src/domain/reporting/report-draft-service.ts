import { randomUUID } from "crypto";
import { withTransaction } from "../../db/transaction";
import { writeAuditEvent } from "../audit/service/audit-helper";
import { ReportDraftRepo } from "./report-draft-repo";
import { IntegrationOutboxRepo } from "../trusted-reporting/outbox-repo";
import { buildReportCreatedOutboxEvent } from "../trusted-reporting/outbox";

function scopeFromActor(actor: any) {
  const actorId = actor?.user_id || actor?.id;
  const organizationId = actor?.organization_id;
  if (!actorId || !organizationId) throw new Error("Trusted report scope unavailable");
  return {
    actor_id: actorId,
    organization_id: organizationId,
    tenant_id: actor?.tenant_id || actor?.tenant || "shs",
  };
}

function draftInput(input: any, scope: any) {
  const reportType = String(input?.reportType || "generic-shs-report").trim();
  const subjectType = String(input?.subjectType || "shs-internal").trim();
  const subjectName = String(input?.subjectName || "Missing").trim();
  if (!reportType || !subjectType || !subjectName) throw new Error("Report draft fields are required");
  return {
    report_id: `report_${randomUUID()}`,
    tenant_id: scope.tenant_id,
    organization_id: scope.organization_id,
    actor_id: scope.actor_id,
    report_type: reportType,
    report_title: String(input?.title || reportType),
    subject_type: subjectType,
    subject_name: subjectName,
    brand_mode: String(input?.brandMode || "shs-premium"),
    visibility: String(input?.visibility || "internal-only"),
    draft_config: {
      readiness: input?.readiness || null,
      exportMetadata: input?.exportMetadata || { exportFormat: "pdf", exportLocked: false },
    },
  };
}

export class ReportDraftService {
  constructor(
    private repo = new ReportDraftRepo(),
    private transaction = withTransaction,
    private auditWriter = writeAuditEvent,
    private outbox = new IntegrationOutboxRepo(),
  ) {}

  async createDraft(input: any, actor: any) {
    const scope = scopeFromActor(actor);
    const normalized = draftInput(input, scope);
    const correlationId = `corr_${randomUUID()}`;
    return this.transaction(async (db: any) => {
      const created = await this.repo.createDraft(normalized, db);
      const revisionId = `revision_${randomUUID()}`;
      await this.repo.createRevision(created, scope.actor_id, revisionId, db);
      await this.auditWriter({
        audit_event_id: `audit_${randomUUID()}`,
        organization_id: scope.organization_id,
        actor_user_id: scope.actor_id,
        target_object_type: "report_draft",
        target_object_id: created.report_id,
        action_type: "report_draft.created",
        new_state_json: { report_id: created.report_id, version: created.version, lifecycle_status: created.lifecycle_status },
        reason_text: "Report draft created",
        correlation_id: correlationId,
        source_channel: "shs-api",
      }, db);
      await this.outbox.enqueue(buildReportCreatedOutboxEvent({
        ...created,
        tenant_id: scope.tenant_id,
        organization_id: scope.organization_id,
        created_by_user_id: scope.actor_id,
      }, revisionId, correlationId), db);
      return created;
    });
  }

  async getDraft(reportId: string, actor: any) {
    return this.repo.getDraft(reportId, scopeFromActor(actor));
  }

  async listDrafts(actor: any) {
    return this.repo.listDrafts(scopeFromActor(actor));
  }

  async listRevisions(reportId: string, actor: any) {
    return this.repo.listRevisions(reportId, scopeFromActor(actor));
  }

  async updateDraft(reportId: string, input: any, actor: any, expectedVersion: number) {
    const scope = scopeFromActor(actor);
    if (!Number.isInteger(expectedVersion) || expectedVersion < 1) throw new Error("Expected draft version is required");
    const requestedLifecycle = input?.lifecycle_status || input?.lifecycleStatus;
    if (requestedLifecycle && requestedLifecycle !== "draft") throw new Error("Unsupported lifecycle status");
    return this.transaction(async (db: any) => {
      const current = await this.repo.getDraft(reportId, scope, db);
      if (!current) throw new Error("Report draft not found");
      if (Number(current.version) !== expectedVersion) throw new Error("Report draft version conflict");
      const updated = await this.repo.updateDraft(reportId, scope, {
        subject_type: String(input?.subjectType || "shs-internal"),
        subject_name: String(input?.subjectName || "Missing"),
        brand_mode: String(input?.brandMode || "shs-premium"),
        visibility: String(input?.visibility || "internal-only"),
        draft_config: { readiness: input?.readiness || null, exportMetadata: input?.exportMetadata || {} },
      }, expectedVersion, db);
      if (!updated) throw new Error("Report draft not found, not editable, or version conflict");
      await this.repo.createRevision(updated, scope.actor_id, `revision_${randomUUID()}`, db);
      await this.auditWriter({
        audit_event_id: `audit_${randomUUID()}`,
        organization_id: scope.organization_id,
        actor_user_id: scope.actor_id,
        target_object_type: "report_draft",
        target_object_id: reportId,
        action_type: "report_draft.updated",
        new_state_json: { report_id: reportId, version: updated.version, lifecycle_status: updated.lifecycle_status },
        reason_text: "Report draft updated",
        correlation_id: `corr_${randomUUID()}`,
        source_channel: "shs-api",
      }, db);
      return updated;
    });
  }
}
