import { randomUUID } from "crypto";
import { withTransaction } from "../../../db/transaction";
import { writeAuditEvent } from "../../audit/service/audit-helper";
import { WorkforceOutcomeRepo } from "../repo/workforce-outcome-repo";
import { IntegrationOutboxRepo } from "../../trusted-reporting/outbox-repo";
import { buildEmploymentStartedVerifiedOutboxEvent } from "../../trusted-reporting/outbox";

function scopeFromActor(actor: any) {
  const actorId = actor?.user_id || actor?.id;
  const organizationId = actor?.organization_id;
  if (!actorId || !organizationId) throw new Error("Workforce outcome scope unavailable");
  return { actor_id: actorId, organization_id: organizationId,
    tenant_id: actor?.tenant_id || actor?.tenant || `tenant:${organizationId}` };
}

const strongVerificationSources = new Set([
  "EMPLOYER_CONFIRMATION", "OFFICIAL_EMPLOYER_RECORD",
  "PAYROLL_OR_EMPLOYMENT_DOCUMENT", "EXTERNAL_SYSTEM_CONFIRMATION",
]);
const allowedVerificationSources = new Set([
  ...strongVerificationSources, "PARTICIPANT_ATTESTATION", "STAFF_ATTESTATION",
]);

function submissionFields(input: any) {
  const participantRef = String(input?.participantRef || input?.participant_ref || "").trim();
  const startedAt = input?.employmentStartedAt || input?.employment_started_at;
  if (!participantRef) throw new Error("Participant reference is required");
  if (!startedAt || Number.isNaN(Date.parse(startedAt))) throw new Error("Employment start date is required");
  const source = input?.verificationSourceType || input?.verification_source_type;
  const reference = input?.verificationReference || input?.verification_reference;
  const evidenceHash = input?.evidenceHash || input?.evidence_hash || null;
  const normalizedSource = source ? String(source).trim().toUpperCase() : null;
  if (normalizedSource && !allowedVerificationSources.has(normalizedSource)) {
    throw new Error("Unsupported verification source");
  }
  return {
    participant_ref: participantRef,
    program_id: input?.programId || input?.program_id || null,
    employment_started_at: new Date(startedAt).toISOString(),
    verification_source_type: normalizedSource,
    verification_reference: reference ? String(reference).trim() : null,
    evidence_hash: evidenceHash ? String(evidenceHash).trim() : null,
  };
}

function audit(scope: any, outcomeId: string, action: string, previous: any, next: any, executor: any, writer = writeAuditEvent) {
  return writer({
    audit_event_id: `audit_${randomUUID()}`,
    organization_id: scope.organization_id,
    actor_user_id: scope.actor_id,
    target_object_type: "workforce_employment_outcome",
    target_object_id: outcomeId,
    action_type: action,
    previous_state_json: previous,
    new_state_json: next,
    reason_text: `Employment-start outcome ${action.replace("employment_outcome.", "")}`,
    correlation_id: `corr_${randomUUID()}`,
    source_channel: "shs-api",
  }, executor);
}

export class WorkforceOutcomeService {
  constructor(
    private repo = new WorkforceOutcomeRepo(),
    private transaction = withTransaction,
    private auditWriter = writeAuditEvent,
    private outbox = new IntegrationOutboxRepo(),
  ) {}

  async submit(input: any, actor: any) {
    const scope = scopeFromActor(actor);
    const fields = submissionFields(input);
    const outcome = { outcome_id: `outcome_${randomUUID()}`, ...scope, actor_id: scope.actor_id, ...fields };
    return this.transaction(async (db: any) => {
      const created = await this.repo.create(outcome, db);
      await audit(scope, created.outcomeId, "employment_outcome.submitted", null, {
        outcome_id: created.outcomeId, outcome_type: created.outcome_type,
        lifecycle_status: created.lifecycle_status, version: created.version,
      }, db, this.auditWriter);
      return created;
    });
  }

  async get(outcomeId: string, actor: any) { return this.repo.get(outcomeId, scopeFromActor(actor)); }
  async list(actor: any) { return this.repo.list(scopeFromActor(actor)); }

  async verify(outcomeId: string, actor: any, expectedVersion: number) {
    return this.transition(outcomeId, actor, expectedVersion, "verification_pending", "verified", "verified");
  }

  async reject(outcomeId: string, actor: any, expectedVersion: number) {
    return this.transition(outcomeId, actor, expectedVersion, "verification_pending", "rejected", "rejected");
  }

  async withdraw(outcomeId: string, actor: any, expectedVersion: number) {
    const current = await this.get(outcomeId, actor);
    if (!current) throw new Error("Employment outcome not found");
    return this.transition(outcomeId, actor, expectedVersion, current.lifecycle_status, "withdrawn", "withdrawn");
  }

  private async transition(outcomeId: string, actor: any, expectedVersion: number,
    fromStatus: string, toStatus: string, verificationStatus: string) {
    const scope = scopeFromActor(actor);
    if (!Number.isInteger(expectedVersion) || expectedVersion < 1) throw new Error("Expected outcome version is required");
    return this.transaction(async (db: any) => {
      const current = await this.repo.get(outcomeId, scope, db);
      if (!current) throw new Error("Employment outcome not found");
      if (current.version !== expectedVersion) throw new Error("Employment outcome version conflict");
      if (toStatus === "verified" && !strongVerificationSources.has(current.verification_source_type)) {
        throw new Error("Verification source is insufficient");
      }
      if (toStatus === "verified" && !current.verification_reference) {
        throw new Error("Verification reference is required");
      }
      if (toStatus === "withdrawn" && !["submitted", "verification_pending", "rejected", "verified"].includes(current.lifecycle_status)) {
        throw new Error("Employment outcome cannot be withdrawn");
      }
      if (toStatus === "rejected" && current.lifecycle_status !== "verification_pending") {
        throw new Error("Only pending employment outcomes can be rejected");
      }
      const updated = await this.repo.transition(outcomeId, scope, fromStatus, toStatus,
        expectedVersion, verificationStatus, null, null, db);
      if (!updated) throw new Error("Employment outcome transition rejected");
      await audit(scope, outcomeId, `employment_outcome.${toStatus}`, {
        outcome_id: outcomeId, lifecycle_status: current.lifecycle_status, version: current.version,
      }, { outcome_id: outcomeId, lifecycle_status: updated.lifecycle_status, version: updated.version }, db, this.auditWriter);
      if (toStatus === "verified") {
        await this.outbox.enqueue(buildEmploymentStartedVerifiedOutboxEvent({
          ...updated,
          verified_by_user_id: scope.actor_id,
        }, `corr_${randomUUID()}`), db);
      }
      return updated;
    });
  }
}
