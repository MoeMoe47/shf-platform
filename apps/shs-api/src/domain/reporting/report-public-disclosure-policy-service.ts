import { randomUUID } from "crypto";
import { withTransaction } from "../../db/transaction.js";
import { writeAuditEvent } from "../audit/service/audit-helper.js";
import { CURRICULUM_COMPLETION_REPORT } from "./report-public-eligibility-service.js";
import { ReportPublicDisclosurePolicyRepo } from "./report-public-disclosure-policy-repo.js";
import { getPublicReportGovernanceRegistration, requirePublicReportGovernanceRegistration } from "./report-public-governance-registry.js";

export const PUBLIC_DISCLOSURE_POLICY_READINESS = "APPROVED_POLICY_READY";

export const CURRICULUM_DISCLOSURE_POLICY = Object.freeze({
  policy_key: "PUBLIC_AGGREGATE_EDUCATION_ACTIVITY",
  policy_version: 1,
  policy_type: "PUBLIC_AGGREGATE_DISCLOSURE",
  report_id: CURRICULUM_COMPLETION_REPORT.report_id,
  report_version: CURRICULUM_COMPLETION_REPORT.report_version,
});

export const REQUIRED_DISCLOSURE_RULES = Object.freeze([
  "minimum_group_size", "cohort_size", "allowed_geography_levels", "allowed_program_granularity",
  "reporting_period", "reidentification_risk", "rare_event_risk", "sensitive_outcome_type",
  "longitudinal_linkage", "cross_metric_combination_risk", "suppression_required", "exact_count_allowed",
  "display_mode", "complementary_suppression_required", "reconstruction_risk", "freshness_rules", "combination_risk_rules",
]);

const DISPLAY_MODES = new Set(["EXACT_COUNT", "RANGE", "SUPPRESSED", "AGGREGATE_ONLY", "SUPPRESSED_LT_10", "UNAVAILABLE"]);
export const REQUIRED_SIGNOFF_TYPES = Object.freeze(["PRIVACY_DATA_GOVERNANCE", "LEGAL_PRIVACY_REVIEW", "EXECUTIVE_APPROVAL"]);

export const APPROVED_CURRICULUM_POLICY_V1 = Object.freeze({
  minimum_group_size: 10,
  cohort_size: { minimum: 10 },
  allowed_geography_levels: ["COUNTY", "STATE", "ORGANIZATION_WIDE"],
  allowed_program_granularity: ["FOUNDATION_WIDE", "NAMED_PROGRAM"],
  reporting_period: ["QUARTERLY", "ANNUAL"],
  reidentification_risk: { review_required: true },
  rare_event_risk: { review_required: true },
  sensitive_outcome_type: "ORDINARY_EDUCATION_ACTIVITY",
  longitudinal_linkage: { review_required: true },
  cross_metric_combination_risk: { review_required: true },
  suppression_required: true,
  exact_count_allowed: true,
  display_mode: ["EXACT_COUNT", "SUPPRESSED_LT_10"],
  complementary_suppression_required: true,
  reconstruction_risk: { review_required: true },
  freshness_rules: { data_as_of_required: true, max_age_months: 12, renewed_review_required: true },
  combination_risk_rules: { review_required: true, narrow_population_scope: true },
});

export const APPROVED_HUB_REFERRAL_POLICY_V1 = Object.freeze({
  minimum_group_size: 10,
  cohort_size: { minimum: 10 },
  allowed_geography_levels: ["ORGANIZATION_WIDE", "STATE", "COUNTY"],
  allowed_program_granularity: ["FOUNDATION_WIDE", "NAMED_HUB_PROGRAM"],
  reporting_period: ["QUARTERLY", "ANNUAL"],
  reidentification_risk: { review_required: true },
  rare_event_risk: { review_required: true },
  sensitive_outcome_type: "REFERRAL_ACTIVITY_WITH_SENSITIVE_DIMENSIONS_BLOCKED",
  longitudinal_linkage: { review_required: true },
  cross_metric_combination_risk: { review_required: true },
  suppression_required: true,
  exact_count_allowed: true,
  display_mode: ["EXACT_COUNT", "SUPPRESSED_LT_10", "UNAVAILABLE"],
  complementary_suppression_required: true,
  reconstruction_risk: { review_required: true },
  freshness_rules: { data_as_of_required: true, max_age_months: 12, renewed_review_required: true },
  combination_risk_rules: { review_required: true, narrow_population_scope: true },
});

