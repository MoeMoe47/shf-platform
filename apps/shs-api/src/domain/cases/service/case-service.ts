import { randomUUID } from "crypto";
import { CaseRepo } from "../repo/case-repo.js";
import { validateCaseAssignment } from "./case-assignment.js";
import { canTransitionCase } from "./case-transitions.js";
import { writeAuditEvent } from "../../audit/service/audit-helper.js";
import { withTransaction } from "../../../db/transaction.js";
import { IntegrationOutboxRepo } from "../../trusted-reporting/outbox-repo.js";
import { buildReferralOutboxEvent } from "../../trusted-reporting/outbox.js";

export class CaseService {
  constructor(
    private repo = new CaseRepo(),
    private outbox = new IntegrationOutboxRepo(),
    private transaction = withTransaction,
    private auditWriter = writeAuditEvent,
  ) {}

  private scopeFromActor(actor: any) {
    const organizationId = actor?.active_organization_id || actor?.organization_id;
    const actorId = actor?.user_id || actor?.id;
    if (!actorId) throw new Error("Actor is required");
    if (!organizationId) throw new Error("Active organization is required");
    return { actor_id: actorId, organization_id: organizationId };
  }

  async listCases(actor: any) {
    return this.repo.listCases(this.scopeFromActor(actor));
  }

  async getCase(caseId: string, actor: any) {
    return this.repo.getCaseById(caseId, this.scopeFromActor(actor));
  }

  async listReferrals(actor: any) {
    return this.repo.listReferralCases(this.scopeFromActor(actor));
  }

  async createCase(input: any, actor?: any) {
    const scope = this.scopeFromActor(actor);
    const created = await this.repo.createCase({
      ...input,
      case_id: `case_${randomUUID()}`,
      organization_id: scope.organization_id,
      status: "draft",
      created_by_user_id: scope.actor_id,
    });

    await this.auditWriter({
      audit_event_id: `audit_${randomUUID()}`,
      organization_id: created.organization_id,
      actor_user_id: actor?.user_id || null,
      target_object_type: "case",
      target_object_id: created.case_id,
      action_type: "case.created",
      new_state_json: created,
      reason_text: "Case created",
      correlation_id: `corr_${randomUUID()}`,
      source_channel: "api",
    });

    return created;
  }

  async createReferral(input: any, actor?: any) {
    const scope = this.scopeFromActor(actor);
    const correlationId = `corr_${randomUUID()}`;
    return this.transaction(async (db: any) => {
      const created = await this.repo.createCase({
        case_id: `case_${randomUUID()}`,
        organization_id: scope.organization_id,
        program_id: input?.program_id || null,
        case_type: "referral",
        status: input?.status || "open",
        priority: input?.priority || "medium",
        created_by_user_id: scope.actor_id,
      }, db);

      const details = await this.repo.upsertReferralDetails(created.case_id, {
        receiving_organization_id: input?.receiving_organization_id || null,
        need_category: input?.need_category || null,
        urgency_level: input?.urgency_level || created.priority,
        notes: input?.notes || null,
      }, db);

      await this.auditWriter({
        audit_event_id: `audit_${randomUUID()}`,
        organization_id: created.organization_id,
        actor_user_id: scope.actor_id,
        target_object_type: "referral",
        target_object_id: created.case_id,
        action_type: "referral.created",
        new_state_json: { ...created, ...details },
        reason_text: input?.reason_text || "Referral created",
        correlation_id: correlationId,
        source_channel: "api",
      }, db);

      await this.outbox.enqueue(buildReferralOutboxEvent(created, correlationId), db);
      return { ...created, ...details, reporting_delivery_status: "PENDING", reporting_correlation_id: correlationId };
    });
  }

  async assignCase(caseId: string, input: any, actor?: any) {
    const scope = this.scopeFromActor(actor);
    validateCaseAssignment(input);
    const updated = await this.repo.assignCase(caseId, input, scope);
    if (!updated) throw new Error("Case not found");

    await this.auditWriter({
      audit_event_id: `audit_${randomUUID()}`,
      organization_id: updated.organization_id,
      actor_user_id: scope.actor_id,
      target_object_type: "case",
      target_object_id: caseId,
      action_type: "case.assigned",
      new_state_json: updated,
      reason_text: input.reason_text || "Case assigned",
      correlation_id: `corr_${randomUUID()}`,
      source_channel: "api",
    });

    return updated;
  }

  async transitionCase(caseId: string, currentStatus: string, nextStatus: string, actor?: any, reasonText?: string) {
    const scope = this.scopeFromActor(actor);
    if (!canTransitionCase(currentStatus, nextStatus)) {
      throw new Error(`Invalid case transition: ${currentStatus} -> ${nextStatus}`);
    }

    const updated = await this.repo.updateCaseStatus(caseId, nextStatus, scope);
    if (!updated) throw new Error("Case not found");

    await this.auditWriter({
      audit_event_id: `audit_${randomUUID()}`,
      organization_id: updated.organization_id,
      actor_user_id: scope.actor_id,
      target_object_type: "case",
      target_object_id: caseId,
      action_type: "case.transitioned",
      previous_state_json: { status: currentStatus },
      new_state_json: { status: nextStatus },
      reason_text: reasonText || "Case transitioned",
      correlation_id: `corr_${randomUUID()}`,
      source_channel: "api",
    });

    return updated;
  }
}
