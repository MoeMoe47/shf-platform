import { randomUUID } from "crypto";
import { withTransaction } from "../../db/transaction";
import { writeAuditEvent } from "../audit/service/audit-helper";
import { ReportPublicDisclosureRepo } from "./report-public-disclosure-repo";
import { ReportPublicEligibilityRepo } from "./report-public-eligibility-repo";
import { CURRICULUM_COMPLETION_REPORT } from "./report-public-eligibility-service";
import { ReportPublicDisclosurePolicyRepo } from "./report-public-disclosure-policy-repo";
import { APPROVED_CURRICULUM_POLICY_V1, APPROVED_HUB_REFERRAL_POLICY_V1, CURRICULUM_DISCLOSURE_POLICY, PUBLIC_DISCLOSURE_POLICY_READINESS } from "./report-public-disclosure-policy-service";
import { requirePublicReportGovernanceRegistration } from "./report-public-governance-registry";

function scopeFromActor(actor: any) {
  const actorId = actor?.user_id || actor?.id;
  const organizationId = actor?.organization_id;
  if (!actorId || !organizationId) throw new Error("Public disclosure scope unavailable");
  return { actor_id: actorId, organization_id: organizationId, tenant_id: actor?.tenant_id || actor?.tenant || `tenant:${organizationId}` };
}

function requirePermission(actor: any) {
  if (!Array.isArray(actor?.permissions) || !actor.permissions.includes("reports.public_disclosure.manage")) {
    throw new Error("Missing permission: reports.public_disclosure.manage");
  }
}

function requireText(value: any, message: string) {
  const result = String(value || "").trim();
  if (!result) throw new Error(message);
  return result;
}

function stableJson(value: any): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function validateReport(reportId: string, reportVersion: number) {
  return requirePublicReportGovernanceRegistration(reportId, reportVersion);
}

function normalize(input: any) {
  const reportId = requireText(input?.report_id || input?.reportId, "Report ID is required");
  const reportVersion = Number(input?.report_version || input?.reportVersion);
  if (!Number.isInteger(reportVersion) || reportVersion < 1) throw new Error("Report version is required");
  validateReport(reportId, reportVersion);
  const eligibilityId = requireText(input?.public_eligibility_decision_id || input?.publicEligibilityDecisionId, "Public eligibility decision is required");
  const decision = requireText(input?.decision, "Public disclosure decision is required").toUpperCase();
  if (decision !== "PUBLIC_DISCLOSURE_APPROVED" && decision !== "PUBLIC_DISCLOSURE_BLOCKED") throw new Error("Unsupported public disclosure decision");
  return {
    report_id: reportId,
    report_version: reportVersion,
    public_eligibility_decision_id: eligibilityId,
    decision,
    privacy_policy_reference: requireText(input?.privacy_policy_reference || input?.privacyPolicyReference, "Privacy policy reference is required"),
    privacy_policy_version: requireText(input?.privacy_policy_version || input?.privacyPolicyVersion, "Privacy policy version is required"),
    reason_code: requireText(input?.reason_code || input?.reasonCode, "Disclosure reason code is required"),
    review_context: input?.review_context || input?.reviewContext || null,
    supersedes_decision_id: input?.supersedes_decision_id || input?.supersedesDecisionId || null,
  };
}

function evaluateAggregateDisclosure(policy: any, expectedDefinition: any, context: any, suppressionMode: string) {
  const rules = policy?.policy_definition;
  if (!rules || stableJson(rules) !== stableJson(expectedDefinition)) throw new Error("Approved disclosure policy v1 is required");
  if (!context || !Number.isInteger(context.canonical_count) || context.canonical_count < 0) throw new Error("Canonical report count is required");
  if (!rules.allowed_geography_levels.includes(context.geography)) throw new Error("Public geography is not allowed");
  if (!rules.allowed_program_granularity.includes(context.program_granularity)) throw new Error("Public program granularity is not allowed");
  if (!rules.reporting_period.includes(context.reporting_period)) throw new Error("Public reporting period is not allowed");
  if (!context.reporting_period_label || !context.data_as_of) throw new Error("Reporting period and data-as-of metadata are required");
  const reviewKeys = ["complementary_suppression_review", "reidentification_review", "rare_event_review", "reconstruction_review", "longitudinal_review", "combination_risk_review"];
  if (reviewKeys.some((key) => context[key] !== "PASS")) throw new Error("Required residual disclosure review is unresolved");
  const evaluatedAt = new Date(context.evaluated_at || new Date().toISOString());
  const dataAsOf = new Date(context.data_as_of);
  if (Number.isNaN(dataAsOf.getTime()) || Number.isNaN(evaluatedAt.getTime())) throw new Error("Freshness metadata is invalid");
  const ageMonths = (evaluatedAt.getTime() - dataAsOf.getTime()) / (1000 * 60 * 60 * 24 * 30.4375);
  if (ageMonths > rules.freshness_rules.max_age_months && context.renewed_review !== true) throw new Error("Disclosure review is stale and requires renewal");
  if (context.canonical_count === 0 && context.zero_publicly_safe === true) return { internal_value: 0, public_value: 0, display_mode: "EXACT_COUNT" };
  if (context.canonical_count < rules.minimum_group_size) {
    if (!rules.display_mode.includes(suppressionMode)) throw new Error("Suppressed public display mode is not permitted");
    return { internal_value: context.canonical_count, public_value: "<10", display_mode: suppressionMode };
  }
  if (!rules.exact_count_allowed) throw new Error("Exact public counts are not permitted");
  return { internal_value: context.canonical_count, public_value: context.canonical_count, display_mode: "EXACT_COUNT" };
}