export const APPROVED_GPA_PROGRAM_ASSURANCE_POLICY_V1 = Object.freeze({
  minimum_group_size: 10,
  cohort_size: { minimum: 10 },
  allowed_geography_levels: ["COUNTY", "STATE", "ORGANIZATION_WIDE"],
  allowed_program_granularity: ["NAMED_PROGRAM", "FOUNDATION_WIDE"],
  reporting_period: ["QUARTERLY", "ANNUAL"],
  reidentification_risk: { review_required: true },
  rare_event_risk: { review_required: true },
  sensitive_outcome_type: "WORKFORCE_OUTCOME_AGGREGATE_ONLY",
  longitudinal_linkage: { review_required: true },
  cross_metric_combination_risk: { review_required: true },
  suppression_required: true,
  exact_count_allowed: true,
  display_mode: ["EXACT_COUNT", "SUPPRESSED_LT_10"],
  complementary_suppression_required: true,
  reconstruction_risk: { review_required: true },
  freshness_rules: { data_as_of_required: true, max_age_months: 12, renewed_review_required: true },
  combination_risk_rules: { review_required: true, narrow_population_scope: true },
});

function scopeFromActor(actor: any) {
  const actorId = actor?.user_id || actor?.id;
  const organizationId = actor?.organization_id;
  if (!actorId || !organizationId) throw new Error("Public disclosure policy scope unavailable");
  return { actor_id: actorId, organization_id: organizationId, tenant_id: actor?.tenant_id || actor?.tenant || `tenant:${organizationId}` };
}

function requirePermission(actor: any) {
  if (!Array.isArray(actor?.permissions) || !actor.permissions.includes("reports.public_disclosure_policy.manage")) throw new Error("Missing permission: reports.public_disclosure_policy.manage");
}

function requireText(value: any, message: string) {
  const result = String(value || "").trim();
  if (!result) throw new Error(message);
  return result;
}

function validatePolicyBinding(reportId: string, reportVersion: number) {
  return requirePublicReportGovernanceRegistration(reportId, reportVersion);
}

function hasGovernedRules(definition: any) {
  if (!definition || typeof definition !== "object" || Array.isArray(definition)) return false;
  return REQUIRED_DISCLOSURE_RULES.every((key) => {
    const value = definition[key];
    if (!Object.prototype.hasOwnProperty.call(definition, key) || value === null || value === "") return false;
    if (key.endsWith("_risk") || key.endsWith("_rules") || key === "freshness_rules") {
      return typeof value === "object" && !Array.isArray(value) && Object.keys(value).length > 0;
    }
    return true;
  });
}

function validateRuleShape(definition: any) {
  if (Object.prototype.hasOwnProperty.call(definition, "display_mode")) {
    const modes = Array.isArray(definition.display_mode) ? definition.display_mode : [definition.display_mode];
    if (!modes.length || modes.some((mode: any) => !DISPLAY_MODES.has(String(mode).toUpperCase()))) throw new Error("Unsupported public disclosure display mode");
  }
  if (Object.prototype.hasOwnProperty.call(definition, "complementary_suppression_required") && typeof definition.complementary_suppression_required !== "boolean") throw new Error("Complementary suppression rule must be boolean");
  for (const key of ["reconstruction_risk", "freshness_rules", "combination_risk_rules"]) {
    if (Object.prototype.hasOwnProperty.call(definition, key) && (!definition[key] || typeof definition[key] !== "object" || Array.isArray(definition[key]))) throw new Error(`${key} must be an object`);
  }
}

function sameJson(left: any, right: any): boolean {
  if (left === right) return true;
  if (!left || !right || typeof left !== "object" || typeof right !== "object" || Array.isArray(left) !== Array.isArray(right)) return false;
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return leftKeys.length === rightKeys.length && leftKeys.every((key, index) => key === rightKeys[index] && sameJson(left[key], right[key]));
}

