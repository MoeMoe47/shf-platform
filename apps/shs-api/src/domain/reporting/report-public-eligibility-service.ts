import { randomUUID } from "crypto";
import { withTransaction } from "../../db/transaction";
import { writeAuditEvent } from "../audit/service/audit-helper";
import { ReportPublicEligibilityRepo } from "./report-public-eligibility-repo";
import { requirePublicReportGovernanceRegistration } from "./report-public-governance-registry";

export const CURRICULUM_COMPLETION_REPORT = Object.freeze({
  report_id: "report.curriculum.lesson_completion_count.v1",
  report_version: 1,
  metric_id: "curriculum.lesson.completion_count.v1",
  lineage: "canonical_truth_source_metric_report",
});

function scopeFromActor(actor: any) {
  const actorId = actor?.user_id || actor?.id;
  const organizationId = actor?.organization_id;
  if (!actorId || !organizationId) throw new Error("Public eligibility scope unavailable");
  return {
    actor_id: actorId,
    organization_id: organizationId,
    tenant_id: actor?.tenant_id || actor?.tenant || `tenant:${organizationId}`,
  };
}

function requirePermission(actor: any) {
  if (!Array.isArray(actor?.permissions) || !actor.permissions.includes("reports.public_eligibility.manage")) {
    throw new Error("Missing permission: reports.public_eligibility.manage");
  }
}

function requireText(value: any, message: string) {
  const result = String(value || "").trim();
  if (!result) throw new Error(message);
  return result;
}

export function validateCanonicalReport(reportId: string, reportVersion: number) {
  return requirePublicReportGovernanceRegistration(reportId, reportVersion);
}

function normalizeDecision(input: any) {
  const reportId = requireText(input?.report_id || input?.reportId, "Report ID is required");
  const reportVersion = Number(input?.report_version || input?.reportVersion);
  if (!Number.isInteger(reportVersion) || reportVersion < 1) throw new Error("Report version is required");
  validateCanonicalReport(reportId, reportVersion);
  const decision = requireText(input?.decision, "Public eligibility decision is required").toUpperCase();
  if (decision !== "PUBLIC_ELIGIBLE" && decision !== "PUBLIC_INELIGIBLE") throw new Error("Unsupported public eligibility decision");
  return {
    report_id: reportId,
    report_version: reportVersion,
    decision,
    reason_code: requireText(input?.reason_code || input?.reasonCode, "Eligibility reason code is required"),
    policy_reference: requireText(input?.policy_reference || input?.policyReference, "Eligibility policy reference is required"),
    supersedes_decision_id: input?.supersedes_decision_id || input?.supersedesDecisionId || null,
  };
}

export class ReportPublicEligibilityService {
  constructor(
    private repo = new ReportPublicEligibilityRepo(),
    private transaction = withTransaction,
    private auditWriter = writeAuditEvent,
  ) {}

  async createDecision(input: any, actor: any) {
    requirePermission(actor);
    const scope = scopeFromActor(actor);
    const normalized = normalizeDecision(input);
    return this.transaction(async (db: any) => {
      if (normalized.supersedes_decision_id) {
        const prior = await this.repo.getDecision(normalized.supersedes_decision_id, scope, db);
        if (!prior || prior.report_id !== normalized.report_id || Number(prior.report_version) !== normalized.report_version) {
          throw new Error("Superseded decision is missing, out of scope, or bound to another report version");
        }
      }
      const created = await this.repo.createDecision({
        public_eligibility_decision_id: `public_eligibility_${randomUUID()}`,
        ...normalized,
        ...scope,
        decided_by_user_id: scope.actor_id,
      }, db);
      await this.auditWriter({
        audit_event_id: `audit_${randomUUID()}`,
        organization_id: scope.organization_id,
        actor_user_id: scope.actor_id,
        target_object_type: "report_public_eligibility_decision",
        target_object_id: created.public_eligibility_decision_id,
        action_type: created.decision === "PUBLIC_ELIGIBLE" ? "report.public_eligibility.approved" : "report.public_eligibility.denied",
        new_state_json: {
          public_eligibility_decision_id: created.public_eligibility_decision_id,
          report_id: created.report_id,
          report_version: created.report_version,
          decision: created.decision,
          reason_code: created.reason_code,
          policy_reference: created.policy_reference,
          supersedes_decision_id: created.supersedes_decision_id,
          version: created.version,
        },
        reason_text: "Report-level public eligibility decision recorded",
        correlation_id: `corr_${randomUUID()}`,
        source_channel: "shs-api",
      }, db);
      return created;
    });
  }

  async listDecisions(actor: any, reportId?: string, reportVersion?: number) {
    const scope = scopeFromActor(actor);
    if (reportId) validateCanonicalReport(reportId, Number(reportVersion));
    return this.repo.listDecisions(scope, reportId, reportVersion);
  }

  async getDecision(id: string, actor: any) {
    return this.repo.getDecision(id, scopeFromActor(actor));
  }
}
