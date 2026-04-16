import { randomUUID } from "crypto";
import { CaseRepo } from "../repo/case-repo";
import { validateCaseAssignment } from "./case-assignment";
import { canTransitionCase } from "./case-transitions";
import { writeAuditEvent } from "../../audit/service/audit-helper";

export class CaseService {
  private repo = new CaseRepo();

  async listCases() {
    return this.repo.listCases();
  }

  async listReferrals() {
    return this.repo.listReferralCases();
  }

  async createCase(input: any, actor?: any) {
    const created = await this.repo.createCase({
      case_id: `case_${randomUUID()}`,
      organization_id: actor?.organization_id || "org_shf_001",
      status: "draft",
      created_by_user_id: actor?.user_id || null,
      ...input,
    });

    await writeAuditEvent({
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
    const created = await this.repo.createCase({
      case_id: `case_${randomUUID()}`,
      organization_id: actor?.organization_id || input?.organization_id || "org_shf_001",
      program_id: input?.program_id || null,
      case_type: "referral",
      status: input?.status || "open",
      priority: input?.priority || "medium",
      created_by_user_id: actor?.user_id || null,
    });

    const details = await this.repo.upsertReferralDetails(created.case_id, {
      receiving_organization_id: input?.receiving_organization_id || null,
      need_category: input?.need_category || null,
      urgency_level: input?.urgency_level || created.priority,
      notes: input?.notes || null,
    });

    await writeAuditEvent({
      audit_event_id: `audit_${randomUUID()}`,
      organization_id: created.organization_id,
      actor_user_id: actor?.user_id || null,
      target_object_type: "referral",
      target_object_id: created.case_id,
      action_type: "referral.created",
      new_state_json: {
        ...created,
        ...details,
      },
      reason_text: input?.reason_text || "Referral created",
      correlation_id: `corr_${randomUUID()}`,
      source_channel: "api",
    });

    return {
      ...created,
      ...details,
    };
  }

  async assignCase(caseId: string, input: any, actor?: any) {
    validateCaseAssignment(input);
    const updated = await this.repo.assignCase(caseId, input);
    if (!updated) throw new Error("Case not found");

    await writeAuditEvent({
      audit_event_id: `audit_${randomUUID()}`,
      organization_id: updated.organization_id,
      actor_user_id: actor?.user_id || null,
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
    if (!canTransitionCase(currentStatus, nextStatus)) {
      throw new Error(`Invalid case transition: ${currentStatus} -> ${nextStatus}`);
    }

    const updated = await this.repo.updateCaseStatus(caseId, nextStatus);
    if (!updated) throw new Error("Case not found");

    await writeAuditEvent({
      audit_event_id: `audit_${randomUUID()}`,
      organization_id: updated.organization_id,
      actor_user_id: actor?.user_id || null,
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
