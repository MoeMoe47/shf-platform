import { randomUUID } from "crypto";
import { withTransaction } from "../../db/transaction";
import { writeAuditEvent } from "../audit/service/audit-helper";
import { ReportPublicSnapshotRepo } from "./report-public-snapshot-repo";
import { ReportPublicEligibilityRepo } from "./report-public-eligibility-repo";
import { ReportPublicDisclosureRepo } from "./report-public-disclosure-repo";
import { ReportPublicDisclosurePolicyRepo } from "./report-public-disclosure-policy-repo";
import { ReportPublicationRepo } from "./report-publication-repo";
import { ReportPublicationActionRepo } from "./report-publication-action-repo";
import { getPublicReportGovernanceRegistration, requirePublicReportGovernanceRegistration } from "./report-public-governance-registry";

function scope(actor: any) { const actorId = actor?.user_id || actor?.id; const organizationId = actor?.organization_id; if (!actorId || !organizationId) throw new Error("Publication scope unavailable"); return { actor_id: actorId, organization_id: organizationId, tenant_id: actor?.tenant_id || actor?.tenant || `tenant:${organizationId}` }; }
function permission(actor: any) { if (!Array.isArray(actor?.permissions) || !actor.permissions.includes("reports.publication.authorize")) throw new Error("Missing permission: reports.publication.authorize"); }
function executePermission(actor: any) { if (!Array.isArray(actor?.permissions) || !actor.permissions.includes("reports.publication.execute")) throw new Error("Missing permission: reports.publication.execute"); }
function required(value: any, message: string) { const result = String(value || "").trim(); if (!result) throw new Error(message); return result; }
function stale(dataAsOf: any, now = new Date()) { const age = now.getTime() - new Date(dataAsOf).getTime(); return Number.isNaN(age) || age > 12 * 30.4375 * 24 * 60 * 60 * 1000; }

