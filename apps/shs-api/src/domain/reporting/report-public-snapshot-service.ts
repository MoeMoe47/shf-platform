import { createHash, randomUUID } from "crypto";
import { withTransaction } from "../../db/transaction.js";
import { writeAuditEvent } from "../audit/service/audit-helper.js";
import { ReportPublicSnapshotRepo } from "./report-public-snapshot-repo.js";
import { ReportPublicEligibilityRepo } from "./report-public-eligibility-repo.js";
import { ReportPublicDisclosureRepo } from "./report-public-disclosure-repo.js";
import { ReportPublicDisclosurePolicyRepo } from "./report-public-disclosure-policy-repo.js";
import { evaluateCurriculumPublicDisclosure } from "./report-public-disclosure-service.js";
import { getPublicReportGovernanceRegistration, requirePublicReportGovernanceRegistration } from "./report-public-governance-registry.js";

export const CURRICULUM_PUBLIC_SNAPSHOT = Object.freeze({ report_id: "report.curriculum.lesson_completion_count.v1", report_version: 1, metric_id: "curriculum.lesson.completion_count.v1", metric_version: 1 });

function scopeFromActor(actor: any) {
  const actorId = actor?.user_id || actor?.id;
  const organizationId = actor?.organization_id;
  if (!actorId || !organizationId) throw new Error("Public snapshot scope unavailable");
  return { actor_id: actorId, organization_id: organizationId, tenant_id: actor?.tenant_id || actor?.tenant || `tenant:${organizationId}` };
}
function requirePermission(actor: any, permission = "reports.public_snapshot.generate") {
  if (!Array.isArray(actor?.permissions) || !actor.permissions.includes(permission)) throw new Error(`Missing permission: ${permission}`);
}
function text(value: any, message: string) { const result = String(value || "").trim(); if (!result) throw new Error(message); return result; }
function stableJson(value: any): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}
export function publicSnapshotHash(input: any) { return createHash("sha256").update(stableJson(input)).digest("hex"); }
export function validateReport(reportId: string, reportVersion: number) {
  if (reportId === CURRICULUM_PUBLIC_SNAPSHOT.report_id && Number(reportVersion) !== 1) throw new Error("Only curriculum lesson completion report v1 supports public snapshots");
  return requirePublicReportGovernanceRegistration(reportId, reportVersion);
}
function isoDate(value: any, message: string) { const date = new Date(value); if (!value || Number.isNaN(date.getTime())) throw new Error(message); return date.toISOString(); }

function normalizeResult(input: any) {
  const source = input?.report_result || input?.reportResult;
  if (!source || typeof source !== "object" || Array.isArray(source)) throw new Error("Canonical evaluated report result is required");
  const reportId = text(source.report_id || source.reportId, "Canonical report result ID is required");
  const reportVersion = Number(source.report_version || source.reportVersion);
  const registration = validateReport(reportId, reportVersion);
  if (text(source.metric_id || source.metricId, "Canonical metric identity is required") !== registration.metric_id || Number(source.metric_version || source.metricVersion) !== registration.metric_version) throw new Error("Canonical metric identity does not match the registered report");
  const resultReference = text(source.report_result_id || source.reportResultId, "Canonical evaluated result reference is required");
  if (source.public_eligibility !== true || source.public_population_eligible !== true) throw new Error("Canonical public population eligibility assertion is required");
  if (!Number.isInteger(source.canonical_count) || source.canonical_count < 0) throw new Error("Canonical report count is required");
  const start = text(source.period_start || source.periodStart, "Reporting period start is required");
  const end = text(source.period_end || source.periodEnd, "Reporting period end is required");
  if (Number.isNaN(new Date(start).getTime()) || Number.isNaN(new Date(end).getTime())) throw new Error("Reporting period is invalid");
  return {
    report_id: reportId, report_version: reportVersion, metric_id: registration.metric_id, metric_version: registration.metric_version,
    result_reference: resultReference, canonical_count: source.canonical_count,
    reporting_period_start: start, reporting_period_end: end,
    data_as_of: isoDate(source.data_as_of || source.dataAsOf, "Data-as-of is required"),
    reporting_period: text(source.reporting_period || source.reportingPeriod, "Reporting period granularity is required").toUpperCase(),
    reporting_period_label: text(source.reporting_period_label || source.reportingPeriodLabel, "Reporting period label is required"),
    geography: text(source.geography || source.geography_level || source.geographyLevel, "Public geography is required").toUpperCase(),
    program_granularity: text(source.program_granularity || source.programGranularity, "Public program granularity is required").toUpperCase(),
  };
}

export class ReportPublicSnapshotService {
  constructor(private repo = new ReportPublicSnapshotRepo(), private eligibilityRepo = new ReportPublicEligibilityRepo(), private disclosureRepo = new ReportPublicDisclosureRepo(), private policyRepo = new ReportPublicDisclosurePolicyRepo(), private transaction = withTransaction, private auditWriter = writeAuditEvent) {}