function normalize(input: any) {
  const reportId = requireText(input?.report_id || input?.reportId, "Policy report ID is required");
  const reportVersion = Number(input?.report_version || input?.reportVersion);
  if (!Number.isInteger(reportVersion) || reportVersion < 1) throw new Error("Policy report version is required");
  const registration = validatePolicyBinding(reportId, reportVersion);
  const policyKey = requireText(input?.policy_key || input?.policyKey, "Policy key is required");
  const policyVersion = Number(input?.policy_version || input?.policyVersion);
  if (!Number.isInteger(policyVersion) || policyVersion < 1) throw new Error("Policy version is required");
  if (policyKey !== registration.required_policy_key) throw new Error("Policy key is not authorized for the registered report");
  const definition = input?.policy_definition || input?.policyDefinition || {};
  if (!definition || typeof definition !== "object" || Array.isArray(definition)) throw new Error("Policy definition must be an object");
  validateRuleShape(definition);
  return { report_id: reportId, report_version: reportVersion, policy_key: policyKey, policy_version: policyVersion, policy_type: "PUBLIC_AGGREGATE_DISCLOSURE", policy_definition: definition, effective_at: input?.effective_at || input?.effectiveAt || null };
}

export function resolveApprovedPublicDisclosurePolicy({ reportId, reportVersion, tenantId, organizationId, policyRepo = new ReportPublicDisclosurePolicyRepo() }: any) {
  validatePolicyBinding(reportId, Number(reportVersion));
  return policyRepo.getApprovedPolicy(reportId, Number(reportVersion), { tenant_id: tenantId, organization_id: organizationId });
}

export class ReportPublicDisclosurePolicyService {
  constructor(private repo = new ReportPublicDisclosurePolicyRepo(), private transaction = withTransaction, private auditWriter = writeAuditEvent) {}

  async createPolicy(input: any, actor: any) {
    requirePermission(actor);
    const scope = scopeFromActor(actor);
    const normalized = normalize(input);
    return this.transaction(async (db: any) => {
      const created = await this.repo.createPolicy({ policy_id: `public_policy_${randomUUID()}`, ...normalized, ...scope, created_by_user_id: scope.actor_id }, db);
      await this.auditWriter({ audit_event_id: `audit_${randomUUID()}`, organization_id: scope.organization_id, actor_user_id: scope.actor_id, target_object_type: "report_public_disclosure_policy", target_object_id: created.policy_id, action_type: "report.public_disclosure_policy.created", new_state_json: { policy_id: created.policy_id, policy_key: created.policy_key, policy_version: created.policy_version, report_id: created.report_id, report_version: created.report_version, status: created.status, version: created.version }, reason_text: "Public disclosure policy draft created", correlation_id: `corr_${randomUUID()}`, source_channel: "shs-api" }, db);
      return created;
    });
  }

  async approvePolicy(policyId: string, actor: any) {
    requirePermission(actor);
    const scope = scopeFromActor(actor);
    return this.transaction(async (db: any) => {
      const policy = await this.repo.getPolicy(policyId, scope, db);
      if (!policy) throw new Error("Policy not found in authorized scope");
      if (policy.status !== "DRAFT") throw new Error("Only DRAFT policies can be approved");
      if (!hasGovernedRules(policy.policy_definition)) throw new Error("Policy governance values are incomplete; policy remains DRAFT");
      const registration = getPublicReportGovernanceRegistration(policy.report_id, Number(policy.report_version));
      if (registration?.required_policy_key === CURRICULUM_DISCLOSURE_POLICY.policy_key && !sameJson(policy.policy_definition, APPROVED_CURRICULUM_POLICY_V1)) throw new Error("Policy values do not match institutionally approved curriculum policy v1");
      if (registration?.required_policy_key === "PUBLIC_AGGREGATE_HUB_REFERRAL_ACTIVITY" && !sameJson(policy.policy_definition, APPROVED_HUB_REFERRAL_POLICY_V1)) throw new Error("Policy values do not match institutionally approved Hub referral policy v1");
      if (registration?.required_policy_key === "PUBLIC_AGGREGATE_GPA_PROGRAM_ASSURANCE" && !sameJson(policy.policy_definition, APPROVED_GPA_PROGRAM_ASSURANCE_POLICY_V1)) throw new Error("Policy values do not match institutionally approved GPA program assurance policy v1");
      if (policy.institutional_signoff_required) {
        const signoffs = await this.repo.listSignoffs(policyId, scope, db);
        for (const type of REQUIRED_SIGNOFF_TYPES) {
          if (!signoffs.some((signoff: any) => signoff.signoff_type === type && signoff.status === "APPROVED")) {
            throw new Error(`Institutional sign-off is required: ${type}; policy remains DRAFT`);
          }
        }
      }
      const approved = await this.repo.approvePolicy(policyId, scope, scope.actor_id, new Date().toISOString(), db);
      if (!approved) throw new Error("Policy approval conflict; policy remains DRAFT");
      await this.auditWriter({ audit_event_id: `audit_${randomUUID()}`, organization_id: scope.organization_id, actor_user_id: scope.actor_id, target_object_type: "report_public_disclosure_policy", target_object_id: policyId, action_type: "report.public_disclosure_policy.approved", new_state_json: { policy_id: policyId, policy_key: approved.policy_key, policy_version: approved.policy_version, status: approved.status, version: approved.version }, reason_text: "Institutionally approved public disclosure policy", correlation_id: `corr_${randomUUID()}`, source_channel: "shs-api" }, db);
      return approved;
    });
  }

