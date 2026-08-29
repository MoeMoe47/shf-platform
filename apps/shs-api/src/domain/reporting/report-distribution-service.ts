import { randomUUID } from "crypto";
import { withTransaction } from "../../db/transaction.js";
import { writeAuditEvent } from "../audit/service/audit-helper.js";
import { ReportArtifactRepo } from "./report-artifact-repo.js";
import { ReportDistributionRepo } from "./report-distribution-repo.js";
import { DONOR_SUMMARY_COMPOSITION } from "./report-artifact-service.js";

const AUDIENCE_TYPES = new Set(["DONOR", "FUNDER", "PARTNER", "BOARD_EXTERNAL", "OTHER_AUTHORIZED_EXTERNAL"]);

function scopeFromActor(actor: any) {
  const actorId = actor?.user_id || actor?.id;
  const organizationId = actor?.organization_id;
  if (!actorId || !organizationId) throw new Error("Reporting distribution scope unavailable");
  return { actor_id: actorId, organization_id: organizationId, tenant_id: actor?.tenant_id || actor?.tenant || `tenant:${organizationId}` };
}

function requireText(value: any, message: string) {
  const result = String(value || "").trim();
  if (!result) throw new Error(message);
  return result;
}

function requireDistributionManagement(actor: any) {
  if (!Array.isArray(actor?.permissions) || !actor.permissions.includes("reports.distribution.manage")) {
    throw new Error("Missing permission: reports.distribution.manage");
  }
}

function donorSummaryArtifactIsValid(artifact: any) {
  if (artifact?.composition_type !== DONOR_SUMMARY_COMPOSITION.type) return true;
  const reports = artifact?.canonical_input_manifest?.reports;
  return artifact.composition_version === DONOR_SUMMARY_COMPOSITION.version
    && Array.isArray(reports)
    && reports.length === 1
    && reports[0]?.report_id === DONOR_SUMMARY_COMPOSITION.report_id
    && Number(reports[0]?.report_version) === DONOR_SUMMARY_COMPOSITION.report_version;
}

export function canDistributeRestrictedArtifact({ artifact, recipient, disclosureDecision, actor }: any) {
  const requiredPermission = "reports.distribute";
  const scope = scopeFromActor(actor);
  const eligible = artifact?.classification === "RESTRICTED_EXTERNAL"
    && donorSummaryArtifactIsValid(artifact)
    && artifact?.lifecycle_status === "GENERATED"
    && Number(artifact?.artifact_version) > 0
    && artifact?.tenant_id === scope.tenant_id
    && artifact?.organization_id === scope.organization_id
    && recipient?.status === "AUTHORIZED"
    && disclosureDecision?.decision === "APPROVED"
    && disclosureDecision?.artifact_id === artifact?.artifact_id
    && Number(disclosureDecision?.artifact_version) === Number(artifact?.artifact_version)
    && disclosureDecision?.tenant_id === scope.tenant_id
    && disclosureDecision?.organization_id === scope.organization_id
    && Boolean(String(disclosureDecision?.policy_reference || "").trim())
    && recipient?.tenant_id === scope.tenant_id
    && recipient?.organization_id === scope.organization_id
    && Array.isArray(actor?.permissions) && actor.permissions.includes(requiredPermission);
  return { eligible, reason: eligible ? null : "RESTRICTED_DISTRIBUTION_PREREQUISITES_UNMET" };
}

export class ReportDistributionService {
  constructor(
    private recipients = new ReportDistributionRepo(),
    private artifacts = new ReportArtifactRepo(),
    private transaction = withTransaction,
    private auditWriter = writeAuditEvent,
  ) {}