export class ReportPublicationService {
  constructor(private repo = new ReportPublicationRepo(), private snapshots = new ReportPublicSnapshotRepo(), private eligibility = new ReportPublicEligibilityRepo(), private disclosure = new ReportPublicDisclosureRepo(), private policies = new ReportPublicDisclosurePolicyRepo(), private transaction = withTransaction, private auditWriter = writeAuditEvent, private actions = new ReportPublicationActionRepo()) {}
  async authorize(input: any, actor: any) {
    permission(actor); const current = scope(actor); const snapshotId = required(input?.public_snapshot_id || input?.publicSnapshotId, "Public snapshot is required"); const expectedVersion = Number(input?.snapshot_version || input?.snapshotVersion); const expectedHash = required(input?.snapshot_hash || input?.snapshotHash, "Public snapshot hash is required"); const releaseApprovalId = required(input?.release_approval_reference || input?.releaseApprovalReference, "Institutional release approval is required"); const authorityId = required(input?.institutional_authority_reference || input?.institutionalAuthorityReference, "Institutional authority is required"); const key = required(input?.idempotency_key || input?.idempotencyKey, "Publication authorization idempotency key is required");
    return this.transaction(async (db: any) => {
      const existing = await this.repo.getByIdempotencyKey(key, current, db); const snapshot = await this.snapshots.getSnapshot(snapshotId, current, db);
      if (!snapshot || snapshot.public_snapshot_id !== snapshotId || Number(snapshot.version) !== expectedVersion || snapshot.snapshot_hash !== expectedHash) throw new Error("Exact immutable public snapshot binding is required");
      const registration = getPublicReportGovernanceRegistration(snapshot.report_id, Number(snapshot.report_version));
      if (!registration || snapshot.public_population_eligible !== true) throw new Error("Registered public snapshot prerequisites are not satisfied");
      if (stale(snapshot.data_as_of)) throw new Error("Public snapshot is stale and requires renewed disclosure review");
      const elig = await this.eligibility.getDecision(snapshot.public_eligibility_decision_id, current, db); const latestElig = await this.eligibility.getLatestEligible(snapshot.report_id, Number(snapshot.report_version), current, db);
      if (!elig || elig.decision !== "PUBLIC_ELIGIBLE" || latestElig?.public_eligibility_decision_id !== elig.public_eligibility_decision_id) throw new Error("Current PUBLIC_ELIGIBLE decision is required");
      const disclosure = await this.disclosure.getDecision(snapshot.public_disclosure_decision_id, current, db); if (!disclosure || disclosure.decision !== "PUBLIC_DISCLOSURE_APPROVED" || disclosure.report_id !== snapshot.report_id || Number(disclosure.report_version) !== Number(snapshot.report_version)) throw new Error("Current PUBLIC_DISCLOSURE_APPROVED decision is required");
      const policy = await this.policies.getApprovedPolicy(snapshot.report_id, Number(snapshot.report_version), current, db); if (!policy || policy.policy_key !== registration.required_policy_key || disclosure.privacy_policy_reference !== policy.policy_key || String(disclosure.privacy_policy_version) !== String(policy.policy_version)) throw new Error("Approved disclosure policy for the registered report is required");
      const authority = await this.repo.getAuthority(authorityId, current, db); if (!authority || authority.status !== "ACTIVE" || authority.authority_type !== "SHF_EXECUTIVE_AUTHORITY" && authority.authority_type !== "PUBLIC_REPORTING_RELEASE_AUTHORITY" || new Date(authority.effective_at) > new Date()) throw new Error("Active institutional publication authority is required");
      const approval = await this.repo.getReleaseApproval(releaseApprovalId, snapshotId, current, db); if (!approval || approval.status !== "APPROVED" || approval.approval_category !== "PUBLIC_REPORTING_RELEASE_APPROVAL" || approval.authority_id !== authorityId || approval.snapshot_version !== expectedVersion || approval.snapshot_hash !== expectedHash || approval.tenant_id !== current.tenant_id || approval.organization_id !== current.organization_id) throw new Error("Exact institutional release approval is required");
      if (existing) { if (existing.public_snapshot_id !== snapshotId || existing.snapshot_hash !== expectedHash || existing.release_approval_reference !== releaseApprovalId || existing.institutional_authority_reference !== authority.authority_reference) throw new Error("Publication authorization idempotency key conflicts"); return { authorization: existing, replayed: true }; }
      const created = await this.repo.createAuthorization({ publication_authorization_id: `publication_authorization_${randomUUID()}`, public_snapshot_id: snapshotId, snapshot_version: expectedVersion, snapshot_hash: expectedHash, report_id: snapshot.report_id, report_version: snapshot.report_version, tenant_id: current.tenant_id, organization_id: current.organization_id, public_eligibility_decision_id: snapshot.public_eligibility_decision_id, public_disclosure_decision_id: snapshot.public_disclosure_decision_id, disclosure_policy_reference: policy.policy_key, disclosure_policy_version: String(policy.policy_version), institutional_authority_reference: authority.authority_reference, release_approval_reference: releaseApprovalId, authorized_by_user_id: current.actor_id, purpose_reference: input?.purpose_reference || input?.purposeReference, idempotency_key: key }, db);
      await this.auditWriter({ audit_event_id: `audit_${randomUUID()}`, organization_id: current.organization_id, actor_user_id: current.actor_id, target_object_type: "report_publication_authorization", target_object_id: created.publication_authorization_id, action_type: "report.publication.authorized", new_state_json: { publication_authorization_id: created.publication_authorization_id, public_snapshot_id: snapshotId, snapshot_version: expectedVersion, snapshot_hash: expectedHash, report_id: snapshot.report_id, report_version: snapshot.report_version, public_eligibility_decision_id: snapshot.public_eligibility_decision_id, public_disclosure_decision_id: snapshot.public_disclosure_decision_id, disclosure_policy_reference: policy.policy_key, disclosure_policy_version: String(policy.policy_version), institutional_authority_reference: authority.authority_reference, release_approval_reference: releaseApprovalId, status: created.status, version: created.version }, reason_text: "Public snapshot publication authorized; publication is not asserted", correlation_id: `corr_${randomUUID()}`, source_channel: "shs-api" }, db);
      return { authorization: created, replayed: false };
    });
  }
  async getAuthorization(id: string, actor: any) { permission(actor); return this.repo.getAuthorization(id, scope(actor)); }
  async listAuthorizations(actor: any) { permission(actor); return this.repo.listAuthorizations(scope(actor)); }