export function evaluateCurriculumPublicDisclosure(policy: any, context: any) {
  return evaluateAggregateDisclosure(policy, APPROVED_CURRICULUM_POLICY_V1, context, "SUPPRESSED_LT_10");
}

export function evaluateHubReferralPublicDisclosure(policy: any, context: any) {
  return evaluateAggregateDisclosure(policy, APPROVED_HUB_REFERRAL_POLICY_V1, context, "SUPPRESSED_LT_10");
}

export class ReportPublicDisclosureService {
  constructor(
    private repo = new ReportPublicDisclosureRepo(),
    private eligibilityRepo = new ReportPublicEligibilityRepo(),
    private transaction = withTransaction,
    private auditWriter = writeAuditEvent,
    private policyRepo = new ReportPublicDisclosurePolicyRepo(),
  ) {}

  async createDecision(input: any, actor: any) {
    requirePermission(actor);
    const scope = scopeFromActor(actor);
    const normalized = normalize(input);
    return this.transaction(async (db: any) => {
      const registration = validateReport(normalized.report_id, normalized.report_version);
      const eligibility = await this.eligibilityRepo.getDecision(normalized.public_eligibility_decision_id, scope, db);
      if (!eligibility || eligibility.report_id !== normalized.report_id || Number(eligibility.report_version) !== normalized.report_version || eligibility.decision !== "PUBLIC_ELIGIBLE") {
        throw new Error("Exact PUBLIC_ELIGIBLE report decision is required");
      }
      if (normalized.decision === "PUBLIC_DISCLOSURE_APPROVED") {
        const policy = await this.policyRepo.getApprovedPolicy(normalized.report_id, normalized.report_version, scope, db);
        if (!policy || String(PUBLIC_DISCLOSURE_POLICY_READINESS) !== "APPROVED_POLICY_READY") throw new Error("Approved disclosure policy is not available");
        if (normalized.privacy_policy_reference !== registration.required_policy_key || normalized.privacy_policy_reference !== policy.policy_key || normalized.privacy_policy_version !== String(policy.policy_version)) throw new Error("Exact approved policy identity is required");
        const evaluator = registration.disclosure_evaluator === "CURRICULUM_EDUCATION_ACTIVITY_V1"
          ? evaluateCurriculumPublicDisclosure
          : registration.disclosure_evaluator === "HUB_REFERRAL_ACTIVITY_V1"
            ? evaluateHubReferralPublicDisclosure
            : null;
        if (!evaluator) throw new Error("No disclosure evaluator is registered for this report");
        const evaluation = evaluator(policy, normalized.review_context);
        normalized.review_context = { ...normalized.review_context, public_representation: evaluation.display_mode };
      }
      if (normalized.supersedes_decision_id) {
        const prior = await this.repo.getDecision(normalized.supersedes_decision_id, scope, db);
        if (!prior || prior.report_id !== normalized.report_id || Number(prior.report_version) !== normalized.report_version) throw new Error("Superseded disclosure decision is invalid");
      }
      const created = await this.repo.createDecision({ public_disclosure_decision_id: `public_disclosure_${randomUUID()}`, ...normalized, ...scope, reviewed_by_user_id: scope.actor_id }, db);
      await this.auditWriter({
        audit_event_id: `audit_${randomUUID()}`, organization_id: scope.organization_id, actor_user_id: scope.actor_id,
        target_object_type: "report_public_disclosure_decision", target_object_id: created.public_disclosure_decision_id,
        action_type: created.decision === "PUBLIC_DISCLOSURE_APPROVED" ? "report.public_disclosure.approved" : "report.public_disclosure.blocked",
        new_state_json: { public_disclosure_decision_id: created.public_disclosure_decision_id, report_id: created.report_id, report_version: created.report_version, public_eligibility_decision_id: created.public_eligibility_decision_id, decision: created.decision, privacy_policy_reference: created.privacy_policy_reference, privacy_policy_version: created.privacy_policy_version, reason_code: created.reason_code, version: created.version },
        reason_text: created.decision === "PUBLIC_DISCLOSURE_APPROVED" ? "Public disclosure approved under institutionally approved policy" : "Public disclosure blocked by policy or review gate", correlation_id: `corr_${randomUUID()}`, source_channel: "shs-api",
      }, db);
      return created;
    });
  }

  async listDecisions(actor: any, reportId?: string, reportVersion?: number) {
    const scope = scopeFromActor(actor);
    if (reportId) validateReport(reportId, Number(reportVersion));
    return this.repo.listDecisions(scope, reportId, reportVersion);
  }

  async getDecision(id: string, actor: any) { return this.repo.getDecision(id, scopeFromActor(actor)); }
}