  async createRecipient(input: any, actor: any) {
    requireDistributionManagement(actor);
    const scope = scopeFromActor(actor);
    const recipientOrganizationRef = requireText(input?.recipient_organization_ref || input?.recipientOrganizationRef, "Recipient organization reference is required");
    const audienceType = requireText(input?.audience_type || input?.audienceType, "Audience type is required").toUpperCase();
    if (!AUDIENCE_TYPES.has(audienceType)) throw new Error("Unsupported recipient audience type");
    return this.transaction(async (db: any) => {
      const created = await this.recipients.createRecipient({
        recipient_authorization_id: `recipient_auth_${randomUUID()}`,
        ...scope,
        recipient_organization_ref: recipientOrganizationRef,
        recipient_contact_ref: input?.recipient_contact_ref || input?.recipientContactRef || null,
        audience_type: audienceType,
        purpose_scope: input?.purpose_scope || input?.purposeScope || null,
        authorized_by_user_id: scope.actor_id,
      }, db);
      await this.auditWriter({
        audit_event_id: `audit_${randomUUID()}`, organization_id: scope.organization_id,
        actor_user_id: scope.actor_id, target_object_type: "report_distribution_recipient",
        target_object_id: created.recipient_authorization_id, action_type: "report_distribution_recipient.authorized",
        new_state_json: { recipient_authorization_id: created.recipient_authorization_id, recipient_organization_ref: created.recipient_organization_ref, audience_type: created.audience_type, purpose_scope: created.purpose_scope, version: created.version },
        reason_text: "Restricted report recipient authorized", correlation_id: `corr_${randomUUID()}`, source_channel: "shs-api",
      }, db);
      return created;
    });
  }

  async listRecipients(actor: any) { return this.recipients.listRecipients(scopeFromActor(actor)); }
  async getRecipient(id: string, actor: any) { return this.recipients.getRecipient(id, scopeFromActor(actor)); }

  async revokeRecipient(id: string, expectedVersion: number, actor: any) {
    requireDistributionManagement(actor);
    const scope = scopeFromActor(actor);
    if (!Number.isInteger(expectedVersion) || expectedVersion < 1) throw new Error("Expected recipient version is required");
    return this.transaction(async (db: any) => {
      const revoked = await this.recipients.revokeRecipient(id, scope, expectedVersion, new Date().toISOString(), db);
      if (!revoked) throw new Error("Recipient authorization is stale, missing, or already revoked");
      await this.auditWriter({
        audit_event_id: `audit_${randomUUID()}`, organization_id: scope.organization_id,
        actor_user_id: scope.actor_id, target_object_type: "report_distribution_recipient",
        target_object_id: id, action_type: "report_distribution_recipient.revoked",
        previous_state_json: { status: "AUTHORIZED", version: expectedVersion },
        new_state_json: { status: "REVOKED", version: revoked.version },
        reason_text: "Restricted report recipient authorization revoked", correlation_id: `corr_${randomUUID()}`, source_channel: "shs-api",
      }, db);
      return revoked;
    });
  }

  async createDisclosureDecision(artifactId: string, input: any, actor: any) {
    requireDistributionManagement(actor);
    const scope = scopeFromActor(actor);
    const artifact = await this.artifacts.getArtifact(artifactId, scope);
    if (!artifact) throw new Error("Artifact not found in authorized scope");
    if (artifact.classification !== "RESTRICTED_EXTERNAL" || artifact.lifecycle_status !== "GENERATED") throw new Error("Artifact is not eligible for restricted disclosure review");
    const artifactVersion = Number(input?.artifact_version || input?.artifactVersion);
    if (artifactVersion !== Number(artifact.artifact_version)) throw new Error("Artifact version does not match current artifact");
    const decision = requireText(input?.decision, "Disclosure decision is required").toUpperCase();
    if (decision !== "APPROVED" && decision !== "BLOCKED") throw new Error("Unsupported disclosure decision");
    if (decision === "APPROVED" && !String(input?.policy_reference || "").trim()) throw new Error("Approved disclosure decision requires policy reference");
    if (!input?.decision_scope || typeof input.decision_scope !== "object" || Array.isArray(input.decision_scope)) throw new Error("Disclosure decision scope is required");
    return this.transaction(async (db: any) => {
      const created = await this.recipients.createDisclosureDecision({
        disclosure_decision_id: `disclosure_${randomUUID()}`, artifact_id: artifactId,
        artifact_version: artifactVersion, ...scope, decision,
        decision_scope: input.decision_scope, rationale_code: input?.rationale_code || null,
        policy_reference: input?.policy_reference || null,
        reviewed_by_user_id: scope.actor_id,
      }, db);
      await this.auditWriter({
        audit_event_id: `audit_${randomUUID()}`, organization_id: scope.organization_id,
        actor_user_id: scope.actor_id, target_object_type: "report_disclosure_decision",
        target_object_id: created.disclosure_decision_id, action_type: `report_disclosure.${decision.toLowerCase()}`,
        new_state_json: { disclosure_decision_id: created.disclosure_decision_id, artifact_id: artifactId, artifact_version: artifactVersion, decision, rationale_code: created.rationale_code, policy_reference: created.policy_reference, version: created.version },
        reason_text: `Restricted report disclosure decision: ${decision}`, correlation_id: `corr_${randomUUID()}`, source_channel: "shs-api",
      }, db);
      return created;
    });
  }