  async createSnapshot(input: any, actor: any) {
    requirePermission(actor);
    const scope = scopeFromActor(actor);
    const report = normalizeResult(input);
    const registration = getPublicReportGovernanceRegistration(report.report_id, report.report_version);
    const expectedResultReference = `${registration.result_reference_prefix}:${report.reporting_period_start}:${report.reporting_period_end}:${scope.organization_id}`;
    if (report.result_reference !== expectedResultReference) throw new Error("Canonical evaluated result reference does not match scoped report period");
    const eligibilityId = text(input?.public_eligibility_decision_id || input?.publicEligibilityDecisionId, "Public eligibility decision is required");
    const disclosureId = text(input?.public_disclosure_decision_id || input?.publicDisclosureDecisionId, "Public disclosure decision is required");
    const idempotencyKey = text(input?.idempotency_key || input?.idempotencyKey, "Snapshot idempotency key is required");
    if (idempotencyKey.length > 200) throw new Error("Snapshot idempotency key is too long");
    return this.transaction(async (db: any) => {
      const existing = await this.repo.getByIdempotencyKey(idempotencyKey, scope, db);
      const eligibility = await this.eligibilityRepo.getDecision(eligibilityId, scope, db);
      if (!eligibility || eligibility.decision !== "PUBLIC_ELIGIBLE" || eligibility.report_id !== report.report_id || Number(eligibility.report_version) !== report.report_version) throw new Error("Exact PUBLIC_ELIGIBLE decision is required");
      const latestEligibility = await this.eligibilityRepo.getLatestEligible(report.report_id, report.report_version, scope, db);
      if (!latestEligibility || latestEligibility.public_eligibility_decision_id !== eligibilityId) throw new Error("Current PUBLIC_ELIGIBLE decision is required");
      const disclosure = await this.disclosureRepo.getDecision(disclosureId, scope, db);
      if (!disclosure || disclosure.decision !== "PUBLIC_DISCLOSURE_APPROVED" || disclosure.report_id !== report.report_id || Number(disclosure.report_version) !== report.report_version) throw new Error("Exact PUBLIC_DISCLOSURE_APPROVED decision is required");
      const policy = await this.policyRepo.getApprovedPolicy(report.report_id, report.report_version, scope, db);
      if (!policy || policy.policy_key !== registration.required_policy_key) throw new Error("Approved disclosure policy for the registered report is required");
      if (disclosure.privacy_policy_reference !== policy.policy_key || String(disclosure.privacy_policy_version) !== "1") throw new Error("Disclosure policy identity does not match approved policy");
      const reviewContext = disclosure.review_context;
      if (!reviewContext || reviewContext.canonical_count !== report.canonical_count) throw new Error("Snapshot result does not match approved disclosure result");
      if (registration.disclosure_evaluator !== "CURRICULUM_EDUCATION_ACTIVITY_V1") throw new Error("No public snapshot evaluator is registered for this report");
      const evaluated = evaluateCurriculumPublicDisclosure(policy, { ...reviewContext, ...report, evaluated_at: new Date().toISOString() });
      const safe = { report_id: report.report_id, report_version: report.report_version, source_result_reference: report.result_reference, tenant_id: scope.tenant_id, organization_id: scope.organization_id, public_eligibility_decision_id: eligibilityId, public_disclosure_decision_id: disclosureId, disclosure_policy_reference: policy.policy_key, disclosure_policy_version: String(policy.policy_version), reporting_period_start: report.reporting_period_start, reporting_period_end: report.reporting_period_end, reporting_period: report.reporting_period, reporting_period_label: report.reporting_period_label, data_as_of: report.data_as_of, geography_level: report.geography, program_granularity: report.program_granularity, public_representation_type: evaluated.display_mode, public_display_value: String(evaluated.public_value), suppression_state: evaluated.display_mode === "SUPPRESSED_LT_10" ? "SUPPRESSED_LT_10" : "NONE", public_population_eligible: true };
      const snapshotHash = publicSnapshotHash(safe);
      if (existing) { if (existing.snapshot_hash !== snapshotHash) throw new Error("Snapshot idempotency key conflicts with a different governed result"); return { snapshot: existing, replayed: true }; }
      const created = await this.repo.createSnapshot({ public_snapshot_id: `public_snapshot_${randomUUID()}`, ...safe, snapshot_hash: snapshotHash, created_by_user_id: scope.actor_id, idempotency_key: idempotencyKey }, db);
      await this.auditWriter({ audit_event_id: `audit_${randomUUID()}`, organization_id: scope.organization_id, actor_user_id: scope.actor_id, target_object_type: "report_public_snapshot", target_object_id: created.public_snapshot_id, action_type: "report.public_snapshot.created", new_state_json: { public_snapshot_id: created.public_snapshot_id, report_id: created.report_id, report_version: created.report_version, source_result_reference: created.source_result_reference, public_eligibility_decision_id: created.public_eligibility_decision_id, public_disclosure_decision_id: created.public_disclosure_decision_id, disclosure_policy_reference: created.disclosure_policy_reference, disclosure_policy_version: created.disclosure_policy_version, reporting_period: created.reporting_period, data_as_of: created.data_as_of, public_representation_type: created.public_representation_type, suppression_state: created.suppression_state, version: created.version }, reason_text: "Immutable public-safe report snapshot created; publication is not asserted", correlation_id: `corr_${randomUUID()}`, source_channel: "shs-api" }, db);
      return { snapshot: created, replayed: false };
    });
  }
  async getSnapshot(id: string, actor: any) { requirePermission(actor, "reports.public_snapshot.view"); return this.repo.getSnapshot(id, scopeFromActor(actor)); }
  async listSnapshots(actor: any, reportId?: string, reportVersion?: number) { requirePermission(actor, "reports.public_snapshot.view"); return this.repo.listSnapshots(scopeFromActor(actor), reportId, reportVersion); }
}