  async publish(input: any, actor: any) {
    executePermission(actor);
    const current = scope(actor);
    const authorizationId = required(input?.publication_authorization_id || input?.publicationAuthorizationId, "Publication authorization is required");
    const snapshotId = required(input?.public_snapshot_id || input?.publicSnapshotId, "Public snapshot is required");
    const snapshotVersion = Number(input?.snapshot_version || input?.snapshotVersion);
    const snapshotHash = required(input?.snapshot_hash || input?.snapshotHash, "Public snapshot hash is required");
    const key = required(input?.idempotency_key || input?.idempotencyKey, "Publication idempotency key is required");
    return this.transaction(async (db: any) => {
      const authorization = await this.repo.getAuthorization(authorizationId, current, db);
      if (!authorization || authorization.status !== "PUBLICATION_AUTHORIZED") throw new Error("Current publication authorization is required");
      if (authorization.public_snapshot_id !== snapshotId || Number(authorization.snapshot_version) !== snapshotVersion || authorization.snapshot_hash !== snapshotHash) throw new Error("Exact publication authorization snapshot binding is required");

      const snapshot = await this.snapshots.getSnapshot(snapshotId, current, db);
      if (!snapshot || snapshot.public_snapshot_id !== snapshotId || Number(snapshot.version) !== snapshotVersion || snapshot.snapshot_hash !== snapshotHash) throw new Error("Exact immutable public snapshot binding is required");
      const registration = getPublicReportGovernanceRegistration(snapshot.report_id, Number(snapshot.report_version));
      if (!registration || snapshot.public_population_eligible !== true) throw new Error("Registered public snapshot prerequisites are not satisfied");
      if (stale(snapshot.data_as_of)) throw new Error("Public snapshot is stale and cannot be published");

      const eligibility = await this.eligibility.getDecision(snapshot.public_eligibility_decision_id, current, db);
      const latestEligibility = await this.eligibility.getLatestEligible(snapshot.report_id, Number(snapshot.report_version), current, db);
      if (!eligibility || eligibility.decision !== "PUBLIC_ELIGIBLE" || latestEligibility?.public_eligibility_decision_id !== eligibility.public_eligibility_decision_id) throw new Error("Current PUBLIC_ELIGIBLE decision is required");
      const disclosure = await this.disclosure.getDecision(snapshot.public_disclosure_decision_id, current, db);
      if (!disclosure || disclosure.decision !== "PUBLIC_DISCLOSURE_APPROVED" || disclosure.report_id !== snapshot.report_id || Number(disclosure.report_version) !== Number(snapshot.report_version)) throw new Error("Current PUBLIC_DISCLOSURE_APPROVED decision is required");
      const policy = await this.policies.getApprovedPolicy(snapshot.report_id, Number(snapshot.report_version), current, db);
      if (!policy || policy.policy_key !== registration.required_policy_key || disclosure.privacy_policy_reference !== policy.policy_key || String(disclosure.privacy_policy_version) !== String(policy.policy_version)) throw new Error("Approved disclosure policy for the registered report is required");

      const existing = await this.actions.getPublicationByIdempotencyKey(key, current, db);
      if (existing) {
        if (existing.publication_authorization_id !== authorizationId || existing.public_snapshot_id !== snapshotId || existing.snapshot_hash !== snapshotHash) throw new Error("Publication idempotency key conflicts");
        const projection = await this.actions.getProjectionForPublication(existing.publication_id, db);
        return { publication: existing, projection, replayed: true };
      }

      const publication = await this.actions.createPublication({
        publication_id: `publication_${randomUUID()}`,
        publication_authorization_id: authorizationId,
        public_snapshot_id: snapshotId,
        snapshot_version: snapshotVersion,
        snapshot_hash: snapshotHash,
        report_id: snapshot.report_id,
        report_version: snapshot.report_version,
        tenant_id: current.tenant_id,
        organization_id: current.organization_id,
        published_by_user_id: current.actor_id,
        projection_reference: `shf_public_impact_projection:${snapshotId}`,
        idempotency_key: key,
      }, db);
      const projection = await this.actions.createProjection({
        projection_id: `impact_projection_${randomUUID()}`,
        publication_id: publication.publication_id,
        public_snapshot_id: snapshot.public_snapshot_id,
        snapshot_version: snapshot.version,
        snapshot_hash: snapshot.snapshot_hash,
        report_id: snapshot.report_id,
        report_version: snapshot.report_version,
        tenant_id: current.tenant_id,
        organization_id: current.organization_id,
        metric_label: registration.semantic_label,
        reporting_period_start: snapshot.reporting_period_start,
        reporting_period_end: snapshot.reporting_period_end,
        reporting_period: snapshot.reporting_period,
        reporting_period_label: snapshot.reporting_period_label,
        data_as_of: snapshot.data_as_of,
        geography_level: snapshot.geography_level,
        program_granularity: snapshot.program_granularity,
        public_representation_type: snapshot.public_representation_type,
        public_display_value: snapshot.public_display_value,
        suppression_state: snapshot.suppression_state,
      }, db);
      await this.auditWriter({
        audit_event_id: `audit_${randomUUID()}`,
        organization_id: current.organization_id,
        actor_user_id: current.actor_id,
        target_object_type: "report_publication",
        target_object_id: publication.publication_id,
        action_type: "report.published",
        new_state_json: {
          publication_id: publication.publication_id,
          publication_authorization_id: authorizationId,
          public_snapshot_id: snapshotId,
          snapshot_version: snapshotVersion,
          snapshot_hash: snapshotHash,
          report_id: snapshot.report_id,
          report_version: snapshot.report_version,
          projection_reference: publication.projection_reference,
          publication_status: publication.publication_status,
          version: publication.version,
        },
        reason_text: "Exact publication-authorized public snapshot written to the canonical SHF public Impact projection",
        correlation_id: `corr_${randomUUID()}`,
        source_channel: "shs-api",
      }, db);
      return { publication, projection, replayed: false };
    });
  }

  async getPublication(id: string, actor: any) { executePermission(actor); return this.actions.getPublication(id, scope(actor)); }
  async listPublications(actor: any) { executePermission(actor); return this.actions.listPublications(scope(actor)); }
  async listPublicImpactProjections(reportId = "report.curriculum.lesson_completion_count.v1", reportVersion = 1) {
    const registration = requirePublicReportGovernanceRegistration(reportId, reportVersion);
    if (registration.public_read_model_id !== "curriculum-lesson-completions") throw new Error("Public read model is not exposed");
    return this.actions.listPublicProjections(registration.report_id, registration.report_version);
  }
}