  async listDisclosureDecisions(artifactId: string, actor: any) {
    const scope = scopeFromActor(actor);
    const artifact = await this.artifacts.getArtifact(artifactId, scope);
    if (!artifact) return [];
    return this.recipients.listDisclosureDecisions(artifactId, scope);
  }

  async authorizeDistribution(artifactId: string, input: any, actor: any) {
    if (!Array.isArray(actor?.permissions) || !actor.permissions.includes("reports.distribute")) {
      throw new Error("Missing permission: reports.distribute");
    }
    const scope = scopeFromActor(actor);
    const expectedVersion = Number(input?.artifact_version || input?.artifactVersion);
    const recipientId = requireText(input?.recipient_authorization_id || input?.recipientAuthorizationId, "Recipient authorization is required");
    const disclosureId = requireText(input?.disclosure_decision_id || input?.disclosureDecisionId, "Disclosure decision is required");
    const idempotencyKey = requireText(input?.idempotency_key || input?.idempotencyKey, "Idempotency key is required");
    if (idempotencyKey.length > 200) throw new Error("Idempotency key is too long");
    return this.transaction(async (db: any) => {
      const existing = await this.recipients.getDistributionByIdempotencyKey(idempotencyKey, scope, db);
      const artifact = await this.artifacts.getArtifact(artifactId, scope, db);
      if (existing) {
        if (existing.artifact_id !== artifactId || Number(existing.artifact_version) !== expectedVersion || existing.recipient_authorization_id !== recipientId || existing.disclosure_decision_id !== disclosureId) {
          throw new Error("Idempotency key conflicts with existing distribution authorization");
        }
        return { record: existing, replayed: true };
      }
      const recipient = await this.recipients.getRecipient(recipientId, scope, db);
      const disclosureDecision = await this.recipients.getDisclosureDecision(disclosureId, artifactId, scope, db);
      if (!artifact || expectedVersion !== Number(artifact.artifact_version)) throw new Error("Artifact version does not match current artifact");
      const eligibility = canDistributeRestrictedArtifact({ artifact, recipient, disclosureDecision, actor });
      if (!eligibility.eligible) throw new Error(eligibility.reason);
      const record = await this.recipients.createDistribution({
        distribution_id: `distribution_${randomUUID()}`,
        artifact_id: artifactId,
        artifact_version: expectedVersion,
        recipient_authorization_id: recipientId,
        disclosure_decision_id: disclosureId,
        tenant_id: scope.tenant_id,
        organization_id: scope.organization_id,
        authorized_by_user_id: scope.actor_id,
        distribution_purpose: input?.distribution_purpose || input?.distributionPurpose || null,
        idempotency_key: idempotencyKey,
      }, db);
      await this.auditWriter({
        audit_event_id: `audit_${randomUUID()}`, organization_id: scope.organization_id,
        actor_user_id: scope.actor_id, target_object_type: "report_distribution",
        target_object_id: record.distribution_id, action_type: "report.distribution.authorized",
        new_state_json: { distribution_id: record.distribution_id, artifact_id: artifactId, artifact_version: expectedVersion, recipient_authorization_id: recipientId, disclosure_decision_id: disclosureId, classification: artifact.classification, status: record.status, version: record.version },
        reason_text: "Restricted report distribution authorized; delivery is not asserted", correlation_id: `corr_${randomUUID()}`, source_channel: "shs-api",
      }, db);
      return { record, replayed: false };
    });
  }

  async listDistributions(artifactId: string, actor: any) {
    const scope = scopeFromActor(actor);
    return this.recipients.listDistributions(artifactId, scope);
  }
}