  async retirePolicy(policyId: string, actor: any) {
    requirePermission(actor);
    const scope = scopeFromActor(actor);
    return this.transaction(async (db: any) => {
      const retired = await this.repo.retirePolicy(policyId, scope, db);
      if (!retired) throw new Error("Only an approved policy in scope can be retired");
      await this.auditWriter({ audit_event_id: `audit_${randomUUID()}`, organization_id: scope.organization_id, actor_user_id: scope.actor_id, target_object_type: "report_public_disclosure_policy", target_object_id: policyId, action_type: "report.public_disclosure_policy.retired", new_state_json: { policy_id: policyId, status: retired.status, version: retired.version }, reason_text: "Public disclosure policy retired", correlation_id: `corr_${randomUUID()}`, source_channel: "shs-api" }, db);
      return retired;
    });
  }

  async listPolicies(actor: any, reportId?: string, reportVersion?: number) { const scope = scopeFromActor(actor); if (reportId) validatePolicyBinding(reportId, Number(reportVersion)); return this.repo.listPolicies(scope, reportId, reportVersion); }
  async getPolicy(policyId: string, actor: any) { return this.repo.getPolicy(policyId, scopeFromActor(actor)); }

  async createSignoff(policyId: string, input: any, actor: any) {
    requirePermission(actor);
    const scope = scopeFromActor(actor);
    const authorityReference = requireText(input?.authority_reference || input?.authorityReference, "Institutional approval reference is required");
    const signoffType = requireText(input?.signoff_type || input?.signoffType, "Institutional sign-off type is required").toUpperCase();
    if (!REQUIRED_SIGNOFF_TYPES.includes(signoffType)) throw new Error("Unsupported institutional sign-off type");
    return this.transaction(async (db: any) => {
      const policy = await this.repo.getPolicy(policyId, scope, db);
      if (!policy) throw new Error("Policy not found in authorized scope");
      const signoff = await this.repo.createSignoff({ signoff_record_id: `policy_signoff_${randomUUID()}`, policy_id: policyId, ...scope, signoff_type: signoffType, authority_reference: authorityReference, recorded_by_user_id: scope.actor_id }, db);
      await this.auditWriter({ audit_event_id: `audit_${randomUUID()}`, organization_id: scope.organization_id, actor_user_id: scope.actor_id, target_object_type: "report_public_disclosure_policy_signoff", target_object_id: signoff.signoff_record_id, action_type: "report.public_disclosure_policy.signoff_recorded", new_state_json: { signoff_record_id: signoff.signoff_record_id, policy_id: policyId, signoff_type: signoff.signoff_type, authority_reference: signoff.authority_reference, status: signoff.status, version: signoff.version }, reason_text: "Institutional policy sign-off reference recorded as pending", correlation_id: `corr_${randomUUID()}`, source_channel: "shs-api" }, db);
      return signoff;
    });
  }

  async approveSignoff(signoffId: string, actor: any) {
    requirePermission(actor);
    const scope = scopeFromActor(actor);
    return this.transaction(async (db: any) => {
      const approved = await this.repo.approveSignoff(signoffId, scope, db);
      if (!approved) throw new Error("Sign-off not found, out of scope, or already decided");
      await this.auditWriter({ audit_event_id: `audit_${randomUUID()}`, organization_id: scope.organization_id, actor_user_id: scope.actor_id, target_object_type: "report_public_disclosure_policy_signoff", target_object_id: signoffId, action_type: "report.public_disclosure_policy.signoff_approved", new_state_json: { signoff_record_id: signoffId, policy_id: approved.policy_id, signoff_type: approved.signoff_type, status: approved.status, version: approved.version }, reason_text: "Institutional policy sign-off approved", correlation_id: `corr_${randomUUID()}`, source_channel: "shs-api" }, db);
      return approved;
    });
  }

  async listSignoffs(policyId: string, actor: any) { return this.repo.listSignoffs(policyId, scopeFromActor(actor)); }
}
